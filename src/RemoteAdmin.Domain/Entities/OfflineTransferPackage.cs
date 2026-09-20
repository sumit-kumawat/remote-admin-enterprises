namespace RemoteAdmin.Domain.Entities;

public class OfflineTransferPackage
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public required string PackageId { get; set; }
    public string Version { get; set; } = "1.0";
    public required string CreatedBy { get; set; }
    public required string SourceEnvironment { get; set; }
    public required string TargetEnvironment { get; set; }
    public string SchemaVersion { get; set; } = "v1";
    public required string PackageHash { get; set; } // SHA-256
    public required string Signature { get; set; } // Cryptographic signature
    public string Status { get; set; } = "Exported"; // Exported, Verified, Imported, Rejected
    public string? Description { get; set; }
    public int RecordCount { get; set; }
    public string? PackageJsonData { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ExpirationDate { get; set; }
    public DateTime? ImportedAt { get; set; }
    public string? ImportedBy { get; set; }
    public string? RejectionReason { get; set; }
}
