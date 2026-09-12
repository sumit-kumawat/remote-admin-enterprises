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

        var endpoint = new Endpoint
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
}
