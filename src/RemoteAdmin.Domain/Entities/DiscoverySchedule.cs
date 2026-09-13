namespace RemoteAdmin.Domain.Entities;

public class DiscoverySchedule
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public required string Name { get; set; }
    public required string CronExpression { get; set; }
    public required string TargetCidr { get; set; }
    public string ScanType { get; set; } = "Full";
    public string? PortSet { get; set; } = "Common";
    public bool Enabled { get; set; } = true;
    public DateTime? LastRunAt { get; set; }
    public DateTime? NextRunAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public required string CreatedBy { get; set; }
}
