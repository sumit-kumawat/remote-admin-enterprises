namespace RemoteAdmin.Contracts.Agent;

public sealed class EnrollmentResponse
{
    public required string EndpointId { get; set; }
    public required string Certificate { get; set; }
    public string? ServerUrl { get; set; }
    public int HeartbeatIntervalSeconds { get; set; } = 60;
    public int InventoryIntervalMinutes { get; set; } = 60;
}
