namespace RemoteAdmin.Domain.Entities;

public class DiscoveryResult
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public required string ScanId { get; set; }
    public required string Hostname { get; set; }
    public required string IpAddress { get; set; }
    public string? MacAddress { get; set; }
    public string? OsName { get; set; }
    public bool IsWindows { get; set; } = true;
    public string DiscoveryMethod { get; set; } = "WMI/Ping";
    public string Status { get; set; } = "Unmanaged"; // Unmanaged | Managed
    public DateTime DiscoveredAt { get; set; } = DateTime.UtcNow;
}
