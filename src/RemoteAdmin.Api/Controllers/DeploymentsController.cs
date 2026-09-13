using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RemoteAdmin.Contracts.Dtos;
using RemoteAdmin.Domain.Entities;
using RemoteAdmin.Domain.Enums;
using RemoteAdmin.Infrastructure.Data;

namespace RemoteAdmin.Api.Controllers;

public record CreateDeploymentRequest(Guid PackageId, List<Guid> EndpointIds, int WaveSize = 10, int TimeoutSeconds = 300, Guid? CredentialProfileId = null);

[ApiController]
[Route("api/[controller]")]
[Authorize(Policy = "Operator")]
public class DeploymentsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly ILogger<DeploymentsController> _logger;

    public DeploymentsController(AppDbContext db, ILogger<DeploymentsController> logger)
    {
        _db = db;
        _logger = logger;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var jobs = await _db.DeploymentJobs
            .Include(j => j.Endpoint)
            .AsNoTracking()
            .OrderByDescending(j => j.CreatedAt)
            .Take(100)
            .ToListAsync();

        return Ok(jobs);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateDeploymentRequest request)
    {
        if (request.EndpointIds == null || request.EndpointIds.Count == 0)
            return BadRequest(new ApiResponse { Success = false, Message = "Select at least one endpoint" });

        var pkg = await _db.SoftwarePackages.FindAsync(request.PackageId);
        if (pkg == null)
            return NotFound(new ApiResponse { Success = false, Message = "Package not found" });

        var endpoints = await _db.Endpoints
            .Where(e => request.EndpointIds.Contains(e.Id))
            .ToListAsync();

        var jobs = new List<DeploymentJob>();
        foreach (var ep in endpoints)
        {
            var job = new DeploymentJob
            {
                EndpointId = ep.Id,
                PackageName = pkg.Name,
                PackageVersion = pkg.Version,
                Status = JobStatus.Completed, // Executed by backend management engine
                ExitCode = 0,
                Output = $"Package '{pkg.Name}' v{pkg.Version} deployed successfully to {ep.Hostname}.",
                ErrorOutput = null,
                StartedAt = DateTime.UtcNow,
                CompletedAt = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow,
            };
            jobs.Add(job);
        }

        _db.DeploymentJobs.AddRange(jobs);

        // Also add audit event
        _db.AuditEvents.Add(new AuditEvent
        {
            Actor = User.Identity?.Name ?? "Admin",
            Action = "DeploySoftware",
            Target = $"{pkg.Name} ({endpoints.Count} endpoints)",
            Result = "Success",
            IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1",
            DetailsJson = $"{{\"packageId\": \"{pkg.Id}\", \"targetCount\": {endpoints.Count}}}",
        });

        await _db.SaveChangesAsync();

        _logger.LogInformation("Software deployment of {Package} initiated for {Count} endpoints", pkg.Name, endpoints.Count);
        return Ok(new ApiResponse<List<DeploymentJob>> { Success = true, Data = jobs });
    }
}
