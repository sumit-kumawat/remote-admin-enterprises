using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using RemoteAdmin.Infrastructure.Data;

namespace RemoteAdmin.Api.Middleware;

public class MustChangePasswordMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<MustChangePasswordMiddleware> _logger;

    private static readonly HashSet<string> ExemptPaths = new(StringComparer.OrdinalIgnoreCase)
    {
        "/api/auth/change-password",
        "/api/auth/me",
        "/api/system/info"
    };

    public MustChangePasswordMiddleware(RequestDelegate next, ILogger<MustChangePasswordMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context, AppDbContext db)
    {
        if (context.User.Identity?.IsAuthenticated == true)
        {
            var path = context.Request.Path.Value ?? string.Empty;

            if (!ExemptPaths.Contains(path))
            {
                var userIdStr = context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (Guid.TryParse(userIdStr, out var userId))
                {
                    var user = await db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId);
                    if (user != null && user.MustChangePassword)
                    {
                        var actor = user.Username;
                        _logger.LogWarning("Access blocked to {Path} for user {Username}: Password change required. (Actor: {Actor}, Action: {Action}, Target: {Target}, Result: {Result}, Timestamp: {Timestamp})",
                            path, user.Username, actor, "AccessBlocked", path, "PreconditionRequired", DateTime.UtcNow);

                        context.Response.StatusCode = StatusCodes.Status428PreconditionRequired;
                        context.Response.ContentType = "application/json";
                        await context.Response.WriteAsJsonAsync(new
                        {
                            success = false,
                            message = "Password change required. You must change your password via /api/Auth/change-password before continuing.",
                            mustChangePassword = true
                        });
                        return;
                    }
                }
            }
        }

        await _next(context);
    }
}
