namespace RemoteAdmin.Domain.Entities;

using RemoteAdmin.Domain.Enums;

public class PerpetualLicense
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public required string LicenseReference { get; set; }
    public ProductFamily ProductFamily { get; set; } = ProductFamily.Windows;
    public required string ProductName { get; set; }
    public string? ProductVersion { get; set; }
    public string? Edition { get; set; }
    public LicenseTerm LicenseTerm { get; set; } = LicenseTerm.Perpetual;
    public LicenseChannel LicenseChannel { get; set; } = LicenseChannel.Volume;
    public ActivationType ActivationType { get; set; } = ActivationType.KMS;
    public string? AgreementReference { get; set; }
    public string? PurchaseReference { get; set; }
    public int EntitlementQuantity { get; set; }
    public int AssignedQuantity { get; set; }
    public int AvailableQuantity { get; set; }
    public int ReservedQuantity { get; set; }
    public DateTime? EffectiveDate { get; set; }
    public DateTime? PurchaseDate { get; set; }
    public DateTime? ExpiryDate { get; set; } // Normally null for perpetual licenses
    public bool IsActive { get; set; } = true;
    public string? Notes { get; set; }
    public string? SupportingDocumentRef { get; set; }
    public string? MaskedKey { get; set; } // e.g. XXXXX-XXXXX-XXXXX-XXXXX-12345
    public string? Site { get; set; }
    public string? Department { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public required string CreatedBy { get; set; }
    public string? UpdatedBy { get; set; }

    public ICollection<LicenseAssignment> Assignments { get; set; } = new List<LicenseAssignment>();
    public ICollection<LicenseEntitlement> Entitlements { get; set; } = new List<LicenseEntitlement>();
}
