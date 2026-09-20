namespace RemoteAdmin.Application.Dtos.Licensing;

using RemoteAdmin.Domain.Enums;

public class PerpetualLicenseDto
{
    public Guid Id { get; set; }
    public required string LicenseReference { get; set; }
    public string ProductFamily { get; set; } = "Windows";
    public required string ProductName { get; set; }
    public string? ProductVersion { get; set; }
    public string? Edition { get; set; }
    public string LicenseTerm { get; set; } = "Perpetual";
    public string LicenseChannel { get; set; } = "Volume";
    public string ActivationType { get; set; } = "KMS";
    public string? AgreementReference { get; set; }
    public string? PurchaseReference { get; set; }
    public int EntitlementQuantity { get; set; }
    public int AssignedQuantity { get; set; }
    public int AvailableQuantity { get; set; }
    public int ReservedQuantity { get; set; }
    public DateTime? EffectiveDate { get; set; }
    public DateTime? PurchaseDate { get; set; }
    public DateTime? ExpiryDate { get; set; }
    public bool IsActive { get; set; } = true;
    public string? Notes { get; set; }
    public string? SupportingDocumentRef { get; set; }
    public string? MaskedKey { get; set; }
    public string? Site { get; set; }
    public string? Department { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public required string CreatedBy { get; set; }
    public string? UpdatedBy { get; set; }
}

public class CreatePerpetualLicenseDto
{
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
    public DateTime? EffectiveDate { get; set; }
    public DateTime? PurchaseDate { get; set; }
    public DateTime? ExpiryDate { get; set; }
    public string? Notes { get; set; }
    public string? SupportingDocumentRef { get; set; }
    public string? MaskedKey { get; set; }
    public string? Site { get; set; }
    public string? Department { get; set; }
}

public class UpdatePerpetualLicenseDto
{
    public string? LicenseReference { get; set; }
    public ProductFamily? ProductFamily { get; set; }
    public string? ProductName { get; set; }
    public string? ProductVersion { get; set; }
    public string? Edition { get; set; }
    public LicenseTerm? LicenseTerm { get; set; }
    public LicenseChannel? LicenseChannel { get; set; }
    public ActivationType? ActivationType { get; set; }
    public string? AgreementReference { get; set; }
    public string? PurchaseReference { get; set; }
    public int? EntitlementQuantity { get; set; }
    public int? ReservedQuantity { get; set; }
    public DateTime? EffectiveDate { get; set; }
    public DateTime? PurchaseDate { get; set; }
    public DateTime? ExpiryDate { get; set; }
    public bool? IsActive { get; set; }
    public string? Notes { get; set; }
    public string? SupportingDocumentRef { get; set; }
    public string? MaskedKey { get; set; }
    public string? Site { get; set; }
    public string? Department { get; set; }
}

public class LicenseEntitlementDto
{
    public Guid Id { get; set; }
    public Guid? LicenseId { get; set; }
    public required string ProductId { get; set; }
    public string EntitlementType { get; set; } = "Perpetual";
    public int Quantity { get; set; }
    public int AssignedQuantity { get; set; }
    public int AvailableQuantity { get; set; }
    public int ReservedQuantity { get; set; }
    public string? AgreementReference { get; set; }
    public DateTime? EffectiveDate { get; set; }
    public DateTime? ExpirationDate { get; set; }
    public string Status { get; set; } = "Active";
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class CreateLicenseEntitlementDto
{
    public Guid? LicenseId { get; set; }
    public required string ProductId { get; set; }
    public EntitlementType EntitlementType { get; set; } = EntitlementType.Perpetual;
    public int Quantity { get; set; }
    public string? AgreementReference { get; set; }
    public DateTime? EffectiveDate { get; set; }
    public DateTime? ExpirationDate { get; set; }
}

public class LicensingProductDto
{
    public Guid Id { get; set; }
    public required string ProductId { get; set; }
    public required string ProductName { get; set; }
    public required string ProductFamily { get; set; }
    public string? Version { get; set; }
    public string? Edition { get; set; }
    public string? Architecture { get; set; }
    public List<string> SupportedActivationTypes { get; set; } = [];
    public List<string> SupportedLicenseTerms { get; set; } = [];
    public bool IsVolumeProduct { get; set; } = true;
    public bool IsPerpetual { get; set; } = true;
    public bool IsActive { get; set; } = true;
}

public class LicenseAssignmentDto
{
    public Guid Id { get; set; }
    public Guid LicenseId { get; set; }
    public string? LicenseReference { get; set; }
    public Guid EndpointId { get; set; }
    public string? EndpointHostname { get; set; }
    public string? EndpointIpAddress { get; set; }
    public string? ProductId { get; set; }
    public string AssignmentStatus { get; set; } = "Assigned";
    public DateTime AssignedAt { get; set; }
    public required string AssignedBy { get; set; }
    public DateTime? ReleasedAt { get; set; }
    public string? ReleasedBy { get; set; }
    public string? Notes { get; set; }
}

public class AssignLicenseRequestDto
{
    public Guid LicenseId { get; set; }
    public Guid EndpointId { get; set; }
    public string? ProductId { get; set; }
    public string? Notes { get; set; }
}

public class ReleaseLicenseRequestDto
{
    public Guid AssignmentId { get; set; }
    public string? Notes { get; set; }
}

public class TransferLicenseRequestDto
{
    public Guid AssignmentId { get; set; }
    public Guid TargetEndpointId { get; set; }
    public string? Notes { get; set; }
}

public class LicenseMatrixRowDto
{
    public string LicenseTerm { get; set; } = "Perpetual";
    public string LicenseChannel { get; set; } = "Volume";
    public string ActivationType { get; set; } = "KMS";
    public string ManagedStatus { get; set; } = "Yes"; // "Yes", "Detect/Report", etc.
    public string MicrosoftGuidance { get; set; } = "Supported for legitimate enterprise volume deployment.";
}

public class PerpetualLicenseComplianceOverviewDto
{
    public int TotalEntitlements { get; set; }
    public int Assigned { get; set; }
    public int Available { get; set; }
    public int Reserved { get; set; }
    public int Unassigned { get; set; }
    public int ComplianceExceptionsCount { get; set; }
    public List<LicenseComplianceAlertDto> Alerts { get; set; } = [];
}

public class LicenseComplianceAlertDto
{
    public Guid Id { get; set; }
    public Guid? LicenseId { get; set; }
    public required string ProductName { get; set; }
    public string ComplianceStatus { get; set; } = "Compliant";
    public int EntitlementCount { get; set; }
    public int DetectedCount { get; set; }
    public int AssignedCount { get; set; }
    public DateTime DetectedAt { get; set; }
    public required string Message { get; set; }
    public bool IsResolved { get; set; }
}
