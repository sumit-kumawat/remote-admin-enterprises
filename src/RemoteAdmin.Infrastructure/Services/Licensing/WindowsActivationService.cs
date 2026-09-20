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

public class WindowsActivationService : IWindowsActivationService
{
    private readonly AppDbContext _db;
    private readonly IAuditLogService _auditLog;
    private readonly ILogger<WindowsActivationService> _logger;

    public WindowsActivationService(AppDbContext db, IAuditLogService auditLog, ILogger<WindowsActivationService> logger)
    {
        _db = db;
        _auditLog = auditLog;
        _logger = logger;
    }

    public async Task<ActivationRecordDto?> GetActivationStatusAsync(Guid endpointId)
    {
        var record = await _db.ActivationRecords
            .Include(r => r.Endpoint)
            .Include(r => r.KmsHost)
            .AsNoTracking()
            .FirstOrDefaultAsync(r => r.EndpointId == endpointId && (r.ProductFamily == ProductFamily.Windows || r.ProductFamily == ProductFamily.WindowsServer));

        if (record == null) return null;

        return MapToDto(record);
    }

    public async Task<ActivationRecordDto> CheckAndRecordStatusAsync(Guid endpointId, string rawSlmgrDlvOutput, string? rawSlmgrXprOutput = null)
    {
        var endpoint = await _db.Endpoints.FirstOrDefaultAsync(e => e.Id == endpointId);
        if (endpoint == null)
        {
            throw new KeyNotFoundException($"Endpoint '{endpointId}' not found.");
        }

        var record = await _db.ActivationRecords
            .FirstOrDefaultAsync(r => r.EndpointId == endpointId && (r.ProductFamily == ProductFamily.Windows || r.ProductFamily == ProductFamily.WindowsServer));

        if (record == null)
        {
            record = new ActivationRecord
            {
                EndpointId = endpointId,
                ProductFamily = ProductFamily.Windows,
                ProductName = "Windows Operating System",
                CreatedAt = DateTime.UtcNow
            };
            _db.ActivationRecords.Add(record);
        }

        // Parse slmgr /dlv output safely
        ParseSlmgrOutput(rawSlmgrDlvOutput, record);
        if (!string.IsNullOrWhiteSpace(rawSlmgrXprOutput))
        {
            ParseXprOutput(rawSlmgrXprOutput, record);
        }

        record.LastCheckedAt = DateTime.UtcNow;
        record.UpdatedAt = DateTime.UtcNow;
        record.RawOutputLog = rawSlmgrDlvOutput;

        await _db.SaveChangesAsync();

        await _auditLog.LogAsync("System", "ActivationCheckCompleted", endpoint.Hostname, record.ActivationStatus.ToString(), details: new { endpointId, record.ActivationStatus, record.KmsHostAddress });

        return MapToDto(record);
    }

    public async Task<ActivationRecordDto> ConfigureKmsClientAsync(ConfigureKmsClientDto dto, string requestedBy)
    {
        var endpoint = await _db.Endpoints.FirstOrDefaultAsync(e => e.Id == dto.EndpointId);
        if (endpoint == null)
        {
            throw new KeyNotFoundException($"Endpoint '{dto.EndpointId}' not found.");
        }

        await _auditLog.LogAsync(requestedBy, "KmsConfigurationChanged", endpoint.Hostname, "Success", details: new { dto.EndpointId, dto.KmsHostname, dto.Port });

        var record = await _db.ActivationRecords
            .FirstOrDefaultAsync(r => r.EndpointId == dto.EndpointId && (r.ProductFamily == ProductFamily.Windows || r.ProductFamily == ProductFamily.WindowsServer));

        if (record != null)
        {
            record.KmsHostAddress = $"{dto.KmsHostname}:{dto.Port}";
            record.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
        }

        return (await GetActivationStatusAsync(dto.EndpointId)) ?? new ActivationRecordDto
        {
            EndpointId = dto.EndpointId,
            EndpointHostname = endpoint.Hostname,
            ProductName = "Windows Operating System",
            ProductFamily = ProductFamily.Windows,
            ActivationStatus = ActivationStatus.Unknown,
            KmsHostAddress = $"{dto.KmsHostname}:{dto.Port}"
        };
    }

