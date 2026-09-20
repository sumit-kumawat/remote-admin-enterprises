using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using RemoteAdmin.Application.Dtos.Licensing;
using RemoteAdmin.Application.Interfaces;
using RemoteAdmin.Application.Interfaces.Licensing;
using RemoteAdmin.Domain.Entities;
using RemoteAdmin.Domain.Enums;
using RemoteAdmin.Infrastructure.Data;

namespace RemoteAdmin.Infrastructure.Services.Licensing;

public class OfficeActivationService : IOfficeActivationService
{
    private readonly AppDbContext _db;
    private readonly IAuditLogService _auditLog;
    private readonly ILogger<OfficeActivationService> _logger;

    public OfficeActivationService(AppDbContext db, IAuditLogService auditLog, ILogger<OfficeActivationService> logger)
    {
        _db = db;
        _auditLog = auditLog;
        _logger = logger;
    }

    public async Task<ActivationRecordDto?> GetOfficeActivationStatusAsync(Guid endpointId)
    {
        var record = await _db.ActivationRecords
            .Include(r => r.Endpoint)
            .Include(r => r.KmsHost)
            .AsNoTracking()
            .FirstOrDefaultAsync(r => r.EndpointId == endpointId && r.ProductFamily == ProductFamily.Office);

        if (record == null) return null;

        return MapToDto(record);
    }

    public async Task<ActivationRecordDto> CheckAndRecordOfficeStatusAsync(Guid endpointId, string rawOsppOutput)
    {
        var endpoint = await _db.Endpoints.FirstOrDefaultAsync(e => e.Id == endpointId);
        if (endpoint == null)
        {
            throw new KeyNotFoundException($"Endpoint '{endpointId}' not found.");
        }

        var record = await _db.ActivationRecords
            .FirstOrDefaultAsync(r => r.EndpointId == endpointId && r.ProductFamily == ProductFamily.Office);

        if (record == null)
        {
            record = new ActivationRecord
            {
                EndpointId = endpointId,
                ProductFamily = ProductFamily.Office,
                ProductName = "Microsoft Office",
                CreatedAt = DateTime.UtcNow
            };
            _db.ActivationRecords.Add(record);
        }

        ParseOsppOutput(rawOsppOutput, record);

        record.LastCheckedAt = DateTime.UtcNow;
        record.UpdatedAt = DateTime.UtcNow;
        record.RawOutputLog = rawOsppOutput;

        await _db.SaveChangesAsync();

        await _auditLog.LogAsync("System", "OfficeActivationCheckCompleted", endpoint.Hostname, record.ActivationStatus.ToString(), details: new { endpointId, record.ActivationStatus });

        return MapToDto(record);
    }

    public async Task<ActivationRecordDto> ConfigureOfficeKmsHostAsync(ConfigureKmsClientDto dto, string requestedBy)
    {
        var endpoint = await _db.Endpoints.FirstOrDefaultAsync(e => e.Id == dto.EndpointId);
        if (endpoint == null)
        {
            throw new KeyNotFoundException($"Endpoint '{dto.EndpointId}' not found.");
        }

        await _auditLog.LogAsync(requestedBy, "OfficeKmsConfigurationChanged", endpoint.Hostname, "Success", details: new { dto.EndpointId, dto.KmsHostname, dto.Port });

        var record = await _db.ActivationRecords
            .FirstOrDefaultAsync(r => r.EndpointId == dto.EndpointId && r.ProductFamily == ProductFamily.Office);

        if (record != null)
        {
            record.KmsHostAddress = $"{dto.KmsHostname}:{dto.Port}";
            record.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
        }

        return (await GetOfficeActivationStatusAsync(dto.EndpointId)) ?? new ActivationRecordDto
        {
            EndpointId = dto.EndpointId,
            EndpointHostname = endpoint.Hostname,
            ProductName = "Microsoft Office",
            ProductFamily = ProductFamily.Office,
            ActivationStatus = ActivationStatus.Unknown,
            KmsHostAddress = $"{dto.KmsHostname}:{dto.Port}"
        };
    }

