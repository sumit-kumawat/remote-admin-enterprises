namespace RemoteAdmin.Domain.Entities;

public class HardwareInventory
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid EndpointId { get; set; }
    public string? Manufacturer { get; set; }
    public string? Model { get; set; }
    public string? SerialNumber { get; set; }
    public string? BiosVersion { get; set; }
    public string? ProcessorName { get; set; }
    public int? Cores { get; set; }
    public int? LogicalProcessors { get; set; }
    public int? ClockSpeedMhz { get; set; }
    public long? TotalRamMb { get; set; }
    public long? AvailableRamMb { get; set; }
    public string? GpuName { get; set; }
    public string? GpuDriverVersion { get; set; }
    public string? Architecture { get; set; }
    public DateTime? InstallDate { get; set; }
    public DateTime? LastBoot { get; set; }
    public DateTime? CollectedAt { get; set; }

    public Endpoint Endpoint { get; set; } = null!;
    public ICollection<StorageDrive> Drives { get; set; } = [];
}
