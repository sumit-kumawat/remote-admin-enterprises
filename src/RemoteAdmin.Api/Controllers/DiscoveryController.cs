using System.Net;
using System.Net.NetworkInformation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RemoteAdmin.Contracts.Dtos;
using RemoteAdmin.Domain.Entities;
using RemoteAdmin.Infrastructure.Data;

namespace RemoteAdmin.Api.Controllers;

public record StartScanRequest(string Cidr);
public record ImportDiscoveredRequest(List<Guid> DiscoveredIds);

[ApiController]
[Route("api/[controller]")]
[Authorize(Policy = "Operator")]
public class DiscoveryController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly ILogger<DiscoveryController> _logger;

    public DiscoveryController(AppDbContext db, ILogger<DiscoveryController> logger)
    {
        _db = db;
        _logger = logger;
    }

    [HttpGet("results")]
    public async Task<IActionResult> GetResults()
    {
        var results = await _db.DiscoveryResults
            .AsNoTracking()
            .OrderByDescending(d => d.DiscoveredAt)
            .ToListAsync();

        return Ok(results);
    }

    [HttpPost("scan")]
    public async Task<IActionResult> StartScan([FromBody] StartScanRequest request)
    {
        var scanId = Guid.NewGuid().ToString("N")[..8];
        var inputCidr = string.IsNullOrWhiteSpace(request.Cidr) ? "192.168.1.0/24" : request.Cidr.Trim();

        var baseIp = inputCidr.Split('/')[0].Trim();
        var parts = baseIp.Split('.');
        var prefix = parts.Length == 4 ? $"{parts[0]}.{parts[1]}.{parts[2]}" : "192.168.1";

        // Generate target IPs (e.g. 1..254)
        var targetIps = Enumerable.Range(1, 254).Select(i => $"{prefix}.{i}").ToList();
        var discoveredHosts = new System.Collections.Concurrent.ConcurrentBag<DiscoveryResult>();

        using var semaphore = new SemaphoreSlim(40); // 40 parallel scanner tasks
        var tasks = targetIps.Select(async ip =>
        {
            await semaphore.WaitAsync();
            try
            {
                using var ping = new Ping();
                var reply = await ping.SendPingAsync(ip, 300);

                bool isAlive = reply.Status == IPStatus.Success;
                bool isWinPortOpen = false;
                bool isLinuxPortOpen = false;

                if (!isAlive)
                {
                    isWinPortOpen = await TestTcpPortAsync(ip, 135, 300) || await TestTcpPortAsync(ip, 445, 300);
                    isLinuxPortOpen = await TestTcpPortAsync(ip, 22, 300);
                    if (isWinPortOpen || isLinuxPortOpen) isAlive = true;
                }
                else
                {
                    isWinPortOpen = await TestTcpPortAsync(ip, 135, 300) || await TestTcpPortAsync(ip, 445, 300) || await TestTcpPortAsync(ip, 3389, 300);
                    if (!isWinPortOpen)
                    {
                        isLinuxPortOpen = await TestTcpPortAsync(ip, 22, 300);
                    }
                }

                if (isAlive)
                {
                    string hostname = ip;
                    try
                    {
                        var entry = await Dns.GetHostEntryAsync(ip);
                        if (!string.IsNullOrWhiteSpace(entry.HostName)) hostname = entry.HostName;
                    }
                    catch { }

                    string osName = "Network Device";
                    if (isWinPortOpen) osName = "Windows Server / Workstation";
                    else if (isLinuxPortOpen) osName = "Linux Host (SSH/Enterprise)";

                    discoveredHosts.Add(new DiscoveryResult
                    {
                        ScanId = scanId,
                        Hostname = hostname,
                        IpAddress = ip,
                        MacAddress = null,
                        OsName = osName,
                        IsWindows = isWinPortOpen, // Only Windows endpoints can be imported to inventory
                        DiscoveryMethod = isWinPortOpen ? "WMI/RPC/Ping" : (isLinuxPortOpen ? "SSH/ICMP" : "ICMP Ping"),
                        Status = "Unmanaged",
                        DiscoveredAt = DateTime.UtcNow,
                    });
                }
            }
            catch { }
            finally
            {
                semaphore.Release();
            }
        });

        await Task.WhenAll(tasks);
        var results = discoveredHosts.OrderBy(d => d.IpAddress).ToList();

        if (results.Count > 0)
        {
            _db.DiscoveryResults.AddRange(results);
        }

        _db.AuditEvents.Add(new AuditEvent
        {
            Actor = User.Identity?.Name ?? "Admin",
            Action = "DiscoveryScan",
            Target = inputCidr,
            Result = "Success",
            IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1",
            DetailsJson = $"{{\"discovered\": {results.Count}, \"windowsCount\": {results.Count(r => r.IsWindows)}}}",
        });

        await _db.SaveChangesAsync();

        _logger.LogInformation("Discovery scan {ScanId} completed for CIDR {Cidr}. Discovered {Count} active hosts ({WinCount} Windows).", scanId, inputCidr, results.Count, results.Count(r => r.IsWindows));
        return Ok(new ApiResponse<List<DiscoveryResult>> { Success = true, Data = results });
    }

    private static async Task<bool> TestTcpPortAsync(string ip, int port, int timeoutMs)
    {
        try
        {
            using var client = new System.Net.Sockets.TcpClient();
            var connectTask = client.ConnectAsync(ip, port);
            var timeoutTask = Task.Delay(timeoutMs);

            var completed = await Task.WhenAny(connectTask, timeoutTask);
            return completed == connectTask && client.Connected;
        }
        catch
        {
            return false;
        }
    }

    [HttpPost("import")]
    public async Task<IActionResult> ImportSelected([FromBody] ImportDiscoveredRequest request)
    {
        if (request.DiscoveredIds == null || request.DiscoveredIds.Count == 0)
            return BadRequest(new ApiResponse { Success = false, Message = "No endpoints selected for import" });

        var itemsToImport = await _db.DiscoveryResults
            .Where(d => request.DiscoveredIds.Contains(d.Id) && d.IsWindows)
            .ToListAsync();

        int importedCount = 0;
        foreach (var item in itemsToImport)
        {
            var exists = await _db.Endpoints.AnyAsync(e => e.Hostname == item.Hostname || e.IpAddress == item.IpAddress);
            if (!exists)
            {
                _db.Endpoints.Add(new Domain.Entities.Endpoint
                {
                    Hostname = item.Hostname,
                    IpAddress = item.IpAddress,
                    MacAddress = item.MacAddress,
                    Status = Domain.Enums.EndpointStatus.Unknown,
                    ApprovalStatus = Domain.Enums.EndpointApprovalStatus.Approved,
                    AuthMode = "Inherit",
                    AuthStatus = "NotAuthorized",
                    AuthUser = null,
                    DeviceType = "Windows",
                    Description = $"Imported via Discovery Scan ({item.ScanId})",
                });
                importedCount++;
            }
            item.Status = "Managed";
        }

        await _db.SaveChangesAsync();
        _logger.LogInformation("Imported {Count} discovered Windows endpoints into inventory", importedCount);
        return Ok(new ApiResponse { Success = true, Message = $"Imported {importedCount} Windows endpoints into inventory" });
    }
}
