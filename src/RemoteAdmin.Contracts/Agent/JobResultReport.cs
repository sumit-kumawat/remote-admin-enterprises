namespace RemoteAdmin.Contracts.Agent;

public sealed class JobResultReport
{
    public required string EndpointId { get; set; }
    public required string JobId { get; set; }
    public required string Status { get; set; }
    public int? ExitCode { get; set; }
    public string? ErrorMessage { get; set; }
    public string? ResultLog { get; set; }
    public DateTime CompletedAt { get; set; } = DateTime.UtcNow;
    public bool VerificationPassed { get; set; }
    public bool RequiresReboot { get; set; }
}
