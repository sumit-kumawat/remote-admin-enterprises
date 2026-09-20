using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using RemoteAdmin.Application.Dtos.Licensing;
using RemoteAdmin.Application.Interfaces;
using RemoteAdmin.Application.Interfaces.Licensing;
using RemoteAdmin.Domain.Entities;
using RemoteAdmin.Infrastructure.Data;

namespace RemoteAdmin.Infrastructure.Services.Licensing;

public class OfflinePackageService : IOfflinePackageService
{
    private readonly AppDbContext _db;
    private readonly IAuditLogService _auditLog;
    private readonly IConfiguration _config;
    private readonly ILogger<OfflinePackageService> _logger;

    public OfflinePackageService(AppDbContext db, IAuditLogService auditLog, IConfiguration config, ILogger<OfflinePackageService> logger)
    {
        _db = db;
        _auditLog = auditLog;
        _config = config;
        _logger = logger;
    }

    public async Task<List<OfflinePackageDto>> GetPackageHistoryAsync()
    {
        var pkgs = await _db.OfflineTransferPackages.AsNoTracking().OrderByDescending(p => p.CreatedAt).ToListAsync();
        return pkgs.Select(p => new OfflinePackageDto
        {
            Id = p.Id,
            PackageId = p.PackageId,
            Version = p.Version,
            CreatedBy = p.CreatedBy,
            SourceEnvironment = p.SourceEnvironment,
            TargetEnvironment = p.TargetEnvironment,
            SchemaVersion = p.SchemaVersion,
            PackageHash = p.PackageHash,
            Signature = p.Signature,
            Status = p.Status,
            Description = p.Description,
            RecordCount = p.RecordCount,
            CreatedAt = p.CreatedAt,
            ExpirationDate = p.ExpirationDate,
            ImportedAt = p.ImportedAt,
            ImportedBy = p.ImportedBy
        }).ToList();
    }

    public async Task<string> ExportPackageJsonAsync(ExportOfflinePackageRequestDto dto, string exportedBy)
    {
        var kmsHosts = dto.IncludeKmsHosts ? await _db.KmsHosts.AsNoTracking().ToListAsync() : [];
        var policies = dto.IncludePolicies ? await _db.ActivationPolicies.AsNoTracking().ToListAsync() : [];

        var packageId = $"KMS-PKG-{Guid.NewGuid().ToString()[..8].ToUpper()}";

        var payloadObj = new
        {
            PackageId = packageId,
            Version = "1.0",
            SchemaVersion = "v1",
            SourceEnvironment = "STAGING-ENTERPRISE",
            TargetEnvironment = dto.TargetEnvironment,
            CreatedAt = DateTime.UtcNow,
            ExpirationDate = DateTime.UtcNow.AddDays(dto.ExpirationDays),
            Description = dto.Description,
            ExportedBy = exportedBy,
            KmsHosts = kmsHosts.Select(h => new
            {
                h.Name,
                h.Hostname,
                h.IpAddress,
                h.Fqdn,
                h.Port,
                h.OperatingSystem,
                h.ServerVersion,
                h.Environment,
                h.Site,
                h.Description
            }).ToList(),
            Policies = policies.Select(p => new
            {
                p.Name,
                p.ProductFamily,
                p.AutoActivateOnDiscovery,
                p.RenewalDaysInterval,
                p.Enabled
            }).ToList()
        };

        var payloadElement = JsonSerializer.SerializeToElement(payloadObj);
        var canonicalPayloadJson = payloadElement.GetRawText();
        var hash = ComputeSha256(canonicalPayloadJson);
        var signature = SignPayload(hash);

        var finalPackageObj = new
        {
            Header = new
            {
                PackageId = packageId,
                Version = "1.0",
                SchemaVersion = "v1",
                PackageHash = hash,
                Signature = signature
            },
            Payload = payloadElement
        };

        var fullPackageJson = JsonSerializer.Serialize(finalPackageObj);

        var pkgRecord = new OfflineTransferPackage
        {
            PackageId = packageId,
            Version = "1.0",
            CreatedBy = exportedBy,
            SourceEnvironment = "STAGING-ENTERPRISE",
            TargetEnvironment = dto.TargetEnvironment,
            SchemaVersion = "v1",
            PackageHash = hash,
            Signature = signature,
            Status = "Exported",
            Description = dto.Description,
            RecordCount = kmsHosts.Count + policies.Count,
            PackageJsonData = fullPackageJson,
            CreatedAt = DateTime.UtcNow,
            ExpirationDate = DateTime.UtcNow.AddDays(dto.ExpirationDays)
        };

        _db.OfflineTransferPackages.Add(pkgRecord);
        await _db.SaveChangesAsync();

        await _auditLog.LogAsync(exportedBy, "OfflinePackageExported", packageId, "Success", details: new { packageId, dto.TargetEnvironment, pkgRecord.RecordCount });

        return fullPackageJson;
    }

