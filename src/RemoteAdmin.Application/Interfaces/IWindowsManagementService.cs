using RemoteAdmin.Contracts.Dtos;
using RemoteAdmin.Domain.Entities;

namespace RemoteAdmin.Application.Interfaces;

public interface IWindowsManagementService
{
    Task<EndpointLiveQueryResult> ExecuteLiveEndpointQueryAsync(
        Endpoint endpoint,
        CredentialProfile? credentialProfile,
        CancellationToken cancellationToken = default);

    Task<PowerOperationResult> ExecutePowerActionAsync(
        Endpoint endpoint,
        CredentialProfile? credentialProfile,
        string action,
        CancellationToken cancellationToken = default);

    Task<LocalAccountOperationResult> CreateLocalAccountAsync(
        Endpoint endpoint,
        CredentialProfile? credentialProfile,
        CreateLocalAccountRequest request,
        CancellationToken cancellationToken = default);

    Task<LocalAccountOperationResult> ResetLocalAccountPasswordAsync(
        Endpoint endpoint,
        CredentialProfile? credentialProfile,
        string targetUsername,
        string newPassword,
        CancellationToken cancellationToken = default);

    Task<SoftwareOperationResult> InstallSoftwareAsync(
        Endpoint endpoint,
        CredentialProfile? credentialProfile,
        string packageName,
        string? version,
        CancellationToken cancellationToken = default);

    Task<SoftwareOperationResult> UninstallSoftwareAsync(
        Endpoint endpoint,
        CredentialProfile? credentialProfile,
        string softwareName,
        CancellationToken cancellationToken = default);
}

public sealed class EndpointLiveQueryResult
{
    public bool IsSuccess { get; set; }
    public required string AuthStatus { get; set; }
    public string? AuthUser { get; set; }
    public string? ErrorMessage { get; set; }
    public string? DomainWorkgroup { get; set; }
    public string? CurrentInteractiveUser { get; set; }
    public string? SystemUptime { get; set; }
    public string? DeviceType { get; set; } = "Windows";
    public string? OsName { get; set; }
    public string? OsVersion { get; set; }
    public string? OsArchitecture { get; set; }
    public HardwareInventoryDto? Hardware { get; set; }
    public List<PhysicalDiskDto> PhysicalDisks { get; set; } = [];
    public List<StorageDriveDto> Drives { get; set; } = [];
    public List<NetworkInterfaceDto> NetworkInterfaces { get; set; } = [];
    public List<LocalAccountDto> LocalAccounts { get; set; } = [];
    public List<SecuritySoftwareDto> SecuritySoftware { get; set; } = [];
    public List<SoftwareInventoryItemDto> SoftwareInventory { get; set; } = [];
    public Dictionary<string, SectionStatusDto> SectionStatuses { get; set; } = new();
}

public sealed class PowerOperationResult
{
    public bool Success { get; set; }
    public required string Action { get; set; }
    public required string Message { get; set; }
    public string? FailureReason { get; set; }
}

public sealed class LocalAccountOperationResult
{
    public bool Success { get; set; }
    public required string Username { get; set; }
    public required string Message { get; set; }
    public string? FailureReason { get; set; }
}

public sealed class SoftwareOperationResult
{
    public bool Success { get; set; }
    public required string SoftwareName { get; set; }
    public required string Message { get; set; }
    public string? FailureReason { get; set; }
}
