namespace RemoteAdmin.Contracts.Agent;

public sealed class HeartbeatResponse
{
    public bool Acknowledged { get; set; } = true;
    public DateTime ServerTime { get; set; } = DateTime.UtcNow;
    public List<PendingJobInfo> PendingJobs { get; set; } = [];
    public bool InventoryRequired { get; set; }
    public string? AgentUpdateVersion { get; set; }
}

public sealed class PendingJobInfo
{
    public required string JobId { get; set; }
    public required string Type { get; set; }
    public string? Configuration { get; set; }
}
