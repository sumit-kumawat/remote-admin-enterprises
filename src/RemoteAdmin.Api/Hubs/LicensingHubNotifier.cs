using Microsoft.AspNetCore.SignalR;
using RemoteAdmin.Application.Dtos.Licensing;

namespace RemoteAdmin.Api.Hubs;

public interface ILicensingHubNotifier
{
    Task NotifyKmsHostStatusChangedAsync(Guid hostId, string hostname, string status, int latencyMs);
    Task NotifyEndpointActivationChangedAsync(Guid endpointId, string productFamily, string status, DateTime checkedAt);
    Task NotifyActivationWaveProgressAsync(Guid waveId, string waveName, int activatedCount, int totalCount, string status);
}

public class LicensingHubNotifier : ILicensingHubNotifier
{
    private readonly IHubContext<LicensingHub> _hubContext;

    public LicensingHubNotifier(IHubContext<LicensingHub> hubContext)
    {
        _hubContext = hubContext;
    }

    public async Task NotifyKmsHostStatusChangedAsync(Guid hostId, string hostname, string status, int latencyMs)
    {
        await _hubContext.Clients.All.SendAsync("KmsHostStatusChanged", new
        {
            HostId = hostId,
            Hostname = hostname,
            Status = status,
            LatencyMs = latencyMs,
            Timestamp = DateTime.UtcNow
        });
    }

    public async Task NotifyEndpointActivationChangedAsync(Guid endpointId, string productFamily, string status, DateTime checkedAt)
    {
        await _hubContext.Clients.All.SendAsync("EndpointActivationChanged", new
        {
            EndpointId = endpointId,
            ProductFamily = productFamily,
            Status = status,
            CheckedAt = checkedAt
        });
    }

    public async Task NotifyActivationWaveProgressAsync(Guid waveId, string waveName, int activatedCount, int totalCount, string status)
    {
        await _hubContext.Clients.All.SendAsync("ActivationWaveProgress", new
        {
            WaveId = waveId,
            WaveName = waveName,
            ActivatedCount = activatedCount,
            TotalCount = totalCount,
            Status = status,
            Timestamp = DateTime.UtcNow
        });
    }
}
