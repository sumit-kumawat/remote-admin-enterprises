namespace RemoteAdmin.Contracts.Dtos;

public class EndpointDto
{
    public Guid Id { get; set; }
    public required string Hostname { get; set; }
    public string? Fqdn { get; set; }
    public string? IpAddress { get; set; }
    public string? MacAddress { get; set; }
    public required string Status { get; set; }
    public required string ApprovalStatus { get; set; }
    
    // Auth & Credential properties
    public string AuthStatus { get; set; } = "NotAuthorized";
    public string AuthMode { get; set; } = "Inherit";
    public string? AuthUser { get; set; }
    public Guid? CredentialProfileId { get; set; }
    public string? CredentialProfileName { get; set; }
    public string DeviceType { get; set; } = "Windows";

    public string? AgentStatus { get; set; }
    public string? AgentVersion { get; set; }
    public string? WindowsEdition { get; set; }
    public string? WindowsVersion { get; set; }
    public string? Description { get; set; }
    public string? Location { get; set; }
    public string? GroupName { get; set; }
    public Guid? GroupId { get; set; }
    public DateTime? LastHeartbeat { get; set; }
    public DateTime? LastInventory { get; set; }
    public DateTime? LastSuccessfulJob { get; set; }
    public DateTime? LastFailedJob { get; set; }
    public DateTime CreatedAt { get; set; }
}

public sealed class EndpointDetailDto : EndpointDto
{
    public HardwareInventoryDto? Hardware { get; set; }
    public List<NetworkInterfaceDto> NetworkInterfaces { get; set; } = [];
    public List<SoftwareInventoryItemDto> Software { get; set; } = [];
    public List<StorageDriveDto> Drives { get; set; } = [];
    public List<LocalAccountDto> LocalAccounts { get; set; } = [];
    public List<SecuritySoftwareDto> SecuritySoftware { get; set; } = [];
}

public sealed class LocalAccountDto
{
    public required string Username { get; set; }
    public string? FullName { get; set; }
    public string? Description { get; set; }
    public bool IsEnabled { get; set; } = true;
    public bool IsAdmin { get; set; }
    public List<string> Groups { get; set; } = [];
    public string? PasswordStatus { get; set; }
}

public sealed class SecuritySoftwareDto
{
    public required string ProductName { get; set; }
    public string? Vendor { get; set; }
    public string? Version { get; set; }
    public string Status { get; set; } = "Active";
    public bool IsEnabled { get; set; } = true;
    public bool IsRunning { get; set; } = true;
    public string? LastUpdated { get; set; }
}

public sealed class UpdateEndpointCredentialRequest
{
    public required string AuthMode { get; set; } // "Inherit", "EndpointSpecific", "AskWhenConnecting"
    public Guid? CredentialProfileId { get; set; }
}

public sealed class CreateLocalAccountRequest
{
    public required string Username { get; set; }
    public required string Password { get; set; }
    public string? FullName { get; set; }
    public string? Description { get; set; }
    public bool IsAdmin { get; set; } = true;
}

public sealed class GlobalSearchEndpointDto
{
    public Guid Id { get; set; }
    public required string Hostname { get; set; }
    public string? Fqdn { get; set; }
    public string? IpAddress { get; set; }
    public string? MacAddress { get; set; }
    public string Status { get; set; } = "Online";
    public string AuthStatus { get; set; } = "Authorized";
    public string? AuthUser { get; set; }
    public string DeviceType { get; set; } = "Windows";
    public string? OsName { get; set; }
}

public sealed class HardwareInventoryDto
{
    public string? Manufacturer { get; set; }
    public string? Model { get; set; }
    public string? SerialNumber { get; set; }
    public string? BiosVersion { get; set; }
    public string? ProcessorName { get; set; }
    public int? Cores { get; set; }
    public int? LogicalProcessors { get; set; }
    public int? ClockSpeedMhz { get; set; }
    public long? TotalRamMb { get; set; }
    public long? AvailableRamMb { get; set; }
    public string? GpuName { get; set; }
    public string? GpuDriverVersion { get; set; }
    public string? Architecture { get; set; }
    public DateTime? InstallDate { get; set; }
    public DateTime? LastBoot { get; set; }
    public DateTime? CollectedAt { get; set; }
}

public sealed class NetworkInterfaceDto
{
    public string? AdapterName { get; set; }
    public string? Ipv4Address { get; set; }
    public string? Ipv6Address { get; set; }
    public string? MacAddress { get; set; }
    public string? ConnectionState { get; set; }
    public int? LinkSpeedMbps { get; set; }
    public string? Gateway { get; set; }
    public string? DnsServers { get; set; }
}

public sealed class SoftwareInventoryItemDto
{
    public Guid Id { get; set; }
    public required string SoftwareName { get; set; }
    public string? Version { get; set; }
    public string? Publisher { get; set; }
    public DateTime? InstallDate { get; set; }
    public string? Architecture { get; set; }
    public string? InstallPath { get; set; }
}

public sealed class StorageDriveDto
{
    public string? DriveLetter { get; set; }
    public double? CapacityGb { get; set; }
    public double? FreeSpaceGb { get; set; }
    public double? UsedSpaceGb { get; set; }
    public string? FileSystem { get; set; }
    public string? DiskType { get; set; }
}

public sealed class CreateEndpointRequest
{
    public required string Hostname { get; set; }
    public string? Fqdn { get; set; }
    public string? IpAddress { get; set; }
    public string? MacAddress { get; set; }
    public string? Description { get; set; }
    public string? Location { get; set; }
    public Guid? GroupId { get; set; }
}

public sealed class ImportEndpointsRequest
{
    public required List<ImportEndpointRow> Endpoints { get; set; }
}

public sealed class ImportEndpointRow
{
    public required string Hostname { get; set; }
    public string? IpAddress { get; set; }
    public string? MacAddress { get; set; }
    public string? Group { get; set; }
    public string? Description { get; set; }
}
