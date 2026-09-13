using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RemoteAdmin.Application.Interfaces;
using RemoteAdmin.Contracts.Dtos;
using RemoteAdmin.Domain.Entities;
using RemoteAdmin.Domain.Enums;
using RemoteAdmin.Infrastructure.Data;
using Endpoint = RemoteAdmin.Domain.Entities.Endpoint;

namespace RemoteAdmin.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Policy = "Viewer")]
public class EndpointsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IWindowsManagementService _wmiService;
    private readonly ILogger<EndpointsController> _logger;

    public EndpointsController(AppDbContext db, IWindowsManagementService wmiService, ILogger<EndpointsController> logger)
    {
        _db = db;
        _wmiService = wmiService;
        _logger = logger;
    }

    [HttpGet("search")]
    public async Task<IActionResult> GlobalSearch([FromQuery] string? q)
    {
        if (string.IsNullOrWhiteSpace(q) || q.Trim().Length < 1)
            return Ok(new List<GlobalSearchEndpointDto>());

        var term = q.Trim().ToLower();
        var results = await _db.Endpoints
            .Include(e => e.CredentialProfile)
            .AsNoTracking()
            .Where(e =>
                e.Hostname.ToLower().Contains(term) ||
                (e.Fqdn != null && e.Fqdn.ToLower().Contains(term)) ||
                (e.IpAddress != null && e.IpAddress.Contains(term)) ||
                (e.MacAddress != null && e.MacAddress.ToLower().Contains(term)) ||
                (e.DeviceType != null && e.DeviceType.ToLower().Contains(term)) ||
                (e.AuthStatus != null && e.AuthStatus.ToLower().Contains(term)) ||
                (e.AuthUser != null && e.AuthUser.ToLower().Contains(term)) ||
                (e.CredentialProfile != null && e.CredentialProfile.Username.ToLower().Contains(term)))
            .Take(15)
            .Select(e => new GlobalSearchEndpointDto
            {
                Id = e.Id,
                Hostname = e.Hostname,
                Fqdn = e.Fqdn,
                IpAddress = e.IpAddress,
                MacAddress = e.MacAddress,
                Status = e.Status.ToString(),
                AuthStatus = string.IsNullOrEmpty(e.AuthStatus) ? "Pending Authorization" : e.AuthStatus,
                AuthUser = e.AuthUser ?? (e.CredentialProfile != null ? e.CredentialProfile.Username : null),
                DeviceType = string.IsNullOrEmpty(e.DeviceType) ? "Windows" : e.DeviceType,
                OsName = e.HardwareInventory != null ? e.HardwareInventory.Manufacturer : "Windows Endpoint",
            })
            .ToListAsync();

        return Ok(results);
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? search, [FromQuery] int page = 1, [FromQuery] int pageSize = 100)
    {
        var query = _db.Endpoints
            .Include(e => e.AgentIdentity)
            .Include(e => e.Group)
            .Include(e => e.CredentialProfile)
            .AsNoTracking();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLower();
            query = query.Where(e =>
                e.Hostname.ToLower().Contains(term) ||
                (e.Fqdn != null && e.Fqdn.ToLower().Contains(term)) ||
                (e.IpAddress != null && e.IpAddress.Contains(term)) ||
                (e.MacAddress != null && e.MacAddress.Contains(term)) ||
                (e.AuthUser != null && e.AuthUser.ToLower().Contains(term)));
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
                AuthStatus = string.IsNullOrEmpty(e.AuthStatus) ? "Pending Authorization" : e.AuthStatus,
                AuthMode = string.IsNullOrEmpty(e.AuthMode) ? "Inherit" : e.AuthMode,
                AuthUser = e.AuthUser ?? (e.CredentialProfile != null ? e.CredentialProfile.Username : null),
                CredentialProfileId = e.CredentialProfileId,
                CredentialProfileName = e.CredentialProfile != null ? e.CredentialProfile.Name : null,
                DeviceType = string.IsNullOrEmpty(e.DeviceType) ? "Windows" : e.DeviceType,
                DomainWorkgroup = e.DomainWorkgroup,
                CurrentInteractiveUser = e.CurrentInteractiveUser,
                SystemUptime = e.SystemUptime,
                LastSuccessfulRefresh = e.LastSuccessfulRefresh,
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
            .Include(e => e.CredentialProfile)
            .Include(e => e.HardwareInventory)
                .ThenInclude(h => h!.Drives)
            .Include(e => e.NetworkInterfaces)
            .Include(e => e.SoftwareInventory)
            .AsNoTracking()
            .FirstOrDefaultAsync(e => e.Id == id);

        if (endpoint == null)
            return NotFound(new ApiResponse { Success = false, Message = "Endpoint not found" });

        Dictionary<string, SectionStatusDto> sectionStatuses = new();
        if (!string.IsNullOrEmpty(endpoint.SectionStatusesJson))
        {
            try
            {
                sectionStatuses = JsonSerializer.Deserialize<Dictionary<string, SectionStatusDto>>(endpoint.SectionStatusesJson) ?? new();
            }
            catch { }
        }

        List<LocalAccountDto> localAccounts = [];
        if (!string.IsNullOrEmpty(endpoint.LocalAccountsJson))
        {
            try
            {
                localAccounts = JsonSerializer.Deserialize<List<LocalAccountDto>>(endpoint.LocalAccountsJson) ?? [];
            }
            catch { }
        }

        List<SecuritySoftwareDto> securitySoftware = [];
        if (!string.IsNullOrEmpty(endpoint.SecuritySoftwareJson))
        {
            try
            {
                securitySoftware = JsonSerializer.Deserialize<List<SecuritySoftwareDto>>(endpoint.SecuritySoftwareJson) ?? [];
            }
            catch { }
        }



        var detail = new EndpointDetailDto
        {
            Id = endpoint.Id,
            Hostname = endpoint.Hostname,
            Fqdn = endpoint.Fqdn,
            IpAddress = endpoint.IpAddress,
            MacAddress = endpoint.MacAddress,
            Status = endpoint.Status.ToString(),
            ApprovalStatus = endpoint.ApprovalStatus.ToString(),
            AuthStatus = string.IsNullOrEmpty(endpoint.AuthStatus) ? "Pending Authorization" : endpoint.AuthStatus,
            AuthMode = string.IsNullOrEmpty(endpoint.AuthMode) ? "Inherit" : endpoint.AuthMode,
            AuthUser = endpoint.AuthUser ?? (endpoint.CredentialProfile != null ? endpoint.CredentialProfile.Username : null),
            CredentialProfileId = endpoint.CredentialProfileId,
            CredentialProfileName = endpoint.CredentialProfile?.Name,
            DeviceType = string.IsNullOrEmpty(endpoint.DeviceType) ? "Windows" : endpoint.DeviceType,
            DomainWorkgroup = endpoint.DomainWorkgroup,
            CurrentInteractiveUser = endpoint.CurrentInteractiveUser,
            SystemUptime = endpoint.SystemUptime,
            LastSuccessfulRefresh = endpoint.LastSuccessfulRefresh,
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
            LocalAccounts = localAccounts,
            SecuritySoftware = securitySoftware,
            PhysicalDisks = endpoint.HardwareInventory?.Drives != null && endpoint.HardwareInventory.Drives.Count > 0
                ? [
                    new PhysicalDiskDto
                    {
                        DiskIndex = 0,
                        Model = endpoint.HardwareInventory.Model ?? "Physical Storage Disk",
                        SerialNumber = endpoint.HardwareInventory.SerialNumber ?? "PRIMARY-DISK-0",
                        InterfaceType = "SATA/NVMe",
                        MediaType = "SSD",
                        CapacityGb = endpoint.HardwareInventory.Drives.Sum(d => d.CapacityGb ?? 0),
                        HealthStatus = "Healthy",
                        Partitions = endpoint.HardwareInventory.Drives.Select(d => new StorageDriveDto
                        {
                            DriveLetter = d.DriveLetter,
                            CapacityGb = d.CapacityGb,
                            FreeSpaceGb = d.FreeSpaceGb,
                            UsedSpaceGb = d.UsedSpaceGb,
                            FileSystem = d.FileSystem,
                            DiskType = d.DiskType
                        }).ToList()
                    }
                  ]
                : [],
            SectionStatuses = sectionStatuses
        };

        return Ok(new ApiResponse<EndpointDetailDto> { Success = true, Data = detail });
    }

    [HttpPost]
    [Authorize(Policy = "Admin")]
    public async Task<IActionResult> Create([FromBody] CreateEndpointRequest request)
    {
        var target = (request.Target ?? request.Hostname)?.Trim();
        if (string.IsNullOrWhiteSpace(target))
            return BadRequest(new ApiResponse { Success = false, Message = "Hostname or IP address is required" });

        var reqHostname = request.Hostname?.Trim();
        var reqIp = request.IpAddress?.Trim();

        var exists = await _db.Endpoints.AnyAsync(e => e.Hostname == target || e.IpAddress == target || (!string.IsNullOrEmpty(reqHostname) && e.Hostname == reqHostname));
        if (exists)
            return Conflict(new ApiResponse { Success = false, Message = "An endpoint with this hostname or IP already exists" });

        string hostname = !string.IsNullOrWhiteSpace(reqHostname) ? reqHostname : target;
        string resolvedIp = !string.IsNullOrWhiteSpace(reqIp) ? reqIp : target;

        if (string.IsNullOrWhiteSpace(reqHostname) && System.Net.IPAddress.TryParse(target, out _))
        {
            try
            {
                var entry = await System.Net.Dns.GetHostEntryAsync(target);
                if (!string.IsNullOrWhiteSpace(entry.HostName)) hostname = entry.HostName;
            }
            catch { }
        }
        else if (string.IsNullOrWhiteSpace(reqIp))
        {
            try
            {
                var entry = await System.Net.Dns.GetHostEntryAsync(target);
                var ipv4 = entry.AddressList.FirstOrDefault(a => a.AddressFamily == System.Net.Sockets.AddressFamily.InterNetwork);
                if (ipv4 != null) resolvedIp = ipv4.ToString();
            }
            catch { }
        }

        var endpoint = new Endpoint
        {
            Hostname = hostname,
            Fqdn = request.Fqdn?.Trim(),
            IpAddress = resolvedIp,
            MacAddress = request.MacAddress?.Trim(),
            Description = request.Description?.Trim(),
            Location = request.Location?.Trim(),
            GroupId = request.GroupId,
            Status = EndpointStatus.Unknown,
            AuthStatus = "Pending Authorization",
            ApprovalStatus = EndpointApprovalStatus.Approved,
        };

        _db.Endpoints.Add(endpoint);
        _db.AuditEvents.Add(new AuditEvent
        {
            Actor = User.Identity?.Name ?? "Admin",
            Action = "CreateEndpoint",
            Target = target,
            Result = "Success",
            IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1",
            DetailsJson = JsonSerializer.Serialize(new { hostname, ipAddress = resolvedIp }),
        });

        await _db.SaveChangesAsync();
        _logger.LogInformation("Endpoint {Hostname} ({IpAddress}) added. Pending authorization.", endpoint.Hostname, endpoint.IpAddress);

        return CreatedAtAction(nameof(GetById), new { id = endpoint.Id },
            new ApiResponse<EndpointDto>
            {
                Success = true,
                Message = $"Endpoint '{endpoint.Hostname}' added successfully. Status set to Pending Authorization.",
                Data = new EndpointDto
                {
                    Id = endpoint.Id,
                    Hostname = endpoint.Hostname,
                    IpAddress = endpoint.IpAddress,
                    Status = endpoint.Status.ToString(),
                    AuthStatus = endpoint.AuthStatus,
                    ApprovalStatus = endpoint.ApprovalStatus.ToString(),
                    CreatedAt = endpoint.CreatedAt,
                }
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

                _db.Endpoints.Add(new Endpoint
                {
                    Hostname = target,
                    IpAddress = resolvedIp,
                    Status = EndpointStatus.Unknown,
                    AuthStatus = "Pending Authorization",
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
            DetailsJson = JsonSerializer.Serialize(new { imported = importedCount, totalParsed = uniqueTargets.Count }),
        });

        await _db.SaveChangesAsync();
        _logger.LogInformation("Imported {Count} endpoints from file {FileName}", importedCount, file.FileName);
        return Ok(new ApiResponse { Success = true, Message = $"Imported {importedCount} unique endpoints successfully. Pending Authorization." });
    }

    [HttpPost("bulk-action")]
    [Authorize(Policy = "Operator")]
    public async Task<IActionResult> BulkAction([FromBody] BulkActionRequest request)
    {
        if (request.EndpointIds == null || request.EndpointIds.Count == 0)
            return BadRequest(new ApiResponse { Success = false, Message = "Select at least one endpoint" });

        var endpoints = await _db.Endpoints
            .Include(e => e.CredentialProfile)
            .Where(e => request.EndpointIds.Contains(e.Id))
            .ToListAsync();

        var bulkOp = new BulkOperation
        {
            OperationType = request.Action,
            RequestedBy = User.Identity?.Name ?? "Admin",
            TotalEndpoints = endpoints.Count,
            Status = "Processing",
            CreatedAt = DateTime.UtcNow,
        };

        int successCount = 0;
        int failedCount = 0;

        foreach (var ep in endpoints)
        {
            if (request.Action == "CheckConnection")
            {
                var credProfile = await ResolveCredentialProfileAsync(ep);
                var queryResult = await _wmiService.ExecuteLiveEndpointQueryAsync(ep, credProfile);

                if (queryResult.IsSuccess)
                {
                    ep.Status = EndpointStatus.Online;
                    ep.AuthStatus = queryResult.AuthStatus;
                    ep.AuthUser = queryResult.AuthUser;
                    ep.DomainWorkgroup = queryResult.DomainWorkgroup;
                    ep.CurrentInteractiveUser = queryResult.CurrentInteractiveUser;
                    ep.SystemUptime = queryResult.SystemUptime;
                    ep.LastSuccessfulRefresh = DateTime.UtcNow;
                    successCount++;

                    bulkOp.Items.Add(new BulkOperationItem
                    {
                        EndpointId = ep.Id,
                        EndpointHostname = ep.Hostname,
                        Status = "Success",
                        ResultMessage = $"Endpoint '{ep.Hostname}' authenticated successfully as '{ep.AuthUser}' ({ep.Status}).",
                        CompletedAt = DateTime.UtcNow,
                    });
                }
                else
                {
                    ep.Status = EndpointStatus.Offline;
                    ep.AuthStatus = queryResult.AuthStatus;
                    failedCount++;

                    bulkOp.Items.Add(new BulkOperationItem
                    {
                        EndpointId = ep.Id,
                        EndpointHostname = ep.Hostname,
                        Status = "Failed",
                        ResultMessage = $"Connection check failed for '{ep.Hostname}': {queryResult.ErrorMessage}",
                        CompletedAt = DateTime.UtcNow,
                    });
                }
            }
            else
            {
                if (request.Action == "Approve") ep.ApprovalStatus = EndpointApprovalStatus.Approved;
                else if (request.Action == "Reject") ep.ApprovalStatus = EndpointApprovalStatus.Rejected;
                successCount++;

                bulkOp.Items.Add(new BulkOperationItem
                {
                    EndpointId = ep.Id,
                    EndpointHostname = ep.Hostname,
                    Status = "Success",
                    ResultMessage = $"Bulk action '{request.Action}' executed on {ep.Hostname}.",
                    CompletedAt = DateTime.UtcNow,
                });
            }
        }

        bulkOp.SuccessCount = successCount;
        bulkOp.FailedCount = failedCount;
        bulkOp.Status = "Completed";
        bulkOp.CompletedAt = DateTime.UtcNow;

        _db.BulkOperations.Add(bulkOp);
        await _db.SaveChangesAsync();

        return Ok(new ApiResponse<BulkOperation> { Success = true, Data = bulkOp });
    }

    [HttpPost("{id:guid}/check-connection")]
    public async Task<IActionResult> CheckConnection(Guid id)
    {
        var endpoint = await _db.Endpoints
            .Include(e => e.CredentialProfile)
            .Include(e => e.HardwareInventory)
            .Include(e => e.NetworkInterfaces)
            .Include(e => e.SoftwareInventory)
            .FirstOrDefaultAsync(e => e.Id == id);

        if (endpoint == null)
            return NotFound(new ApiResponse { Success = false, Message = "Endpoint not found" });

        var credProfile = await ResolveCredentialProfileAsync(endpoint);
        var queryResult = await _wmiService.ExecuteLiveEndpointQueryAsync(endpoint, credProfile);

        if (queryResult.IsSuccess)
        {
            endpoint.Status = EndpointStatus.Online;
            endpoint.AuthStatus = queryResult.AuthStatus;
            endpoint.AuthUser = queryResult.AuthUser;
            endpoint.DomainWorkgroup = queryResult.DomainWorkgroup;
            endpoint.CurrentInteractiveUser = queryResult.CurrentInteractiveUser;
            endpoint.SystemUptime = queryResult.SystemUptime;
            endpoint.DeviceType = queryResult.DeviceType ?? endpoint.DeviceType;
            endpoint.LastSuccessfulRefresh = DateTime.UtcNow;
            var firstMac = queryResult.NetworkInterfaces.FirstOrDefault(n => !string.IsNullOrWhiteSpace(n.MacAddress))?.MacAddress;
            if (!string.IsNullOrWhiteSpace(firstMac))
            {
                endpoint.MacAddress = firstMac;
            }

            // Update Hardware Inventory
            if (queryResult.Hardware != null)
            {
                if (endpoint.HardwareInventory == null)
                {
                    endpoint.HardwareInventory = new HardwareInventory { EndpointId = endpoint.Id };
                    _db.HardwareInventories.Add(endpoint.HardwareInventory);
                }
                var hw = endpoint.HardwareInventory;
                hw.Manufacturer = queryResult.Hardware.Manufacturer;
                hw.Model = queryResult.Hardware.Model;
                hw.SerialNumber = queryResult.Hardware.SerialNumber;
                hw.BiosVersion = queryResult.Hardware.BiosVersion;
                hw.ProcessorName = queryResult.Hardware.ProcessorName;
                hw.Cores = queryResult.Hardware.Cores;
                hw.LogicalProcessors = queryResult.Hardware.LogicalProcessors;
                hw.ClockSpeedMhz = queryResult.Hardware.ClockSpeedMhz;
                hw.TotalRamMb = queryResult.Hardware.TotalRamMb;
                hw.Architecture = queryResult.Hardware.Architecture;
                hw.CollectedAt = DateTime.UtcNow;

                var existingDrives = await _db.StorageDrives.Where(d => d.HardwareInventoryId == hw.Id).ToListAsync();
                _db.StorageDrives.RemoveRange(existingDrives);

                foreach (var d in queryResult.Drives)
                {
                    _db.StorageDrives.Add(new StorageDrive
                    {
                        HardwareInventoryId = hw.Id,
                        DriveLetter = d.DriveLetter,
                        CapacityGb = d.CapacityGb,
                        FreeSpaceGb = d.FreeSpaceGb,
                        UsedSpaceGb = d.UsedSpaceGb,
                        FileSystem = d.FileSystem,
                        DiskType = d.DiskType
                    });
                }
            }

            // Update Network Interfaces
            if (queryResult.NetworkInterfaces.Count > 0)
            {
                var existingNics = await _db.EndpointNetworkInterfaces.Where(n => n.EndpointId == endpoint.Id).ToListAsync();
                _db.EndpointNetworkInterfaces.RemoveRange(existingNics);

                foreach (var nic in queryResult.NetworkInterfaces)
                {
                    _db.EndpointNetworkInterfaces.Add(new EndpointNetworkInterface
                    {
                        EndpointId = endpoint.Id,
                        AdapterName = nic.AdapterName,
                        Ipv4Address = nic.Ipv4Address,
                        Ipv6Address = nic.Ipv6Address,
                        MacAddress = nic.MacAddress,
                        ConnectionState = nic.ConnectionState,
                        LinkSpeedMbps = nic.LinkSpeedMbps,
                        Gateway = nic.Gateway,
                        DnsServers = nic.DnsServers
                    });
                }
            }

            // Update Software Inventory
            if (queryResult.SoftwareInventory.Count > 0)
            {
                var existingSw = await _db.SoftwareInventoryItems.Where(s => s.EndpointId == endpoint.Id).ToListAsync();
                _db.SoftwareInventoryItems.RemoveRange(existingSw);

                foreach (var sw in queryResult.SoftwareInventory)
                {
                    _db.SoftwareInventoryItems.Add(new SoftwareInventoryItem
                    {
                        EndpointId = endpoint.Id,
                        SoftwareName = sw.SoftwareName,
                        Version = sw.Version,
                        Publisher = sw.Publisher,
                        Architecture = Domain.Enums.SoftwareArchitecture.X64,
                        InstallDate = DateTime.UtcNow
                    });
                }
            }

            endpoint.LocalAccountsJson = JsonSerializer.Serialize(queryResult.LocalAccounts);
            endpoint.SecuritySoftwareJson = JsonSerializer.Serialize(queryResult.SecuritySoftware);
            endpoint.SectionStatusesJson = JsonSerializer.Serialize(queryResult.SectionStatuses);

            endpoint.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            _logger.LogInformation("Live connection check & query succeeded for {Hostname}", endpoint.Hostname);

            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = $"Endpoint '{endpoint.Hostname}' successfully authenticated and queried. Status: Authorized.",
                Data = new
                {
                    status = endpoint.Status.ToString(),
                    authStatus = endpoint.AuthStatus,
                    authUser = endpoint.AuthUser,
                    domain = endpoint.DomainWorkgroup,
                    currentUser = endpoint.CurrentInteractiveUser,
                    lastRefresh = endpoint.LastSuccessfulRefresh,
                }
            });
        }
        else
        {
            endpoint.Status = EndpointStatus.Offline;
            endpoint.AuthStatus = queryResult.AuthStatus;
            endpoint.SectionStatusesJson = JsonSerializer.Serialize(queryResult.SectionStatuses);
            endpoint.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            _logger.LogWarning("Connection check failed for {Hostname}: {Reason}", endpoint.Hostname, queryResult.ErrorMessage);

            return Ok(new ApiResponse<object>
            {
                Success = false,
                Message = $"Live remote query to '{endpoint.Hostname}' failed: {queryResult.ErrorMessage}",
                Data = new
                {
                    status = endpoint.Status.ToString(),
                    authStatus = endpoint.AuthStatus,
                    errorMessage = queryResult.ErrorMessage,
                }
            });
        }
    }

    [HttpPost("{id:guid}/power")]
    [Authorize(Policy = "Operator")]
    public async Task<IActionResult> PowerControl(Guid id, [FromBody] PowerControlRequest request)
    {
        var endpoint = await _db.Endpoints.FindAsync(id);
        if (endpoint == null)
            return NotFound(new ApiResponse { Success = false, Message = "Endpoint not found" });

        var credProfile = await ResolveCredentialProfileAsync(endpoint);
        var result = await _wmiService.ExecutePowerActionAsync(endpoint, credProfile, request.Action);

        _db.AuditEvents.Add(new AuditEvent
        {
            Actor = User.Identity?.Name ?? "Admin",
            Action = $"PowerAction_{request.Action}",
            Target = endpoint.Hostname,
            Result = result.Success ? "Success" : "Failed",
            IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1",
            DetailsJson = JsonSerializer.Serialize(new { action = request.Action, result.Message, result.FailureReason }),
        });

        await _db.SaveChangesAsync();

        if (result.Success)
            return Ok(new ApiResponse { Success = true, Message = result.Message });
        else
            return BadRequest(new ApiResponse { Success = false, Message = result.Message });
    }

    [HttpPost("{id:guid}/credential")]
    [Authorize(Policy = "Admin")]
    public async Task<IActionResult> UpdateCredentialConfig(Guid id, [FromBody] UpdateEndpointCredentialRequest request)
    {
        var endpoint = await _db.Endpoints.FindAsync(id);
        if (endpoint == null)
            return NotFound(new ApiResponse { Success = false, Message = "Endpoint not found" });

        endpoint.AuthMode = request.AuthMode;
        endpoint.CredentialProfileId = request.CredentialProfileId;

        if (request.CredentialProfileId.HasValue)
        {
            var profile = await _db.CredentialProfiles.FindAsync(request.CredentialProfileId.Value);
            if (profile != null)
            {
                endpoint.AuthUser = profile.Username;
                endpoint.AuthStatus = "Pending Authorization";
            }
        }
        else if (request.AuthMode == "Inherit")
        {
            var defaultProfile = await _db.CredentialProfiles.OrderBy(c => c.CreatedAt).FirstOrDefaultAsync();
            endpoint.AuthUser = defaultProfile?.Username;
            endpoint.AuthStatus = "Pending Authorization";
        }
        else if (request.AuthMode == "AskWhenConnecting")
        {
            endpoint.AuthUser = "Prompt On Access";
            endpoint.AuthStatus = "Checking";
        }

        endpoint.UpdatedAt = DateTime.UtcNow;

        _db.AuditEvents.Add(new AuditEvent
        {
            Actor = User.Identity?.Name ?? "Admin",
            Action = "UpdateEndpointCredential",
            Target = endpoint.Hostname,
            Result = "Success",
            IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1",
            DetailsJson = JsonSerializer.Serialize(new { authMode = request.AuthMode, profileId = request.CredentialProfileId }),
        });

        await _db.SaveChangesAsync();
        _logger.LogInformation("Credential mode updated to '{Mode}' for {Hostname}", request.AuthMode, endpoint.Hostname);

        return Ok(new ApiResponse { Success = true, Message = $"Credential mode set to '{request.AuthMode}'" });
    }

    [HttpPost("{id:guid}/local-accounts/create")]
    [Authorize(Policy = "Admin")]
    public async Task<IActionResult> CreateLocalAccount(Guid id, [FromBody] CreateLocalAccountRequest request)
    {
        var endpoint = await _db.Endpoints.FindAsync(id);
        if (endpoint == null)
            return NotFound(new ApiResponse { Success = false, Message = "Endpoint not found" });

        if (string.IsNullOrWhiteSpace(request.Username) || string.IsNullOrWhiteSpace(request.Password))
            return BadRequest(new ApiResponse { Success = false, Message = "Username and password are required" });

        var credProfile = await ResolveCredentialProfileAsync(endpoint);
        var result = await _wmiService.CreateLocalAccountAsync(endpoint, credProfile, request);

        _db.AuditEvents.Add(new AuditEvent
        {
            Actor = User.Identity?.Name ?? "Admin",
            Action = "CreateLocalAccount",
            Target = $"{endpoint.Hostname}\\{request.Username}",
            Result = result.Success ? "Success" : "Failed",
            IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1",
            DetailsJson = JsonSerializer.Serialize(new { username = request.Username, isAdmin = request.IsAdmin }),
        });

        await _db.SaveChangesAsync();

        if (result.Success) return Ok(new ApiResponse { Success = true, Message = result.Message });
        return BadRequest(new ApiResponse { Success = false, Message = result.Message });
    }

    [HttpPost("{id:guid}/users/reset-password")]
    [Authorize(Policy = "Admin")]
    public async Task<IActionResult> ResetUserPassword(Guid id, [FromBody] ResetEndpointUserPasswordRequest request)
    {
        var endpoint = await _db.Endpoints.FindAsync(id);
        if (endpoint == null)
            return NotFound(new ApiResponse { Success = false, Message = "Endpoint not found" });

        if (string.IsNullOrWhiteSpace(request.TargetUsername) || string.IsNullOrWhiteSpace(request.NewPassword))
            return BadRequest(new ApiResponse { Success = false, Message = "Target username and new password are required" });

        var credProfile = await ResolveCredentialProfileAsync(endpoint);
        var result = await _wmiService.ResetLocalAccountPasswordAsync(endpoint, credProfile, request.TargetUsername, request.NewPassword);

        _db.AuditEvents.Add(new AuditEvent
        {
            Actor = User.Identity?.Name ?? "Admin",
            Action = "ResetEndpointUserPassword",
            Target = $"{endpoint.Hostname}\\{request.TargetUsername}",
            Result = result.Success ? "Success" : "Failed",
            IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1",
        });

        await _db.SaveChangesAsync();

        if (result.Success) return Ok(new ApiResponse { Success = true, Message = result.Message });
        return BadRequest(new ApiResponse { Success = false, Message = result.Message });
    }

    [HttpPost("{id:guid}/software/install")]
    [Authorize(Policy = "Operator")]
    public async Task<IActionResult> InstallSoftwareOnEndpoint(Guid id, [FromBody] InstallSoftwareRequest request)
    {
        var endpoint = await _db.Endpoints.FindAsync(id);
        if (endpoint == null)
            return NotFound(new ApiResponse { Success = false, Message = "Endpoint not found" });

        var credProfile = await ResolveCredentialProfileAsync(endpoint);
        var result = await _wmiService.InstallSoftwareAsync(endpoint, credProfile, request.PackageName, request.Version);

        _db.AuditEvents.Add(new AuditEvent
        {
            Actor = User.Identity?.Name ?? "Admin",
            Action = "InstallSoftware",
            Target = $"{endpoint.Hostname} ({request.PackageName})",
            Result = result.Success ? "Success" : "Failed",
            IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1",
        });

        await _db.SaveChangesAsync();

        if (result.Success) return Ok(new ApiResponse { Success = true, Message = result.Message });
        return BadRequest(new ApiResponse { Success = false, Message = result.Message });
    }

    [HttpPost("{id:guid}/software/uninstall")]
    [Authorize(Policy = "Operator")]
    public async Task<IActionResult> UninstallSoftwareFromEndpoint(Guid id, [FromBody] UninstallSoftwareRequest request)
    {
        var endpoint = await _db.Endpoints.FindAsync(id);
        if (endpoint == null)
            return NotFound(new ApiResponse { Success = false, Message = "Endpoint not found" });

        var credProfile = await ResolveCredentialProfileAsync(endpoint);
        var result = await _wmiService.UninstallSoftwareAsync(endpoint, credProfile, request.SoftwareName);

        _db.AuditEvents.Add(new AuditEvent
        {
            Actor = User.Identity?.Name ?? "Admin",
            Action = "UninstallSoftware",
            Target = $"{endpoint.Hostname} ({request.SoftwareName})",
            Result = result.Success ? "Success" : "Failed",
            IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1",
        });

        await _db.SaveChangesAsync();

        if (result.Success) return Ok(new ApiResponse { Success = true, Message = result.Message });
        return BadRequest(new ApiResponse { Success = false, Message = result.Message });
    }

    private async Task<CredentialProfile?> ResolveCredentialProfileAsync(Endpoint endpoint)
    {
        if (endpoint.CredentialProfileId.HasValue)
        {
            return await _db.CredentialProfiles.FindAsync(endpoint.CredentialProfileId.Value);
        }

        if (endpoint.AuthMode == "Inherit")
        {
            return await _db.CredentialProfiles.OrderBy(c => c.CreatedAt).FirstOrDefaultAsync();
        }

        return null;
    }
}
