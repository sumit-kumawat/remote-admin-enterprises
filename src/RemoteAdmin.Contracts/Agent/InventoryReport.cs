namespace RemoteAdmin.Contracts.Agent;

public sealed class InventoryReport
{
    public required string EndpointId { get; set; }
    public required string AgentVersion { get; set; }
    public DateTime CollectedAt { get; set; } = DateTime.UtcNow;
    public string? InventoryHash { get; set; }
    public OperatingSystemInfo? OperatingSystem { get; set; }
    public CpuInfo? Cpu { get; set; }
    public MemoryInfo? Memory { get; set; }
    public List<StorageDriveInfo> Drives { get; set; } = [];
    public List<NetworkAdapterInfo> NetworkAdapters { get; set; } = [];
    public GpuInfo? Gpu { get; set; }
    public List<InstalledSoftwareInfo> InstalledSoftware { get; set; } = [];
}

public sealed class OperatingSystemInfo
{
    public string? Hostname { get; set; }
    public string? Edition { get; set; }
    public string? Version { get; set; }
    public string? Build { get; set; }
    public string? Architecture { get; set; }
    public DateTime? InstallDate { get; set; }
    public DateTime? LastBoot { get; set; }
    public string? Manufacturer { get; set; }
    public string? Model { get; set; }
    public string? SerialNumber { get; set; }
    public string? BiosVersion { get; set; }
}

public sealed class CpuInfo
{
    public string? Name { get; set; }
    public string? Manufacturer { get; set; }
    public int? Cores { get; set; }
    public int? LogicalProcessors { get; set; }
    public int? ClockSpeedMhz { get; set; }
}

public sealed class MemoryInfo
{
    public long? TotalMb { get; set; }
    public long? AvailableMb { get; set; }
}

public sealed class StorageDriveInfo
{
    public string? DriveLetter { get; set; }
    public double? CapacityGb { get; set; }
    public double? FreeSpaceGb { get; set; }
    public double? UsedSpaceGb { get; set; }
    public string? FileSystem { get; set; }
    public string? DiskType { get; set; }
    public string? SerialNumber { get; set; }
}

public sealed class NetworkAdapterInfo
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

public sealed class GpuInfo
{
    public string? Name { get; set; }
    public string? DriverVersion { get; set; }
}

public sealed class InstalledSoftwareInfo
{
    public required string Name { get; set; }
    public string? Version { get; set; }
    public string? Publisher { get; set; }
    public DateTime? InstallDate { get; set; }
    public string? Architecture { get; set; }
    public string? InstallPath { get; set; }
    public string? DetectionMethod { get; set; }
    public string? ProductCode { get; set; }
}
