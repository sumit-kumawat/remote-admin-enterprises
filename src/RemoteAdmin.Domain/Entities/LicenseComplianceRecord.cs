namespace RemoteAdmin.Domain.Entities;

public class LicenseComplianceRecord
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public int TotalEndpoints { get; set; }
    public int WindowsActivatedCount { get; set; }
    public int WindowsUnactivatedCount { get; set; }
    public int OfficeActivatedCount { get; set; }
    public int OfficeUnactivatedCount { get; set; }
    public int KmsHostsTotalCount { get; set; }
    public int KmsHostsOnlineCount { get; set; }
    public decimal CompliancePercentage { get; set; }
    public DateTime CalculatedAt { get; set; } = DateTime.UtcNow;
}
