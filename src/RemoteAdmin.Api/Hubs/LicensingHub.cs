using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;

namespace RemoteAdmin.Api.Hubs;

[Authorize]
public class LicensingHub : Hub
{
    private readonly ILogger<LicensingHub> _logger;

    public LicensingHub(ILogger<LicensingHub> logger)
    {
        _logger = logger;
    }

    public async Task JoinLicensingGroup()
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, "LicensingConsole");
        _logger.LogInformation("SignalR connection {ConnectionId} joined 'LicensingConsole' group", Context.ConnectionId);
    }

    public async Task LeaveLicensingGroup()
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, "LicensingConsole");
        _logger.LogInformation("SignalR connection {ConnectionId} left 'LicensingConsole' group", Context.ConnectionId);
    }
}
