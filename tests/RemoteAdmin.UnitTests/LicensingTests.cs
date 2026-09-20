using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using RemoteAdmin.Domain.Entities;
using RemoteAdmin.Domain.Enums;
using RemoteAdmin.Infrastructure.Data;
using RemoteAdmin.Infrastructure.Services;
using RemoteAdmin.Infrastructure.Services.Licensing;
using Xunit;

namespace RemoteAdmin.UnitTests;

public class LicensingTests
{
    private static AppDbContext GetInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new AppDbContext(options);
    }

    [Fact]
    public async Task WindowsActivationService_ParsesSlmgrOutputCorrectly()
    {
        using var db = GetInMemoryDbContext();
        var endpoint = new Endpoint { Hostname = "PC-TEST-01", IpAddress = "10.0.0.5" };
        db.Endpoints.Add(endpoint);
        await db.SaveChangesAsync();

        var auditLog = new AuditLogService(db, NullLogger<AuditLogService>.Instance);
        var service = new WindowsActivationService(db, auditLog, NullLogger<WindowsActivationService>.Instance);

        var sampleSlmgrOutput = @"
Software licensing service version: 10.0.26100.1
Name: Windows(R), Enterprise edition
Description: Windows(R) Operating System, VOLUME_KMSCLIENT channel
Partial Product Key: 3V66T
License Status: Licensed
KMS machine name from DNS: kms1.domain.local:1688
";

        var result = await service.CheckAndRecordStatusAsync(endpoint.Id, sampleSlmgrOutput);

        Assert.Equal(ActivationStatus.Activated, result.ActivationStatus);
        Assert.Equal(ActivationType.KMS, result.ActivationType);
        Assert.Equal("3V66T", result.PartialProductKey);
        Assert.Equal("kms1.domain.local:1688", result.KmsHostAddress);
    }

    [Fact]
    public async Task OfficeActivationService_ParsesOsppOutputCorrectly()
    {
        using var db = GetInMemoryDbContext();
        var endpoint = new Endpoint { Hostname = "PC-TEST-OFFICE", IpAddress = "10.0.0.6" };
        db.Endpoints.Add(endpoint);
        await db.SaveChangesAsync();

        var auditLog = new AuditLogService(db, NullLogger<AuditLogService>.Instance);
        var service = new OfficeActivationService(db, auditLog, NullLogger<OfficeActivationService>.Instance);

        var sampleOsppOutput = @"
PRODUCT ID: 00466-00000-00000-AA844
LICENSE NAME: Office 24, Office2024ProPlusMSKMS_VL_KMS channel
LICENSE STATUS:  ---LICENSED---
Last 5 characters of installed product key: 3V66T
KMS machine name from DNS: kms1.domain.local:1688
";

        var result = await service.CheckAndRecordOfficeStatusAsync(endpoint.Id, sampleOsppOutput);

        Assert.Equal(ActivationStatus.Activated, result.ActivationStatus);
        Assert.Equal(ActivationType.KMS, result.ActivationType);
        Assert.Equal("Office LTSC 2024", result.Edition);
        Assert.Equal("3V66T", result.PartialProductKey);
    }

    [Fact]
    public async Task OfflinePackageService_ExportsAndValidatesSignedPackage()
    {
        using var db = GetInMemoryDbContext();
        db.KmsHosts.Add(new KmsHost { Name = "KMS-01", Hostname = "kms1.local", Port = 1688 });
        await db.SaveChangesAsync();

        var inMemorySettings = new Dictionary<string, string?>
        {
            {"Jwt:Key", "TestSigningKeyMinimum64CharsForHmacSha256PackageVerificationSecret12345!"}
        };
        IConfiguration config = new ConfigurationBuilder().AddInMemoryCollection(inMemorySettings).Build();

        var auditLog = new AuditLogService(db, NullLogger<AuditLogService>.Instance);
        var service = new OfflinePackageService(db, auditLog, config, NullLogger<OfflinePackageService>.Instance);

        var exportedJson = await service.ExportPackageJsonAsync(new Application.Dtos.Licensing.ExportOfflinePackageRequestDto
        {
            TargetEnvironment = "AIRGAP-PROD",
            Description = "Test Export"
        }, "Admin");

        Assert.False(string.IsNullOrWhiteSpace(exportedJson));

        var validation = await service.ValidatePackageAsync(exportedJson);
        Assert.True(validation.IsValid);
        Assert.Empty(validation.ValidationErrors);
    }

    [Fact]
    public async Task OfflinePackageService_RejectsTamperedPackage()
    {
        using var db = GetInMemoryDbContext();
        var inMemorySettings = new Dictionary<string, string?>
        {
            {"Jwt:Key", "TestSigningKeyMinimum64CharsForHmacSha256PackageVerificationSecret12345!"}
        };
        IConfiguration config = new ConfigurationBuilder().AddInMemoryCollection(inMemorySettings).Build();

        var auditLog = new AuditLogService(db, NullLogger<AuditLogService>.Instance);
        var service = new OfflinePackageService(db, auditLog, config, NullLogger<OfflinePackageService>.Instance);

        var exportedJson = await service.ExportPackageJsonAsync(new Application.Dtos.Licensing.ExportOfflinePackageRequestDto
        {
            TargetEnvironment = "AIRGAP-PROD"
        }, "Admin");

        // Tamper payload JSON
        var tamperedJson = exportedJson.Replace("AIRGAP-PROD", "TAMPERED-ENV");

        var validation = await service.ValidatePackageAsync(tamperedJson);
        Assert.False(validation.IsValid);
        Assert.NotEmpty(validation.ValidationErrors);
    }
}
