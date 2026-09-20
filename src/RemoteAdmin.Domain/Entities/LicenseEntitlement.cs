namespace RemoteAdmin.Domain.Entities;

using RemoteAdmin.Domain.Enums;

public class LicenseEntitlement
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid? LicenseId { get; set; }
    public PerpetualLicense? License { get; set; }
    public required string ProductId { get; set; }
    public EntitlementType EntitlementType { get; set; } = EntitlementType.Perpetual;
    public int Quantity { get; set; }
    public int AssignedQuantity { get; set; }
    public int AvailableQuantity { get; set; }
    public int ReservedQuantity { get; set; }
    public string? AgreementReference { get; set; }
    public DateTime? EffectiveDate { get; set; }
    public DateTime? ExpirationDate { get; set; }
    public EntitlementStatus Status { get; set; } = EntitlementStatus.Active;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
