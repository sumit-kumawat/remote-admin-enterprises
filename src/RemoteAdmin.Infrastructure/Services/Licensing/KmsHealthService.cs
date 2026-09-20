using System.Diagnostics;
using System.Net;
using System.Net.Sockets;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using RemoteAdmin.Application.Dtos.Licensing;
using RemoteAdmin.Application.Interfaces.Licensing;
using RemoteAdmin.Domain.Enums;
using RemoteAdmin.Infrastructure.Data;

namespace RemoteAdmin.Infrastructure.Services.Licensing;

public class KmsHealthService : IKmsHealthService
{
    private readonly AppDbContext _db;
    private readonly ILogger<KmsHealthService> _logger;

    public KmsHealthService(AppDbContext db, ILogger<KmsHealthService> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task<KmsHealthCheckResultDto> CheckHealthAsync(Guid kmsHostId, CancellationToken cancellationToken = default)
    {
        var host = await _db.KmsHosts.FirstOrDefaultAsync(h => h.Id == kmsHostId, cancellationToken);
        if (host == null)
        {
            throw new KeyNotFoundException($"KMS Host '{kmsHostId}' not found.");
        }

        var result = new KmsHealthCheckResultDto
        {
            KmsHostId = host.Id,
            Hostname = host.Hostname,
            CheckedAt = DateTime.UtcNow
        };

        var targetAddress = !string.IsNullOrWhiteSpace(host.Fqdn) ? host.Fqdn : (!string.IsNullOrWhiteSpace(host.IpAddress) ? host.IpAddress : host.Hostname);

        IPAddress[] resolvedAddresses = [];
        try
        {
            resolvedAddresses = await Dns.GetHostAddressesAsync(targetAddress, cancellationToken);
            result.DnsResolved = resolvedAddresses.Length > 0;
        }
        catch (Exception ex)
        {
            _logger.LogWarning("DNS resolution failed for KMS Host '{Hostname}': {Message}", host.Hostname, ex.Message);
            result.DnsResolved = false;
        }

        var targetIp = resolvedAddresses.Length > 0 ? resolvedAddresses[0].ToString() : host.IpAddress;

        if (string.IsNullOrWhiteSpace(targetIp))
        {
            result.Status = KmsHostStatus.Misconfigured;
            result.ErrorMessage = "Unable to resolve target IP or FQDN for host.";
        }
        else
        {
            var stopwatch = Stopwatch.StartNew();
            try
            {
                using var client = new TcpClient();
                var connectTask = client.ConnectAsync(targetIp, host.Port);
                var timeoutTask = Task.Delay(TimeSpan.FromSeconds(4), cancellationToken);

                var completedTask = await Task.WhenAny(connectTask, timeoutTask);
                stopwatch.Stop();

                if (completedTask == connectTask && client.Connected)
                {
                    result.PortReachable = true;
                    result.LatencyMs = (int)stopwatch.ElapsedMilliseconds;
                    result.Status = KmsHostStatus.Online;
                }
                else
                {
                    result.PortReachable = false;
                    result.Status = KmsHostStatus.Offline;
                    result.ErrorMessage = $"TCP port {host.Port} connection timed out.";
                }
            }
            catch (Exception ex)
            {
                stopwatch.Stop();
                result.PortReachable = false;
                result.Status = KmsHostStatus.Offline;
                result.ErrorMessage = ex.Message;
                _logger.LogWarning("TCP 1688 check failed for KMS Host '{Hostname}': {Message}", host.Hostname, ex.Message);
            }
        }

        // Update database entity
        host.Status = result.Status;
        host.LastHealthCheck = result.CheckedAt;
        host.ResponseLatencyMs = result.LatencyMs;
        host.LastErrorMessage = result.ErrorMessage;
        host.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(cancellationToken);

        return result;
    }

    public async Task<List<KmsHealthCheckResultDto>> CheckAllHostsHealthAsync(CancellationToken cancellationToken = default)
    {
        var hosts = await _db.KmsHosts.ToListAsync(cancellationToken);
        var results = new List<KmsHealthCheckResultDto>();

        foreach (var host in hosts)
        {
            try
            {
                var check = await CheckHealthAsync(host.Id, cancellationToken);
                results.Add(check);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to check health for KMS Host '{Hostname}'", host.Hostname);
            }
        }

        return results;
    }
}