    public async Task<PackageValidationResultDto> ValidatePackageAsync(string packageJson)
    {
        var result = new PackageValidationResultDto { IsValid = true };
        try
        {
            using var doc = JsonDocument.Parse(packageJson);
            var root = doc.RootElement;

            if (!root.TryGetProperty("Header", out var header) || !root.TryGetProperty("Payload", out var payload))
            {
                result.IsValid = false;
                result.ValidationErrors.Add("Invalid package schema: missing Header or Payload.");
                return result;
            }

            var pkgId = header.GetProperty("PackageId").GetString();
            var hash = header.GetProperty("PackageHash").GetString();
            var sig = header.GetProperty("Signature").GetString();

            result.PackageId = pkgId;

            var payloadElement = JsonSerializer.SerializeToElement(payload);
            var canonicalPayloadJson = payloadElement.GetRawText();
            var computedHash = ComputeSha256(canonicalPayloadJson);

            if (hash != computedHash)
            {
                result.IsValid = false;
                result.ValidationErrors.Add("Cryptographic verification failed: SHA-256 hash mismatch! Package may be tampered.");
                return result;
            }

            if (!VerifySignature(computedHash, sig ?? ""))
            {
                result.IsValid = false;
                result.ValidationErrors.Add("Cryptographic signature verification failed! Package signature is invalid.");
                return result;
            }

            if (payload.TryGetProperty("ExpirationDate", out var expProp) && expProp.TryGetDateTime(out var expDate))
            {
                if (expDate < DateTime.UtcNow)
                {
                    result.IsValid = false;
                    result.ValidationErrors.Add($"Package expired on {expDate:yyyy-MM-dd HH:mm:ss} UTC.");
                    return result;
                }
            }

            int count = 0;
            if (payload.TryGetProperty("KmsHosts", out var hostsArr)) count += hostsArr.GetArrayLength();
            if (payload.TryGetProperty("Policies", out var polArr)) count += polArr.GetArrayLength();

            result.TotalRecords = count;
        }
        catch (Exception ex)
        {
            result.IsValid = false;
            result.ValidationErrors.Add($"JSON parsing exception: {ex.Message}");
        }

        return await Task.FromResult(result);
    }

