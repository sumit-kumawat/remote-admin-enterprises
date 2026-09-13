using Microsoft.AspNetCore.SignalR;
using RemoteAdmin.Application.Interfaces;

namespace RemoteAdmin.Api.Hubs;

public class DiscoveryHubNotifier : IDiscoveryHubNotifier
{
    private readonly IHubContext<DiscoveryHub> _hubContext;

    public DiscoveryHubNotifier(IHubContext<DiscoveryHub> hubContext)
    {
        _hubContext = hubContext;
    }

    public Task NotifyScanStartedAsync(Guid scanId, object scanData)
    {
        return _hubContext.Clients.Group($"scan-{scanId}").SendAsync("scan.started", scanData);
    }

    public Task NotifyScanProgressAsync(Guid scanId, object progressData)
    {
        return _hubContext.Clients.Group($"scan-{scanId}").SendAsync("scan.progress", progressData);
    }

    public Task NotifyHostDiscoveredAsync(Guid scanId, object hostData)
    {
        return _hubContext.Clients.Group($"scan-{scanId}").SendAsync("host.discovered", hostData);
    }

    public Task NotifyHostUpdatedAsync(Guid scanId, object hostData)
    {
        return _hubContext.Clients.Group($"scan-{scanId}").SendAsync("host.updated", hostData);
    }

    public Task NotifyScanCompletedAsync(Guid scanId, object completionData)
    {
        return _hubContext.Clients.Group($"scan-{scanId}").SendAsync("scan.completed", completionData);
    }

    public Task NotifyScanFailedAsync(Guid scanId, object failureData)
    {
        return _hubContext.Clients.Group($"scan-{scanId}").SendAsync("scan.failed", failureData);
    }

    public Task NotifyScanEventAsync(Guid scanId, object eventData)
    {
        return _hubContext.Clients.Group($"scan-{scanId}").SendAsync("scan.event", eventData);
    }
}
