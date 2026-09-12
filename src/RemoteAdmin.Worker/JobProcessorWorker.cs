namespace RemoteAdmin.Worker;

public class JobProcessorWorker : BackgroundService
{
    private readonly ILogger<JobProcessorWorker> _logger;

    public JobProcessorWorker(ILogger<JobProcessorWorker> logger)
    {
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Job Processor Worker started");

        while (!stoppingToken.IsCancellationRequested)
        {
            // Phase 7: Job queue processing will be implemented here
            await Task.Delay(TimeSpan.FromSeconds(5), stoppingToken);
        }

        _logger.LogInformation("Job Processor Worker stopped");
    }
}
