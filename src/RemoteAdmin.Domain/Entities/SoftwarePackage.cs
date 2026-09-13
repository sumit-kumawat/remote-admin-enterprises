namespace RemoteAdmin.Domain.Entities;

public class SoftwarePackage
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public required string Name { get; set; }
    public required string Version { get; set; }
    public string Architecture { get; set; } = "x64";
    public required string FileName { get; set; }
    public required string FilePath { get; set; }
    public long FileSize { get; set; }
    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;
}
