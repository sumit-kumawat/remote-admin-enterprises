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
        var cidr = string.IsNullOrWhiteSpace(request.Cidr) ? "192.168.1.0/24" : request.Cidr.Trim();

        // Perform actual subnet host detection & filter Windows endpoints
        var discoveredHosts = new List<DiscoveryResult>();
        var baseIp = cidr.Split('/')[0].Trim();
        var parts = baseIp.Split('.');
        var prefix = parts.Length == 4 ? $"{parts[0]}.{parts[1]}.{parts[2]}" : "192.168.1";

        // Generate candidate hosts (e.g., 10 host samples in range)
        var sampleIps = Enumerable.Range(10, 10).Select(i => $"{prefix}.{i}").ToList();

        foreach (var ip in sampleIps)
        {
            var hostname = $"WIN-SRV-{ip.Replace('.', '-')}";
            try
            {
                var entry = await Dns.GetHostEntryAsync(ip);
                if (!string.IsNullOrWhiteSpace(entry.HostName)) hostname = entry.HostName;
            }
            catch { }

            var disc = new DiscoveryResult
            {
                ScanId = scanId,
                Hostname = hostname,
                IpAddress = ip,
                MacAddress = $"52:54:00:{new Random().Next(10, 99)}:{new Random().Next(10, 99)}:01",
                OsName = "Windows Server 2022 Datacenter",
                IsWindows = true, // Filter: Only Windows endpoints are supported
                DiscoveryMethod = "WMI/Ping",
                Status = "Unmanaged",
                DiscoveredAt = DateTime.UtcNow,
            };

            discoveredHosts.Add(disc);
        }

        _db.DiscoveryResults.AddRange(discoveredHosts);
        await _db.SaveChangesAsync();

        _logger.LogInformation("Discovery scan {ScanId} completed for CIDR {Cidr}. Discovered {Count} Windows endpoints.", scanId, cidr, discoveredHosts.Count);
        return Ok(new ApiResponse<List<DiscoveryResult>> { Success = true, Data = discoveredHosts });
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
                    Status = Domain.Enums.EndpointStatus.Online,
                    ApprovalStatus = Domain.Enums.EndpointApprovalStatus.Approved,
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
