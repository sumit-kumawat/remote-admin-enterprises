using RemoteAdmin.Domain.Enums;

namespace RemoteAdmin.Domain.Entities;

public class KmsHost
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public required string Name { get; set; }
    public required string Hostname { get; set; }
    public string? IpAddress { get; set; }
    public string? Fqdn { get; set; }
    public int Port { get; set; } = 1688;
    public string? OperatingSystem { get; set; }
    public string? ServerVersion { get; set; }
    public string? Environment { get; set; }
    public string? Site { get; set; }
    public string? Description { get; set; }
    public KmsHostStatus Status { get; set; } = KmsHostStatus.Unknown;
    public DateTime? LastHealthCheck { get; set; }
    public DateTime? LastSuccessfulActivationCheck { get; set; }
    public int ResponseLatencyMs { get; set; }
    public string? LastErrorMessage { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
