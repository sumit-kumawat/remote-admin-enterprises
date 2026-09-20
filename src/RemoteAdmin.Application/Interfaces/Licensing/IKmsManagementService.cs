using RemoteAdmin.Application.Dtos.Licensing;

namespace RemoteAdmin.Application.Interfaces.Licensing;

public interface IKmsManagementService
{
    Task<List<KmsHostDto>> GetAllHostsAsync();
    Task<KmsHostDto?> GetHostByIdAsync(Guid id);
    Task<KmsHostDto> CreateHostAsync(CreateKmsHostDto dto, string createdBy);
    Task<KmsHostDto?> UpdateHostAsync(Guid id, UpdateKmsHostDto dto, string updatedBy);
    Task<bool> DeleteHostAsync(Guid id, string deletedBy);
    Task<LicensingOverviewDto> GetOverviewAsync();
}
