using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RemoteAdmin.Contracts.Dtos;
using RemoteAdmin.Domain.Entities;
using RemoteAdmin.Infrastructure.Data;

namespace RemoteAdmin.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Policy = "Operator")]
public class PackagesController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IWebHostEnvironment _env;
    private readonly ILogger<PackagesController> _logger;

    public PackagesController(AppDbContext db, IWebHostEnvironment env, ILogger<PackagesController> logger)
    {
        _db = db;
        _env = env;
        _logger = logger;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var packages = await _db.SoftwarePackages
            .AsNoTracking()
            .OrderByDescending(p => p.UploadedAt)
            .ToListAsync();

        return Ok(packages);
    }

    [HttpPost("upload")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> Upload(IFormFile file, [FromForm] string name, [FromForm] string version, [FromForm] string? architecture)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new ApiResponse { Success = false, Message = "File is required" });

        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (ext != ".msi" && ext != ".exe")
            return BadRequest(new ApiResponse { Success = false, Message = "Only .msi and .exe installer packages are allowed" });

        var uploadDir = Path.Combine(_env.ContentRootPath, "uploads", "packages");
        Directory.CreateDirectory(uploadDir);

        var safeFileName = $"{Guid.NewGuid()}_{Path.GetFileName(file.FileName)}";
        var filePath = Path.Combine(uploadDir, safeFileName);

        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        var pkg = new SoftwarePackage
        {
            Name = string.IsNullOrWhiteSpace(name) ? Path.GetFileNameWithoutExtension(file.FileName) : name.Trim(),
            Version = string.IsNullOrWhiteSpace(version) ? "1.0.0" : version.Trim(),
            Architecture = string.IsNullOrWhiteSpace(architecture) ? "x64" : architecture.Trim(),
            FileName = file.FileName,
            FilePath = filePath,
            FileSize = file.Length,
            UploadedAt = DateTime.UtcNow,
        };

        _db.SoftwarePackages.Add(pkg);
        await _db.SaveChangesAsync();

        _logger.LogInformation("Installer package {Name} v{Version} uploaded by {User}", pkg.Name, pkg.Version, User.Identity?.Name);
        return Ok(new ApiResponse<SoftwarePackage> { Success = true, Data = pkg });
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var pkg = await _db.SoftwarePackages.FindAsync(id);
        if (pkg == null)
            return NotFound(new ApiResponse { Success = false, Message = "Package not found" });

        if (System.IO.File.Exists(pkg.FilePath))
        {
            try { System.IO.File.Delete(pkg.FilePath); } catch { }
        }

        _db.SoftwarePackages.Remove(pkg);
        await _db.SaveChangesAsync();

        return Ok(new ApiResponse { Success = true, Message = "Package deleted" });
    }
}
