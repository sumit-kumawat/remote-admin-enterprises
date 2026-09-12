namespace RemoteAdmin.Agent;

public class AgentService : BackgroundService
{
    private readonly ILogger<AgentService> _logger;
    private readonly IConfiguration _configuration;

    public AgentService(ILogger<AgentService> logger, IConfiguration configuration)
    {
        _logger = logger;
        _configuration = configuration;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Remote Admin Agent starting — waiting for enrollment");

        var heartbeatInterval = _configuration.GetValue("Agent:HeartbeatIntervalSeconds", 60);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                // Phase 3: Full agent implementation
                // 1. Check enrollment status
                // 2. If not enrolled, attempt enrollment
                // 3. If enrolled, send heartbeat
                // 4. Check for pending jobs
                // 5. Execute jobs
                // 6. Report results

                await Task.Delay(TimeSpan.FromSeconds(heartbeatInterval), stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Agent error — will retry in {Interval} seconds", heartbeatInterval);
                await Task.Delay(TimeSpan.FromSeconds(heartbeatInterval), stoppingToken);
            }
        }

        _logger.LogInformation("Remote Admin Agent shutting down gracefully");
    }
}
