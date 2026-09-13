namespace RemoteAdmin.Contracts.Dtos;

public class CreateScanRequest
{
    public string Name { get; set; } = string.Empty;
    public required string TargetCidr { get; set; }
    public string ScanType { get; set; } = "Full"; // ARP | ICMP | TCP | Full
    public string PortSet { get; set; } = "Common"; // Common | Web | Windows | SSH | Database | Custom
    public List<int>? CustomPorts { get; set; }
    public int Concurrency { get; set; } = 500;
    public int TimeoutMs { get; set; } = 1000;
    public int Retries { get; set; } = 1;
    public int RateLimitPps { get; set; } = 5000;
    public bool ConfirmedOwnership { get; set; } = false;
}

public class DiscoveryScanDto
{
    public Guid Id { get; set; }
    public required string Name { get; set; }
    public required string TargetCidr { get; set; }
    public string ScanType { get; set; } = "Full";
    public string? PortSet { get; set; }
    public int Concurrency { get; set; }
    public int TimeoutMs { get; set; }
    public int Retries { get; set; }
    public int RateLimitPps { get; set; }
    public string Status { get; set; } = "Queued";
    public DateTime? StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public required string CreatedBy { get; set; }
    public double ProgressPercent { get; set; }
    public int HostsFound { get; set; }
    public int HostsTotal { get; set; }
    public bool ConfirmedOwnership { get; set; }
}

public class DiscoveryHostDto
{
    public Guid Id { get; set; }
    public Guid ScanId { get; set; }
    public required string IpAddress { get; set; }
    public string? MacAddress { get; set; }
    public string? Vendor { get; set; }
    public string? Hostname { get; set; }
    public int? Ttl { get; set; }
    public string? OsGuess { get; set; }
    public List<int> OpenPorts { get; set; } = new();
    public Dictionary<int, string> Banners { get; set; } = new();
    public DateTime FirstSeenAt { get; set; }
    public DateTime LastSeenAt { get; set; }
    public string Status { get; set; } = "Up";
    public double Confidence { get; set; }
    public bool IsPromoted { get; set; }
    public Guid? PromotedEndpointId { get; set; }
}

public class DiscoveryScanEventDto
{
    public Guid Id { get; set; }
    public Guid ScanId { get; set; }
    public Guid? HostId { get; set; }
    public DateTime Timestamp { get; set; }
    public string Severity { get; set; } = "Info";
    public required string Message { get; set; }
    public string? PayloadJson { get; set; }
}

public class DiscoveryScheduleDto
{
    public Guid Id { get; set; }
    public required string Name { get; set; }
    public required string CronExpression { get; set; }
    public required string TargetCidr { get; set; }
    public string ScanType { get; set; } = "Full";
    public string? PortSet { get; set; }
    public bool Enabled { get; set; }
    public DateTime? LastRunAt { get; set; }
    public DateTime? NextRunAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public required string CreatedBy { get; set; }
}

public class CreateScheduleRequest
{
    public required string Name { get; set; }
    public required string CronExpression { get; set; }
    public required string TargetCidr { get; set; }
    public string ScanType { get; set; } = "Full";
    public string PortSet { get; set; } = "Common";
    public bool Enabled { get; set; } = true;
}

public class PromoteHostRequest
{
    public string? Hostname { get; set; }
    public string? DeviceType { get; set; } = "Windows";
    public string? AuthMode { get; set; } = "Inherit";
    public Guid? CredentialProfileId { get; set; }
}

public class SubnetInfoDto
{
    public required string InterfaceName { get; set; }
    public required string IpAddress { get; set; }
    public string? MacAddress { get; set; }
    public required string SubnetMask { get; set; }
    public required string Cidr { get; set; }
    public int HostCount { get; set; }
}
