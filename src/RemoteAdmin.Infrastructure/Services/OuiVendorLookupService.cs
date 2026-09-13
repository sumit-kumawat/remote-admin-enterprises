using System.Collections.Concurrent;

namespace RemoteAdmin.Infrastructure.Services;

public interface IOuiVendorLookupService
{
    string LookupVendor(string macAddress);
}

public class OuiVendorLookupService : IOuiVendorLookupService
{
    private static readonly ConcurrentDictionary<string, string> OuiDatabase = new(StringComparer.OrdinalIgnoreCase)
    {
        ["00:05:69"] = "VMware, Inc.",
        ["00:0C:29"] = "VMware, Inc.",
        ["00:50:56"] = "VMware, Inc.",
        ["00:15:5D"] = "Microsoft Corporation (Hyper-V)",
        ["00:03:FF"] = "Microsoft Corporation",
        ["00:16:3E"] = "Xen / Red Hat Enterprise",
        ["52:54:00"] = "QEMU / KVM Virtual Machine",
        ["08:00:27"] = "Oracle VirtualBox",
        ["B8:27:EB"] = "Raspberry Pi Foundation",
        ["DC:A6:32"] = "Raspberry Pi Foundation",
        ["E4:5F:01"] = "Raspberry Pi Foundation",
        ["00:1A:11"] = "Cisco Systems",
        ["00:1B:0C"] = "Cisco Systems",
        ["00:22:BD"] = "Cisco Systems",
        ["00:14:22"] = "Dell Inc.",
        ["00:1D:09"] = "Dell Inc.",
        ["00:21:A0"] = "Dell Inc.",
        ["00:11:0A"] = "Hewlett Packard Enterprise",
        ["3C:D9:2B"] = "Hewlett Packard Enterprise",
        ["00:1E:67"] = "Intel Corporation",
        ["00:21:6B"] = "Intel Corporation",
        ["AC:1F:6B"] = "Super Micro Computer, Inc.",
        ["00:25:90"] = "Super Micro Computer, Inc.",
        ["00:1E:C9"] = "Apple, Inc.",
        ["00:23:12"] = "Apple, Inc.",
        ["A4:83:E7"] = "Apple, Inc.",
        ["00:1C:42"] = "Parallels International GmbH",
        ["00:01:42"] = "Cisco Systems",
        ["00:04:96"] = "Extreme Networks",
        ["00:0E:0C"] = "TP-Link Technologies",
        ["00:1F:CE"] = "Netgear Inc.",
        ["00:26:5A"] = "D-Link Corporation",
        ["00:11:32"] = "Synology Incorporated",
        ["00:08:9B"] = "QNAP Systems, Inc.",
    };

    public string LookupVendor(string macAddress)
    {
        if (string.IsNullOrWhiteSpace(macAddress)) return "Unknown Vendor";

        var cleanMac = macAddress.Trim().Replace("-", ":").Replace(".", "").ToUpperInvariant();

        if (cleanMac.Length >= 8 && cleanMac.Contains(':'))
        {
            var prefix = cleanMac[..8];
            if (OuiDatabase.TryGetValue(prefix, out var vendor))
                return vendor;
        }

        if (cleanMac.Length >= 6 && !cleanMac.Contains(':'))
        {
            var formatted = $"{cleanMac[..2]}:{cleanMac[2..4]}:{cleanMac[4..6]}";
            if (OuiDatabase.TryGetValue(formatted, out var vendor))
                return vendor;
        }

        return "Network Device / Standard MAC";
    }
}
