using RemoteAdmin.Domain.Enums;

namespace RemoteAdmin.Domain.Entities;

public class ActivationPolicy
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public required string Name { get; set; }
    public ProductFamily ProductFamily { get; set; } = ProductFamily.Windows;
    public Guid? DefaultKmsHostId { get; set; }
    public KmsHost? DefaultKmsHost { get; set; }
    public bool AutoActivateOnDiscovery { get; set; } = false;
    public int RenewalDaysInterval { get; set; } = 7;
    public bool Enabled { get; set; } = true;
    public string? TargetGroupFilter { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
