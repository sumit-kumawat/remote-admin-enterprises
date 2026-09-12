namespace RemoteAdmin.Contracts.Agent;

public sealed class HeartbeatRequest
{
    public required string EndpointId { get; set; }
    public required string AgentVersion { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    public string? CurrentState { get; set; }
    public string? JobState { get; set; }
    public double? CpuPercent { get; set; }
    public long? MemoryMb { get; set; }
}
