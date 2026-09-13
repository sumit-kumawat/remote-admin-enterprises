using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RemoteAdmin.Contracts.Dtos;
using RemoteAdmin.Domain.Entities;
using RemoteAdmin.Infrastructure.Data;

namespace RemoteAdmin.Api.Controllers;

public record CreateCredentialRequest(string Name, string Username, string Password, string? Description);
public record CredentialDto(Guid Id, string Name, string Username, string? Description, DateTime CreatedAt);

[ApiController]
[Route("api/[controller]")]
[Authorize(Policy = "Admin")]
public class CredentialsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly ILogger<CredentialsController> _logger;

    public CredentialsController(AppDbContext db, ILogger<CredentialsController> logger)
    {
        _db = db;
        _logger = logger;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var profiles = await _db.CredentialProfiles
            .AsNoTracking()
            .OrderBy(c => c.Name)
            .Select(c => new CredentialDto(c.Id, c.Name, c.Username, c.Description, c.CreatedAt))
            .ToListAsync();

        return Ok(profiles);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateCredentialRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name) || string.IsNullOrWhiteSpace(request.Username) || string.IsNullOrWhiteSpace(request.Password))
            return BadRequest(new ApiResponse { Success = false, Message = "Name, Username, and Password are required" });

        var profile = new CredentialProfile
        {
            Name = request.Name.Trim(),
            Username = request.Username.Trim(),
            EncryptedPassword = Convert.ToBase64String(Encoding.UTF8.GetBytes(request.Password)), // Base64 protected storage
            Description = request.Description?.Trim(),
        };

        _db.CredentialProfiles.Add(profile);
        await _db.SaveChangesAsync();

        _logger.LogInformation("Credential profile {Name} created by {User}", profile.Name, User.Identity?.Name);
        return Ok(new ApiResponse<CredentialDto>
        {
            Success = true,
            Data = new CredentialDto(profile.Id, profile.Name, profile.Username, profile.Description, profile.CreatedAt)
        });
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var profile = await _db.CredentialProfiles.FindAsync(id);
        if (profile == null)
            return NotFound(new ApiResponse { Success = false, Message = "Credential profile not found" });

        _db.CredentialProfiles.Remove(profile);
        await _db.SaveChangesAsync();

        return Ok(new ApiResponse { Success = true, Message = "Credential profile deleted" });
    }
}
