using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;

namespace RemoteAdmin.Api.Hubs;

[Authorize]
public class DiscoveryHub : Hub
{
    private readonly ILogger<DiscoveryHub> _logger;

    public DiscoveryHub(ILogger<DiscoveryHub> logger)
    {
        _logger = logger;
    }

    public async Task JoinScanGroup(string scanId)
    {
        if (string.IsNullOrWhiteSpace(scanId)) return;
        var groupName = $"scan-{scanId.Trim()}";
        await Groups.AddToGroupAsync(Context.ConnectionId, groupName);
        _logger.LogInformation("SignalR Connection {ConnectionId} joined discovery group '{GroupName}'", Context.ConnectionId, groupName);
    }

    public async Task LeaveScanGroup(string scanId)
    {
        if (string.IsNullOrWhiteSpace(scanId)) return;
        var groupName = $"scan-{scanId.Trim()}";
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, groupName);
        _logger.LogInformation("SignalR Connection {ConnectionId} left discovery group '{GroupName}'", Context.ConnectionId, groupName);
    }

    public override async Task OnConnectedAsync()
    {
        var httpContext = Context.GetHttpContext();
        var scanId = httpContext?.Request.Query["scanId"].ToString();
        if (!string.IsNullOrWhiteSpace(scanId))
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"scan-{scanId.Trim()}");
        }
        await base.OnConnectedAsync();
    }
}
