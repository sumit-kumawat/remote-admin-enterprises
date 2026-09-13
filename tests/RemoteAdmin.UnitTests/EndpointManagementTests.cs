using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using RemoteAdmin.Api.Controllers;
using RemoteAdmin.Application.Interfaces;
using RemoteAdmin.Contracts.Dtos;
using RemoteAdmin.Domain.Entities;
using RemoteAdmin.Domain.Enums;
using RemoteAdmin.Infrastructure.Data;
using Endpoint = RemoteAdmin.Domain.Entities.Endpoint;
using Xunit;

namespace RemoteAdmin.UnitTests;

public class EndpointManagementTests
{
    private static AppDbContext GetInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        return new AppDbContext(options);
    }

    private static ControllerContext GetMockControllerContext(string username = "Admin")
    {
        return new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(new ClaimsIdentity(new[]
                {
                    new Claim(ClaimTypes.Name, username),
                    new Claim(ClaimTypes.Role, "Admin")
                }, "TestAuth"))
            }
        };
    }

    [Fact]
    public async Task CreateEndpoint_StartsAsPendingAuthorization_WithNoHardcodedRaUser()
    {
        using var db = GetInMemoryDbContext();
        var fakeWmiService = new FakeWindowsManagementService();
        var controller = new EndpointsController(db, fakeWmiService, NullLogger<EndpointsController>.Instance)
        {
            ControllerContext = GetMockControllerContext()
        };

        var request = new CreateEndpointRequest
        {
            Target = "192.168.1.50",
            Hostname = "SRV-TEST01",
            IpAddress = "192.168.1.50",
            Description = "Test Endpoint",
            Location = "Datacenter"
        };
        var result = await controller.Create(request);

        var createdResult = Assert.IsType<CreatedAtActionResult>(result);
        var response = Assert.IsType<ApiResponse<EndpointDto>>(createdResult.Value);
        Assert.True(response.Success);
        Assert.Equal("Pending Authorization", response.Data?.AuthStatus);
        Assert.Null(response.Data?.AuthUser);

        var dbEndpoint = await db.Endpoints.FirstOrDefaultAsync(e => e.Hostname == "SRV-TEST01");
        Assert.NotNull(dbEndpoint);
        Assert.Equal("Pending Authorization", dbEndpoint.AuthStatus);
        Assert.Null(dbEndpoint.AuthUser);
    }

    [Fact]
    public async Task CheckConnection_WhenWmiSucceeds_UpdatesEndpointToAuthorized_WithLiveQueryData()
    {
        using var db = GetInMemoryDbContext();
        var endpoint = new Endpoint
        {
            Hostname = "SRV-WIN2022",
            IpAddress = "192.168.10.100",
            Status = EndpointStatus.Unknown,
            AuthStatus = "Pending Authorization"
        };
        db.Endpoints.Add(endpoint);
        await db.SaveChangesAsync();

        var fakeWmiService = new FakeWindowsManagementService
        {
            QueryResponse = new EndpointLiveQueryResult
            {
                IsSuccess = true,
                AuthStatus = "Authorized",
                AuthUser = @"CORP\admin_service",
                DomainWorkgroup = "CORP.LOCAL",
                CurrentInteractiveUser = @"CORP\jsmith",
                SystemUptime = "5 days, 12 hours",
                DeviceType = "Windows Server",
                Hardware = new HardwareInventoryDto
                {
                    Manufacturer = "Dell Inc.",
                    Model = "PowerEdge R750",
                    SerialNumber = "DELL-SRV-9981",
                    ProcessorName = "Intel Xeon Gold 6330",
                    Cores = 28,
                    LogicalProcessors = 56,
                    TotalRamMb = 65536
                },
                Drives = [
                    new StorageDriveDto { DriveLetter = "C:", CapacityGb = 500, FreeSpaceGb = 320, UsedSpaceGb = 180, FileSystem = "NTFS" }
                ],
                NetworkInterfaces = [
                    new NetworkInterfaceDto { AdapterName = "Intel 10GbE", Ipv4Address = "192.168.10.100", MacAddress = "AA:BB:CC:DD:EE:99", ConnectionState = "Connected" }
                ],
                LocalAccounts = [
                    new LocalAccountDto { Username = "Administrator", IsEnabled = true, IsAdmin = true, Groups = ["Administrators"] }
                ]
            }
        };

        var controller = new EndpointsController(db, fakeWmiService, NullLogger<EndpointsController>.Instance)
        {
            ControllerContext = GetMockControllerContext()
        };

        var actionResult = await controller.CheckConnection(endpoint.Id.ToString());
        var okResult = Assert.IsType<OkObjectResult>(actionResult);
        var apiResp = Assert.IsType<ApiResponse<object>>(okResult.Value);
        Assert.True(apiResp.Success);

        var updatedEp = await db.Endpoints
            .Include(e => e.HardwareInventory)
            .Include(e => e.NetworkInterfaces)
            .FirstOrDefaultAsync(e => e.Id == endpoint.Id);

        Assert.NotNull(updatedEp);
        Assert.Equal(EndpointStatus.Online, updatedEp.Status);
        Assert.Equal("Authorized", updatedEp.AuthStatus);
        Assert.Equal(@"CORP\admin_service", updatedEp.AuthUser);
        Assert.Equal("CORP.LOCAL", updatedEp.DomainWorkgroup);
        Assert.Equal(@"CORP\jsmith", updatedEp.CurrentInteractiveUser);
        Assert.Equal("Dell Inc.", updatedEp.HardwareInventory?.Manufacturer);
        Assert.Equal("AA:BB:CC:DD:EE:99", updatedEp.MacAddress);
    }

    [Fact]
    public async Task PowerControl_ExecutesRemotePowerOperation_AndLogsAudit()
    {
        using var db = GetInMemoryDbContext();
        var endpoint = new Endpoint
        {
            Hostname = "SRV-POWER01",
            IpAddress = "192.168.10.105",
            Status = EndpointStatus.Online,
            AuthStatus = "Authorized",
            MacAddress = "00:11:22:33:44:55"
        };
        db.Endpoints.Add(endpoint);
        await db.SaveChangesAsync();

        var fakeWmiService = new FakeWindowsManagementService
        {
            PowerResponse = new PowerOperationResult
            {
                Success = true,
                Action = "Restart",
                Message = "Restart command issued successfully to SRV-POWER01."
            }
        };

        var controller = new EndpointsController(db, fakeWmiService, NullLogger<EndpointsController>.Instance)
        {
            ControllerContext = GetMockControllerContext("OperatorUser")
        };

        var actionResult = await controller.PowerControl(endpoint.Id.ToString(), new PowerControlRequest { Action = "Restart" });
        var okResult = Assert.IsType<OkObjectResult>(actionResult);
        var apiResp = Assert.IsType<ApiResponse>(okResult.Value);
        Assert.True(apiResp.Success);

        var auditEvent = await db.AuditEvents.FirstOrDefaultAsync(a => a.Target == "SRV-POWER01");
        Assert.NotNull(auditEvent);
        Assert.Equal("OperatorUser", auditEvent.Actor);
        Assert.Equal("PowerAction_Restart", auditEvent.Action);
        Assert.Equal("Success", auditEvent.Result);
    }
}

