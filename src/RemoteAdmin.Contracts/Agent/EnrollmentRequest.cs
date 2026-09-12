namespace RemoteAdmin.Contracts.Agent;

public sealed class EnrollmentRequest
{
    public required string Hostname { get; set; }
    public required string EnrollmentToken { get; set; }
    public required string AgentVersion { get; set; }
    public string? IpAddress { get; set; }
    public string? MacAddress { get; set; }
    public string? WindowsEdition { get; set; }
    public string? WindowsVersion { get; set; }
}
