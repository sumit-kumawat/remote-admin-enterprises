using RemoteAdmin.Agent;
using Serilog;

var builder = Host.CreateApplicationBuilder(args);

builder.Services.AddSerilog(loggerConfig =>
{
    loggerConfig
        .ReadFrom.Configuration(builder.Configuration)
        .Enrich.FromLogContext()
        .Enrich.WithProperty("Application", "RemoteAdmin.Agent")
        .WriteTo.Console(outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] {Message:lj}{NewLine}{Exception}")
        .WriteTo.File("logs/agent-.log",
            rollingInterval: RollingInterval.Day,
            retainedFileCountLimit: 14);
});

builder.Services.AddHostedService<AgentService>();

// Configure as Windows Service when running on Windows
if (OperatingSystem.IsWindows())
{
    builder.Services.AddWindowsService(options =>
    {
        options.ServiceName = "RemoteAdminAgent";
    });
}

var host = builder.Build();

Log.Information("Remote Admin Enterprises Agent v1.0 starting");

await host.RunAsync();