    public async Task<ActivationRecordDto> TriggerActivationAsync(Guid endpointId, string requestedBy)
    {
        var endpoint = await _db.Endpoints.FirstOrDefaultAsync(e => e.Id == endpointId);
        if (endpoint == null)
        {
            throw new KeyNotFoundException($"Endpoint '{endpointId}' not found.");
        }

        await _auditLog.LogAsync(requestedBy, "ActivationStarted", endpoint.Hostname, "Dispatched", details: new { endpointId });

        return (await GetActivationStatusAsync(endpointId)) ?? new ActivationRecordDto
        {
            EndpointId = endpointId,
            EndpointHostname = endpoint.Hostname,
            ProductName = "Windows Operating System",
            ProductFamily = ProductFamily.Windows,
            ActivationStatus = ActivationStatus.Unknown
        };
    }

    private void ParseSlmgrOutput(string output, ActivationRecord record)
    {
        if (string.IsNullOrWhiteSpace(output)) return;

        // Name / Edition
        var nameMatch = Regex.Match(output, @"Name:\s*(.+)", RegexOptions.IgnoreCase);
        if (nameMatch.Success)
        {
            record.ProductName = nameMatch.Groups[1].Value.Trim();
        }

        // License Channel / Description
        var descMatch = Regex.Match(output, @"Description:\s*(.+)", RegexOptions.IgnoreCase);
        if (descMatch.Success)
        {
            var desc = descMatch.Groups[1].Value.Trim();
            record.Channel = desc;
            if (desc.Contains("KMS", StringComparison.OrdinalIgnoreCase)) record.ActivationType = ActivationType.KMS;
            else if (desc.Contains("MAK", StringComparison.OrdinalIgnoreCase)) record.ActivationType = ActivationType.MAK;
            else if (desc.Contains("ADBA", StringComparison.OrdinalIgnoreCase)) record.ActivationType = ActivationType.ADBA;
        }

        // License Status
        var statusMatch = Regex.Match(output, @"License Status:\s*(.+)", RegexOptions.IgnoreCase);
        if (statusMatch.Success)
        {
            var statusStr = statusMatch.Groups[1].Value.Trim();
            if (statusStr.Contains("Licensed", StringComparison.OrdinalIgnoreCase)) record.ActivationStatus = ActivationStatus.Activated;
            else if (statusStr.Contains("Initial grace", StringComparison.OrdinalIgnoreCase)) record.ActivationStatus = ActivationStatus.GracePeriod;
            else if (statusStr.Contains("Notification", StringComparison.OrdinalIgnoreCase)) record.ActivationStatus = ActivationStatus.Notification;
            else if (statusStr.Contains("Unlicensed", StringComparison.OrdinalIgnoreCase)) record.ActivationStatus = ActivationStatus.Unlicensed;
            else record.ActivationStatus = ActivationStatus.NotActivated;
        }

        // Partial Key
        var keyMatch = Regex.Match(output, @"Partial Product Key:\s*(.+)", RegexOptions.IgnoreCase);
        if (keyMatch.Success)
        {
            record.PartialProductKey = keyMatch.Groups[1].Value.Trim();
        }

        // KMS host address
        var kmsMatch = Regex.Match(output, @"KMS machine name from DNS:\s*(.+)", RegexOptions.IgnoreCase);
        if (kmsMatch.Success)
        {
            record.KmsHostAddress = kmsMatch.Groups[1].Value.Trim();
        }
    }

    private void ParseXprOutput(string output, ActivationRecord record)
    {
        if (string.IsNullOrWhiteSpace(output)) return;
        if (output.Contains("permanently activated", StringComparison.OrdinalIgnoreCase))
        {
            record.ActivationExpiry = null;
        }
        else
        {
            var dateMatch = Regex.Match(output, @"will expire\s+(.+)", RegexOptions.IgnoreCase);
            if (dateMatch.Success && DateTime.TryParse(dateMatch.Groups[1].Value.Trim(), out var exp))
            {
                record.ActivationExpiry = exp;
            }
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
