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

public enum ActivationType
{
    KMS,
    MAK,
    ADBA,
    Unknown,
}

public enum ProductFamily
{
    Windows,
    Office,
    WindowsServer,
    Other,
}
