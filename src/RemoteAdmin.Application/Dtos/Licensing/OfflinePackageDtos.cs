namespace RemoteAdmin.Application.Dtos.Licensing;

public class OfflinePackageDto
{
    public Guid Id { get; set; }
    public required string PackageId { get; set; }
    public string Version { get; set; } = "1.0";
    public required string CreatedBy { get; set; }
    public required string SourceEnvironment { get; set; }
    public required string TargetEnvironment { get; set; }
    public string SchemaVersion { get; set; } = "v1";
    public required string PackageHash { get; set; }
    public required string Signature { get; set; }
    public string Status { get; set; } = "Exported";
    public string? Description { get; set; }
    public int RecordCount { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? ExpirationDate { get; set; }
    public DateTime? ImportedAt { get; set; }
    public string? ImportedBy { get; set; }
}

public class ExportOfflinePackageRequestDto
{
    public required string TargetEnvironment { get; set; }
    public string? Description { get; set; }
    public bool IncludeKmsHosts { get; set; } = true;
    public bool IncludePolicies { get; set; } = true;
    public bool IncludeActivationRecords { get; set; } = true;
    public int ExpirationDays { get; set; } = 30;
}

public class ImportOfflinePackageRequestDto
{
    public required string PackageJsonContent { get; set; }
}

public class PackageValidationResultDto
{
    public bool IsValid { get; set; }
    public string? PackageId { get; set; }
    public string? Version { get; set; }
    public string? SourceEnvironment { get; set; }
    public int TotalRecords { get; set; }
    public List<string> ValidationErrors { get; set; } = [];
    public List<string> Warnings { get; set; } = [];
}
