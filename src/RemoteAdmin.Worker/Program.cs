using Microsoft.EntityFrameworkCore;
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

builder.Services.AddDbContext<RemoteAdmin.Infrastructure.Data.AppDbContext>(options =>
{
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection"));
});

builder.Services.AddScoped<RemoteAdmin.Application.Interfaces.IAuditLogService, RemoteAdmin.Infrastructure.Services.AuditLogService>();
builder.Services.AddScoped<RemoteAdmin.Application.Interfaces.Licensing.IKmsManagementService, RemoteAdmin.Infrastructure.Services.Licensing.KmsManagementService>();
builder.Services.AddScoped<RemoteAdmin.Application.Interfaces.Licensing.IKmsHealthService, RemoteAdmin.Infrastructure.Services.Licensing.KmsHealthService>();
builder.Services.AddScoped<RemoteAdmin.Application.Interfaces.Licensing.IWindowsActivationService, RemoteAdmin.Infrastructure.Services.Licensing.WindowsActivationService>();
builder.Services.AddScoped<RemoteAdmin.Application.Interfaces.Licensing.IOfficeActivationService, RemoteAdmin.Infrastructure.Services.Licensing.OfficeActivationService>();
builder.Services.AddScoped<RemoteAdmin.Application.Interfaces.Licensing.IActivationWaveService, RemoteAdmin.Infrastructure.Services.Licensing.ActivationWaveService>();

builder.Services.AddHostedService<JobProcessorWorker>();
builder.Services.AddHostedService<HeartbeatMonitorWorker>();
builder.Services.AddHostedService<KmsHealthCheckWorker>();
builder.Services.AddHostedService<ActivationWaveWorker>();

var host = builder.Build();

Log.Information("Remote Admin Enterprises Worker v1.0 starting");

await host.RunAsync();
