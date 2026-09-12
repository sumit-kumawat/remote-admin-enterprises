namespace RemoteAdmin.Contracts.Dtos;

public sealed class DashboardStatsDto
{
    public int TotalEndpoints { get; set; }
    public int OnlineEndpoints { get; set; }
    public int OfflineEndpoints { get; set; }
    public int UnknownEndpoints { get; set; }
    public int Windows10Count { get; set; }
    public int Windows11Count { get; set; }
    public int AgentHealthy { get; set; }
    public int AgentNeedsUpdate { get; set; }
    public int LowDiskSpace { get; set; }
    public int PendingJobs { get; set; }
    public int RunningJobs { get; set; }
    public int FailedJobs { get; set; }
    public int RecentDeployments { get; set; }
    public int ManagementAccountCoverage { get; set; }
}
