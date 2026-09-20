using RemoteAdmin.Domain.Enums;

namespace RemoteAdmin.Application.Dtos.Licensing;

public class ActivationRecordDto
{
    public Guid Id { get; set; }
    public Guid EndpointId { get; set; }
    public string EndpointHostname { get; set; } = "";
    public ProductFamily ProductFamily { get; set; }
    public required string ProductName { get; set; }
    public string? ProductVersion { get; set; }
    public string? Edition { get; set; }
    public string? Channel { get; set; }
    public ActivationType ActivationType { get; set; }
    public ActivationStatus ActivationStatus { get; set; }
    public string? PartialProductKey { get; set; }
    public Guid? KmsHostId { get; set; }
    public string? KmsHostName { get; set; }
    public string? KmsHostAddress { get; set; }
    public DateTime? LastCheckedAt { get; set; }
    public DateTime? ActivationExpiry { get; set; }
    public string? FailureReason { get; set; }
}

public class CheckActivationRequestDto
{
    public Guid EndpointId { get; set; }
    public ProductFamily ProductFamily { get; set; } = ProductFamily.Windows;
}

public class ConfigureKmsClientDto
{
    public Guid EndpointId { get; set; }
    public ProductFamily ProductFamily { get; set; } = ProductFamily.Windows;
    public required string KmsHostname { get; set; }
    public int Port { get; set; } = 1688;
    public bool ResetToDefaults { get; set; } = false;
}

public class ActivateClientDto
{
    public Guid EndpointId { get; set; }
    public ProductFamily ProductFamily { get; set; } = ProductFamily.Windows;
}