public class FakeWindowsManagementService : IWindowsManagementService
{
    public EndpointLiveQueryResult QueryResponse { get; set; } = new() { AuthStatus = "Pending Authorization" };
    public PowerOperationResult PowerResponse { get; set; } = new() { Action = "Restart", Message = "Executed" };

    public Task<EndpointLiveQueryResult> ExecuteLiveEndpointQueryAsync(Endpoint endpoint, CredentialProfile? credentialProfile, CancellationToken cancellationToken = default)
    {
        return Task.FromResult(QueryResponse);
    }

    public Task<PowerOperationResult> ExecutePowerActionAsync(Endpoint endpoint, CredentialProfile? credentialProfile, string action, CancellationToken cancellationToken = default)
    {
        return Task.FromResult(PowerResponse);
    }

    public Task<LocalAccountOperationResult> CreateLocalAccountAsync(Endpoint endpoint, CredentialProfile? credentialProfile, CreateLocalAccountRequest request, CancellationToken cancellationToken = default)
    {
        return Task.FromResult(new LocalAccountOperationResult { Success = true, Username = request.Username, Message = "Created" });
    }

    public Task<LocalAccountOperationResult> ResetLocalAccountPasswordAsync(Endpoint endpoint, CredentialProfile? credentialProfile, string targetUsername, string newPassword, CancellationToken cancellationToken = default)
    {
        return Task.FromResult(new LocalAccountOperationResult { Success = true, Username = targetUsername, Message = "Reset" });
    }

    public Task<SoftwareOperationResult> InstallSoftwareAsync(Endpoint endpoint, CredentialProfile? credentialProfile, string packageName, string? version, CancellationToken cancellationToken = default)
    {
        return Task.FromResult(new SoftwareOperationResult { Success = true, SoftwareName = packageName, Message = "Installed" });
    }

    public Task<SoftwareOperationResult> UninstallSoftwareAsync(Endpoint endpoint, CredentialProfile? credentialProfile, string softwareName, CancellationToken cancellationToken = default)
    {
        return Task.FromResult(new SoftwareOperationResult { Success = true, SoftwareName = softwareName, Message = "Uninstalled" });
    }
}
