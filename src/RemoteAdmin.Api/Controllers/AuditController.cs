using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RemoteAdmin.Domain.Entities;
using RemoteAdmin.Infrastructure.Data;

namespace RemoteAdmin.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Policy = "Viewer")]
public class AuditController : ControllerBase
{
    private readonly AppDbContext _db;

    public AuditController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet("logs")]
    public async Task<IActionResult> GetLogs([FromQuery] string? actor, [FromQuery] string? action, [FromQuery] string? result)
    {
        var query = _db.AuditEvents.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(actor) && actor != "All")
            query = query.Where(a => a.Actor == actor);
        if (!string.IsNullOrWhiteSpace(action) && action != "All")
            query = query.Where(a => a.Action == action);
        if (!string.IsNullOrWhiteSpace(result) && result != "All")
            query = query.Where(a => a.Result == result);

        var logs = await query
            .OrderByDescending(a => a.Timestamp)
            .Take(100)
            .ToListAsync();

        return Ok(logs);
    }
}
