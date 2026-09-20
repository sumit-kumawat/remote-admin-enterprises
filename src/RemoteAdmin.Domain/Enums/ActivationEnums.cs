namespace RemoteAdmin.Domain.Enums;

public enum ActivationStatus
{
    Unknown,
    Activated,
    NotActivated,
    GracePeriod,
    Notification,
    Failed,
    Unlicensed,
}

public enum LicenseTerm
{
    Perpetual,
    Subscription,
    Unknown,
}

public enum LicenseChannel
{
    Volume,
    Retail,
    OEM,
    Unknown,
}

public enum ActivationType
{
    KMS,
    MAK,
    ADBA,
    Retail,
    OEM,
    Volume,
    Unknown,
}

public enum EntitlementType
{
    Perpetual,
    Subscription,
    Evaluation,
    Trial,
    Unknown,
}

public enum EntitlementStatus
{
    Active,
    Suspended,
    Expired,
    Exhausted,
    Cancelled,
    Unknown,
}

public enum AssignmentStatus
{
    Assigned,
    Released,
    Suspended,
    Replaced,
}

public enum LicenseComplianceStatus
{
    Compliant,
    UnderAssigned,
    FullyAssigned,
    OverAssigned,
    Unknown,
}

public enum ProductFamily
{
    Windows,
    Office,
    WindowsServer,
    Other,
}
