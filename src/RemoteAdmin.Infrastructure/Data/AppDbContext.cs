using Microsoft.EntityFrameworkCore;
using RemoteAdmin.Domain.Entities;

namespace RemoteAdmin.Infrastructure.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Endpoint> Endpoints => Set<Endpoint>();
    public DbSet<AgentIdentity> AgentIdentities => Set<AgentIdentity>();
    public DbSet<EndpointGroup> EndpointGroups => Set<EndpointGroup>();
    public DbSet<HardwareInventory> HardwareInventories => Set<HardwareInventory>();
    public DbSet<StorageDrive> StorageDrives => Set<StorageDrive>();
    public DbSet<EndpointNetworkInterface> EndpointNetworkInterfaces => Set<EndpointNetworkInterface>();
    public DbSet<SoftwareInventoryItem> SoftwareInventoryItems => Set<SoftwareInventoryItem>();
    public DbSet<DeploymentJob> DeploymentJobs => Set<DeploymentJob>();
    public DbSet<AuditEvent> AuditEvents => Set<AuditEvent>();
    public DbSet<CredentialProfile> CredentialProfiles => Set<CredentialProfile>();
    public DbSet<DiscoveryResult> DiscoveryResults => Set<DiscoveryResult>();
    public DbSet<SoftwarePackage> SoftwarePackages => Set<SoftwarePackage>();
    public DbSet<BulkOperation> BulkOperations => Set<BulkOperation>();
    public DbSet<BulkOperationItem> BulkOperationItems => Set<BulkOperationItem>();
    public DbSet<DiscoveryScan> DiscoveryScans => Set<DiscoveryScan>();
    public DbSet<DiscoveryHost> DiscoveryHosts => Set<DiscoveryHost>();
    public DbSet<DiscoveryScanEvent> DiscoveryScanEvents => Set<DiscoveryScanEvent>();
    public DbSet<DiscoverySchedule> DiscoverySchedules => Set<DiscoverySchedule>();
    public DbSet<KmsHost> KmsHosts => Set<KmsHost>();
    public DbSet<ActivationRecord> ActivationRecords => Set<ActivationRecord>();
    public DbSet<ActivationPolicy> ActivationPolicies => Set<ActivationPolicy>();
    public DbSet<ActivationWave> ActivationWaves => Set<ActivationWave>();
    public DbSet<ActivationWaveItem> ActivationWaveItems => Set<ActivationWaveItem>();
    public DbSet<OfflineTransferPackage> OfflineTransferPackages => Set<OfflineTransferPackage>();
    public DbSet<LicenseComplianceRecord> LicenseComplianceRecords => Set<LicenseComplianceRecord>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasIndex(e => e.Username).IsUnique();
            entity.Property(e => e.Username).HasMaxLength(100);
            entity.Property(e => e.Email).HasMaxLength(255);
            entity.Property(e => e.Role).HasConversion<string>().HasMaxLength(20);
        });

        modelBuilder.Entity<Endpoint>(entity =>
        {
            entity.HasIndex(e => e.Hostname).IsUnique();
            entity.Property(e => e.Hostname).HasMaxLength(255);
            entity.Property(e => e.Status).HasConversion<string>().HasMaxLength(30);
            entity.Property(e => e.ApprovalStatus).HasConversion<string>().HasMaxLength(30);
            entity.Property(e => e.AuthMode).HasMaxLength(50);
            entity.Property(e => e.AuthStatus).HasMaxLength(50);
            entity.Property(e => e.DeviceType).HasMaxLength(50);
            entity.HasOne(e => e.Group)
                .WithMany(g => g.Endpoints)
                .HasForeignKey(e => e.GroupId)
                .OnDelete(DeleteBehavior.SetNull);
            entity.HasOne(e => e.CredentialProfile)
                .WithMany()
                .HasForeignKey(e => e.CredentialProfileId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<AgentIdentity>(entity =>
        {
            entity.HasIndex(e => e.EndpointId).IsUnique();
            entity.Property(e => e.Status).HasConversion<string>().HasMaxLength(20);
            entity.HasOne(e => e.Endpoint)
                .WithOne(ep => ep.AgentIdentity)
                .HasForeignKey<AgentIdentity>(e => e.EndpointId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<EndpointGroup>(entity =>
        {
            entity.HasIndex(e => e.Name).IsUnique();
            entity.Property(e => e.Name).HasMaxLength(200);
        });

        modelBuilder.Entity<HardwareInventory>(entity =>
        {
            entity.HasIndex(e => e.EndpointId).IsUnique();
            entity.HasOne(e => e.Endpoint)
                .WithOne(ep => ep.HardwareInventory)
                .HasForeignKey<HardwareInventory>(e => e.EndpointId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<StorageDrive>(entity =>
        {
            entity.HasOne(e => e.HardwareInventory)
                .WithMany(h => h.Drives)
                .HasForeignKey(e => e.HardwareInventoryId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<EndpointNetworkInterface>(entity =>
        {
            entity.HasOne(e => e.Endpoint)
                .WithMany(ep => ep.NetworkInterfaces)
                .HasForeignKey(e => e.EndpointId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<SoftwareInventoryItem>(entity =>
        {
            entity.HasOne(e => e.Endpoint)
                .WithMany(ep => ep.SoftwareInventory)
                .HasForeignKey(e => e.EndpointId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<DeploymentJob>(entity =>
        {
            entity.Property(e => e.Status).HasConversion<string>().HasMaxLength(30);
            entity.HasOne(e => e.Endpoint)
                .WithMany()
                .HasForeignKey(e => e.EndpointId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.CreatedByUser)
                .WithMany()
                .HasForeignKey(e => e.CreatedByUserId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<DiscoveryScan>(entity =>
        {
            entity.Property(e => e.Name).HasMaxLength(255);
            entity.Property(e => e.TargetCidr).HasMaxLength(100);
            entity.Property(e => e.ScanType).HasMaxLength(50);
            entity.Property(e => e.Status).HasMaxLength(50);
            entity.Property(e => e.CreatedBy).HasMaxLength(100);
        });

        modelBuilder.Entity<DiscoveryHost>(entity =>
        {
            entity.HasIndex(e => new { e.ScanId, e.IpAddress }).IsUnique();
            entity.Property(e => e.IpAddress).HasMaxLength(100);
            entity.Property(e => e.MacAddress).HasMaxLength(100);
            entity.Property(e => e.Vendor).HasMaxLength(255);
            entity.Property(e => e.Hostname).HasMaxLength(255);
            entity.Property(e => e.OsGuess).HasMaxLength(255);
            entity.Property(e => e.Status).HasMaxLength(50);
            entity.HasOne(e => e.Scan)
                .WithMany(s => s.Hosts)
                .HasForeignKey(e => e.ScanId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.PromotedEndpoint)
                .WithMany()
                .HasForeignKey(e => e.PromotedEndpointId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<DiscoveryScanEvent>(entity =>
        {
            entity.Property(e => e.Severity).HasMaxLength(30);
            entity.HasOne(e => e.Scan)
                .WithMany(s => s.Events)
                .HasForeignKey(e => e.ScanId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.Host)
                .WithMany()
                .HasForeignKey(e => e.HostId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<DiscoverySchedule>(entity =>
        {
            entity.Property(e => e.Name).HasMaxLength(255);
            entity.Property(e => e.CronExpression).HasMaxLength(100);
            entity.Property(e => e.TargetCidr).HasMaxLength(100);
            entity.Property(e => e.CreatedBy).HasMaxLength(100);
        });

        modelBuilder.Entity<KmsHost>(entity =>
        {
            entity.HasIndex(e => e.Hostname).IsUnique();
            entity.Property(e => e.Name).HasMaxLength(200);
            entity.Property(e => e.Hostname).HasMaxLength(255);
            entity.Property(e => e.IpAddress).HasMaxLength(100);
            entity.Property(e => e.Fqdn).HasMaxLength(255);
            entity.Property(e => e.Status).HasConversion<string>().HasMaxLength(30);
            entity.Property(e => e.Environment).HasMaxLength(100);
            entity.Property(e => e.Site).HasMaxLength(100);
        });

        modelBuilder.Entity<ActivationRecord>(entity =>
        {
            entity.HasIndex(e => new { e.EndpointId, e.ProductFamily }).IsUnique();
            entity.Property(e => e.ProductFamily).HasConversion<string>().HasMaxLength(30);
            entity.Property(e => e.ActivationStatus).HasConversion<string>().HasMaxLength(30);
            entity.Property(e => e.ActivationType).HasConversion<string>().HasMaxLength(30);
            entity.Property(e => e.ProductName).HasMaxLength(255);
            entity.Property(e => e.ProductVersion).HasMaxLength(100);
            entity.Property(e => e.Edition).HasMaxLength(100);
            entity.Property(e => e.Channel).HasMaxLength(100);
            entity.Property(e => e.PartialProductKey).HasMaxLength(50);
            entity.HasOne(e => e.Endpoint)
                .WithMany()
                .HasForeignKey(e => e.EndpointId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.KmsHost)
                .WithMany()
                .HasForeignKey(e => e.KmsHostId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<ActivationWave>(entity =>
        {
            entity.Property(e => e.Name).HasMaxLength(200);
            entity.Property(e => e.Status).HasMaxLength(50);
            entity.Property(e => e.TargetProductFamily).HasConversion<string>().HasMaxLength(30);
            entity.HasOne(e => e.KmsHost)
                .WithMany()
                .HasForeignKey(e => e.KmsHostId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<ActivationWaveItem>(entity =>
        {
            entity.Property(e => e.Status).HasMaxLength(50);
            entity.HasOne(e => e.Wave)
                .WithMany(w => w.Items)
                .HasForeignKey(e => e.WaveId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.Endpoint)
                .WithMany()
                .HasForeignKey(e => e.EndpointId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<OfflineTransferPackage>(entity =>
        {
            entity.HasIndex(e => e.PackageId).IsUnique();
            entity.Property(e => e.PackageId).HasMaxLength(100);
            entity.Property(e => e.Status).HasMaxLength(50);
            entity.Property(e => e.PackageHash).HasMaxLength(256);
            entity.Property(e => e.SourceEnvironment).HasMaxLength(100);
            entity.Property(e => e.TargetEnvironment).HasMaxLength(100);
        });
    }
}
