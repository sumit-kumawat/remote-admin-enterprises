namespace RemoteAdmin.Domain.Entities;

public class DiscoveryHost
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ScanId { get; set; }
    public required string IpAddress { get; set; }
    public string? MacAddress { get; set; }
    public string? Vendor { get; set; }
    public string? Hostname { get; set; }
    public int? Ttl { get; set; }
    public string? OsGuess { get; set; }
    public string? OpenPortsJson { get; set; }
    public string? BannersJson { get; set; }
    public DateTime FirstSeenAt { get; set; } = DateTime.UtcNow;
    public DateTime LastSeenAt { get; set; } = DateTime.UtcNow;
    public string Status { get; set; } = "Up"; // Up | Down | Filtered | Unknown
    public double Confidence { get; set; } = 0.90;
    public bool IsPromoted { get; set; } = false;
    public Guid? PromotedEndpointId { get; set; }

    public DiscoveryScan? Scan { get; set; }
    public Endpoint? PromotedEndpoint { get; set; }
}
