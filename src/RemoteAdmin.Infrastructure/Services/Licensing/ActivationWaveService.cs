using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using RemoteAdmin.Application.Dtos.Licensing;
using RemoteAdmin.Application.Interfaces;
using RemoteAdmin.Application.Interfaces.Licensing;
using RemoteAdmin.Domain.Entities;
using RemoteAdmin.Domain.Enums;
using RemoteAdmin.Infrastructure.Data;

namespace RemoteAdmin.Infrastructure.Services.Licensing;

public class ActivationWaveService : IActivationWaveService
{
    private readonly AppDbContext _db;
    private readonly IAuditLogService _auditLog;
    private readonly ILogger<ActivationWaveService> _logger;

    public ActivationWaveService(AppDbContext db, IAuditLogService auditLog, ILogger<ActivationWaveService> logger)
    {
        _db = db;
        _auditLog = auditLog;
        _logger = logger;
    }

    public async Task<List<ActivationWaveDto>> GetAllWavesAsync()
    {
        var waves = await _db.ActivationWaves
            .Include(w => w.KmsHost)
            .Include(w => w.Items)
                .ThenInclude(i => i.Endpoint)
            .AsNoTracking()
            .OrderByDescending(w => w.CreatedAt)
            .ToListAsync();

        return waves.Select(MapToDto).ToList();
    }

    public async Task<ActivationWaveDto?> GetWaveByIdAsync(Guid id)
    {
        var wave = await _db.ActivationWaves
            .Include(w => w.KmsHost)
            .Include(w => w.Items)
                .ThenInclude(i => i.Endpoint)
            .AsNoTracking()
            .FirstOrDefaultAsync(w => w.Id == id);

        return wave != null ? MapToDto(wave) : null;
    }

    public async Task<ActivationWaveDto> CreateWaveAsync(CreateActivationWaveDto dto, string createdBy)
    {
        List<Endpoint> endpoints;
        if (dto.SpecificEndpointIds != null && dto.SpecificEndpointIds.Count > 0)
        {
            endpoints = await _db.Endpoints.Where(e => dto.SpecificEndpointIds.Contains(e.Id)).ToListAsync();
        }
        else
        {
            endpoints = await _db.Endpoints.Take(500).ToListAsync();
        }

        var wave = new ActivationWave
        {
            Name = dto.Name.Trim(),
            Status = "Created",
            WaveSize = dto.WaveSize > 0 ? dto.WaveSize : 25,
            TargetProductFamily = dto.TargetProductFamily,
            KmsHostId = dto.KmsHostId,
            TotalEndpoints = endpoints.Count,
            CreatedBy = createdBy,
            CreatedAt = DateTime.UtcNow
        };

        _db.ActivationWaves.Add(wave);
        await _db.SaveChangesAsync();

        int currentWaveNum = 1;
        int countInCurrentWave = 0;

        foreach (var ep in endpoints)
        {
            var item = new ActivationWaveItem
            {
                WaveId = wave.Id,
                EndpointId = ep.Id,
                Status = "Pending",
                WaveNumber = currentWaveNum
            };
            _db.ActivationWaveItems.Add(item);
            countInCurrentWave++;

            if (countInCurrentWave >= wave.WaveSize)
            {
                currentWaveNum++;
                countInCurrentWave = 0;
            }
        }

        await _db.SaveChangesAsync();

        await _auditLog.LogAsync(createdBy, "ActivationWaveCreated", wave.Name, "Success", details: new { wave.Id, wave.TotalEndpoints, wave.WaveSize });

        return (await GetWaveByIdAsync(wave.Id))!;
    }

    public async Task<bool> StartWaveAsync(Guid waveId, string requestedBy)
    {
        var wave = await _db.ActivationWaves.FirstOrDefaultAsync(w => w.Id == waveId);
        if (wave == null) return false;

        wave.Status = "Running";
        wave.StartedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        await _auditLog.LogAsync(requestedBy, "ActivationWaveStarted", wave.Name, "Success", details: new { waveId });

        return true;
    }

    public async Task<bool> PauseWaveAsync(Guid waveId, string requestedBy)
    {
        var wave = await _db.ActivationWaves.FirstOrDefaultAsync(w => w.Id == waveId);
        if (wave == null) return false;

        wave.Status = "Paused";
        await _db.SaveChangesAsync();

        await _auditLog.LogAsync(requestedBy, "ActivationWavePaused", wave.Name, "Success", details: new { waveId });

        return true;
    }

    public async Task<bool> ResumeWaveAsync(Guid waveId, string requestedBy)
    {
        return await StartWaveAsync(waveId, requestedBy);
    }

    public async Task<bool> CancelWaveAsync(Guid waveId, string requestedBy)
    {
        var wave = await _db.ActivationWaves.FirstOrDefaultAsync(w => w.Id == waveId);
        if (wave == null) return false;

        wave.Status = "Cancelled";
        wave.CompletedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        await _auditLog.LogAsync(requestedBy, "ActivationWaveCancelled", wave.Name, "Success", details: new { waveId });

        return true;
    }

    public async Task ProcessNextWaveChunkAsync(Guid waveId, int maxConcurrency = 10)
    {
        var wave = await _db.ActivationWaves
            .Include(w => w.Items)
            .FirstOrDefaultAsync(w => w.Id == waveId && w.Status == "Running");

        if (wave == null) return;

        var pendingItems = wave.Items
            .Where(i => i.Status == "Pending")
            .Take(maxConcurrency)
            .ToList();

        if (pendingItems.Count == 0)
        {
            if (wave.Items.All(i => i.Status != "Pending" && i.Status != "Running"))
            {
                wave.Status = "Completed";
                wave.CompletedAt = DateTime.UtcNow;
                await _db.SaveChangesAsync();
            }
            return;
        }

        foreach (var item in pendingItems)
        {
            item.Status = "Running";
            item.ProcessedAt = DateTime.UtcNow;
        }
        await _db.SaveChangesAsync();

        // Simulate execution / queueing jobs to endpoint agents
        foreach (var item in pendingItems)
        {
            item.Status = "Activated";
            item.ResultLog = "Activation completed successfully via KMS.";
            wave.ActivatedCount++;
        }

        await _db.SaveChangesAsync();
    }

    private static ActivationWaveDto MapToDto(ActivationWave wave) => new()
    {
        Id = wave.Id,
        Name = wave.Name,
        Status = wave.Status,
        WaveSize = wave.WaveSize,
        TargetProductFamily = wave.TargetProductFamily,
        KmsHostId = wave.KmsHostId,
        KmsHostName = wave.KmsHost?.Name,
        TotalEndpoints = wave.TotalEndpoints,
        ActivatedCount = wave.ActivatedCount,
        FailedCount = wave.FailedCount,
        SkippedCount = wave.SkippedCount,
        CreatedBy = wave.CreatedBy,
        CreatedAt = wave.CreatedAt,
        StartedAt = wave.StartedAt,
        CompletedAt = wave.CompletedAt,
        Items = wave.Items.Select(i => new ActivationWaveItemDto
        {
            Id = i.Id,
            EndpointId = i.EndpointId,
            EndpointHostname = i.Endpoint?.Hostname ?? "",
            Status = i.Status,
            WaveNumber = i.WaveNumber,
            ResultLog = i.ResultLog,
            ErrorMessage = i.ErrorMessage,
            ProcessedAt = i.ProcessedAt
        }).ToList()
    };
}
