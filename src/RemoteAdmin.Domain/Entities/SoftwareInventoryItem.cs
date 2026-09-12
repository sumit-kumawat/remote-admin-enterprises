using RemoteAdmin.Domain.Enums;

namespace RemoteAdmin.Domain.Entities;

public class SoftwareInventoryItem
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid EndpointId { get; set; }
    public required string SoftwareName { get; set; }
    public string? Version { get; set; }
    public string? Publisher { get; set; }
    public DateTime? InstallDate { get; set; }
    public SoftwareArchitecture? Architecture { get; set; }
    public string? InstallPath { get; set; }

    public Endpoint Endpoint { get; set; } = null!;
}
