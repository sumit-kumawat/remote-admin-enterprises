using RemoteAdmin.Contracts.Dtos;
using RemoteAdmin.Domain.Entities;

namespace RemoteAdmin.Infrastructure.Services;

public interface IDiscoveryScanEngine
{
    Task<DiscoveryScan> StartScanAsync(CreateScanRequest request, string createdBy, CancellationToken cancellationToken = default);
    Task PauseScanAsync(Guid scanId);
    Task ResumeScanAsync(Guid scanId);
    Task CancelScanAsync(Guid scanId);
    List<string> ParseSingleSubnetCidr(string cidr);
    List<SubnetInfoDto> GetLocalSubnets();
}
