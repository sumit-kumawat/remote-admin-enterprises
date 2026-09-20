namespace RemoteAdmin.Application.Dtos.Licensing;

public class LicensingOverviewDto
{
    public int KmsHostsTotal { get; set; }
    public int KmsHostsHealthy { get; set; }
    public int KmsHostsWarning { get; set; }
    public int KmsHostsOffline { get; set; }

    public int WindowsActivated { get; set; }
    public int WindowsNotActivated { get; set; }
    public int WindowsGracePeriod { get; set; }
    public int WindowsFailed { get; set; }

    public int OfficeActivated { get; set; }
    public int OfficeNotActivated { get; set; }
    public int OfficeGracePeriod { get; set; }
    public int OfficeFailed { get; set; }

    public int TotalEndpointsNeedingAttention { get; set; }
    public decimal CompliancePercentage { get; set; }

    public List<KmsHostDto> TopKmsHosts { get; set; } = [];
    public List<ActivationRecordDto> RecentActivationFailures { get; set; } = [];
}
