using System.Text.Json;
using Microsoft.Extensions.Logging;
using RemoteAdmin.Application.Interfaces;
using RemoteAdmin.Domain.Entities;
using RemoteAdmin.Infrastructure.Data;

namespace RemoteAdmin.Infrastructure.Services;

public class AuditLogService : IAuditLogService
{
    private readonly AppDbContext _db;
    private readonly ILogger<AuditLogService> _logger;

    public AuditLogService(AppDbContext db, ILogger<AuditLogService> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task LogAsync(string actor, string action, string target, string result, string? ipAddress = null, object? details = null)
    {
        try
        {
            var auditEvent = new AuditEvent
            {
                Actor = actor,
                Action = action,
                Target = target,
                Result = result,
                IpAddress = ipAddress,
                DetailsJson = details != null ? JsonSerializer.Serialize(details) : null,
                Timestamp = DateTime.UtcNow
            };

            _db.AuditEvents.Add(auditEvent);
            await _db.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to record audit log entry for action '{Action}' by actor '{Actor}'", action, actor);
        }
    }
}
