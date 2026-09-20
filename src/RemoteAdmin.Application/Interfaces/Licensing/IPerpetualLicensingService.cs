namespace RemoteAdmin.Application.Interfaces.Licensing;

using RemoteAdmin.Application.Dtos.Licensing;

public interface IPerpetualLicensingService
{
    Task<List<PerpetualLicenseDto>> GetLicensesAsync(string? product = null, string? channel = null, string? search = null);
    Task<PerpetualLicenseDto?> GetLicenseByIdAsync(Guid id);
    Task<PerpetualLicenseDto> CreateLicenseAsync(CreatePerpetualLicenseDto dto, string username);
    Task<PerpetualLicenseDto?> UpdateLicenseAsync(Guid id, UpdatePerpetualLicenseDto dto, string username);
    Task<bool> DeleteLicenseAsync(Guid id, string username);

    Task<List<LicenseAssignmentDto>> GetAssignmentsAsync(Guid? licenseId = null, Guid? endpointId = null);
    Task<LicenseAssignmentDto> AssignLicenseAsync(AssignLicenseRequestDto dto, string username);
    Task<bool> ReleaseLicenseAsync(ReleaseLicenseRequestDto dto, string username);
    Task<LicenseAssignmentDto> TransferLicenseAsync(TransferLicenseRequestDto dto, string username);

    Task<List<LicenseEntitlementDto>> GetEntitlementsAsync();
    Task<LicenseEntitlementDto> CreateEntitlementAsync(CreateLicenseEntitlementDto dto);
    Task<List<LicensingProductDto>> GetProductCatalogAsync();
    Task<PerpetualLicenseComplianceOverviewDto> GetComplianceOverviewAsync();
    Task<List<LicenseMatrixRowDto>> GetLicenseMatrixAsync();
    Task<byte[]> GeneratePerpetualReportCsvAsync();
    Task RunComplianceAuditAsync();
}
