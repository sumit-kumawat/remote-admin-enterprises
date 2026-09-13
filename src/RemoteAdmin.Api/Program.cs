using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using RemoteAdmin.Api.Controllers;
using RemoteAdmin.Api.Middleware;
using RemoteAdmin.Domain.Entities;
using RemoteAdmin.Domain.Enums;
using RemoteAdmin.Infrastructure.Data;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

// Serilog
builder.Host.UseSerilog((context, loggerConfig) =>
{
    loggerConfig
        .ReadFrom.Configuration(context.Configuration)
        .Enrich.FromLogContext()
        .Enrich.WithProperty("Application", "RemoteAdmin.Api")
        .WriteTo.Console(outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] {Message:lj}{NewLine}{Exception}")
        .WriteTo.File("logs/api-.log",
            rollingInterval: RollingInterval.Day,
            retainedFileCountLimit: 30,
            outputTemplate: "{Timestamp:yyyy-MM-dd HH:mm:ss.fff zzz} [{Level:u3}] [{CorrelationId}] {Message:lj}{NewLine}{Exception}");
});

// Database Configuration & Validation
var defaultConnectionString = builder.Configuration.GetConnectionString("DefaultConnection");
if (string.IsNullOrWhiteSpace(defaultConnectionString))
{
    Log.Fatal("CRITICAL CONFIGURATION ERROR: Database connection string is missing or uninitialized. Expected configuration key: ConnectionStrings:DefaultConnection");
    throw new InvalidOperationException("CRITICAL CONFIGURATION ERROR: Database connection string is missing or uninitialized. Expected configuration key: ConnectionStrings:DefaultConnection");
}

builder.Services.AddDbContext<AppDbContext>(options =>
{
    options.UseNpgsql(defaultConnectionString, npgsqlOptions =>
        npgsqlOptions.UseQuerySplittingBehavior(QuerySplittingBehavior.SplitQuery));
    options.ConfigureWarnings(w => w.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.RelationalEventId.PendingModelChangesWarning));
});

// Authentication
var jwtKeyRaw = builder.Configuration["Jwt:Key"];
var jwtKey = !string.IsNullOrWhiteSpace(jwtKeyRaw) ? jwtKeyRaw : "CHANGE-THIS-TO-A-LONG-RANDOM-SECRET-KEY-AT-LEAST-64-CHARACTERS-LONG-FOR-PRODUCTION";
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "RemoteAdminEnterprises";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "RemoteAdminEnterprises";

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtIssuer,
            ValidAudience = jwtAudience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
            ClockSkew = TimeSpan.FromMinutes(1),
        };
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var accessToken = context.Request.Query["access_token"];
                var path = context.HttpContext.Request.Path;
                if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs/discovery"))
                {
                    context.Token = accessToken;
                }
                return Task.CompletedTask;
            }
        };
    });

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("SuperAdmin", policy => policy.RequireRole("SuperAdmin"));
    options.AddPolicy("Admin", policy => policy.RequireRole("SuperAdmin", "Admin"));
    options.AddPolicy("Operator", policy => policy.RequireRole("SuperAdmin", "Admin", "Operator"));
    options.AddPolicy("Auditor", policy => policy.RequireRole("SuperAdmin", "Admin", "Auditor"));
    options.AddPolicy("Viewer", policy => policy.RequireRole("SuperAdmin", "Admin", "Operator", "Auditor", "Viewer"));
});

// CORS
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(corsBuilder =>
    {
        corsBuilder
            .SetIsOriginAllowed(_ => true)
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

// Controllers & Swagger
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
    });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Remote Admin Enterprises API",
        Version = "v1.0",
        Description = "Enterprise Windows Endpoint Management Platform",
        Contact = new OpenApiContact
        {
            Name = "Sumit Kumawat",
            Email = "hello@sumitkumawat.com",
            Url = new Uri("https://www.sumitkumawat.com"),
        },
    });
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        Description = "JWT Authorization header using the Bearer scheme.",
    });
    options.AddSecurityRequirement(document => new OpenApiSecurityRequirement
    {
        [new OpenApiSecuritySchemeReference("Bearer", document)] = [],
    });
});

// SignalR & Discovery Engine Services
builder.Services.AddSignalR();
builder.Services.AddSingleton<RemoteAdmin.Infrastructure.Services.IOuiVendorLookupService, RemoteAdmin.Infrastructure.Services.OuiVendorLookupService>();
builder.Services.AddSingleton<RemoteAdmin.Infrastructure.Services.IDiscoveryScanEngine, RemoteAdmin.Infrastructure.Services.DiscoveryScanEngine>();
builder.Services.AddSingleton<RemoteAdmin.Application.Interfaces.IDiscoveryHubNotifier, RemoteAdmin.Api.Hubs.DiscoveryHubNotifier>();

// Windows Management Service
builder.Services.AddScoped<RemoteAdmin.Application.Interfaces.IWindowsManagementService, RemoteAdmin.Infrastructure.Services.WindowsManagementService>();

// Health Checks
builder.Services.AddHealthChecks()
    .AddDbContextCheck<AppDbContext>("database");

var app = builder.Build();

// Security headers
app.Use(async (context, next) =>
{
    context.Response.Headers["X-Content-Type-Options"] = "nosniff";
    context.Response.Headers["X-Frame-Options"] = "SAMEORIGIN";
    context.Response.Headers["Referrer-Policy"] = "strict-origin-when-cross-origin";
    context.Response.Headers["X-XSS-Protection"] = "1; mode=block";
    if (!app.Environment.IsDevelopment())
    {
        context.Response.Headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains";
    }
    await next();
});

app.UseCors();
app.UseAuthentication();
app.UseAuthorization();
app.UseMiddleware<MustChangePasswordMiddleware>();

app.UseSwagger();
app.UseSwaggerUI(options =>
{
    options.SwaggerEndpoint("/swagger/v1/swagger.json", "Remote Admin Enterprises API v1.0");
    options.DocumentTitle = "Remote Admin Enterprises — API";
    options.RoutePrefix = "swagger";
});

app.UseDefaultFiles();
app.UseStaticFiles();

app.MapControllers();
app.MapHub<RemoteAdmin.Api.Hubs.DiscoveryHub>("/hubs/discovery");
app.MapHealthChecks("/health");
app.MapGet("/", () => Results.Redirect("/swagger"));
app.MapGet("/api", () => Results.Redirect("/swagger"));

app.MapFallbackToFile("index.html");

// Auto-migrate and seed default SuperAdmin if none exists
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

    try
    {
        await db.Database.MigrateAsync();
        Log.Information("Database migrations verified and applied successfully.");
    }
    catch (Exception ex)
    {
        Log.Fatal(ex, "CRITICAL ERROR: Failed to apply database migrations.");
        throw;
    }

    var hasSuperAdmin = await db.Users.AnyAsync(u => u.Role == UserRole.SuperAdmin);
    if (!hasSuperAdmin)
    {
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
            CreatedAt = DateTime.UtcNow,
        });
        await db.SaveChangesAsync();
        Log.Information("[AUTH BOOTSTRAP] Default SuperAdmin account created (Username: admin). Password change required on first login.");
    }
    else
    {
        Log.Information("[AUTH BOOTSTRAP] SuperAdmin account exists; skipping bootstrap user creation.");
    }
}

app.Lifetime.ApplicationStarted.Register(() =>
{
    Log.Information("Remote Admin Enterprises API v1.0 listening on {Urls}", string.Join(", ", app.Urls));
});

await app.RunAsync();
