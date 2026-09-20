using RemoteAdmin.Domain.Enums;

namespace RemoteAdmin.Domain.Entities;

public class ActivationRecord
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid EndpointId { get; set; }
    public Endpoint? Endpoint { get; set; }
    public ProductFamily ProductFamily { get; set; } = ProductFamily.Windows;
    public required string ProductName { get; set; }
    public string? ProductVersion { get; set; }
    public string? Edition { get; set; }
    public string? Channel { get; set; }
    public ActivationType ActivationType { get; set; } = ActivationType.Unknown;
    public ActivationStatus ActivationStatus { get; set; } = ActivationStatus.Unknown;
    public string? PartialProductKey { get; set; }
    public Guid? KmsHostId { get; set; }
    public KmsHost? KmsHost { get; set; }
    public string? KmsHostAddress { get; set; }
    public DateTime? LastCheckedAt { get; set; }
    public DateTime? ActivationExpiry { get; set; }
    public string? FailureReason { get; set; }
    public string? RawOutputLog { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
