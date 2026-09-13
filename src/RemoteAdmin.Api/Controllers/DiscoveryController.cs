using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RemoteAdmin.Contracts.Dtos;
using RemoteAdmin.Domain.Entities;
using RemoteAdmin.Domain.Enums;
using RemoteAdmin.Infrastructure.Data;
using RemoteAdmin.Infrastructure.Services;
using Endpoint = RemoteAdmin.Domain.Entities.Endpoint;

namespace RemoteAdmin.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Policy = "Operator")]
public class DiscoveryController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IDiscoveryScanEngine _scanEngine;
    private readonly ILogger<DiscoveryController> _logger;

    public DiscoveryController(AppDbContext db, IDiscoveryScanEngine scanEngine, ILogger<DiscoveryController> logger)
    {
        _db = db;
        _scanEngine = scanEngine;
        _logger = logger;
    }

    [HttpGet("subnets")]
    public IActionResult GetLocalSubnets()
    {
        var subnets = _scanEngine.GetLocalSubnets();
        return Ok(new ApiResponse<List<SubnetInfoDto>> { Success = true, Data = subnets });
    }

    [HttpPost("scans")]
    public async Task<IActionResult> StartScan([FromBody] CreateScanRequest request)
    {
        if (request == null)
            return BadRequest(new ApiResponse { Success = false, Message = "Scan configuration request is required." });

        if (!request.ConfirmedOwnership)
            return BadRequest(new ApiResponse { Success = false, Message = "Safety Policy Guard: You must check and acknowledge network ownership confirmation before scanning." });

        try
        {
            var user = User.Identity?.Name ?? "Admin";
            var scan = await _scanEngine.StartScanAsync(request, user);

            _db.AuditEvents.Add(new AuditEvent
            {
                Actor = user,
                Action = "DiscoveryScan_Start",
                Target = scan.TargetCidr,
                Result = "Success",
                IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1",
                DetailsJson = JsonSerializer.Serialize(new { scanId = scan.Id, scan.Name, scan.TargetCidr, scan.ScanType, scan.HostsTotal }),
            });
            await _db.SaveChangesAsync();

            _logger.LogInformation("[DISCOVERY SCAN START] User '{User}' initiated single subnet scan {ScanId} on target {TargetCidr}.", user, scan.Id, scan.TargetCidr);

            var dto = MapScanToDto(scan);
            return Ok(new ApiResponse<DiscoveryScanDto> { Success = true, Message = $"Discovery scan started for CIDR {scan.TargetCidr}", Data = dto });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new ApiResponse { Success = false, Message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new ApiResponse { Success = false, Message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to start discovery scan");
            return StatusCode(500, new ApiResponse { Success = false, Message = $"Scan initialization failed: {ex.Message}" });
        }
    }

    [HttpGet("scans")]
    public async Task<IActionResult> GetScans([FromQuery] int page = 1, [FromQuery] int pageSize = 50)
    {
        var query = _db.DiscoveryScans.AsNoTracking().OrderByDescending(s => s.StartedAt);
        var total = await query.CountAsync();
        var scans = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();

        var dtos = scans.Select(MapScanToDto).ToList();
        return Ok(new PagedResponse<DiscoveryScanDto>
        {
            Items = dtos,
            TotalCount = total,
            Page = page,
            PageSize = pageSize
        });
    }

    [HttpGet("scans/{id:guid}")]
    public async Task<IActionResult> GetScanById(Guid id)
    {
        var scan = await _db.DiscoveryScans.AsNoTracking().FirstOrDefaultAsync(s => s.Id == id);
        if (scan == null)
            return NotFound(new ApiResponse { Success = false, Message = $"Discovery scan '{id}' not found." });

        return Ok(new ApiResponse<DiscoveryScanDto> { Success = true, Data = MapScanToDto(scan) });
    }

    [HttpGet("scans/{id:guid}/hosts")]
    public async Task<IActionResult> GetScanHosts(Guid id, [FromQuery] string? status, [FromQuery] string? search)
    {
        var scanExists = await _db.DiscoveryScans.AnyAsync(s => s.Id == id);
        if (!scanExists)
            return NotFound(new ApiResponse { Success = false, Message = $"Discovery scan '{id}' not found." });

        var query = _db.DiscoveryHosts.AsNoTracking().Where(h => h.ScanId == id);

        if (!string.IsNullOrWhiteSpace(status) && status.Trim() != "All")
        {
            query = query.Where(h => h.Status.ToLower() == status.Trim().ToLower());
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLower();
            query = query.Where(h =>
                h.IpAddress.Contains(term) ||
                (h.Hostname != null && h.Hostname.ToLower().Contains(term)) ||
                (h.MacAddress != null && h.MacAddress.ToLower().Contains(term)) ||
                (h.Vendor != null && h.Vendor.ToLower().Contains(term)) ||
                (h.OsGuess != null && h.OsGuess.ToLower().Contains(term)));
        }

        var hosts = await query.OrderBy(h => h.IpAddress).ToListAsync();
        var dtos = hosts.Select(DiscoveryScanEngine.MapHostToDto).ToList();

        return Ok(new ApiResponse<List<DiscoveryHostDto>> { Success = true, Data = dtos });
    }

    [HttpPost("scans/{id:guid}/pause")]
    public async Task<IActionResult> PauseScan(Guid id)
    {
        var scan = await _db.DiscoveryScans.FindAsync(id);
        if (scan == null)
            return NotFound(new ApiResponse { Success = false, Message = $"Discovery scan '{id}' not found." });

        scan.Status = "Paused";
        await _db.SaveChangesAsync();
        await _scanEngine.PauseScanAsync(id);

        _logger.LogInformation("[DISCOVERY SCAN PAUSE] Scan {ScanId} paused.", id);
        return Ok(new ApiResponse { Success = true, Message = $"Scan '{scan.Name}' paused." });
    }

    [HttpPost("scans/{id:guid}/resume")]
    public async Task<IActionResult> ResumeScan(Guid id)
    {
        var scan = await _db.DiscoveryScans.FindAsync(id);
        if (scan == null)
            return NotFound(new ApiResponse { Success = false, Message = $"Discovery scan '{id}' not found." });

        scan.Status = "Running";
        await _db.SaveChangesAsync();
        await _scanEngine.ResumeScanAsync(id);

        _logger.LogInformation("[DISCOVERY SCAN RESUME] Scan {ScanId} resumed.", id);
        return Ok(new ApiResponse { Success = true, Message = $"Scan '{scan.Name}' resumed." });
    }

    [HttpPost("scans/{id:guid}/cancel")]
    public async Task<IActionResult> CancelScan(Guid id)
    {
        var scan = await _db.DiscoveryScans.FindAsync(id);
        if (scan == null)
            return NotFound(new ApiResponse { Success = false, Message = $"Discovery scan '{id}' not found." });

        scan.Status = "Cancelled";
        scan.CompletedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        await _scanEngine.CancelScanAsync(id);

        _logger.LogInformation("[DISCOVERY SCAN CANCEL] Scan {ScanId} cancelled.", id);
        return Ok(new ApiResponse { Success = true, Message = $"Scan '{scan.Name}' cancelled." });
    }

    [HttpPost("hosts/{id:guid}/promote")]
    public async Task<IActionResult> PromoteHost(Guid id, [FromBody] PromoteHostRequest? request)
    {
        var host = await _db.DiscoveryHosts.FindAsync(id);
        if (host == null)
            return NotFound(new ApiResponse { Success = false, Message = $"Discovered host '{id}' not found." });

        if (host.IsPromoted && host.PromotedEndpointId.HasValue)
        {
            var existingEndpoint = await _db.Endpoints.FindAsync(host.PromotedEndpointId.Value);
            if (existingEndpoint != null)
            {
                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = $"Host {host.IpAddress} is already promoted to Endpoint '{existingEndpoint.Hostname}'.",
                    Data = new { endpointId = existingEndpoint.Id, hostname = existingEndpoint.Hostname }
                });
            }
        }

        string hostname = !string.IsNullOrWhiteSpace(request?.Hostname) ? request.Hostname.Trim() : (!string.IsNullOrWhiteSpace(host.Hostname) ? host.Hostname : host.IpAddress);
        var exists = await _db.Endpoints.AnyAsync(e => e.Hostname == hostname || e.IpAddress == host.IpAddress);

        Endpoint endpoint;
        if (!exists)
        {
            endpoint = new Endpoint
            {
                Hostname = hostname,
                IpAddress = host.IpAddress,
                MacAddress = host.MacAddress,
                DeviceType = request?.DeviceType ?? (host.OsGuess?.Contains("Windows") == true ? "Windows" : "Linux"),
                Status = EndpointStatus.Online, // Reachable via ICMP ping
                AuthStatus = "NotAuthorized",
                ApprovalStatus = EndpointApprovalStatus.Approved,
                AuthMode = request?.AuthMode ?? "Inherit",
                CredentialProfileId = request?.CredentialProfileId,
                Description = $"Promoted from Discovery Scan ({host.ScanId})"
            };
            _db.Endpoints.Add(endpoint);
        }
        else
        {
            endpoint = await _db.Endpoints.FirstAsync(e => e.Hostname == hostname || e.IpAddress == host.IpAddress);
        }

        host.IsPromoted = true;
        host.PromotedEndpointId = endpoint.Id;

        var user = User.Identity?.Name ?? "Admin";
        _db.AuditEvents.Add(new AuditEvent
        {
            Actor = user,
            Action = "PromoteDiscoveredHost",
            Target = $"{endpoint.Hostname} ({endpoint.IpAddress})",
            Result = "Success",
            IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1",
            DetailsJson = JsonSerializer.Serialize(new { hostId = host.Id, endpointId = endpoint.Id, host.IpAddress, endpoint.Hostname }),
        });

        await _db.SaveChangesAsync();
        _logger.LogInformation("[PROMOTE HOST] Host '{IpAddress}' promoted to Endpoint '{Hostname}' by user '{User}'.", host.IpAddress, endpoint.Hostname, user);

        return Ok(new ApiResponse<object>
        {
            Success = true,
            Message = $"Host '{host.IpAddress}' promoted to managed Endpoint '{endpoint.Hostname}' successfully.",
            Data = new { endpointId = endpoint.Id, hostname = endpoint.Hostname }
        });
    }

    [HttpGet("scans/{id:guid}/export")]
    public async Task<IActionResult> ExportScanResults(Guid id, [FromQuery] string format = "csv")
    {
        var scan = await _db.DiscoveryScans.AsNoTracking().FirstOrDefaultAsync(s => s.Id == id);
        if (scan == null)
            return NotFound(new ApiResponse { Success = false, Message = $"Discovery scan '{id}' not found." });

        var hosts = await _db.DiscoveryHosts.AsNoTracking().Where(h => h.ScanId == id).OrderBy(h => h.IpAddress).ToListAsync();

        if (format.Trim().ToLower() == "json")
        {
            var json = JsonSerializer.Serialize(hosts.Select(DiscoveryScanEngine.MapHostToDto), new JsonSerializerOptions { WriteIndented = true });
            return File(Encoding.UTF8.GetBytes(json), "application/json", $"discovery-scan-{scan.TargetCidr.Replace('/', '-')}.json");
        }
        else
        {
            var sb = new StringBuilder();
            sb.AppendLine("IP Address,Hostname,MAC Address,Vendor,TTL,OS Guess,Status,Confidence,Open Ports,Promoted");
            foreach (var h in hosts)
            {
                var dto = DiscoveryScanEngine.MapHostToDto(h);
                var portsStr = string.Join(";", dto.OpenPorts);
                sb.AppendLine($"\"{dto.IpAddress}\",\"{dto.Hostname ?? ""}\",\"{dto.MacAddress ?? ""}\",\"{dto.Vendor ?? ""}\",\"{dto.Ttl}\",\"{dto.OsGuess ?? ""}\",\"{dto.Status}\",\"{dto.Confidence}\",\"{portsStr}\",\"{dto.IsPromoted}\"");
            }
            return File(Encoding.UTF8.GetBytes(sb.ToString()), "text/csv", $"discovery-scan-{scan.TargetCidr.Replace('/', '-')}.csv");
        }
    }

    // Schedules Management (Requires Admin role)
    [HttpGet("schedules")]
    [Authorize(Policy = "Admin")]
    public async Task<IActionResult> GetSchedules()
    {
        var schedules = await _db.DiscoverySchedules.AsNoTracking().OrderByDescending(s => s.CreatedAt).ToListAsync();
        var dtos = schedules.Select(s => new DiscoveryScheduleDto
        {
            Id = s.Id,
            Name = s.Name,
            CronExpression = s.CronExpression,
            TargetCidr = s.TargetCidr,
            ScanType = s.ScanType,
            PortSet = s.PortSet,
            Enabled = s.Enabled,
            LastRunAt = s.LastRunAt,
            NextRunAt = s.NextRunAt,
            CreatedAt = s.CreatedAt,
            CreatedBy = s.CreatedBy
        }).ToList();

        return Ok(new ApiResponse<List<DiscoveryScheduleDto>> { Success = true, Data = dtos });
    }

    [HttpPost("schedules")]
    [Authorize(Policy = "Admin")]
    public async Task<IActionResult> CreateSchedule([FromBody] CreateScheduleRequest request)
    {
        if (request == null || string.IsNullOrWhiteSpace(request.TargetCidr) || string.IsNullOrWhiteSpace(request.CronExpression))
            return BadRequest(new ApiResponse { Success = false, Message = "Name, Target CIDR, and Cron Expression are required." });

        try
        {
            _scanEngine.ParseSingleSubnetCidr(request.TargetCidr);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new ApiResponse { Success = false, Message = ex.Message });
        }

        var user = User.Identity?.Name ?? "Admin";
        var schedule = new DiscoverySchedule
        {
            Name = request.Name.Trim(),
            CronExpression = request.CronExpression.Trim(),
            TargetCidr = request.TargetCidr.Trim(),
            ScanType = request.ScanType ?? "Full",
            PortSet = request.PortSet ?? "Common",
            Enabled = request.Enabled,
            CreatedBy = user,
            CreatedAt = DateTime.UtcNow
        };

        _db.DiscoverySchedules.Add(schedule);
        await _db.SaveChangesAsync();

        _logger.LogInformation("[DISCOVERY SCHEDULE CREATE] User '{User}' created schedule '{Name}' ({Cron}) for CIDR {TargetCidr}.", user, schedule.Name, schedule.CronExpression, schedule.TargetCidr);

        return Ok(new ApiResponse<DiscoveryScheduleDto>
        {
            Success = true,
            Message = $"Discovery scan schedule '{schedule.Name}' created successfully.",
            Data = new DiscoveryScheduleDto
            {
                Id = schedule.Id,
                Name = schedule.Name,
                CronExpression = schedule.CronExpression,
                TargetCidr = schedule.TargetCidr,
                ScanType = schedule.ScanType,
                PortSet = schedule.PortSet,
                Enabled = schedule.Enabled,
                CreatedAt = schedule.CreatedAt,
                CreatedBy = schedule.CreatedBy
            }
        });
    }

    [HttpDelete("schedules/{id:guid}")]
    [Authorize(Policy = "Admin")]
    public async Task<IActionResult> DeleteSchedule(Guid id)
    {
        var schedule = await _db.DiscoverySchedules.FindAsync(id);
        if (schedule == null)
            return NotFound(new ApiResponse { Success = false, Message = $"Schedule '{id}' not found." });

        _db.DiscoverySchedules.Remove(schedule);
        await _db.SaveChangesAsync();

        return Ok(new ApiResponse { Success = true, Message = $"Schedule '{schedule.Name}' deleted." });
    }

    private static DiscoveryScanDto MapScanToDto(DiscoveryScan scan)
    {
        return new DiscoveryScanDto
        {
            Id = scan.Id,
            Name = scan.Name,
            TargetCidr = scan.TargetCidr,
            ScanType = scan.ScanType,
            PortSet = scan.PortSet,
            Concurrency = scan.Concurrency,
            TimeoutMs = scan.TimeoutMs,
            Retries = scan.Retries,
            RateLimitPps = scan.RateLimitPps,
            Status = scan.Status,
            StartedAt = scan.StartedAt,
            CompletedAt = scan.CompletedAt,
            CreatedBy = scan.CreatedBy,
            ProgressPercent = scan.ProgressPercent,
            HostsFound = scan.HostsFound,
            HostsTotal = scan.HostsTotal,
            ConfirmedOwnership = scan.ConfirmedOwnership
        };
    }
}
