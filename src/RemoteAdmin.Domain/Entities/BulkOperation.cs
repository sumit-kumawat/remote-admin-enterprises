namespace RemoteAdmin.Domain.Entities;

public class BulkOperation
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public required string OperationType { get; set; }
    public required string RequestedBy { get; set; }
    public int TotalEndpoints { get; set; }
    public int SuccessCount { get; set; }
    public int FailedCount { get; set; }
    public string Status { get; set; } = "Completed"; // Running | Completed | Failed
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? CompletedAt { get; set; }

    public ICollection<BulkOperationItem> Items { get; set; } = [];
}

public class BulkOperationItem
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid BulkOperationId { get; set; }
    public Guid EndpointId { get; set; }
    public required string EndpointHostname { get; set; }
    public string Status { get; set; } = "Success"; // Success | Failed | Timeout
    public string? ResultMessage { get; set; }
    public DateTime CompletedAt { get; set; } = DateTime.UtcNow;

    public BulkOperation? BulkOperation { get; set; }
}