    public async Task<OfflinePackageDto> ImportPackageAsync(ImportOfflinePackageRequestDto dto, string importedBy)
    {
        var validation = await ValidatePackageAsync(dto.PackageJsonContent);
        if (!validation.IsValid)
        {
            await _auditLog.LogAsync(importedBy, "OfflinePackageRejected", validation.PackageId ?? "Unknown", "Failed", details: new { validation.ValidationErrors });
            throw new InvalidOperationException($"Package import failed: {string.Join("; ", validation.ValidationErrors)}");
        }

        using var doc = JsonDocument.Parse(dto.PackageJsonContent);
        var root = doc.RootElement;
        var header = root.GetProperty("Header");
        var payload = root.GetProperty("Payload");

        var pkgId = header.GetProperty("PackageId").GetString()!;
        var hash = header.GetProperty("PackageHash").GetString()!;
        var sig = header.GetProperty("Signature").GetString()!;

        // Import KmsHosts transactionally
        if (payload.TryGetProperty("KmsHosts", out var hostsArr))
        {
            foreach (var h in hostsArr.EnumerateArray())
            {
                var hostname = h.GetProperty("Hostname").GetString()!;
                var existing = await _db.KmsHosts.FirstOrDefaultAsync(x => x.Hostname == hostname);
                if (existing == null)
                {
                    _db.KmsHosts.Add(new KmsHost
                    {
                        Name = h.GetProperty("Name").GetString()!,
                        Hostname = hostname,
                        IpAddress = h.TryGetProperty("IpAddress", out var ip) ? ip.GetString() : null,
                        Fqdn = h.TryGetProperty("Fqdn", out var fqdn) ? fqdn.GetString() : null,
                        Port = h.TryGetProperty("Port", out var port) ? port.GetInt32() : 1688,
                        OperatingSystem = h.TryGetProperty("OperatingSystem", out var os) ? os.GetString() : null,
                        ServerVersion = h.TryGetProperty("ServerVersion", out var sv) ? sv.GetString() : null,
                        Environment = h.TryGetProperty("Environment", out var env) ? env.GetString() : null,
                        Site = h.TryGetProperty("Site", out var site) ? site.GetString() : null,
                        Description = h.TryGetProperty("Description", out var desc) ? desc.GetString() : null,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    });
                }
            }
        }

        var pkgRecord = new OfflineTransferPackage
        {
            PackageId = pkgId,
            Version = header.GetProperty("Version").GetString() ?? "1.0",
            CreatedBy = payload.TryGetProperty("ExportedBy", out var expBy) ? expBy.GetString()! : "StagingAdmin",
            SourceEnvironment = payload.GetProperty("SourceEnvironment").GetString()!,
            TargetEnvironment = payload.GetProperty("TargetEnvironment").GetString()!,
            SchemaVersion = "v1",
            PackageHash = hash,
            Signature = sig,
            Status = "Imported",
            RecordCount = validation.TotalRecords,
            PackageJsonData = dto.PackageJsonContent,
            CreatedAt = DateTime.UtcNow,
            ImportedAt = DateTime.UtcNow,
            ImportedBy = importedBy
        };

        _db.OfflineTransferPackages.Add(pkgRecord);
        await _db.SaveChangesAsync();

        await _auditLog.LogAsync(importedBy, "OfflinePackageImported", pkgId, "Success", details: new { pkgId, validation.TotalRecords });

        return new OfflinePackageDto
        {
            Id = pkgRecord.Id,
            PackageId = pkgRecord.PackageId,
            Version = pkgRecord.Version,
            CreatedBy = pkgRecord.CreatedBy,
            SourceEnvironment = pkgRecord.SourceEnvironment,
            TargetEnvironment = pkgRecord.TargetEnvironment,
            SchemaVersion = pkgRecord.SchemaVersion,
            PackageHash = pkgRecord.PackageHash,
            Signature = pkgRecord.Signature,
            Status = pkgRecord.Status,
            RecordCount = pkgRecord.RecordCount,
            CreatedAt = pkgRecord.CreatedAt,
            ImportedAt = pkgRecord.ImportedAt,
            ImportedBy = pkgRecord.ImportedBy
        };
    }

    private string ComputeSha256(string input)
    {
        using var sha = SHA256.Create();
        var bytes = sha.ComputeHash(Encoding.UTF8.GetBytes(input));
        return Convert.ToHexString(bytes).ToLower();
    }

    private string SignPayload(string hash)
    {
        var key = _config["Jwt:Key"] ?? "DefaultSuperSecretKeyForOfflinePackageSigning2026";
        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(key));
        var sigBytes = hmac.ComputeHash(Encoding.UTF8.GetBytes(hash));
        return Convert.ToBase64String(sigBytes);
    }

    private bool VerifySignature(string hash, string signature)
    {
        var expectedSig = SignPayload(hash);
        return expectedSig == signature;
    }
}
