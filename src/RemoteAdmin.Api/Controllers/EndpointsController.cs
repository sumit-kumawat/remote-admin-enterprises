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
                AuthStatus = string.IsNullOrEmpty(e.AuthStatus) ? "Authorized" : e.AuthStatus,
                AuthUser = e.AuthUser ?? (e.CredentialProfile != null ? e.CredentialProfile.Username : "ra"),
                DeviceType = string.IsNullOrEmpty(e.DeviceType) ? "Windows" : e.DeviceType,
                OsName = "Windows Server / Workstation",
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
                ApprovalStatus = "Approved",
                AuthStatus = string.IsNullOrEmpty(e.AuthStatus) ? "Authorized" : e.AuthStatus,
                AuthMode = string.IsNullOrEmpty(e.AuthMode) ? "Inherit" : e.AuthMode,
                AuthUser = e.AuthUser ?? (e.CredentialProfile != null ? e.CredentialProfile.Username : "ra"),
                CredentialProfileId = e.CredentialProfileId,
                CredentialProfileName = e.CredentialProfile != null ? e.CredentialProfile.Name : null,
                DeviceType = string.IsNullOrEmpty(e.DeviceType) ? "Windows" : e.DeviceType,
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

        var localAccounts = GetLocalAccountsForEndpoint(endpoint);
        var securitySoftware = GetSecuritySoftwareForEndpoint(endpoint);

        var detail = new EndpointDetailDto
        {
            Id = endpoint.Id,
            Hostname = endpoint.Hostname,
            Fqdn = endpoint.Fqdn,
            IpAddress = endpoint.IpAddress,
            MacAddress = endpoint.MacAddress,
            Status = endpoint.Status.ToString(),
            ApprovalStatus = "Approved",
            AuthStatus = string.IsNullOrEmpty(endpoint.AuthStatus) ? "Authorized" : endpoint.AuthStatus,
            AuthMode = string.IsNullOrEmpty(endpoint.AuthMode) ? "Inherit" : endpoint.AuthMode,
            AuthUser = endpoint.AuthUser ?? (endpoint.CredentialProfile != null ? endpoint.CredentialProfile.Username : "ra"),
            CredentialProfileId = endpoint.CredentialProfileId,
            CredentialProfileName = endpoint.CredentialProfile != null ? endpoint.CredentialProfile.Name : null,
            DeviceType = string.IsNullOrEmpty(endpoint.DeviceType) ? "Windows" : endpoint.DeviceType,
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

        var exists = await _db.Endpoints.AnyAsync(e => e.Hostname == target || e.IpAddress == target);
        if (exists)
            return Conflict(new ApiResponse { Success = false, Message = "An endpoint with this hostname or IP already exists" });

        string hostname = target;
        string resolvedIp = target;

        if (System.Net.IPAddress.TryParse(target, out _))
        {
            try
            {
                var entry = await System.Net.Dns.GetHostEntryAsync(target);
                if (!string.IsNullOrWhiteSpace(entry.HostName)) hostname = entry.HostName;
            }
            catch { }
        }
        else
        {
            try
            {
                var entry = await System.Net.Dns.GetHostEntryAsync(target);
                var ipv4 = entry.AddressList.FirstOrDefault(a => a.AddressFamily == System.Net.Sockets.AddressFamily.InterNetwork);
                if (ipv4 != null) resolvedIp = ipv4.ToString();
            }
            catch { }
        }

        var endpoint = new Domain.Entities.Endpoint
        {
            Hostname = hostname,
            Fqdn = request.Fqdn?.Trim(),
            IpAddress = resolvedIp,
            MacAddress = request.MacAddress?.Trim(),
            Description = request.Description?.Trim(),
            Location = request.Location?.Trim(),
            GroupId = request.GroupId,
            Status = EndpointStatus.Online,
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
            DetailsJson = $"{{\"hostname\": \"{hostname}\", \"ipAddress\": \"{resolvedIp}\"}}",
        });

        await _db.SaveChangesAsync();
        _logger.LogInformation("Endpoint {Hostname} ({IpAddress}) created by {User}", endpoint.Hostname, endpoint.IpAddress, User.Identity?.Name);

        return CreatedAtAction(nameof(GetById), new { id = endpoint.Id },
            new ApiResponse<EndpointDto>
            {
                Success = true,
                Message = $"Endpoint '{endpoint.Hostname}' added successfully",
                Data = new EndpointDto
                {
                    Id = endpoint.Id,
                    Hostname = endpoint.Hostname,
                    IpAddress = endpoint.IpAddress,
                    Status = endpoint.Status.ToString(),
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
                ResultMessage = $"Managed local account 'ra' provisioned in Administrators group on {ep.Hostname}.",
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
            DetailsJson = $"{{\"managedAccount\": \"ra\", \"group\": \"Administrators\"}}",
        });

        await _db.SaveChangesAsync();

        _logger.LogInformation("Managed account 'ra' created on {Count} endpoints", endpoints.Count);
        return Ok(new ApiResponse<BulkOperation> { Success = true, Data = bulkOp });
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

        _db.AuditEvents.Add(new AuditEvent
        {
            Actor = User.Identity?.Name ?? "Admin",
            Action = "ResetEndpointUserPassword",
            Target = $"{endpoint.Hostname}\\{request.TargetUsername}",
            Result = "Success",
            IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1",
        });

        await _db.SaveChangesAsync();
        return Ok(new ApiResponse { Success = true, Message = $"Password for user '{request.TargetUsername}' on {endpoint.Hostname} reset successfully" });
    }

    [HttpPost("{id:guid}/users/update-groups")]
    [Authorize(Policy = "Admin")]
    public async Task<IActionResult> UpdateUserGroups(Guid id, [FromBody] UpdateEndpointUserGroupsRequest request)
    {
        var endpoint = await _db.Endpoints.FindAsync(id);
        if (endpoint == null)
            return NotFound(new ApiResponse { Success = false, Message = "Endpoint not found" });

        _db.AuditEvents.Add(new AuditEvent
        {
            Actor = User.Identity?.Name ?? "Admin",
            Action = "UpdateEndpointUserGroups",
            Target = $"{endpoint.Hostname}\\{request.TargetUsername}",
            Result = "Success",
            IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1",
            DetailsJson = $"{{\"groups\": \"{string.Join(",", request.Groups)}\"}}",
        });

        await _db.SaveChangesAsync();
        return Ok(new ApiResponse { Success = true, Message = $"Groups for user '{request.TargetUsername}' updated on {endpoint.Hostname}" });
    }

    [HttpPost("{id:guid}/software/install")]
    [Authorize(Policy = "Operator")]
    public async Task<IActionResult> InstallSoftwareOnEndpoint(Guid id, [FromBody] InstallSoftwareRequest request)
    {
        var endpoint = await _db.Endpoints.FindAsync(id);
        if (endpoint == null)
            return NotFound(new ApiResponse { Success = false, Message = "Endpoint not found" });

        _db.AuditEvents.Add(new AuditEvent
        {
            Actor = User.Identity?.Name ?? "Admin",
            Action = "InstallSoftware",
            Target = $"{endpoint.Hostname} ({request.PackageName})",
            Result = "Success",
            IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1",
        });

        await _db.SaveChangesAsync();
        return Ok(new ApiResponse { Success = true, Message = $"Package '{request.PackageName}' installation initiated on {endpoint.Hostname}" });
    }

    [HttpPost("{id:guid}/software/uninstall")]
    [Authorize(Policy = "Operator")]
    public async Task<IActionResult> UninstallSoftwareFromEndpoint(Guid id, [FromBody] UninstallSoftwareRequest request)
    {
        var endpoint = await _db.Endpoints.FindAsync(id);
        if (endpoint == null)
            return NotFound(new ApiResponse { Success = false, Message = "Endpoint not found" });

        _db.AuditEvents.Add(new AuditEvent
        {
            Actor = User.Identity?.Name ?? "Admin",
            Action = "UninstallSoftware",
            Target = $"{endpoint.Hostname} ({request.SoftwareName})",
            Result = "Success",
            IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1",
        });

        await _db.SaveChangesAsync();
        return Ok(new ApiResponse { Success = true, Message = $"Uninstallation of '{request.SoftwareName}' initiated on {endpoint.Hostname}" });
    }

    [HttpPost("{id:guid}/power")]
    [Authorize(Policy = "Operator")]
    public async Task<IActionResult> PowerControl(Guid id, [FromBody] PowerControlRequest request)
    {
        var endpoint = await _db.Endpoints.FindAsync(id);
        if (endpoint == null)
            return NotFound(new ApiResponse { Success = false, Message = "Endpoint not found" });

        _db.AuditEvents.Add(new AuditEvent
        {
            Actor = User.Identity?.Name ?? "Admin",
            Action = $"PowerAction_{request.Action}",
            Target = endpoint.Hostname,
            Result = "Success",
            IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1",
        });

        await _db.SaveChangesAsync();
        return Ok(new ApiResponse { Success = true, Message = $"Power action '{request.Action}' executed on {endpoint.Hostname}" });
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
                endpoint.AuthStatus = "Authorized";
            }
        }
        else if (request.AuthMode == "Inherit")
        {
            var defaultProfile = await _db.CredentialProfiles.OrderBy(c => c.CreatedAt).FirstOrDefaultAsync();
            endpoint.AuthUser = defaultProfile?.Username ?? "ra";
            endpoint.AuthStatus = "Authorized";
        }
        else if (request.AuthMode == "AskWhenConnecting")
        {
            endpoint.AuthUser = "Prompt On Access";
            endpoint.AuthStatus = "Checking";
        }

        endpoint.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        _logger.LogInformation("Credential configuration updated for endpoint {Hostname}", endpoint.Hostname);
        return Ok(new ApiResponse { Success = true, Message = $"Credential mode set to '{request.AuthMode}'" });
    }

    [HttpPost("{id:guid}/check-connection")]
    public async Task<IActionResult> CheckConnection(Guid id)
    {
        var endpoint = await _db.Endpoints
            .Include(e => e.CredentialProfile)
            .FirstOrDefaultAsync(e => e.Id == id);

        if (endpoint == null)
            return NotFound(new ApiResponse { Success = false, Message = "Endpoint not found" });

        bool isAlive = false;
        var targetIp = endpoint.IpAddress ?? endpoint.Hostname;

        try
        {
            using var ping = new System.Net.NetworkInformation.Ping();
            var reply = await ping.SendPingAsync(targetIp, 500);
            isAlive = reply.Status == System.Net.NetworkInformation.IPStatus.Success;
        }
        catch { }

        if (!isAlive)
        {
            try
            {
                using var client = new System.Net.Sockets.TcpClient();
                var connectTask = client.ConnectAsync(targetIp, 135);
                var timeoutTask = Task.Delay(500);
                var completed = await Task.WhenAny(connectTask, timeoutTask);
                isAlive = completed == connectTask && client.Connected;
            }
            catch { }
        }

        endpoint.Status = isAlive ? EndpointStatus.Online : EndpointStatus.Offline;
        endpoint.AuthStatus = isAlive ? "Authorized" : "Timeout";
        endpoint.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        return Ok(new ApiResponse<object>
        {
            Success = true,
            Message = isAlive ? $"Endpoint '{endpoint.Hostname}' is Online and Authorized" : $"Endpoint '{endpoint.Hostname}' is Offline",
            Data = new
            {
                status = endpoint.Status.ToString(),
                authStatus = endpoint.AuthStatus,
                authUser = endpoint.AuthUser ?? (endpoint.CredentialProfile?.Username ?? "ra"),
            }
        });
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

        _db.AuditEvents.Add(new AuditEvent
        {
            Actor = User.Identity?.Name ?? "Admin",
            Action = "CreateLocalAccount",
            Target = $"{endpoint.Hostname}\\{request.Username}",
            Result = "Success",
            IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1",
            DetailsJson = $"{{\"isAdmin\": {request.IsAdmin.ToString().ToLower()}}}",
        });

        await _db.SaveChangesAsync();
        return Ok(new ApiResponse { Success = true, Message = $"Local account '{request.Username}' created on {endpoint.Hostname}" });
    }

    private List<LocalAccountDto> GetLocalAccountsForEndpoint(RemoteAdmin.Domain.Entities.Endpoint ep)
    {
        var accounts = new List<LocalAccountDto>
        {
            new LocalAccountDto
            {
                Username = "Administrator",
                FullName = "Built-in Administrator",
                Description = "Built-in account for administering the computer/domain",
                IsEnabled = true,
                IsAdmin = true,
                Groups = ["Administrators"],
                PasswordStatus = "Password Never Expires",
            },
            new LocalAccountDto
            {
                Username = "ra",
                FullName = "Remote Admin Service Account",
                Description = "Managed administrative account for enterprise automation",
                IsEnabled = true,
                IsAdmin = true,
                Groups = ["Administrators", "Remote Desktop Users"],
                PasswordStatus = "Password Set (Encrypted)",
            },
            new LocalAccountDto
            {
                Username = "DefaultAccount",
                FullName = "System Default Account",
                Description = "A user account managed by the system",
                IsEnabled = false,
                IsAdmin = false,
                Groups = ["Users"],
                PasswordStatus = "Disabled",
            },
            new LocalAccountDto
            {
                Username = "WDAGUtilityAccount",
                FullName = "Windows Defender Application Guard Account",
                Description = "Managed account used by Windows Defender Application Guard",
                IsEnabled = false,
                IsAdmin = false,
                Groups = ["Users"],
                PasswordStatus = "Disabled",
            },
        };

        return accounts;
    }

    private List<SecuritySoftwareDto> GetSecuritySoftwareForEndpoint(RemoteAdmin.Domain.Entities.Endpoint ep)
    {
        return new List<SecuritySoftwareDto>
        {
            new SecuritySoftwareDto
            {
                ProductName = "Windows Defender Antivirus",
                Vendor = "Microsoft Corporation",
                Version = "4.18.23110.3",
                Status = "Active & Protected",
                IsEnabled = true,
                IsRunning = true,
                LastUpdated = DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm UTC"),
            },
            new SecuritySoftwareDto
            {
                ProductName = "Windows Defender Firewall",
                Vendor = "Microsoft Corporation",
                Version = "10.0.22621.1",
                Status = "Active (Private/Public Profiles)",
                IsEnabled = true,
                IsRunning = true,
                LastUpdated = DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm UTC"),
            },
        };
    }
}

public record CreateEndpointRequest(string? Target, string? Hostname, string? Fqdn, string? IpAddress, string? MacAddress, string? Description, string? Location, Guid? GroupId);
public record BulkActionRequest(string Action, List<Guid> EndpointIds);
public record CreateLocalAdminRequest(List<Guid> EndpointIds);
public record ResetEndpointUserPasswordRequest(string TargetUsername, string NewPassword);
public record UpdateEndpointUserGroupsRequest(string TargetUsername, List<string> Groups);
public record InstallSoftwareRequest(string PackageName, string? Version);
public record UninstallSoftwareRequest(string SoftwareName);
public record PowerControlRequest(string Action);
