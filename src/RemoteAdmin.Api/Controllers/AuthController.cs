using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using RemoteAdmin.Contracts.Dtos;
using RemoteAdmin.Domain.Enums;
using RemoteAdmin.Infrastructure.Data;

namespace RemoteAdmin.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    public const string DefaultAdminUsername = "admin";

    private readonly AppDbContext _db;
    private readonly IConfiguration _config;
    private readonly ILogger<AuthController> _logger;

    public AuthController(AppDbContext db, IConfiguration config, ILogger<AuthController> logger)
    {
        _db = db;
        _config = config;
        _logger = logger;
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Username == request.Username);
        if (user == null || !user.IsActive)
        {
            _logger.LogWarning("Login failed for username {Username} — user not found or inactive", request.Username);
            return Unauthorized(new ApiResponse { Success = false, Message = "Invalid username or password" });
        }

        if (user.LockedUntil.HasValue && user.LockedUntil > DateTime.UtcNow)
        {
            _logger.LogWarning("Login failed for {Username} — account locked until {LockedUntil}", request.Username, user.LockedUntil);
            return Unauthorized(new ApiResponse { Success = false, Message = "Account is temporarily locked" });
        }

        var hash = HashPassword(request.Password, user.Salt);
        if (hash != user.PasswordHash)
        {
            user.FailedLoginAttempts++;
            if (user.FailedLoginAttempts >= 5)
            {
                user.LockedUntil = DateTime.UtcNow.AddMinutes(15);
                _logger.LogWarning("Account {Username} locked after {Attempts} failed attempts", request.Username, user.FailedLoginAttempts);
            }
            await _db.SaveChangesAsync();
            return Unauthorized(new ApiResponse { Success = false, Message = "Invalid username or password" });
        }

        user.FailedLoginAttempts = 0;
        user.LockedUntil = null;
        user.LastLogin = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        var token = GenerateToken(user);
        var expiryMinutes = _config.GetValue("Jwt:ExpiryMinutes", 480);

        _logger.LogInformation("User {Username} logged in from {IpAddress}", user.Username, HttpContext.Connection.RemoteIpAddress);

        return Ok(new LoginResponse
        {
            Token = token,
            ExpiresAt = DateTime.UtcNow.AddMinutes(expiryMinutes),
            User = new UserDto
            {
                Id = user.Id,
                Username = user.Username,
                Email = user.Email,
                Role = user.Role.ToString(),
                IsActive = user.IsActive,
                LastLogin = user.LastLogin,
            },
        });
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> Me()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userId == null || !Guid.TryParse(userId, out var id))
            return Unauthorized();

        var user = await _db.Users.FindAsync(id);
        if (user == null || !user.IsActive)
            return Unauthorized();

        return Ok(new UserDto
        {
            Id = user.Id,
            Username = user.Username,
            Email = user.Email,
            Role = user.Role.ToString(),
            IsActive = user.IsActive,
            LastLogin = user.LastLogin,
        });
    }

    [HttpPost("change-password")]
    [Authorize]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
    {
        if (request.NewPassword != request.NewPasswordConfirmation)
            return BadRequest(new ApiResponse { Success = false, Message = "Passwords do not match" });

        if (request.NewPassword.Length < 8)
            return BadRequest(new ApiResponse { Success = false, Message = "Password must be at least 8 characters" });

        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userId == null || !Guid.TryParse(userId, out var id))
            return Unauthorized();

        var user = await _db.Users.FindAsync(id);
        if (user == null)
            return Unauthorized();

        var currentHash = HashPassword(request.CurrentPassword, user.Salt);
        if (currentHash != user.PasswordHash)
            return BadRequest(new ApiResponse { Success = false, Message = "Current password is incorrect" });

        var newSalt = GenerateSalt();
        user.Salt = newSalt;
        user.PasswordHash = HashPassword(request.NewPassword, newSalt);
        user.MustChangePassword = false;
        await _db.SaveChangesAsync();

        _logger.LogInformation("User {Username} changed password", user.Username);
        return Ok(new ApiResponse { Success = true, Message = "Password changed successfully" });
    }

    [HttpGet("users")]
    [Authorize(Policy = "SuperAdmin")]
    public async Task<IActionResult> ListUsers()
    {
        var users = await _db.Users
            .AsNoTracking()
            .OrderBy(u => u.Username)
            .Select(u => new UserDto
            {
                Id = u.Id,
                Username = u.Username,
                Email = u.Email,
                Role = u.Role.ToString(),
                IsActive = u.IsActive,
                LastLogin = u.LastLogin,
            })
            .ToListAsync();

        return Ok(users);
    }

    [HttpPost("users")]
    [Authorize(Policy = "SuperAdmin")]
    public async Task<IActionResult> CreateUser([FromBody] CreateUserRequest request)
    {
        if (request.Password != request.PasswordConfirmation)
            return BadRequest(new ApiResponse { Success = false, Message = "Passwords do not match" });

        if (request.Password.Length < 8)
            return BadRequest(new ApiResponse { Success = false, Message = "Password must be at least 8 characters" });

        if (await _db.Users.AnyAsync(u => u.Username == request.Username))
            return Conflict(new ApiResponse { Success = false, Message = "Username already exists" });

        if (!Enum.TryParse<UserRole>(request.Role, ignoreCase: true, out var role))
            return BadRequest(new ApiResponse { Success = false, Message = "Invalid role" });

        var salt = GenerateSalt();
        var user = new Domain.Entities.User
        {
            Username = request.Username,
            Email = request.Email,
            PasswordHash = HashPassword(request.Password, salt),
            Salt = salt,
            Role = role,
            IsActive = true,
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        _logger.LogInformation("User {Username} created by {CreatedBy}", user.Username, User.Identity?.Name);
        return Ok(new ApiResponse { Success = true, Message = $"User '{user.Username}' created" });
    }

    [HttpDelete("users/{id:guid}")]
    [Authorize(Policy = "SuperAdmin")]
    public async Task<IActionResult> DeleteUser(Guid id)
    {
        var user = await _db.Users.FindAsync(id);
        if (user == null)
            return NotFound(new ApiResponse { Success = false, Message = "User not found" });

        if (user.Username == DefaultAdminUsername)
            return BadRequest(new ApiResponse { Success = false, Message = "The default admin account cannot be deleted" });

        _db.Users.Remove(user);
        await _db.SaveChangesAsync();

        _logger.LogInformation("User {Username} deleted by {DeletedBy}", user.Username, User.Identity?.Name);
        return Ok(new ApiResponse { Success = true, Message = $"User '{user.Username}' deleted" });
    }

    [HttpPut("users/{id:guid}/role")]
    [Authorize(Policy = "SuperAdmin")]
    public async Task<IActionResult> UpdateUserRole(Guid id, [FromBody] string role)
    {
        var user = await _db.Users.FindAsync(id);
        if (user == null)
            return NotFound(new ApiResponse { Success = false, Message = "User not found" });

        if (user.Username == DefaultAdminUsername)
            return BadRequest(new ApiResponse { Success = false, Message = "The default admin account role cannot be changed" });

        if (!Enum.TryParse<UserRole>(role, ignoreCase: true, out var newRole))
            return BadRequest(new ApiResponse { Success = false, Message = "Invalid role" });

        user.Role = newRole;
        await _db.SaveChangesAsync();

        _logger.LogInformation("User {Username} role changed to {Role} by {ChangedBy}", user.Username, newRole, User.Identity?.Name);
        return Ok(new ApiResponse { Success = true, Message = $"User '{user.Username}' role updated to {newRole}" });
    }

    [HttpPut("users/{id:guid}/deactivate")]
    [Authorize(Policy = "SuperAdmin")]
    public async Task<IActionResult> DeactivateUser(Guid id)
    {
        var user = await _db.Users.FindAsync(id);
        if (user == null)
            return NotFound(new ApiResponse { Success = false, Message = "User not found" });

        if (user.Username == DefaultAdminUsername)
            return BadRequest(new ApiResponse { Success = false, Message = "The default admin account cannot be deactivated" });

        user.IsActive = false;
        await _db.SaveChangesAsync();

        _logger.LogInformation("User {Username} deactivated by {DeactivatedBy}", user.Username, User.Identity?.Name);
        return Ok(new ApiResponse { Success = true, Message = $"User '{user.Username}' deactivated" });
    }

    private string GenerateToken(Domain.Entities.User user)
    {
        var key = _config["Jwt:Key"]!;
        var issuer = _config["Jwt:Issuer"] ?? "RemoteAdminEnterprises";
        var audience = _config["Jwt:Audience"] ?? "RemoteAdminEnterprises";
        var expiryMinutes = _config.GetValue("Jwt:ExpiryMinutes", 480);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Name, user.Username),
            new Claim(ClaimTypes.Role, user.Role.ToString()),
        };

        var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key));
        var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(expiryMinutes),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public static string GenerateSalt()
    {
        var bytes = new byte[32];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(bytes);
        return Convert.ToBase64String(bytes);
    }

    public static string HashPassword(string password, string salt)
    {
        using var hmac = new HMACSHA512(Encoding.UTF8.GetBytes(salt));
        var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(password));
        return Convert.ToBase64String(hash);
    }
}
