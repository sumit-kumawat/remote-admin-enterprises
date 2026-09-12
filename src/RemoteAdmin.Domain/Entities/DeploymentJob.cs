using RemoteAdmin.Domain.Enums;

namespace RemoteAdmin.Domain.Entities;

public class DeploymentJob
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid EndpointId { get; set; }
    public JobStatus Status { get; set; } = JobStatus.Queued;
    public string? PackageName { get; set; }
    public string? PackageVersion { get; set; }
    public string? CommandLine { get; set; }
    public int? ExitCode { get; set; }
    public string? Output { get; set; }
    public string? ErrorOutput { get; set; }
    public int RetryCount { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public Guid? CreatedByUserId { get; set; }

    public Endpoint Endpoint { get; set; } = null!;
    public User? CreatedByUser { get; set; }
}
