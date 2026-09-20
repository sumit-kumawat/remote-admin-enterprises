using RemoteAdmin.Application.Dtos.Licensing;

namespace RemoteAdmin.Application.Interfaces.Licensing;

public interface IWindowsActivationService
{
    Task<ActivationRecordDto?> GetActivationStatusAsync(Guid endpointId);
    Task<ActivationRecordDto> CheckAndRecordStatusAsync(Guid endpointId, string rawSlmgrDlvOutput, string? rawSlmgrXprOutput = null);
    Task<ActivationRecordDto> ConfigureKmsClientAsync(ConfigureKmsClientDto dto, string requestedBy);
    Task<ActivationRecordDto> TriggerActivationAsync(Guid endpointId, string requestedBy);
}

public interface IOfficeActivationService
{
    Task<ActivationRecordDto?> GetOfficeActivationStatusAsync(Guid endpointId);
    Task<ActivationRecordDto> CheckAndRecordOfficeStatusAsync(Guid endpointId, string rawOsppOutput);
    Task<ActivationRecordDto> ConfigureOfficeKmsHostAsync(ConfigureKmsClientDto dto, string requestedBy);
    Task<ActivationRecordDto> TriggerOfficeActivationAsync(Guid endpointId, string requestedBy);
}
