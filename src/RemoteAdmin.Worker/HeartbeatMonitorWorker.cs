namespace RemoteAdmin.Worker;

public class HeartbeatMonitorWorker : BackgroundService
{
    private readonly ILogger<HeartbeatMonitorWorker> _logger;

    public HeartbeatMonitorWorker(ILogger<HeartbeatMonitorWorker> logger)
    {
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Heartbeat Monitor Worker started");

        while (!stoppingToken.IsCancellationRequested)
        {
            // Phase 3: Heartbeat monitoring will be implemented here
            // Detect endpoints that missed heartbeats and update status
            await Task.Delay(TimeSpan.FromSeconds(30), stoppingToken);
        }

        _logger.LogInformation("Heartbeat Monitor Worker stopped");
    }
}
