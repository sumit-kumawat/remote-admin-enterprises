namespace RemoteAdmin.Application.Interfaces;

public interface IDiscoveryHubNotifier
{
    Task NotifyScanStartedAsync(Guid scanId, object scanData);
    Task NotifyScanProgressAsync(Guid scanId, object progressData);
    Task NotifyHostDiscoveredAsync(Guid scanId, object hostData);
    Task NotifyHostUpdatedAsync(Guid scanId, object hostData);
    Task NotifyScanCompletedAsync(Guid scanId, object completionData);
    Task NotifyScanFailedAsync(Guid scanId, object failureData);
    Task NotifyScanEventAsync(Guid scanId, object eventData);
}
