using RemoteAdmin.Domain.Enums;

namespace RemoteAdmin.Domain.Entities;

public class ActivationWave
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public required string Name { get; set; }
    public string Status { get; set; } = "Created"; // Created, Running, Paused, Completed, Cancelled
    public int WaveSize { get; set; } = 25;
    public ProductFamily TargetProductFamily { get; set; } = ProductFamily.Windows;
    public Guid? KmsHostId { get; set; }
    public KmsHost? KmsHost { get; set; }
    public int TotalEndpoints { get; set; }
    public int ActivatedCount { get; set; }
    public int FailedCount { get; set; }
    public int SkippedCount { get; set; }
    public string? CreatedBy { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public List<ActivationWaveItem> Items { get; set; } = [];
}

public class ActivationWaveItem
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid WaveId { get; set; }
    public ActivationWave? Wave { get; set; }
    public Guid EndpointId { get; set; }
    public Endpoint? Endpoint { get; set; }
    public string Status { get; set; } = "Pending"; // Pending, Running, Activated, Failed, Skipped
    public int WaveNumber { get; set; } = 1;
    public string? ResultLog { get; set; }
    public string? ErrorMessage { get; set; }
    public DateTime? ProcessedAt { get; set; }
}
