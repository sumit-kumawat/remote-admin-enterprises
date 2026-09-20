using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using RemoteAdmin.Application.Dtos.Licensing;
using RemoteAdmin.Application.Interfaces;
using RemoteAdmin.Application.Interfaces.Licensing;
using RemoteAdmin.Domain.Entities;
using RemoteAdmin.Domain.Enums;
using RemoteAdmin.Infrastructure.Data;

namespace RemoteAdmin.Infrastructure.Services.Licensing;

public class KmsManagementService : IKmsManagementService
{
    private readonly AppDbContext _db;
    private readonly IAuditLogService _auditLog;
    private readonly ILogger<KmsManagementService> _logger;

    public KmsManagementService(AppDbContext db, IAuditLogService auditLog, ILogger<KmsManagementService> logger)
    {
        _db = db;
        _auditLog = auditLog;
        _logger = logger;
    }

    public async Task<List<KmsHostDto>> GetAllHostsAsync()
    {
        var hosts = await _db.KmsHosts.AsNoTracking().ToListAsync();

        var hostIds = hosts.Select(h => h.Id).ToList();
        var activeCounts = await _db.ActivationRecords
            .Where(a => a.KmsHostId != null && hostIds.Contains(a.KmsHostId.Value))
            .GroupBy(a => a.KmsHostId!.Value)
            .Select(g => new { HostId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.HostId, x => x.Count);

        return hosts.Select(h => new KmsHostDto
        {
            Id = h.Id,
            Name = h.Name,
            Hostname = h.Hostname,
            IpAddress = h.IpAddress,
            Fqdn = h.Fqdn,
            Port = h.Port,
            OperatingSystem = h.OperatingSystem,
            ServerVersion = h.ServerVersion,
            Environment = h.Environment,
            Site = h.Site,
            Description = h.Description,
            Status = h.Status,
            LastHealthCheck = h.LastHealthCheck,
            LastSuccessfulActivationCheck = h.LastSuccessfulActivationCheck,
            ResponseLatencyMs = h.ResponseLatencyMs,
            LastErrorMessage = h.LastErrorMessage,
            ActiveEndpointsCount = activeCounts.TryGetValue(h.Id, out var count) ? count : 0,
            CreatedAt = h.CreatedAt
        }).ToList();
    }

    public async Task<KmsHostDto?> GetHostByIdAsync(Guid id)
    {
        var h = await _db.KmsHosts.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id);
        if (h == null) return null;

        var count = await _db.ActivationRecords.CountAsync(a => a.KmsHostId == h.Id);

        return new KmsHostDto
        {
            Id = h.Id,
            Name = h.Name,
            Hostname = h.Hostname,
            IpAddress = h.IpAddress,
            Fqdn = h.Fqdn,
            Port = h.Port,
            OperatingSystem = h.OperatingSystem,
            ServerVersion = h.ServerVersion,
            Environment = h.Environment,
            Site = h.Site,
            Description = h.Description,
            Status = h.Status,
            LastHealthCheck = h.LastHealthCheck,
            LastSuccessfulActivationCheck = h.LastSuccessfulActivationCheck,
            ResponseLatencyMs = h.ResponseLatencyMs,
            LastErrorMessage = h.LastErrorMessage,
            ActiveEndpointsCount = count,
            CreatedAt = h.CreatedAt
        };
    }