    public async Task<ActivationRecordDto> TriggerOfficeActivationAsync(Guid endpointId, string requestedBy)
    {
        var endpoint = await _db.Endpoints.FirstOrDefaultAsync(e => e.Id == endpointId);
        if (endpoint == null)
        {
            throw new KeyNotFoundException($"Endpoint '{endpointId}' not found.");
        }

        await _auditLog.LogAsync(requestedBy, "OfficeActivationStarted", endpoint.Hostname, "Dispatched", details: new { endpointId });

        return (await GetOfficeActivationStatusAsync(endpointId)) ?? new ActivationRecordDto
        {
            EndpointId = endpointId,
            EndpointHostname = endpoint.Hostname,
            ProductName = "Microsoft Office",
            ProductFamily = ProductFamily.Office,
            ActivationStatus = ActivationStatus.Unknown
        };
    }

    private void ParseOsppOutput(string output, ActivationRecord record)
    {
        if (string.IsNullOrWhiteSpace(output)) return;

        // Product Name / License Name
        var nameMatch = Regex.Match(output, @"LICENSE NAME:\s*(.+)", RegexOptions.IgnoreCase);
        if (nameMatch.Success)
        {
            var name = nameMatch.Groups[1].Value.Trim();
            record.ProductName = name;
            if (name.Contains("2024", StringComparison.OrdinalIgnoreCase) || name.Contains("Office24", StringComparison.OrdinalIgnoreCase))
            {
                record.Edition = "Office LTSC 2024";
            }
            else if (name.Contains("2021", StringComparison.OrdinalIgnoreCase))
            {
                record.Edition = "Office LTSC 2021";
            }
            else
            {
                record.Edition = "Office Volume";
            }

            if (name.Contains("KMS", StringComparison.OrdinalIgnoreCase)) record.ActivationType = ActivationType.KMS;
            else if (name.Contains("MAK", StringComparison.OrdinalIgnoreCase)) record.ActivationType = ActivationType.MAK;
        }

        // License Status
        var statusMatch = Regex.Match(output, @"LICENSE STATUS:\s*(.+)", RegexOptions.IgnoreCase);
        if (statusMatch.Success)
        {
            var statusStr = statusMatch.Groups[1].Value.Trim();
            if (statusStr.Contains("LICENSED", StringComparison.OrdinalIgnoreCase)) record.ActivationStatus = ActivationStatus.Activated;
            else if (statusStr.Contains("GRACE", StringComparison.OrdinalIgnoreCase)) record.ActivationStatus = ActivationStatus.GracePeriod;
            else if (statusStr.Contains("NOTIFICATION", StringComparison.OrdinalIgnoreCase)) record.ActivationStatus = ActivationStatus.Notification;
            else record.ActivationStatus = ActivationStatus.NotActivated;
        }

        // Last 5 characters of product key
        var keyMatch = Regex.Match(output, @"Last 5 characters of installed product key:\s*(.+)", RegexOptions.IgnoreCase);
        if (keyMatch.Success)
        {
            record.PartialProductKey = keyMatch.Groups[1].Value.Trim();
        }

        // KMS Host
        var kmsMatch = Regex.Match(output, @"KMS machine name from DNS:\s*(.+)", RegexOptions.IgnoreCase);
        if (kmsMatch.Success)
        {
            record.KmsHostAddress = kmsMatch.Groups[1].Value.Trim();
        }
    }

    private static ActivationRecordDto MapToDto(ActivationRecord record) => new()
    {
        Id = record.Id,
        EndpointId = record.EndpointId,
        EndpointHostname = record.Endpoint?.Hostname ?? "",
        ProductFamily = record.ProductFamily,
        ProductName = record.ProductName,
        ProductVersion = record.ProductVersion,
        Edition = record.Edition,
        Channel = record.Channel,
        ActivationType = record.ActivationType,
        ActivationStatus = record.ActivationStatus,
        PartialProductKey = record.PartialProductKey,
        KmsHostId = record.KmsHostId,
        KmsHostName = record.KmsHost?.Name,
        KmsHostAddress = record.KmsHostAddress,
        LastCheckedAt = record.LastCheckedAt,
        ActivationExpiry = record.ActivationExpiry,
        FailureReason = record.FailureReason
    };
}
