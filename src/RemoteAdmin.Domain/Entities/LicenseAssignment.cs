namespace RemoteAdmin.Domain.Entities;

using RemoteAdmin.Domain.Enums;

public class LicenseAssignment
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid LicenseId { get; set; }
    public PerpetualLicense? License { get; set; }
    public Guid EndpointId { get; set; }
    public Endpoint? Endpoint { get; set; }
    public string? ProductId { get; set; }
    public AssignmentStatus AssignmentStatus { get; set; } = AssignmentStatus.Assigned;
    public DateTime AssignedAt { get; set; } = DateTime.UtcNow;
    public required string AssignedBy { get; set; }
    public DateTime? ReleasedAt { get; set; }
    public string? ReleasedBy { get; set; }
    public string? Notes { get; set; }
}
