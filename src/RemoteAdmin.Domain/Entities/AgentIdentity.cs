using RemoteAdmin.Domain.Enums;

namespace RemoteAdmin.Domain.Entities;

public class AgentIdentity
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid EndpointId { get; set; }
    public AgentStatus Status { get; set; } = AgentStatus.Unknown;
    public string? AgentVersion { get; set; }
    public string? CertificateThumbprint { get; set; }
    public DateTime? LastHeartbeat { get; set; }
    public DateTime? LastInventory { get; set; }
    public DateTime? LastSuccessfulJob { get; set; }
    public DateTime? LastFailedJob { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Endpoint Endpoint { get; set; } = null!;
}
