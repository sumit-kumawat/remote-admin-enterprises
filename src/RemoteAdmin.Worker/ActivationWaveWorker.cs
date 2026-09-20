using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using RemoteAdmin.Application.Interfaces.Licensing;

namespace RemoteAdmin.Worker;

public class ActivationWaveWorker : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<ActivationWaveWorker> _logger;

    public ActivationWaveWorker(IServiceProvider serviceProvider, ILogger<ActivationWaveWorker> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Activation Wave Worker started");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = _serviceProvider.CreateScope();
                var waveService = scope.ServiceProvider.GetRequiredService<IActivationWaveService>();
                var waves = await waveService.GetAllWavesAsync();

                var runningWaves = waves.Where(w => w.Status == "Running").ToList();
                foreach (var wave in runningWaves)
                {
                    await waveService.ProcessNextWaveChunkAsync(wave.Id, maxConcurrency: 10);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred during background Activation Wave processing");
            }

            await Task.Delay(TimeSpan.FromSeconds(10), stoppingToken);
        }

        _logger.LogInformation("Activation Wave Worker stopped");
    }
}
