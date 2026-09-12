namespace RemoteAdmin.Domain.Enums;

public enum JobStatus
{
    Queued,
    WaitingForApproval,
    Running,
    Completed,
    Failed,
    Cancelled,
}
