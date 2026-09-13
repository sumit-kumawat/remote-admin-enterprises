namespace RemoteAdmin.Domain.Entities;

public class DiscoveryScanEvent
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ScanId { get; set; }
    public Guid? HostId { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    public string Severity { get; set; } = "Info"; // Info | Warning | Error
    public required string Message { get; set; }
    public string? PayloadJson { get; set; }

    public DiscoveryScan? Scan { get; set; }
    public DiscoveryHost? Host { get; set; }
}
