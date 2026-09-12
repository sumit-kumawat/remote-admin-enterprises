namespace RemoteAdmin.Domain.Entities;

public class StorageDrive
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid HardwareInventoryId { get; set; }
    public string? DriveLetter { get; set; }
    public double? CapacityGb { get; set; }
    public double? FreeSpaceGb { get; set; }
    public double? UsedSpaceGb { get; set; }
    public string? FileSystem { get; set; }
    public string? DiskType { get; set; }

    public HardwareInventory HardwareInventory { get; set; } = null!;
}
