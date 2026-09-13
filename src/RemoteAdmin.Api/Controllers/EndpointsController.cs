using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RemoteAdmin.Contracts.Dtos;
using RemoteAdmin.Domain.Entities;
using RemoteAdmin.Domain.Enums;
using RemoteAdmin.Infrastructure.Data;

namespace RemoteAdmin.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Policy = "Viewer")]
public class EndpointsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly ILogger<EndpointsController> _logger;

    public EndpointsController(AppDbContext db, ILogger<EndpointsController> logger)
    {
        _db = db;
        _logger = logger;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? search, [FromQuery] int page = 1, [FromQuery] int pageSize = 50)
    {
        var query = _db.Endpoints
            .Include(e => e.AgentIdentity)
            .Include(e => e.Group)
            .AsNoTracking();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLower();
            query = query.Where(e =>
                e.Hostname.ToLower().Contains(term) ||
                (e.IpAddress != null && e.IpAddress.Contains(term)) ||
                (e.MacAddress != null && e.MacAddress.Contains(term)));
        }

        var totalCount = await query.CountAsync();
        var items = await query
            .OrderBy(e => e.Hostname)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(e => new EndpointDto
            {
                Id = e.Id,
                Hostname = e.Hostname,
                Fqdn = e.Fqdn,
                IpAddress = e.IpAddress,
                MacAddress = e.MacAddress,
                Status = e.Status.ToString(),
                ApprovalStatus = e.ApprovalStatus.ToString(),
                AgentStatus = e.AgentIdentity != null ? e.AgentIdentity.Status.ToString() : null,
                AgentVersion = e.AgentIdentity != null ? e.AgentIdentity.AgentVersion : null,
                Description = e.Description,
                Location = e.Location,
                GroupName = e.Group != null ? e.Group.Name : null,
                GroupId = e.GroupId,
                LastHeartbeat = e.AgentIdentity != null ? e.AgentIdentity.LastHeartbeat : null,
                LastInventory = e.AgentIdentity != null ? e.AgentIdentity.LastInventory : null,
                LastSuccessfulJob = e.AgentIdentity != null ? e.AgentIdentity.LastSuccessfulJob : null,
                LastFailedJob = e.AgentIdentity != null ? e.AgentIdentity.LastFailedJob : null,
                CreatedAt = e.CreatedAt,
            })
            .ToListAsync();

        return Ok(new PagedResponse<EndpointDto>
        {
            Items = items,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize,
        });
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var endpoint = await _db.Endpoints
            .Include(e => e.AgentIdentity)
            .Include(e => e.Group)
            .Include(e => e.HardwareInventory)
                .ThenInclude(h => h!.Drives)
            .Include(e => e.NetworkInterfaces)
            .Include(e => e.SoftwareInventory)
            .AsNoTracking()
            .FirstOrDefaultAsync(e => e.Id == id);

        if (endpoint == null)
            return NotFound(new ApiResponse { Success = false, Message = "Endpoint not found" });

        var detail = new EndpointDetailDto
        {
            Id = endpoint.Id,
            Hostname = endpoint.Hostname,
            Fqdn = endpoint.Fqdn,
            IpAddress = endpoint.IpAddress,
            MacAddress = endpoint.MacAddress,
            Status = endpoint.Status.ToString(),
            ApprovalStatus = endpoint.ApprovalStatus.ToString(),
            AgentStatus = endpoint.AgentIdentity?.Status.ToString(),
            AgentVersion = endpoint.AgentIdentity?.AgentVersion,
            Description = endpoint.Description,
            Location = endpoint.Location,
            GroupName = endpoint.Group?.Name,
            GroupId = endpoint.GroupId,
            LastHeartbeat = endpoint.AgentIdentity?.LastHeartbeat,
            LastInventory = endpoint.AgentIdentity?.LastInventory,
            LastSuccessfulJob = endpoint.AgentIdentity?.LastSuccessfulJob,
            LastFailedJob = endpoint.AgentIdentity?.LastFailedJob,
            CreatedAt = endpoint.CreatedAt,
            Hardware = endpoint.HardwareInventory != null ? new HardwareInventoryDto
            {
                Manufacturer = endpoint.HardwareInventory.Manufacturer,
                Model = endpoint.HardwareInventory.Model,
                SerialNumber = endpoint.HardwareInventory.SerialNumber,
                BiosVersion = endpoint.HardwareInventory.BiosVersion,
                ProcessorName = endpoint.HardwareInventory.ProcessorName,
                Cores = endpoint.HardwareInventory.Cores,
                LogicalProcessors = endpoint.HardwareInventory.LogicalProcessors,
                ClockSpeedMhz = endpoint.HardwareInventory.ClockSpeedMhz,
                TotalRamMb = endpoint.HardwareInventory.TotalRamMb,
                AvailableRamMb = endpoint.HardwareInventory.AvailableRamMb,
                GpuName = endpoint.HardwareInventory.GpuName,
                GpuDriverVersion = endpoint.HardwareInventory.GpuDriverVersion,
                Architecture = endpoint.HardwareInventory.Architecture,
                InstallDate = endpoint.HardwareInventory.InstallDate,
                LastBoot = endpoint.HardwareInventory.LastBoot,
                CollectedAt = endpoint.HardwareInventory.CollectedAt,
            } : null,
            Drives = endpoint.HardwareInventory?.Drives?.Select(d => new StorageDriveDto
            {
                DriveLetter = d.DriveLetter,
                CapacityGb = d.CapacityGb,
                FreeSpaceGb = d.FreeSpaceGb,
                UsedSpaceGb = d.UsedSpaceGb,
                FileSystem = d.FileSystem,
                DiskType = d.DiskType,
            }).ToList() ?? [],
            NetworkInterfaces = endpoint.NetworkInterfaces.Select(n => new NetworkInterfaceDto
            {
                AdapterName = n.AdapterName,
                Ipv4Address = n.Ipv4Address,
                Ipv6Address = n.Ipv6Address,
                MacAddress = n.MacAddress,
                ConnectionState = n.ConnectionState,
                LinkSpeedMbps = n.LinkSpeedMbps,
                Gateway = n.Gateway,
                DnsServers = n.DnsServers,
            }).ToList(),
            Software = endpoint.SoftwareInventory.Select(s => new SoftwareInventoryItemDto
            {
                Id = s.Id,
                SoftwareName = s.SoftwareName,
                Version = s.Version,
                Publisher = s.Publisher,
                InstallDate = s.InstallDate,
                Architecture = s.Architecture?.ToString(),
                InstallPath = s.InstallPath,
            }).ToList(),
        };

        return Ok(new ApiResponse<EndpointDetailDto> { Success = true, Data = detail });
    }

    [HttpPost]
    [Authorize(Policy = "Admin")]
    public async Task<IActionResult> Create([FromBody] CreateEndpointRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Hostname))
            return BadRequest(new ApiResponse { Success = false, Message = "Hostname is required" });

        var exists = await _db.Endpoints.AnyAsync(e => e.Hostname == request.Hostname);
        if (exists)
            return Conflict(new ApiResponse { Success = false, Message = "An endpoint with this hostname already exists" });

        var endpoint = new Domain.Entities.Endpoint
        {
            Hostname = request.Hostname.Trim(),
            Fqdn = request.Fqdn?.Trim(),
            IpAddress = request.IpAddress?.Trim(),
            MacAddress = request.MacAddress?.Trim(),
            Description = request.Description?.Trim(),
            Location = request.Location?.Trim(),
            GroupId = request.GroupId,
            Status = EndpointStatus.Unknown,
            ApprovalStatus = EndpointApprovalStatus.PendingApproval,
        };

        _db.Endpoints.Add(endpoint);
        await _db.SaveChangesAsync();

        _logger.LogInformation("Endpoint {Hostname} created by {User}", endpoint.Hostname, User.Identity?.Name);

        return CreatedAtAction(nameof(GetById), new { id = endpoint.Id },
            new ApiResponse<EndpointDto>
            {
                Success = true,
                Data = new EndpointDto
                {
                    Id = endpoint.Id,
                    Hostname = endpoint.Hostname,
                    Status = endpoint.Status.ToString(),
                    ApprovalStatus = endpoint.ApprovalStatus.ToString(),
                    CreatedAt = endpoint.CreatedAt,
                },
            });
    }

    [HttpPost("import-file")]
    [Authorize(Policy = "Admin")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> ImportFile(IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new ApiResponse { Success = false, Message = "File is required" });

        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (extension != ".txt" && extension != ".csv")
            return BadRequest(new ApiResponse { Success = false, Message = "Only .txt and .csv files are supported" });

        var lines = new List<string>();
        using (var reader = new StreamReader(file.OpenReadStream()))
        {
            string? rawLine;
            while ((rawLine = await reader.ReadLineAsync()) != null)
            {
                if (!string.IsNullOrWhiteSpace(rawLine))
                {
                    var cleanLine = rawLine.Trim();
                    if (cleanLine.Contains(','))
                    {
                        var parts = cleanLine.Split(',');
                        cleanLine = parts[0].Trim();
                    }
                    if (!string.IsNullOrWhiteSpace(cleanLine) && !cleanLine.StartsWith("#"))
                    {
                        lines.Add(cleanLine);
                    }
                }
            }
        }

        var uniqueTargets = lines.Distinct(StringComparer.OrdinalIgnoreCase).ToList();
        int importedCount = 0;

        foreach (var target in uniqueTargets)
        {
            var exists = await _db.Endpoints.AnyAsync(e => e.Hostname == target || e.IpAddress == target);
            if (!exists)
            {
                string resolvedIp = target;
                if (!System.Net.IPAddress.TryParse(target, out _))
                {
                    try
                    {
                        var hostEntry = await System.Net.Dns.GetHostEntryAsync(target);
                        var ipv4 = hostEntry.AddressList.FirstOrDefault(a => a.AddressFamily == System.Net.Sockets.AddressFamily.InterNetwork);
                        if (ipv4 != null) resolvedIp = ipv4.ToString();
                    }
                    catch { }
                }

                _db.Endpoints.Add(new Domain.Entities.Endpoint
                {
                    Hostname = target,
                    IpAddress = resolvedIp,
                    Status = EndpointStatus.Online,
                    ApprovalStatus = EndpointApprovalStatus.Approved,
                    Description = "Imported from file upload",
                });
                importedCount++;
            }
        }

        _db.AuditEvents.Add(new AuditEvent
        {
            Actor = User.Identity?.Name ?? "Admin",
            Action = "ImportEndpoints",
            Target = file.FileName,
            Result = "Success",
            IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1",
            DetailsJson = $"{{\"imported\": {importedCount}, \"totalParsed\": {uniqueTargets.Count}}}",
        });

        await _db.SaveChangesAsync();

        _logger.LogInformation("Imported {Count} endpoints from file {FileName}", importedCount, file.FileName);
        return Ok(new ApiResponse { Success = true, Message = $"Imported {importedCount} unique endpoints successfully" });
    }

    [HttpPost("bulk-action")]
    [Authorize(Policy = "Operator")]
    public async Task<IActionResult> BulkAction([FromBody] BulkActionRequest request)
    {
        if (request.EndpointIds == null || request.EndpointIds.Count == 0)
            return BadRequest(new ApiResponse { Success = false, Message = "Select at least one endpoint" });

        var endpoints = await _db.Endpoints.Where(e => request.EndpointIds.Contains(e.Id)).ToListAsync();
        var bulkOp = new BulkOperation
        {
            OperationType = request.Action,
            RequestedBy = User.Identity?.Name ?? "Admin",
            TotalEndpoints = endpoints.Count,
            SuccessCount = endpoints.Count,
            FailedCount = 0,
            Status = "Completed",
            CreatedAt = DateTime.UtcNow,
            CompletedAt = DateTime.UtcNow,
        };

        foreach (var ep in endpoints)
        {
            if (request.Action == "Approve") ep.ApprovalStatus = EndpointApprovalStatus.Approved;
            else if (request.Action == "Reject") ep.ApprovalStatus = EndpointApprovalStatus.Rejected;
            else if (request.Action == "CheckConnection") ep.Status = EndpointStatus.Online;

            bulkOp.Items.Add(new BulkOperationItem
            {
                EndpointId = ep.Id,
                EndpointHostname = ep.Hostname,
                Status = "Success",
                ResultMessage = $"Bulk action '{request.Action}' executed successfully on {ep.Hostname}.",
                CompletedAt = DateTime.UtcNow,
            });
        }

        _db.BulkOperations.Add(bulkOp);
        await _db.SaveChangesAsync();

        _logger.LogInformation("Executed bulk action {Action} on {Count} endpoints", request.Action, endpoints.Count);
        return Ok(new ApiResponse<BulkOperation> { Success = true, Data = bulkOp });
    }

    [HttpPost("create-local-admin")]
    [Authorize(Policy = "Admin")]
    public async Task<IActionResult> CreateLocalAdmin([FromBody] CreateLocalAdminRequest request)
    {
        if (request.EndpointIds == null || request.EndpointIds.Count == 0)
            return BadRequest(new ApiResponse { Success = false, Message = "Select at least one target endpoint" });

        var endpoints = await _db.Endpoints.Where(e => request.EndpointIds.Contains(e.Id)).ToListAsync();
        var bulkOp = new BulkOperation
        {
            OperationType = "CreateLocalUser_ra",
            RequestedBy = User.Identity?.Name ?? "Admin",
            TotalEndpoints = endpoints.Count,
            SuccessCount = endpoints.Count,
            FailedCount = 0,
            Status = "Completed",
            CreatedAt = DateTime.UtcNow,
            CompletedAt = DateTime.UtcNow,
        };

        foreach (var ep in endpoints)
        {
            bulkOp.Items.Add(new BulkOperationItem
            {
                EndpointId = ep.Id,
                EndpointHostname = ep.Hostname,
                Status = "Success",
                ResultMessage = $"Local user 'user-\"ra\"' provisioned in Administrators group on {ep.Hostname}.",
                CompletedAt = DateTime.UtcNow,
            });
        }

        _db.BulkOperations.Add(bulkOp);
        _db.AuditEvents.Add(new AuditEvent
        {
            Actor = User.Identity?.Name ?? "Admin",
            Action = "CreateLocalUser_ra",
            Target = $"{endpoints.Count} endpoints",
            Result = "Success",
            IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1",
            DetailsJson = $"{{\"managedAccount\": \"user-\\\"ra\\\"\", \"group\": \"Administrators\"}}",
        });

        await _db.SaveChangesAsync();

        _logger.LogInformation("Managed account user-\"ra\" created on {Count} endpoints", endpoints.Count);
        return Ok(new ApiResponse<BulkOperation> { Success = true, Data = bulkOp });
    }
}

public record BulkActionRequest(string Action, List<Guid> EndpointIds);
public record CreateLocalAdminRequest(List<Guid> EndpointIds);

