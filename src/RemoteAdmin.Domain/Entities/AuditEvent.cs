namespace RemoteAdmin.Domain.Entities;

public class AuditEvent
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    public required string Actor { get; set; }
    public required string Action { get; set; }
    public required string Target { get; set; }
    public required string Result { get; set; }
    public string? IpAddress { get; set; }
    public string? DetailsJson { get; set; }
}
