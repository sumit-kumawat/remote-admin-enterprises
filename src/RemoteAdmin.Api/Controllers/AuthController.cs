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
            _logger.LogWarning("Login failed for username {Username}: user not found or inactive. (Actor: {Actor}, Action: {Action}, Target: {Target}, Result: {Result}, Timestamp: {Timestamp})",
                request.Username, request.Username, "Login", "Session", "Failed", DateTime.UtcNow);
            return Unauthorized(new ApiResponse { Success = false, Message = "Invalid username or password" });
        }

        if (user.LockedUntil.HasValue && user.LockedUntil > DateTime.UtcNow)
        {
            _logger.LogWarning("Login failed for user {Username}: account locked until {LockedUntil}. (Actor: {Actor}, Action: {Action}, Target: {Target}, Result: {Result}, Timestamp: {Timestamp})",
                request.Username, user.LockedUntil, user.Username, "Login", "Session", "LockedOut", DateTime.UtcNow);
            return Unauthorized(new ApiResponse { Success = false, Message = "Account is temporarily locked" });
        }

        var hash = HashPassword(request.Password, user.Salt);
        if (hash != user.PasswordHash)
        {
            user.FailedLoginAttempts++;
            if (user.FailedLoginAttempts >= 5)
            {
                user.LockedUntil = DateTime.UtcNow.AddMinutes(15);
                _logger.LogWarning("Account {Username} locked after {Attempts} failed attempts. (Actor: {Actor}, Action: {Action}, Target: {Target}, Result: {Result}, Timestamp: {Timestamp})",
                    request.Username, user.FailedLoginAttempts, request.Username, "Login", "Session", "LockedOut", DateTime.UtcNow);
            }
            else
            {
                _logger.LogWarning("Login failed for user {Username}: incorrect password. (Actor: {Actor}, Action: {Action}, Target: {Target}, Result: {Result}, Timestamp: {Timestamp})",
                    request.Username, request.Username, "Login", "Session", "Failed", DateTime.UtcNow);
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

        var ipAddress = HttpContext?.Connection?.RemoteIpAddress?.ToString() ?? "127.0.0.1";
        _logger.LogInformation("User {Username} logged in from {IpAddress}. (Actor: {Actor}, Action: {Action}, Target: {Target}, Result: {Result}, Timestamp: {Timestamp})",
            user.Username, ipAddress, user.Username, "Login", "Session", "Success", DateTime.UtcNow);

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
                MustChangePassword = user.MustChangePassword,
                LastLogin = user.LastLogin,
            },
            MustChangePassword = user.MustChangePassword,
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
            MustChangePassword = user.MustChangePassword,
            LastLogin = user.LastLogin,
        });
    }

    [HttpPost("change-password")]
    [Authorize]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userId == null || !Guid.TryParse(userId, out var id))
            return Unauthorized();

        var user = await _db.Users.FindAsync(id);
        if (user == null)
            return Unauthorized();

        var actor = user.Username;

        if (request.NewPassword != request.NewPasswordConfirmation)
        {
            _logger.LogWarning("Password change failed for user {Username}: Passwords do not match. (Actor: {Actor}, Action: {Action}, Target: {Target}, Result: {Result}, Timestamp: {Timestamp})",
                user.Username, actor, "ChangePassword", "UserAccount", "Failed", DateTime.UtcNow);
            return BadRequest(new ApiResponse { Success = false, Message = "Passwords do not match" });
        }

        if (request.NewPassword.Length < 8)
        {
            _logger.LogWarning("Password change failed for user {Username}: Password too short. (Actor: {Actor}, Action: {Action}, Target: {Target}, Result: {Result}, Timestamp: {Timestamp})",
                user.Username, actor, "ChangePassword", "UserAccount", "Failed", DateTime.UtcNow);
            return BadRequest(new ApiResponse { Success = false, Message = "Password must be at least 8 characters" });
        }

        var currentHash = HashPassword(request.CurrentPassword, user.Salt);
        if (currentHash != user.PasswordHash)
        {
            _logger.LogWarning("Password change failed for user {Username}: Current password incorrect. (Actor: {Actor}, Action: {Action}, Target: {Target}, Result: {Result}, Timestamp: {Timestamp})",
                user.Username, actor, "ChangePassword", "UserAccount", "Failed", DateTime.UtcNow);
            return BadRequest(new ApiResponse { Success = false, Message = "Current password is incorrect" });
        }

        var newSalt = GenerateSalt();
        user.Salt = newSalt;
        user.PasswordHash = HashPassword(request.NewPassword, newSalt);
        user.MustChangePassword = false;
        user.PasswordChangedAt = DateTime.UtcNow;
        user.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        _logger.LogInformation("User {Username} successfully changed password. (Actor: {Actor}, Action: {Action}, Target: {Target}, Result: {Result}, Timestamp: {Timestamp})",
            user.Username, actor, "ChangePassword", "UserAccount", "Success", DateTime.UtcNow);

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
                MustChangePassword = u.MustChangePassword,
                LastLogin = u.LastLogin,
            })
            .ToListAsync();

        return Ok(users);
    }

    [HttpPost("users")]
    [Authorize(Policy = "SuperAdmin")]
    public async Task<IActionResult> CreateUser([FromBody] CreateUserRequest request)
    {
        var actor = User.Identity?.Name ?? "Unknown";

        if (request.Password != request.PasswordConfirmation)
        {
            _logger.LogWarning("User creation failed by {Actor}: Passwords do not match. (Actor: {Actor}, Action: {Action}, Target: {Target}, Result: {Result}, Timestamp: {Timestamp})",
                actor, actor, "CreateUser", request.Username, "Failed", DateTime.UtcNow);
            return BadRequest(new ApiResponse { Success = false, Message = "Passwords do not match" });
        }

        if (request.Password.Length < 8)
        {
            _logger.LogWarning("User creation failed by {Actor}: Password too short. (Actor: {Actor}, Action: {Action}, Target: {Target}, Result: {Result}, Timestamp: {Timestamp})",
                actor, actor, "CreateUser", request.Username, "Failed", DateTime.UtcNow);
            return BadRequest(new ApiResponse { Success = false, Message = "Password must be at least 8 characters" });
        }

        if (await _db.Users.AnyAsync(u => u.Username == request.Username))
        {
            _logger.LogWarning("User creation failed by {Actor}: Username {Username} already exists. (Actor: {Actor}, Action: {Action}, Target: {Target}, Result: {Result}, Timestamp: {Timestamp})",
                actor, request.Username, actor, "CreateUser", request.Username, "Conflict", DateTime.UtcNow);
            return Conflict(new ApiResponse { Success = false, Message = "Username already exists" });
        }

        if (!Enum.TryParse<UserRole>(request.Role, ignoreCase: true, out var role))
        {
            _logger.LogWarning("User creation failed by {Actor}: Invalid role {Role}. (Actor: {Actor}, Action: {Action}, Target: {Target}, Result: {Result}, Timestamp: {Timestamp})",
                actor, request.Role, actor, "CreateUser", request.Username, "Failed", DateTime.UtcNow);
            return BadRequest(new ApiResponse { Success = false, Message = "Invalid role" });
        }

        var salt = GenerateSalt();
        var user = new Domain.Entities.User
        {
            Username = request.Username,
            Email = request.Email,
            PasswordHash = HashPassword(request.Password, salt),
            Salt = salt,
            Role = role,
            IsActive = true,
            MustChangePassword = false,
            CreatedAt = DateTime.UtcNow,
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        _logger.LogInformation("User {Username} created by {Actor}. (Actor: {Actor}, Action: {Action}, Target: {Target}, Result: {Result}, Timestamp: {Timestamp})",
            user.Username, actor, actor, "CreateUser", user.Username, "Success", DateTime.UtcNow);
        return Ok(new ApiResponse { Success = true, Message = $"User '{user.Username}' created" });
    }

    [HttpDelete("users/{id:guid}")]
    [Authorize(Policy = "SuperAdmin")]
    public async Task<IActionResult> DeleteUser(Guid id)
    {
        var actor = User.Identity?.Name ?? "Unknown";
        var user = await _db.Users.FindAsync(id);
        if (user == null)
            return NotFound(new ApiResponse { Success = false, Message = "User not found" });

        if (user.Role == UserRole.SuperAdmin && user.IsActive)
        {
            var activeSuperAdmins = await _db.Users.CountAsync(u => u.Role == UserRole.SuperAdmin && u.IsActive);
            if (activeSuperAdmins <= 1)
            {
                _logger.LogWarning("Attempt to delete last active SuperAdmin {Target} by {Actor} rejected. (Actor: {Actor}, Action: {Action}, Target: {Target}, Result: {Result}, Timestamp: {Timestamp})",
                    user.Username, actor, actor, "DeleteUser", user.Username, "Rejected", DateTime.UtcNow);
                return BadRequest(new ApiResponse { Success = false, Message = "Cannot delete the last remaining active SuperAdmin account" });
            }
        }

        _db.Users.Remove(user);
        await _db.SaveChangesAsync();

        _logger.LogInformation("User {Username} deleted by {Actor}. (Actor: {Actor}, Action: {Action}, Target: {Target}, Result: {Result}, Timestamp: {Timestamp})",
            user.Username, actor, actor, "DeleteUser", user.Username, "Success", DateTime.UtcNow);
        return Ok(new ApiResponse { Success = true, Message = $"User '{user.Username}' deleted" });
    }

    [HttpPut("users/{id:guid}/role")]
    [Authorize(Policy = "SuperAdmin")]
    public async Task<IActionResult> UpdateUserRole(Guid id, [FromBody] string role)
    {
        var actor = User.Identity?.Name ?? "Unknown";
        var user = await _db.Users.FindAsync(id);
        if (user == null)
            return NotFound(new ApiResponse { Success = false, Message = "User not found" });

        if (!Enum.TryParse<UserRole>(role, ignoreCase: true, out var newRole))
            return BadRequest(new ApiResponse { Success = false, Message = "Invalid role" });

        if (user.Role == UserRole.SuperAdmin && user.IsActive && newRole != UserRole.SuperAdmin)
        {
            var activeSuperAdmins = await _db.Users.CountAsync(u => u.Role == UserRole.SuperAdmin && u.IsActive);
            if (activeSuperAdmins <= 1)
            {
                _logger.LogWarning("Attempt to demote last active SuperAdmin {Target} by {Actor} rejected. (Actor: {Actor}, Action: {Action}, Target: {Target}, Result: {Result}, Timestamp: {Timestamp})",
                    user.Username, actor, actor, "UpdateUserRole", user.Username, "Rejected", DateTime.UtcNow);
                return BadRequest(new ApiResponse { Success = false, Message = "Cannot change the role of the last remaining active SuperAdmin account" });
            }
        }

        user.Role = newRole;
        user.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        _logger.LogInformation("User {Username} role changed to {Role} by {Actor}. (Actor: {Actor}, Action: {Action}, Target: {Target}, Result: {Result}, Timestamp: {Timestamp})",
            user.Username, newRole, actor, actor, "UpdateUserRole", user.Username, "Success", DateTime.UtcNow);
        return Ok(new ApiResponse { Success = true, Message = $"User '{user.Username}' role updated to {newRole}" });
    }

    [HttpPut("users/{id:guid}/deactivate")]
    [Authorize(Policy = "SuperAdmin")]
    public async Task<IActionResult> DeactivateUser(Guid id)
    {
        var actor = User.Identity?.Name ?? "Unknown";
        var user = await _db.Users.FindAsync(id);
        if (user == null)
            return NotFound(new ApiResponse { Success = false, Message = "User not found" });

        if (user.Role == UserRole.SuperAdmin && user.IsActive)
        {
            var activeSuperAdmins = await _db.Users.CountAsync(u => u.Role == UserRole.SuperAdmin && u.IsActive);
            if (activeSuperAdmins <= 1)
            {
                _logger.LogWarning("Attempt to deactivate last active SuperAdmin {Target} by {Actor} rejected. (Actor: {Actor}, Action: {Action}, Target: {Target}, Result: {Result}, Timestamp: {Timestamp})",
                    user.Username, actor, actor, "DeactivateUser", user.Username, "Rejected", DateTime.UtcNow);
                return BadRequest(new ApiResponse { Success = false, Message = "Cannot deactivate the last remaining active SuperAdmin account" });
            }
        }

        user.IsActive = false;
        user.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        _logger.LogInformation("User {Username} deactivated by {Actor}. (Actor: {Actor}, Action: {Action}, Target: {Target}, Result: {Result}, Timestamp: {Timestamp})",
            user.Username, actor, actor, "DeactivateUser", user.Username, "Success", DateTime.UtcNow);
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
