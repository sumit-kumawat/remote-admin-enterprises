using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using RemoteAdmin.Application.Interfaces.Licensing;

namespace RemoteAdmin.Worker;

public class KmsHealthCheckWorker : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<KmsHealthCheckWorker> _logger;

    public KmsHealthCheckWorker(IServiceProvider serviceProvider, ILogger<KmsHealthCheckWorker> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("KMS Health Check Worker started");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = _serviceProvider.CreateScope();
                var healthService = scope.ServiceProvider.GetRequiredService<IKmsHealthService>();
                var results = await healthService.CheckAllHostsHealthAsync(stoppingToken);
                _logger.LogInformation("KMS Health Check Worker polled {Count} KMS hosts", results.Count);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred during background KMS health check");
            }

            await Task.Delay(TimeSpan.FromMinutes(5), stoppingToken);
        }

        _logger.LogInformation("KMS Health Check Worker stopped");
    }
}
