namespace RemoteAdmin.Domain.Entities;

public class DiscoveryScan
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public required string Name { get; set; }
    public required string TargetCidr { get; set; }
    public string ScanType { get; set; } = "Full"; // ARP | ICMP | TCP | Full
    public string? PortSet { get; set; } = "Common"; // Common | Web | Windows | SSH | Database | Custom
    public int Concurrency { get; set; } = 500;
    public int TimeoutMs { get; set; } = 1000;
    public int Retries { get; set; } = 1;
    public int RateLimitPps { get; set; } = 5000;
    public string Status { get; set; } = "Queued"; // Queued | Running | Paused | Completed | Failed | Cancelled
    public DateTime? StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public required string CreatedBy { get; set; }
    public double ProgressPercent { get; set; } = 0.0;
    public int HostsFound { get; set; } = 0;
    public int HostsTotal { get; set; } = 0;
    public bool ConfirmedOwnership { get; set; } = false;

    public ICollection<DiscoveryHost> Hosts { get; set; } = new List<DiscoveryHost>();
    public ICollection<DiscoveryScanEvent> Events { get; set; } = new List<DiscoveryScanEvent>();
}
