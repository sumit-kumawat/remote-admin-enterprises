using RemoteAdmin.Domain.Enums;

namespace RemoteAdmin.Domain.Entities;

public class Endpoint
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public required string Hostname { get; set; }
    public string? Fqdn { get; set; }
    public string? IpAddress { get; set; }
    public string? MacAddress { get; set; }
    public EndpointStatus Status { get; set; } = EndpointStatus.Unknown;
    public EndpointApprovalStatus ApprovalStatus { get; set; } = EndpointApprovalStatus.PendingApproval;
    public string? Description { get; set; }
    public string? Location { get; set; }
    public Guid? GroupId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public EndpointGroup? Group { get; set; }
    public AgentIdentity? AgentIdentity { get; set; }
    public HardwareInventory? HardwareInventory { get; set; }
    public ICollection<EndpointNetworkInterface> NetworkInterfaces { get; set; } = [];
    public ICollection<SoftwareInventoryItem> SoftwareInventory { get; set; } = [];
}