    public async Task<KmsHostDto> CreateHostAsync(CreateKmsHostDto dto, string createdBy)
    {
        var entity = new KmsHost
        {
            Name = dto.Name.Trim(),
            Hostname = dto.Hostname.Trim(),
            IpAddress = dto.IpAddress?.Trim(),
            Fqdn = dto.Fqdn?.Trim(),
            Port = dto.Port > 0 ? dto.Port : 1688,
            OperatingSystem = dto.OperatingSystem?.Trim(),
            ServerVersion = dto.ServerVersion?.Trim(),
            Environment = dto.Environment?.Trim(),
            Site = dto.Site?.Trim(),
            Description = dto.Description?.Trim(),
            Status = KmsHostStatus.Unknown,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _db.KmsHosts.Add(entity);
        await _db.SaveChangesAsync();

        await _auditLog.LogAsync(createdBy, "KmsHostCreated", entity.Hostname, "Success", details: new { entity.Id, entity.Name, entity.Hostname, entity.Port });

        return (await GetHostByIdAsync(entity.Id))!;
    }

    public async Task<KmsHostDto?> UpdateHostAsync(Guid id, UpdateKmsHostDto dto, string updatedBy)
    {
        var entity = await _db.KmsHosts.FirstOrDefaultAsync(x => x.Id == id);
        if (entity == null) return null;

        entity.Name = dto.Name.Trim();
        entity.Hostname = dto.Hostname.Trim();
        entity.IpAddress = dto.IpAddress?.Trim();
        entity.Fqdn = dto.Fqdn?.Trim();
        entity.Port = dto.Port > 0 ? dto.Port : 1688;
        entity.OperatingSystem = dto.OperatingSystem?.Trim();
        entity.ServerVersion = dto.ServerVersion?.Trim();
        entity.Environment = dto.Environment?.Trim();
        entity.Site = dto.Site?.Trim();
        entity.Description = dto.Description?.Trim();
        entity.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        await _auditLog.LogAsync(updatedBy, "KmsHostUpdated", entity.Hostname, "Success", details: new { entity.Id, entity.Name, entity.Hostname });

        return await GetHostByIdAsync(id);
    }

    public async Task<bool> DeleteHostAsync(Guid id, string deletedBy)
    {
        var entity = await _db.KmsHosts.FirstOrDefaultAsync(x => x.Id == id);
        if (entity == null) return false;

        _db.KmsHosts.Remove(entity);
        await _db.SaveChangesAsync();

        await _auditLog.LogAsync(deletedBy, "KmsHostDeleted", entity.Hostname, "Success", details: new { entity.Id, entity.Name });

        return true;
    }

    public async Task<LicensingOverviewDto> GetOverviewAsync()
    {
        var hosts = await GetAllHostsAsync();
        var records = await _db.ActivationRecords.AsNoTracking().ToListAsync();

        var winRecords = records.Where(r => r.ProductFamily == ProductFamily.Windows || r.ProductFamily == ProductFamily.WindowsServer).ToList();
        var officeRecords = records.Where(r => r.ProductFamily == ProductFamily.Office).ToList();

        var totalEndpoints = await _db.Endpoints.CountAsync();

        var winActivated = winRecords.Count(r => r.ActivationStatus == ActivationStatus.Activated);
        var winNotActivated = winRecords.Count(r => r.ActivationStatus == ActivationStatus.NotActivated || r.ActivationStatus == ActivationStatus.Unlicensed);
        var winGrace = winRecords.Count(r => r.ActivationStatus == ActivationStatus.GracePeriod || r.ActivationStatus == ActivationStatus.Notification);
        var winFailed = winRecords.Count(r => r.ActivationStatus == ActivationStatus.Failed);

        var officeActivated = officeRecords.Count(r => r.ActivationStatus == ActivationStatus.Activated);
        var officeNotActivated = officeRecords.Count(r => r.ActivationStatus == ActivationStatus.NotActivated || r.ActivationStatus == ActivationStatus.Unlicensed);
        var officeGrace = officeRecords.Count(r => r.ActivationStatus == ActivationStatus.GracePeriod || r.ActivationStatus == ActivationStatus.Notification);
        var officeFailed = officeRecords.Count(r => r.ActivationStatus == ActivationStatus.Failed);

        var failingRecords = records.Where(r => r.ActivationStatus == ActivationStatus.Failed || r.ActivationStatus == ActivationStatus.NotActivated).Take(10).ToList();

        var compliance = totalEndpoints > 0 ? (decimal)winActivated / totalEndpoints * 100 : 0m;

        return new LicensingOverviewDto
        {
            KmsHostsTotal = hosts.Count,
            KmsHostsHealthy = hosts.Count(h => h.Status == KmsHostStatus.Online),
            KmsHostsWarning = hosts.Count(h => h.Status == KmsHostStatus.Warning),
            KmsHostsOffline = hosts.Count(h => h.Status == KmsHostStatus.Offline),
            WindowsActivated = winActivated,
            WindowsNotActivated = winNotActivated,
            WindowsGracePeriod = winGrace,
            WindowsFailed = winFailed,
            OfficeActivated = officeActivated,
            OfficeNotActivated = officeNotActivated,
            OfficeGracePeriod = officeGrace,
            OfficeFailed = officeFailed,
            TotalEndpointsNeedingAttention = winNotActivated + winFailed + officeNotActivated + officeFailed,
            CompliancePercentage = Math.Round(compliance, 1),
            TopKmsHosts = hosts.Take(5).ToList(),
            RecentActivationFailures = failingRecords.Select(r => new ActivationRecordDto
            {
                Id = r.Id,
                EndpointId = r.EndpointId,
                ProductName = r.ProductName,
                ProductFamily = r.ProductFamily,
                ActivationStatus = r.ActivationStatus,
                FailureReason = r.FailureReason,
                LastCheckedAt = r.LastCheckedAt
            }).ToList()
        };
    }
}
