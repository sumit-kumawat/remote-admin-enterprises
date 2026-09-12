using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RemoteAdmin.Contracts.Dtos;
using RemoteAdmin.Domain.Enums;
using RemoteAdmin.Infrastructure.Data;

namespace RemoteAdmin.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Policy = "Viewer")]
public class DashboardController : ControllerBase
{
    private readonly AppDbContext _db;

    public DashboardController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        var endpoints = _db.Endpoints.AsNoTracking();

        var stats = new DashboardStatsDto
        {
            TotalEndpoints = await endpoints.CountAsync(),
            OnlineEndpoints = await endpoints.CountAsync(e => e.Status == EndpointStatus.Online),
            OfflineEndpoints = await endpoints.CountAsync(e => e.Status == EndpointStatus.Offline),
            UnknownEndpoints = await endpoints.CountAsync(e => e.Status == EndpointStatus.Unknown),
            PendingJobs = await _db.DeploymentJobs.CountAsync(j => j.Status == JobStatus.Queued || j.Status == JobStatus.WaitingForApproval),
            RunningJobs = await _db.DeploymentJobs.CountAsync(j => j.Status == JobStatus.Running),
            FailedJobs = await _db.DeploymentJobs.CountAsync(j => j.Status == JobStatus.Failed),
        };

        var agentIdentities = _db.AgentIdentities.AsNoTracking();
        stats.AgentHealthy = await agentIdentities.CountAsync(a => a.Status == AgentStatus.Healthy);
        stats.AgentNeedsUpdate = await agentIdentities.CountAsync(a => a.Status == AgentStatus.NeedsUpdate);

        return Ok(stats);
    }
}
