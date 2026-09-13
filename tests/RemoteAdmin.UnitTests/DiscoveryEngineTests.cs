using RemoteAdmin.Infrastructure.Services;
using Xunit;

namespace RemoteAdmin.UnitTests;

public class DiscoveryEngineTests
{
    private readonly IOuiVendorLookupService _ouiService = new OuiVendorLookupService();

    [Theory]
    [InlineData("192.168.100.0/24", 254)]
    [InlineData("10.0.0.0/28", 14)]
    [InlineData("172.16.0.0/23", 510)]
    public void ParseSingleSubnetCidr_ValidCidr_ReturnsCorrectHostList(string cidr, int expectedCount)
    {
        var scanEngine = new DiscoveryScanEngine(null!, null!, _ouiService, null!);
        var hosts = scanEngine.ParseSingleSubnetCidr(cidr);
        Assert.Equal(expectedCount, hosts.Count);
    }

    [Theory]
    [InlineData("192.168.1.0/24, 10.0.0.0/24")] // Multiple subnets
    [InlineData("10.0.0.0/16")] // Exceeds /22 prefix length safety cap
    [InlineData("172.16.0.0/8")] // Multi-subnet /8
    [InlineData("invalid-cidr")]
    public void ParseSingleSubnetCidr_InvalidOrMultiSubnet_ThrowsArgumentException(string cidr)
    {
        var scanEngine = new DiscoveryScanEngine(null!, null!, _ouiService, null!);
        Assert.Throws<ArgumentException>(() => scanEngine.ParseSingleSubnetCidr(cidr));
    }

    [Theory]
    [InlineData("00:50:56:A1:B2:C3", "VMware, Inc.")]
    [InlineData("00:15:5D:12:34:56", "Microsoft Corporation (Hyper-V)")]
    [InlineData("00:16:3E:A8:64:2E", "Xen / Red Hat Enterprise")]
    [InlineData("B8:27:EB:00:11:22", "Raspberry Pi Foundation")]
    [InlineData("99:99:99:99:99:99", "Network Device / Standard MAC")]
    public void OuiVendorLookup_ResolvesCorrectVendorName(string mac, string expectedVendor)
    {
        var vendor = _ouiService.LookupVendor(mac);
        Assert.Equal(expectedVendor, vendor);
    }
}
