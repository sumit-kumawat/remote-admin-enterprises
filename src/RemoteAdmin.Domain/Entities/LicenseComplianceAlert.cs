namespace RemoteAdmin.Domain.Entities;

using RemoteAdmin.Domain.Enums;

public class LicenseComplianceAlert
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid? LicenseId { get; set; }
    public PerpetualLicense? License { get; set; }
    public required string ProductName { get; set; }
    public LicenseComplianceStatus ComplianceStatus { get; set; } = LicenseComplianceStatus.Compliant;
    public int EntitlementCount { get; set; }
    public int DetectedCount { get; set; }
    public int AssignedCount { get; set; }
    public DateTime DetectedAt { get; set; } = DateTime.UtcNow;
    public required string Message { get; set; }
    public bool IsResolved { get; set; } = false;
}
