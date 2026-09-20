using RemoteAdmin.Application.Dtos.Licensing;

namespace RemoteAdmin.Application.Interfaces.Licensing;

public interface IKmsHealthService
{
    Task<KmsHealthCheckResultDto> CheckHealthAsync(Guid kmsHostId, CancellationToken cancellationToken = default);
    Task<List<KmsHealthCheckResultDto>> CheckAllHostsHealthAsync(CancellationToken cancellationToken = default);
}
