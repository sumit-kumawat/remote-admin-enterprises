using RemoteAdmin.Application.Dtos.Licensing;

namespace RemoteAdmin.Application.Interfaces.Licensing;

public interface IActivationWaveService
{
    Task<List<ActivationWaveDto>> GetAllWavesAsync();
    Task<ActivationWaveDto?> GetWaveByIdAsync(Guid id);
    Task<ActivationWaveDto> CreateWaveAsync(CreateActivationWaveDto dto, string createdBy);
    Task<bool> StartWaveAsync(Guid waveId, string requestedBy);
    Task<bool> PauseWaveAsync(Guid waveId, string requestedBy);
    Task<bool> ResumeWaveAsync(Guid waveId, string requestedBy);
    Task<bool> CancelWaveAsync(Guid waveId, string requestedBy);
    Task ProcessNextWaveChunkAsync(Guid waveId, int maxConcurrency = 10);
}
