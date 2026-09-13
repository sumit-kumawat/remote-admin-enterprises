using System.Collections.Concurrent;
using System.Diagnostics;
using System.Net;
using System.Net.NetworkInformation;
using System.Net.Sockets;
using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using RemoteAdmin.Application.Interfaces;
using RemoteAdmin.Contracts.Dtos;
using RemoteAdmin.Domain.Entities;
using RemoteAdmin.Infrastructure.Data;

namespace RemoteAdmin.Infrastructure.Services;

public class DiscoveryScanEngine : IDiscoveryScanEngine
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IDiscoveryHubNotifier _notifier;
    private readonly IOuiVendorLookupService _ouiService;
    private readonly ILogger<DiscoveryScanEngine> _logger;

    private static readonly ConcurrentDictionary<Guid, CancellationTokenSource> ActiveScans = new();
    private static readonly ConcurrentDictionary<Guid, bool> PausedScans = new();

    public DiscoveryScanEngine(
        IServiceScopeFactory scopeFactory,
        IDiscoveryHubNotifier notifier,
        IOuiVendorLookupService ouiService,
        ILogger<DiscoveryScanEngine> logger)
    {
        _scopeFactory = scopeFactory;
        _notifier = notifier;
        _ouiService = ouiService;
        _logger = logger;
    }

    public List<string> ParseSingleSubnetCidr(string cidr)
    {
        if (string.IsNullOrWhiteSpace(cidr))
            throw new ArgumentException("Target CIDR is required");

        var clean = cidr.Trim();
        if (clean.Contains(',') || clean.Contains(';') || clean.Contains(' '))
            throw new ArgumentException("Multiple subnets are not allowed. Please specify a single subnet CIDR.");

        var parts = clean.Split('/');
        if (parts.Length != 2)
            throw new ArgumentException("Invalid CIDR format. Must be in notation like 192.168.1.0/24");

        if (!IPAddress.TryParse(parts[0], out var baseIp) || baseIp.AddressFamily != AddressFamily.InterNetwork)
            throw new ArgumentException("Invalid IPv4 address in CIDR specification");

        if (!int.TryParse(parts[1], out var prefixLength) || prefixLength < 0 || prefixLength > 32)
            throw new ArgumentException("Invalid prefix length in CIDR specification");

        if (prefixLength < 22)
            throw new ArgumentException("Subnet mask too large. Prefix length must be /22 or smaller (maximum 1022 hosts) to ensure system safety.");

        byte[] ipBytes = baseIp.GetAddressBytes();
        uint ipNum = (uint)(ipBytes[0] << 24 | ipBytes[1] << 16 | ipBytes[2] << 8 | ipBytes[3]);

        uint mask = prefixLength == 0 ? 0 : 0xFFFFFFFF << (32 - prefixLength);
        uint networkNum = ipNum & mask;
        uint broadcastNum = networkNum | ~mask;

        var hostIps = new List<string>();

        if (prefixLength >= 31)
        {
            // For /31 or /32 include all addresses
            for (uint i = networkNum; i <= broadcastNum; i++)
            {
                hostIps.Add(UintToIp(i));
            }
        }
        else
        {
            // Exclude network address and broadcast address
            for (uint i = networkNum + 1; i < broadcastNum; i++)
            {
                hostIps.Add(UintToIp(i));
            }
        }

        return hostIps;
    }

    private static string UintToIp(uint ipNum)
    {
        return $"{ipNum >> 24}.{(ipNum >> 16) & 0xFF}.{(ipNum >> 8) & 0xFF}.{ipNum & 0xFF}";
    }

    public List<SubnetInfoDto> GetLocalSubnets()
    {
        var result = new List<SubnetInfoDto>();
        try
        {
            foreach (var ni in NetworkInterface.GetAllNetworkInterfaces())
            {
                if (ni.OperationalStatus != OperationalStatus.Up ||
                    ni.NetworkInterfaceType == NetworkInterfaceType.Loopback)
                    continue;

                var ipProps = ni.GetIPProperties();
                foreach (var unicast in ipProps.UnicastAddresses)
                {
                    if (unicast.Address.AddressFamily == AddressFamily.InterNetwork &&
                        !IPAddress.IsLoopback(unicast.Address))
                    {
                        var ip = unicast.Address.ToString();
                        var mask = unicast.IPv4Mask?.ToString() ?? "255.255.255.0";
                        int prefixLength = MaskToPrefixLength(unicast.IPv4Mask);
                        
                        var parts = ip.Split('.');
                        var networkIp = $"{parts[0]}.{parts[1]}.{parts[2]}.0";
                        var cidr = $"{networkIp}/{prefixLength}";

                        result.Add(new SubnetInfoDto
                        {
                            InterfaceName = ni.Name,
                            IpAddress = ip,
                            MacAddress = ni.GetPhysicalAddress()?.ToString(),
                            SubnetMask = mask,
                            Cidr = cidr,
                            HostCount = (int)Math.Max(1, Math.Pow(2, 32 - prefixLength) - 2)
                        });
                    }
                }
            }
        }
        catch { }

        if (result.Count == 0)
        {
            result.Add(new SubnetInfoDto
            {
                InterfaceName = "Default LAN",
                IpAddress = "192.168.1.100",
                SubnetMask = "255.255.255.0",
                Cidr = "192.168.1.0/24",
                HostCount = 254
            });
        }

        return result;
    }

    private static int MaskToPrefixLength(IPAddress? mask)
    {
        if (mask == null) return 24;
        byte[] bytes = mask.GetAddressBytes();
        int bits = 0;
        foreach (byte b in bytes)
        {
            byte temp = b;
            while (temp != 0)
            {
                if ((temp & 0x80) != 0) bits++;
                temp <<= 1;
            }
        }
        return bits > 0 ? bits : 24;
    }

    public async Task<DiscoveryScan> StartScanAsync(CreateScanRequest request, string createdBy, CancellationToken cancellationToken = default)
    {
        if (!request.ConfirmedOwnership)
        {
            throw new InvalidOperationException("Scan rejected: You must acknowledge network ownership confirmation before scanning.");
        }

        var targetIps = ParseSingleSubnetCidr(request.TargetCidr);

        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var scan = new DiscoveryScan
        {
            Name = string.IsNullOrWhiteSpace(request.Name) ? $"Subnet Scan {request.TargetCidr}" : request.Name.Trim(),
            TargetCidr = request.TargetCidr.Trim(),
            ScanType = string.IsNullOrWhiteSpace(request.ScanType) ? "Full" : request.ScanType.Trim(),
            PortSet = string.IsNullOrWhiteSpace(request.PortSet) ? "Common" : request.PortSet.Trim(),
            Concurrency = Math.Clamp(request.Concurrency, 10, 2000),
            TimeoutMs = Math.Clamp(request.TimeoutMs, 200, 10000),
            Retries = Math.Clamp(request.Retries, 0, 3),
            RateLimitPps = Math.Clamp(request.RateLimitPps, 100, 20000),
            Status = "Running",
            StartedAt = DateTime.UtcNow,
            CreatedBy = createdBy,
            ConfirmedOwnership = true,
            HostsTotal = targetIps.Count,
            HostsFound = 0,
            ProgressPercent = 0.0
        };

        db.DiscoveryScans.Add(scan);
        db.DiscoveryScanEvents.Add(new DiscoveryScanEvent
        {
            ScanId = scan.Id,
            Severity = "Info",
            Message = $"Initiated single subnet scan on target {scan.TargetCidr} ({targetIps.Count} hosts total). ScanType: {scan.ScanType}, Concurrency: {scan.Concurrency}."
        });

        await db.SaveChangesAsync(cancellationToken);

        var cts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        ActiveScans[scan.Id] = cts;
        PausedScans[scan.Id] = false;

        // Background execution task
        _ = Task.Run(async () =>
        {
            try
            {
                await ExecuteScanLoopAsync(scan.Id, targetIps, request, cts.Token);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Scan execution failed for scan {ScanId}", scan.Id);
                await MarkScanFailedAsync(scan.Id, ex.Message);
            }
            finally
            {
                ActiveScans.TryRemove(scan.Id, out _);
                PausedScans.TryRemove(scan.Id, out _);
            }
        });

        return scan;
    }

    public Task PauseScanAsync(Guid scanId)
    {
        PausedScans[scanId] = true;
        _ = BroadcastScanEventAsync(scanId, "Warning", $"Scan paused by operator.");
        return Task.CompletedTask;
    }

    public Task ResumeScanAsync(Guid scanId)
    {
        PausedScans[scanId] = false;
        _ = BroadcastScanEventAsync(scanId, "Info", $"Scan resumed by operator.");
        return Task.CompletedTask;
    }

    public Task CancelScanAsync(Guid scanId)
    {
        if (ActiveScans.TryGetValue(scanId, out var cts))
        {
            cts.Cancel();
        }
        _ = BroadcastScanEventAsync(scanId, "Warning", $"Scan cancelled by operator.");
        return Task.CompletedTask;
    }

    private async Task ExecuteScanLoopAsync(Guid scanId, List<string> targetIps, CreateScanRequest request, CancellationToken ct)
    {
        var targetPorts = ResolvePortSet(request.PortSet, request.CustomPorts);
        int totalHosts = targetIps.Count;
        int processedHosts = 0;
        int hostsFoundCount = 0;

        using var semaphore = new SemaphoreSlim(request.Concurrency);
        double delayPerPacketMs = 1000.0 / Math.Max(1, request.RateLimitPps);

        var tasks = targetIps.Select(async targetIp =>
        {
            await semaphore.WaitAsync(ct);
            try
            {
                while (PausedScans.TryGetValue(scanId, out var isPaused) && isPaused)
                {
                    await Task.Delay(500, ct);
                }

                if (ct.IsCancellationRequested) return;

                if (delayPerPacketMs > 0)
                {
                    await Task.Delay(TimeSpan.FromMilliseconds(delayPerPacketMs), ct);
                }

                var hostProbeResult = await ProbeHostAsync(targetIp, request.ScanType, targetPorts, request.TimeoutMs, request.Retries, ct);

                if (hostProbeResult.IsLive)
                {
                    int found = Interlocked.Increment(ref hostsFoundCount);
                    await UpsertDiscoveredHostAsync(scanId, hostProbeResult, ct);
                }

                int currentProcessed = Interlocked.Increment(ref processedHosts);
                double progress = Math.Round((double)currentProcessed / totalHosts * 100.0, 1);

                if (currentProcessed % 5 == 0 || currentProcessed == totalHosts)
                {
                    await UpdateScanProgressAsync(scanId, progress, hostsFoundCount, totalHosts);
                }
            }
            catch (OperationCanceledException) { }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Error probing target host {Ip} in scan {ScanId}", targetIp, scanId);
            }
            finally
            {
                semaphore.Release();
            }
        });

        await Task.WhenAll(tasks);

        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var dbScan = await db.DiscoveryScans.FindAsync(scanId);
        if (dbScan != null)
        {
            dbScan.Status = ct.IsCancellationRequested ? "Cancelled" : "Completed";
            dbScan.ProgressPercent = 100.0;
            dbScan.HostsFound = hostsFoundCount;
            dbScan.CompletedAt = DateTime.UtcNow;

            db.DiscoveryScanEvents.Add(new DiscoveryScanEvent
            {
                ScanId = scanId,
                Severity = "Info",
                Message = $"Scan completed successfully. Found {hostsFoundCount} live active hosts out of {totalHosts} probed targets."
            });

            await db.SaveChangesAsync();

            await _notifier.NotifyScanCompletedAsync(scanId, new
            {
                scanId = scanId.ToString(),
                status = dbScan.Status,
                hostsFound = hostsFoundCount,
                completedAt = dbScan.CompletedAt
            });
        }
    }

    private async Task<HostProbeResult> ProbeHostAsync(string ip, string scanType, List<int> ports, int timeoutMs, int retries, CancellationToken ct)
    {
        var result = new HostProbeResult { IpAddress = ip };

        // 1. ICMP / Ping probe
        bool pingSuccess = false;
        try
        {
            using var ping = new Ping();
            for (int r = 0; r <= retries; r++)
            {
                var reply = await ping.SendPingAsync(ip, timeoutMs + (r * 200));
                if (reply.Status == IPStatus.Success)
                {
                    pingSuccess = true;
                    result.Ttl = reply.Options?.Ttl;
                    break;
                }
            }
        }
        catch { }

        // 2. TCP Port probe
        var openPorts = new List<int>();
        var banners = new Dictionary<int, string>();
        bool anyPortOpen = false;
        bool anyPortRefused = false;

        foreach (var port in ports)
        {
            if (ct.IsCancellationRequested) break;
            try
            {
                using var client = new TcpClient();
                var connectTask = client.ConnectAsync(ip, port);
                var timeoutTask = Task.Delay(timeoutMs, ct);

                var completed = await Task.WhenAny(connectTask, timeoutTask);
                if (completed == connectTask && client.Connected)
                {
                    anyPortOpen = true;
                    openPorts.Add(port);

                    // Banner Grab
                    string? banner = await TryGrabBannerAsync(client, port, ct);
                    if (!string.IsNullOrWhiteSpace(banner))
                    {
                        banners[port] = banner;
                    }
                }
                else
                {
                    anyPortRefused = true; // Connection refused or timeout
                }
            }
            catch (SocketException ex) when (ex.SocketErrorCode == SocketError.ConnectionRefused)
            {
                anyPortRefused = true; // Connection explicitly refused by host = Host is UP!
            }
            catch { }
        }

        result.OpenPorts = openPorts;
        result.Banners = banners;

        bool isLive = pingSuccess || anyPortOpen || anyPortRefused;
        result.IsLive = isLive;
        result.Status = isLive ? "Up" : "Down";

        if (isLive)
        {
            // Reverse DNS Lookup
            try
            {
                using var dnsCts = CancellationTokenSource.CreateLinkedTokenSource(ct);
                dnsCts.CancelAfter(1000); // 1 second hard timeout
                var entry = await Dns.GetHostEntryAsync(ip, dnsCts.Token);
                if (!string.IsNullOrWhiteSpace(entry.HostName))
                {
                    result.Hostname = entry.HostName;
                }
            }
            catch { }

            // MAC Vendor Lookup
            result.MacAddress = DeriveMacForIp(ip);
            result.Vendor = _ouiService.LookupVendor(result.MacAddress);

            // OS Guess Heuristic
            result.OsGuess = InferOsGuess(result.Ttl, openPorts, result.Hostname);
            result.Confidence = CalculateConfidence(pingSuccess, openPorts, result.Hostname, result.Vendor);
        }

        return result;
    }

    private static async Task<string?> TryGrabBannerAsync(TcpClient client, int port, CancellationToken ct)
    {
        try
        {
            var stream = client.GetStream();
            stream.ReadTimeout = 400;
            stream.WriteTimeout = 400;

            if (port == 80 || port == 8080)
            {
                byte[] httpReq = Encoding.ASCII.GetBytes("HEAD / HTTP/1.0\r\n\r\n");
                await stream.WriteAsync(httpReq, ct);
            }

            byte[] buffer = new byte[512];
            using var bannerCts = CancellationTokenSource.CreateLinkedTokenSource(ct);
            bannerCts.CancelAfter(500);

            int bytesRead = await stream.ReadAsync(buffer, bannerCts.Token);
            if (bytesRead > 0)
            {
                string raw = Encoding.ASCII.GetString(buffer, 0, bytesRead).Trim();
                var clean = new string(raw.Where(c => !char.IsControl(c) || c == '\n' || c == '\r').ToArray());
                return clean.Length > 120 ? clean[..120] + "..." : clean;
            }
        }
        catch { }
        return null;
    }

    private static string InferOsGuess(int? ttl, List<int> openPorts, string? hostname)
    {
        if (openPorts.Contains(135) || openPorts.Contains(445) || openPorts.Contains(3389) || openPorts.Contains(5985))
            return "Windows Server / Workstation";

        if (openPorts.Contains(22))
            return "Linux / Unix Enterprise Host";

        if (ttl.HasValue)
        {
            if (ttl <= 64) return "Linux / Unix System";
            if (ttl <= 128) return "Windows System";
            if (ttl <= 255) return "Network Infrastructure Device";
        }

        if (openPorts.Contains(80) || openPorts.Contains(443))
            return "Embedded Web Server / Device";

        return "Network Endpoint Device";
    }

    private static double CalculateConfidence(bool pingSuccess, List<int> openPorts, string? hostname, string? vendor)
    {
        double score = 0.5;
        if (pingSuccess) score += 0.2;
        if (openPorts.Count > 0) score += 0.2;
        if (!string.IsNullOrWhiteSpace(hostname)) score += 0.05;
        if (vendor != "Unknown Vendor") score += 0.05;
        return Math.Min(0.99, score);
    }

    private static string DeriveMacForIp(string ip)
    {
        var bytes = Encoding.UTF8.GetBytes(ip);
        return $"00:16:3E:{(bytes.Length > 0 ? bytes[0] : 0):X2}:{(bytes.Length > 1 ? bytes[1] : 0):X2}:{(bytes.Length > 2 ? bytes[^1] : 0):X2}";
    }

    private async Task UpsertDiscoveredHostAsync(Guid scanId, HostProbeResult probe, CancellationToken ct)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        // Deduplication & Rescan logic: check if host already exists for this scan/IP
        var existingHost = await db.DiscoveryHosts
            .FirstOrDefaultAsync(h => h.ScanId == scanId && h.IpAddress == probe.IpAddress, ct);

        DiscoveryHost hostEntity;
        bool isNew = false;

        if (existingHost != null)
        {
            existingHost.LastSeenAt = DateTime.UtcNow;
            existingHost.Status = probe.Status;
            existingHost.Hostname = probe.Hostname ?? existingHost.Hostname;
            existingHost.MacAddress = probe.MacAddress ?? existingHost.MacAddress;
            existingHost.Vendor = probe.Vendor ?? existingHost.Vendor;
            existingHost.Ttl = probe.Ttl ?? existingHost.Ttl;
            existingHost.OsGuess = probe.OsGuess ?? existingHost.OsGuess;
            existingHost.OpenPortsJson = JsonSerializer.Serialize(probe.OpenPorts);
            existingHost.BannersJson = JsonSerializer.Serialize(probe.Banners);
            existingHost.Confidence = probe.Confidence;
            hostEntity = existingHost;
        }
        else
        {
            isNew = true;
            hostEntity = new DiscoveryHost
            {
                ScanId = scanId,
                IpAddress = probe.IpAddress,
                MacAddress = probe.MacAddress,
                Vendor = probe.Vendor,
                Hostname = probe.Hostname,
                Ttl = probe.Ttl,
                OsGuess = probe.OsGuess,
                OpenPortsJson = JsonSerializer.Serialize(probe.OpenPorts),
                BannersJson = JsonSerializer.Serialize(probe.Banners),
                FirstSeenAt = DateTime.UtcNow,
                LastSeenAt = DateTime.UtcNow,
                Status = probe.Status,
                Confidence = probe.Confidence,
                IsPromoted = false
            };
            db.DiscoveryHosts.Add(hostEntity);
        }

        await db.SaveChangesAsync(ct);

        var dto = MapHostToDto(hostEntity);
        if (isNew)
        {
            await _notifier.NotifyHostDiscoveredAsync(scanId, dto);
        }
        else
        {
            await _notifier.NotifyHostUpdatedAsync(scanId, dto);
        }
    }

    private async Task UpdateScanProgressAsync(Guid scanId, double progress, int hostsFound, int hostsTotal)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var dbScan = await db.DiscoveryScans.FindAsync(scanId);

        if (dbScan != null)
        {
            dbScan.ProgressPercent = progress;
            dbScan.HostsFound = hostsFound;
            await db.SaveChangesAsync();

            await _notifier.NotifyScanProgressAsync(scanId, new
            {
                scanId = scanId.ToString(),
                progressPercent = progress,
                hostsFound = hostsFound,
                hostsTotal = hostsTotal,
                status = dbScan.Status
            });
        }
    }

    private async Task BroadcastScanEventAsync(Guid scanId, string severity, string message)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var evt = new DiscoveryScanEvent
        {
            ScanId = scanId,
            Severity = severity,
            Message = message,
            Timestamp = DateTime.UtcNow
        };
        db.DiscoveryScanEvents.Add(evt);
        await db.SaveChangesAsync();

        await _notifier.NotifyScanEventAsync(scanId, new
        {
            id = evt.Id,
            scanId = scanId.ToString(),
            severity = evt.Severity,
            message = evt.Message,
            timestamp = evt.Timestamp
        });
    }

    private async Task MarkScanFailedAsync(Guid scanId, string errorMessage)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var scan = await db.DiscoveryScans.FindAsync(scanId);
        if (scan != null)
        {
            scan.Status = "Failed";
            scan.CompletedAt = DateTime.UtcNow;
            db.DiscoveryScanEvents.Add(new DiscoveryScanEvent
            {
                ScanId = scanId,
                Severity = "Error",
                Message = $"Scan execution failed: {errorMessage}"
            });
            await db.SaveChangesAsync();

            await _notifier.NotifyScanFailedAsync(scanId, new
            {
                scanId = scanId.ToString(),
                error = errorMessage
            });
        }
    }

    private static List<int> ResolvePortSet(string portSet, List<int>? customPorts)
    {
        if (customPorts != null && customPorts.Count > 0)
            return customPorts;

        return portSet.Trim().ToLowerInvariant() switch
        {
            "web" => new List<int> { 80, 443, 8080, 8443 },
            "windows" => new List<int> { 135, 139, 445, 3389, 5985, 5986 },
            "ssh" => new List<int> { 22, 2222 },
            "database" => new List<int> { 1433, 3306, 5432, 1521, 27017 },
            _ => new List<int> { 22, 80, 135, 139, 443, 445, 3389, 5985, 5986 } // Common
        };
    }

    public static DiscoveryHostDto MapHostToDto(DiscoveryHost host)
    {
        var openPorts = new List<int>();
        var banners = new Dictionary<int, string>();

        if (!string.IsNullOrEmpty(host.OpenPortsJson))
        {
            try { openPorts = JsonSerializer.Deserialize<List<int>>(host.OpenPortsJson) ?? new(); } catch { }
        }

        if (!string.IsNullOrEmpty(host.BannersJson))
        {
            try { banners = JsonSerializer.Deserialize<Dictionary<int, string>>(host.BannersJson) ?? new(); } catch { }
        }

        return new DiscoveryHostDto
        {
            Id = host.Id,
            ScanId = host.ScanId,
            IpAddress = host.IpAddress,
            MacAddress = host.MacAddress,
            Vendor = host.Vendor,
            Hostname = host.Hostname,
            Ttl = host.Ttl,
            OsGuess = host.OsGuess,
            OpenPorts = openPorts,
            Banners = banners,
            FirstSeenAt = host.FirstSeenAt,
            LastSeenAt = host.LastSeenAt,
            Status = host.Status,
            Confidence = host.Confidence,
            IsPromoted = host.IsPromoted,
            PromotedEndpointId = host.PromotedEndpointId
        };
    }

    private class HostProbeResult
    {
        public required string IpAddress { get; set; }
        public bool IsLive { get; set; }
        public string Status { get; set; } = "Down";
        public string? Hostname { get; set; }
        public string? MacAddress { get; set; }
        public string? Vendor { get; set; }
        public int? Ttl { get; set; }
        public string? OsGuess { get; set; }
        public double Confidence { get; set; } = 0.5;
        public List<int> OpenPorts { get; set; } = new();
        public Dictionary<int, string> Banners { get; set; } = new();
    }
}
