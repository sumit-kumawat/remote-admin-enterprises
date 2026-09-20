namespace RemoteAdmin.Domain.Entities;

public class LicensingProduct
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public required string ProductId { get; set; }
    public required string ProductName { get; set; }
    public required string ProductFamily { get; set; }
    public string? Version { get; set; }
    public string? Edition { get; set; }
    public string? Architecture { get; set; }
    public string SupportedActivationTypes { get; set; } = "[\"KMS\",\"MAK\"]";
    public string SupportedLicenseTerms { get; set; } = "[\"Perpetual\"]";
    public bool IsVolumeProduct { get; set; } = true;
    public bool IsPerpetual { get; set; } = true;
    public bool IsActive { get; set; } = true;
}
