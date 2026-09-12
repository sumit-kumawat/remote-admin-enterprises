using RemoteAdmin.Worker;
using Serilog;

var builder = Host.CreateApplicationBuilder(args);

builder.Services.AddSerilog(loggerConfig =>
{
    loggerConfig
        .ReadFrom.Configuration(builder.Configuration)
        .Enrich.FromLogContext()
        .Enrich.WithProperty("Application", "RemoteAdmin.Worker")
        .WriteTo.Console(outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] {Message:lj}{NewLine}{Exception}")
        .WriteTo.File("logs/worker-.log",
            rollingInterval: RollingInterval.Day,
            retainedFileCountLimit: 30);
});

builder.Services.AddHostedService<JobProcessorWorker>();
builder.Services.AddHostedService<HeartbeatMonitorWorker>();

var host = builder.Build();

Log.Information("Remote Admin Enterprises Worker v1.0 starting");

await host.RunAsync();
