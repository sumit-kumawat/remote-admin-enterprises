namespace RemoteAdmin.Application.Interfaces;

public interface IAuditLogService
{
    Task LogAsync(string actor, string action, string target, string result, string? ipAddress = null, object? details = null);
}
