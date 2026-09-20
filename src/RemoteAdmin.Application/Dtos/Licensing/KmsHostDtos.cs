using RemoteAdmin.Domain.Enums;

namespace RemoteAdmin.Application.Dtos.Licensing;

public class KmsHostDto
{
    public Guid Id { get; set; }
    public required string Name { get; set; }
    public required string Hostname { get; set; }
    public string? IpAddress { get; set; }
    public string? Fqdn { get; set; }
    public int Port { get; set; } = 1688;
    public string? OperatingSystem { get; set; }
    public string? ServerVersion { get; set; }
    public string? Environment { get; set; }
    public string? Site { get; set; }
    public string? Description { get; set; }
    public KmsHostStatus Status { get; set; }
    public DateTime? LastHealthCheck { get; set; }
    public DateTime? LastSuccessfulActivationCheck { get; set; }
    public int ResponseLatencyMs { get; set; }
    public string? LastErrorMessage { get; set; }
    public int ActiveEndpointsCount { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateKmsHostDto
{
    public required string Name { get; set; }
    public required string Hostname { get; set; }
    public string? IpAddress { get; set; }
    public string? Fqdn { get; set; }
    public int Port { get; set; } = 1688;
    public string? OperatingSystem { get; set; }
    public string? ServerVersion { get; set; }
    public string? Environment { get; set; }
    public string? Site { get; set; }
    public string? Description { get; set; }
}

public class UpdateKmsHostDto
{
    public required string Name { get; set; }
    public required string Hostname { get; set; }
    public string? IpAddress { get; set; }
    public string? Fqdn { get; set; }
    public int Port { get; set; } = 1688;
    public string? OperatingSystem { get; set; }
    public string? ServerVersion { get; set; }
    public string? Environment { get; set; }
    public string? Site { get; set; }
    public string? Description { get; set; }
}

public class KmsHealthCheckResultDto
{
    public Guid KmsHostId { get; set; }
    public string Hostname { get; set; } = "";
    public KmsHostStatus Status { get; set; }
    public bool DnsResolved { get; set; }
    public bool PortReachable { get; set; }
    public int LatencyMs { get; set; }
    public string? ErrorMessage { get; set; }
    public DateTime CheckedAt { get; set; } = DateTime.UtcNow;
}
