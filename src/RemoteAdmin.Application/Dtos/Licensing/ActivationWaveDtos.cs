using RemoteAdmin.Domain.Enums;

namespace RemoteAdmin.Application.Dtos.Licensing;

public class ActivationWaveDto
{
    public Guid Id { get; set; }
    public required string Name { get; set; }
    public string Status { get; set; } = "Created";
    public int WaveSize { get; set; } = 25;
    public ProductFamily TargetProductFamily { get; set; }
    public Guid? KmsHostId { get; set; }
    public string? KmsHostName { get; set; }
    public int TotalEndpoints { get; set; }
    public int ActivatedCount { get; set; }
    public int FailedCount { get; set; }
    public int SkippedCount { get; set; }
    public string? CreatedBy { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public List<ActivationWaveItemDto> Items { get; set; } = [];
}

public class ActivationWaveItemDto
{
    public Guid Id { get; set; }
    public Guid EndpointId { get; set; }
    public string EndpointHostname { get; set; } = "";
    public string Status { get; set; } = "Pending";
    public int WaveNumber { get; set; }
    public string? ResultLog { get; set; }
    public string? ErrorMessage { get; set; }
    public DateTime? ProcessedAt { get; set; }
}

public class CreateActivationWaveDto
{
    public required string Name { get; set; }
    public int WaveSize { get; set; } = 25;
    public ProductFamily TargetProductFamily { get; set; } = ProductFamily.Windows;
    public Guid? KmsHostId { get; set; }
    public List<Guid>? SpecificEndpointIds { get; set; }
}
