namespace RemoteAdmin.Domain.Entities;

public class EndpointNetworkInterface
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid EndpointId { get; set; }
    public string? AdapterName { get; set; }
    public string? Ipv4Address { get; set; }
    public string? Ipv6Address { get; set; }
    public string? MacAddress { get; set; }
    public string? ConnectionState { get; set; }
    public int? LinkSpeedMbps { get; set; }
    public string? Gateway { get; set; }
    public string? DnsServers { get; set; }

    public Endpoint Endpoint { get; set; } = null!;
}
