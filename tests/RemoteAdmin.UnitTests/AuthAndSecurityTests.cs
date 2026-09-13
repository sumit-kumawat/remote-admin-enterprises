using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using RemoteAdmin.Api.Controllers;
using RemoteAdmin.Api.Middleware;
using RemoteAdmin.Contracts.Dtos;
using RemoteAdmin.Domain.Entities;
using RemoteAdmin.Domain.Enums;
using RemoteAdmin.Infrastructure.Data;
using Xunit;

namespace RemoteAdmin.UnitTests;

public class AuthAndSecurityTests
{
    private static AppDbContext GetInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        return new AppDbContext(options);
    }

    private static IConfiguration GetTestConfig()
    {
        var inMemorySettings = new Dictionary<string, string?>
        {
            { "Jwt:Key", "A-VERY-LONG-TEST-SECRET-KEY-THAT-IS-AT-LEAST-64-CHARACTERS-LONG-FOR-HMACSHA256" },
            { "Jwt:Issuer", "TestIssuer" },
            { "Jwt:Audience", "TestAudience" },
            { "Jwt:ExpiryMinutes", "60" }
        };
        return new ConfigurationBuilder().AddInMemoryCollection(inMemorySettings).Build();
    }

    [Fact]
    public async Task Seeding_WhenNoSuperAdminExists_CreatesBootstrapAdminWithMustChangePasswordTrue()
    {
        using var db = GetInMemoryDbContext();
        Assert.False(await db.Users.AnyAsync(u => u.Role == UserRole.SuperAdmin));

        var salt = AuthController.GenerateSalt();
        var hash = AuthController.HashPassword("Adm1n@123", salt);
        db.Users.Add(new User
        {
            Username = "admin",
            Email = "hello@sumitkumawat.com",
            PasswordHash = hash,
            Salt = salt,
            Role = UserRole.SuperAdmin,
            IsActive = true,
            MustChangePassword = true,
            PasswordChangedAt = null,
            CreatedAt = DateTime.UtcNow
        });
        await db.SaveChangesAsync();

        var adminUser = await db.Users.FirstOrDefaultAsync(u => u.Username == "admin");
        Assert.NotNull(adminUser);
        Assert.Equal(UserRole.SuperAdmin, adminUser.Role);
        Assert.True(adminUser.MustChangePassword);
        Assert.Null(adminUser.PasswordChangedAt);
    }

    [Fact]
    public async Task Login_WithBootstrapAccount_ReturnsMustChangePasswordTrue()
    {
        using var db = GetInMemoryDbContext();
        var config = GetTestConfig();
        var controller = new AuthController(db, config, NullLogger<AuthController>.Instance);

        var salt = AuthController.GenerateSalt();
        var hash = AuthController.HashPassword("Adm1n@123", salt);
        db.Users.Add(new User
        {
            Username = "admin",
            PasswordHash = hash,
            Salt = salt,
            Role = UserRole.SuperAdmin,
            IsActive = true,
            MustChangePassword = true
        });
        await db.SaveChangesAsync();

        var result = await controller.Login(new LoginRequest { Username = "admin", Password = "Adm1n@123" });
        var okResult = Assert.IsType<OkObjectResult>(result);
        var response = Assert.IsType<LoginResponse>(okResult.Value);

        Assert.True(response.MustChangePassword);
        Assert.True(response.User.MustChangePassword);
    }

    [Fact]
    public async Task ChangePassword_ValidCredentials_UpdatesMustChangePasswordAndTimestamp()
    {
        using var db = GetInMemoryDbContext();
        var config = GetTestConfig();

        var salt = AuthController.GenerateSalt();
        var hash = AuthController.HashPassword("Adm1n@123", salt);
        var user = new User
        {
            Username = "admin",
            PasswordHash = hash,
            Salt = salt,
            Role = UserRole.SuperAdmin,
            IsActive = true,
            MustChangePassword = true,
            PasswordChangedAt = null
        };
        db.Users.Add(user);
        await db.SaveChangesAsync();

        var controller = new AuthController(db, config, NullLogger<AuthController>.Instance)
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = new ClaimsPrincipal(new ClaimsIdentity(new[]
                    {
                        new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                        new Claim(ClaimTypes.Name, user.Username),
                        new Claim(ClaimTypes.Role, user.Role.ToString())
                    }, "TestAuth"))
                }
            }
        };

        var result = await controller.ChangePassword(new ChangePasswordRequest
        {
            CurrentPassword = "Adm1n@123",
            NewPassword = "NewSecurePassword123!",
            NewPasswordConfirmation = "NewSecurePassword123!"
        });

        var okResult = Assert.IsType<OkObjectResult>(result);
        var apiResp = Assert.IsType<ApiResponse>(okResult.Value);
        Assert.True(apiResp.Success);

        var updatedUser = await db.Users.FindAsync(user.Id);
        Assert.NotNull(updatedUser);
        Assert.False(updatedUser.MustChangePassword);
        Assert.NotNull(updatedUser.PasswordChangedAt);
    }

    [Fact]
    public async Task LastSuperAdminProtection_CannotDeleteOrDeactivateSoleSuperAdmin()
    {
        using var db = GetInMemoryDbContext();
        var config = GetTestConfig();

        var salt = AuthController.GenerateSalt();
        var hash = AuthController.HashPassword("Adm1n@123", salt);
        var soleAdmin = new User
        {
            Username = "admin",
            PasswordHash = hash,
            Salt = salt,
            Role = UserRole.SuperAdmin,
            IsActive = true
        };
        db.Users.Add(soleAdmin);
        await db.SaveChangesAsync();

        var controller = new AuthController(db, config, NullLogger<AuthController>.Instance)
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = new ClaimsPrincipal(new ClaimsIdentity(new[]
                    {
                        new Claim(ClaimTypes.NameIdentifier, soleAdmin.Id.ToString()),
                        new Claim(ClaimTypes.Name, soleAdmin.Username),
                        new Claim(ClaimTypes.Role, soleAdmin.Role.ToString())
                    }, "TestAuth"))
                }
            }
        };

        // Attempt Delete
        var deleteResult = await controller.DeleteUser(soleAdmin.Id);
        var badDelete = Assert.IsType<BadRequestObjectResult>(deleteResult);
        var deleteResp = Assert.IsType<ApiResponse>(badDelete.Value);
        Assert.False(deleteResp.Success);
        Assert.Contains("last remaining active SuperAdmin", deleteResp.Message);

        // Attempt Deactivate
        var deactResult = await controller.DeactivateUser(soleAdmin.Id);
        var badDeact = Assert.IsType<BadRequestObjectResult>(deactResult);
        var deactResp = Assert.IsType<ApiResponse>(badDeact.Value);
        Assert.False(deactResp.Success);
        Assert.Contains("last remaining active SuperAdmin", deactResp.Message);

        // Attempt Demote
        var roleResult = await controller.UpdateUserRole(soleAdmin.Id, "Admin");
        var badRole = Assert.IsType<BadRequestObjectResult>(roleResult);
        var roleResp = Assert.IsType<ApiResponse>(badRole.Value);
        Assert.False(roleResp.Success);
        Assert.Contains("last remaining active SuperAdmin", roleResp.Message);
    }

    [Fact]
    public async Task Middleware_BlocksProtectedEndpoint_WhenMustChangePasswordIsTrue()
    {
        using var db = GetInMemoryDbContext();
        var salt = AuthController.GenerateSalt();
        var hash = AuthController.HashPassword("Adm1n@123", salt);
        var user = new User
        {
            Username = "admin",
            PasswordHash = hash,
            Salt = salt,
            Role = UserRole.SuperAdmin,
            IsActive = true,
            MustChangePassword = true
        };
        db.Users.Add(user);
        await db.SaveChangesAsync();

        var middleware = new MustChangePasswordMiddleware(
            next: (innerHttpContext) => Task.CompletedTask,
            logger: NullLogger<MustChangePasswordMiddleware>.Instance);

        var httpContext = new DefaultHttpContext();
        httpContext.Request.Path = "/api/Endpoints";
        httpContext.User = new ClaimsPrincipal(new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Name, user.Username)
        }, "Bearer"));

        await middleware.InvokeAsync(httpContext, db);

        Assert.Equal(StatusCodes.Status428PreconditionRequired, httpContext.Response.StatusCode);
    }

    [Fact]
    public async Task Middleware_AllowsExemptEndpoint_WhenMustChangePasswordIsTrue()
    {
        using var db = GetInMemoryDbContext();
        var salt = AuthController.GenerateSalt();
        var hash = AuthController.HashPassword("Adm1n@123", salt);
        var user = new User
        {
            Username = "admin",
            PasswordHash = hash,
            Salt = salt,
            Role = UserRole.SuperAdmin,
            IsActive = true,
            MustChangePassword = true
        };
        db.Users.Add(user);
        await db.SaveChangesAsync();

        bool nextCalled = false;
        var middleware = new MustChangePasswordMiddleware(
            next: (innerHttpContext) =>
            {
                nextCalled = true;
                return Task.CompletedTask;
            },
            logger: NullLogger<MustChangePasswordMiddleware>.Instance);

        var httpContext = new DefaultHttpContext();
        httpContext.Request.Path = "/api/Auth/change-password";
        httpContext.User = new ClaimsPrincipal(new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Name, user.Username)
        }, "Bearer"));

        await middleware.InvokeAsync(httpContext, db);

        Assert.True(nextCalled);
    }
}
