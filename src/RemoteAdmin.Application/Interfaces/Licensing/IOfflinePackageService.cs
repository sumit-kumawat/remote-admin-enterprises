using RemoteAdmin.Application.Dtos.Licensing;

namespace RemoteAdmin.Application.Interfaces.Licensing;

public interface IOfflinePackageService
{
    Task<List<OfflinePackageDto>> GetPackageHistoryAsync();
    Task<string> ExportPackageJsonAsync(ExportOfflinePackageRequestDto dto, string exportedBy);
    Task<PackageValidationResultDto> ValidatePackageAsync(string packageJson);
    Task<OfflinePackageDto> ImportPackageAsync(ImportOfflinePackageRequestDto dto, string importedBy);
}
