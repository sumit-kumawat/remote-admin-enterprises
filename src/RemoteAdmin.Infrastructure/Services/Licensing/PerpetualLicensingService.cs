namespace RemoteAdmin.Infrastructure.Services.Licensing;

using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using RemoteAdmin.Application.Dtos.Licensing;
using RemoteAdmin.Application.Interfaces;
using RemoteAdmin.Application.Interfaces.Licensing;
using RemoteAdmin.Domain.Entities;
using RemoteAdmin.Domain.Enums;
using RemoteAdmin.Infrastructure.Data;

public class PerpetualLicensingService : IPerpetualLicensingService
{
    private readonly AppDbContext _db;
    private readonly IAuditLogService _auditLog;
    private readonly ILogger<PerpetualLicensingService> _logger;

    public PerpetualLicensingService(
        AppDbContext db,
        IAuditLogService auditLog,
        ILogger<PerpetualLicensingService> logger)
    {
        _db = db;
        _auditLog = auditLog;
        _logger = logger;
    }

    private async Task EnsureCatalogSeededAsync()
    {
        if (!await _db.LicensingProducts.AnyAsync())
        {
            var seedProducts = new List<LicensingProduct>
            {
                new()
                {
                    ProductId = "WIN-10-ENT",
                    ProductName = "Microsoft Windows 10 Enterprise",
                    ProductFamily = "Windows",
                    Version = "22H2",
                    Edition = "Enterprise",
                    Architecture = "x64",
                    SupportedActivationTypes = "[\"KMS\",\"MAK\",\"ADBA\",\"OEM\"]",
                    SupportedLicenseTerms = "[\"Perpetual\",\"Subscription\"]",
                    IsVolumeProduct = true,
                    IsPerpetual = true
                },
                new()
                {
                    ProductId = "WIN-11-ENT",
                    ProductName = "Microsoft Windows 11 Enterprise",
                    ProductFamily = "Windows",
                    Version = "24H2",
                    Edition = "Enterprise",
                    Architecture = "x64",
                    SupportedActivationTypes = "[\"KMS\",\"MAK\",\"ADBA\"]",
                    SupportedLicenseTerms = "[\"Perpetual\",\"Subscription\"]",
                    IsVolumeProduct = true,
                    IsPerpetual = true
                },
                new()
                {
                    ProductId = "WIN-SRV-2022",
                    ProductName = "Windows Server 2022 Datacenter / Standard",
                    ProductFamily = "WindowsServer",
                    Version = "21H2",
                    Edition = "Datacenter",
                    Architecture = "x64",
                    SupportedActivationTypes = "[\"KMS\",\"MAK\",\"ADBA\"]",
                    SupportedLicenseTerms = "[\"Perpetual\"]",
                    IsVolumeProduct = true,
                    IsPerpetual = true
                },
                new()
                {
                    ProductId = "WIN-SRV-2025",
                    ProductName = "Windows Server 2025 Datacenter",
                    ProductFamily = "WindowsServer",
                    Version = "24H2",
                    Edition = "Datacenter",
                    Architecture = "x64",
                    SupportedActivationTypes = "[\"KMS\",\"MAK\",\"ADBA\"]",
                    SupportedLicenseTerms = "[\"Perpetual\"]",
                    IsVolumeProduct = true,
                    IsPerpetual = true
                },
                new()
                {
                    ProductId = "OFFICE-2024-PROPLUS",
                    ProductName = "Office LTSC 2024 Professional Plus",
                    ProductFamily = "Office",
                    Version = "2024",
                    Edition = "Professional Plus",
                    Architecture = "x64",
                    SupportedActivationTypes = "[\"KMS\",\"MAK\"]",
                    SupportedLicenseTerms = "[\"Perpetual\"]",
                    IsVolumeProduct = true,
                    IsPerpetual = true
                },
                new()
                {
                    ProductId = "OFFICE-2024-STD",
                    ProductName = "Office LTSC 2024 Standard",
                    ProductFamily = "Office",
                    Version = "2024",
                    Edition = "Standard",
                    Architecture = "x64",
                    SupportedActivationTypes = "[\"KMS\",\"MAK\"]",
                    SupportedLicenseTerms = "[\"Perpetual\"]",
                    IsVolumeProduct = true,
                    IsPerpetual = true
                }
            };
            _db.LicensingProducts.AddRange(seedProducts);
            await _db.SaveChangesAsync();
        }

        if (!await _db.PerpetualLicenses.AnyAsync())
        {
            var seedLicenses = new List<PerpetualLicense>
            {
                new()
                {
                    LicenseReference = "EA-MSFT-2024-WIN11",
                    ProductFamily = ProductFamily.Windows,
                    ProductName = "Microsoft Windows 11 Enterprise",
                    ProductVersion = "24H2",
                    Edition = "Enterprise",
                    LicenseTerm = LicenseTerm.Perpetual,
                    LicenseChannel = LicenseChannel.Volume,
                    ActivationType = ActivationType.KMS,
                    AgreementReference = "EA-8849201",
                    PurchaseReference = "PO-2024-0012",
                    EntitlementQuantity = 500,
                    AssignedQuantity = 460,
                    AvailableQuantity = 30,
                    ReservedQuantity = 10,
                    EffectiveDate = DateTime.UtcNow.AddMonths(-6),
                    PurchaseDate = DateTime.UtcNow.AddMonths(-6),
                    CreatedBy = "SuperAdmin",
                    Site = "HQ-Primary",
                    Department = "IT Operations"
                },
                new()
                {
                    LicenseReference = "EA-MSFT-2024-OFFICE",
                    ProductFamily = ProductFamily.Office,
                    ProductName = "Office LTSC 2024 Professional Plus",
                    ProductVersion = "2024",
                    Edition = "Professional Plus",
                    LicenseTerm = LicenseTerm.Perpetual,
                    LicenseChannel = LicenseChannel.Volume,
                    ActivationType = ActivationType.KMS,
                    AgreementReference = "EA-8849201",
                    PurchaseReference = "PO-2024-0015",
                    EntitlementQuantity = 500,
                    AssignedQuantity = 463,
                    AvailableQuantity = 37,
                    ReservedQuantity = 0,
                    EffectiveDate = DateTime.UtcNow.AddMonths(-5),
                    PurchaseDate = DateTime.UtcNow.AddMonths(-5),
                    CreatedBy = "SuperAdmin",
                    Site = "HQ-Primary",
                    Department = "Corporate Strategy"
                },
                new()
                {
                    LicenseReference = "SELECT-MSFT-MAK-OFFICE",
                    ProductFamily = ProductFamily.Office,
                    ProductName = "Office LTSC 2024 Standard",
                    ProductVersion = "2024",
                    Edition = "Standard",
                    LicenseTerm = LicenseTerm.Perpetual,
                    LicenseChannel = LicenseChannel.Volume,
                    ActivationType = ActivationType.MAK,
                    AgreementReference = "SELECT-992011",
                    PurchaseReference = "PO-2024-0022",
                    EntitlementQuantity = 50,
                    AssignedQuantity = 42,
                    AvailableQuantity = 8,
                    ReservedQuantity = 0,
                    EffectiveDate = DateTime.UtcNow.AddMonths(-3),
                    PurchaseDate = DateTime.UtcNow.AddMonths(-3),
                    MaskedKey = "XXXXX-XXXXX-XXXXX-XXXXX-39821",
                    CreatedBy = "SuperAdmin",
                    Site = "AirGap-Branch",
                    Department = "Isolated Field Site"
                }
            };

            _db.PerpetualLicenses.AddRange(seedLicenses);
            await _db.SaveChangesAsync();
        }
    }

    public async Task<List<PerpetualLicenseDto>> GetLicensesAsync(string? product = null, string? channel = null, string? search = null)
    {
        await EnsureCatalogSeededAsync();

        var query = _db.PerpetualLicenses.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(product))
        {
            var pLower = product.Trim().ToLower();
            query = query.Where(l => l.ProductName.ToLower().Contains(pLower) || l.ProductFamily.ToString().ToLower() == pLower);
        }

        if (!string.IsNullOrWhiteSpace(channel))
        {
            var cLower = channel.Trim().ToLower();
            query = query.Where(l => l.LicenseChannel.ToString().ToLower() == cLower);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLower();
            query = query.Where(l =>
                l.LicenseReference.ToLower().Contains(term) ||
                l.ProductName.ToLower().Contains(term) ||
                (l.AgreementReference != null && l.AgreementReference.ToLower().Contains(term)) ||
                (l.PurchaseReference != null && l.PurchaseReference.ToLower().Contains(term)));
        }

        var list = await query.OrderByDescending(l => l.CreatedAt).ToListAsync();
        return list.Select(MapToDto).ToList();
    }

    public async Task<PerpetualLicenseDto?> GetLicenseByIdAsync(Guid id)
    {
        var license = await _db.PerpetualLicenses.AsNoTracking().FirstOrDefaultAsync(l => l.Id == id);
        return license == null ? null : MapToDto(license);
    }

    public async Task<PerpetualLicenseDto> CreateLicenseAsync(CreatePerpetualLicenseDto dto, string username)
    {
        await EnsureCatalogSeededAsync();

        string maskedKey = dto.MaskedKey ?? "";
        if (dto.ActivationType == ActivationType.MAK && !string.IsNullOrEmpty(maskedKey) && maskedKey.Length > 5)
        {
            // Ensure complete MAK key is never saved in raw text
            var last5 = maskedKey.Substring(maskedKey.Length - 5);
            maskedKey = $"XXXXX-XXXXX-XXXXX-XXXXX-{last5}";
        }

        var license = new PerpetualLicense
        {
            LicenseReference = dto.LicenseReference.Trim(),
            ProductFamily = dto.ProductFamily,
            ProductName = dto.ProductName.Trim(),
            ProductVersion = dto.ProductVersion?.Trim(),
            Edition = dto.Edition?.Trim(),
            LicenseTerm = dto.LicenseTerm,
            LicenseChannel = dto.LicenseChannel,
            ActivationType = dto.ActivationType,
            AgreementReference = dto.AgreementReference?.Trim(),
            PurchaseReference = dto.PurchaseReference?.Trim(),
            EntitlementQuantity = dto.EntitlementQuantity,
            AssignedQuantity = 0,
            ReservedQuantity = 0,
            AvailableQuantity = dto.EntitlementQuantity,
            EffectiveDate = dto.EffectiveDate ?? DateTime.UtcNow,
            PurchaseDate = dto.PurchaseDate ?? DateTime.UtcNow,
            ExpiryDate = dto.ExpiryDate,
            Notes = dto.Notes?.Trim(),
            SupportingDocumentRef = dto.SupportingDocumentRef?.Trim(),
            MaskedKey = maskedKey,
            Site = dto.Site?.Trim(),
            Department = dto.Department?.Trim(),
            CreatedBy = username,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _db.PerpetualLicenses.Add(license);
        await _db.SaveChangesAsync();

        await _auditLog.LogAsync(
            actor: username,
            action: "PerpetualLicenseCreated",
            target: license.LicenseReference,
            result: "Success",
            details: new
            {
                licenseId = license.Id,
                product = license.ProductName,
                term = license.LicenseTerm.ToString(),
                channel = license.LicenseChannel.ToString(),
                activation = license.ActivationType.ToString(),
                quantity = license.EntitlementQuantity
            });

        return MapToDto(license);
    }

    public async Task<PerpetualLicenseDto?> UpdateLicenseAsync(Guid id, UpdatePerpetualLicenseDto dto, string username)
    {
        var license = await _db.PerpetualLicenses.FirstOrDefaultAsync(l => l.Id == id);
        if (license == null) return null;

        var prev = JsonSerializer.Serialize(MapToDto(license));

        if (!string.IsNullOrWhiteSpace(dto.LicenseReference)) license.LicenseReference = dto.LicenseReference.Trim();
        if (dto.ProductFamily.HasValue) license.ProductFamily = dto.ProductFamily.Value;
        if (!string.IsNullOrWhiteSpace(dto.ProductName)) license.ProductName = dto.ProductName.Trim();
        if (dto.ProductVersion != null) license.ProductVersion = dto.ProductVersion.Trim();
        if (dto.Edition != null) license.Edition = dto.Edition.Trim();
        if (dto.LicenseTerm.HasValue) license.LicenseTerm = dto.LicenseTerm.Value;
        if (dto.LicenseChannel.HasValue) license.LicenseChannel = dto.LicenseChannel.Value;
        if (dto.ActivationType.HasValue) license.ActivationType = dto.ActivationType.Value;
        if (dto.AgreementReference != null) license.AgreementReference = dto.AgreementReference.Trim();
        if (dto.PurchaseReference != null) license.PurchaseReference = dto.PurchaseReference.Trim();
        if (dto.EntitlementQuantity.HasValue)
        {
            license.EntitlementQuantity = dto.EntitlementQuantity.Value;
        }
        if (dto.ReservedQuantity.HasValue)
        {
            license.ReservedQuantity = dto.ReservedQuantity.Value;
        }

        // Recalculate available quantity ensuring assigned + reserved <= entitlement
        license.AvailableQuantity = Math.Max(0, license.EntitlementQuantity - (license.AssignedQuantity + license.ReservedQuantity));
        if (dto.EffectiveDate.HasValue) license.EffectiveDate = dto.EffectiveDate;
        if (dto.PurchaseDate.HasValue) license.PurchaseDate = dto.PurchaseDate;
        if (dto.ExpiryDate.HasValue) license.ExpiryDate = dto.ExpiryDate;
        if (dto.IsActive.HasValue) license.IsActive = dto.IsActive.Value;
        if (dto.Notes != null) license.Notes = dto.Notes.Trim();
        if (dto.Site != null) license.Site = dto.Site.Trim();
        if (dto.Department != null) license.Department = dto.Department.Trim();

        license.UpdatedAt = DateTime.UtcNow;
        license.UpdatedBy = username;

        await _db.SaveChangesAsync();

        await _auditLog.LogAsync(
            actor: username,
            action: "PerpetualLicenseUpdated",
            target: license.LicenseReference,
            result: "Success",
            details: new
            {
                licenseId = license.Id,
                previousState = prev,
                newState = JsonSerializer.Serialize(MapToDto(license))
            });

        return MapToDto(license);
    }

    public async Task<bool> DeleteLicenseAsync(Guid id, string username)
    {
        var license = await _db.PerpetualLicenses.FirstOrDefaultAsync(l => l.Id == id);
        if (license == null) return false;

        var refName = license.LicenseReference;
        var pName = license.ProductName;

        _db.PerpetualLicenses.Remove(license);
        await _db.SaveChangesAsync();

        await _auditLog.LogAsync(
            actor: username,
            action: "PerpetualLicenseDeleted",
            target: refName,
            result: "Success",
            details: new { licenseId = id, productName = pName });

        return true;
    }

    public async Task<List<LicenseAssignmentDto>> GetAssignmentsAsync(Guid? licenseId = null, Guid? endpointId = null)
    {
        var query = _db.LicenseAssignments
            .Include(a => a.License)
            .Include(a => a.Endpoint)
            .AsNoTracking()
            .AsQueryable();

        if (licenseId.HasValue) query = query.Where(a => a.LicenseId == licenseId.Value);
        if (endpointId.HasValue) query = query.Where(a => a.EndpointId == endpointId.Value);

        var list = await query.OrderByDescending(a => a.AssignedAt).ToListAsync();

        return list.Select(a => new LicenseAssignmentDto
        {
            Id = a.Id,
            LicenseId = a.LicenseId,
            LicenseReference = a.License?.LicenseReference,
            EndpointId = a.EndpointId,
            EndpointHostname = a.Endpoint?.Hostname,
            EndpointIpAddress = a.Endpoint?.IpAddress,
            ProductId = a.ProductId,
            AssignmentStatus = a.AssignmentStatus.ToString(),
            AssignedAt = a.AssignedAt,
            AssignedBy = a.AssignedBy,
            ReleasedAt = a.ReleasedAt,
            ReleasedBy = a.ReleasedBy,
            Notes = a.Notes
        }).ToList();
    }

    public async Task<LicenseAssignmentDto> AssignLicenseAsync(AssignLicenseRequestDto dto, string username)
    {
        using var transaction = await _db.Database.BeginTransactionAsync();

        try
        {
            var license = await _db.PerpetualLicenses.FirstOrDefaultAsync(l => l.Id == dto.LicenseId);
            if (license == null)
                throw new InvalidOperationException($"License ID {dto.LicenseId} not found.");

            var endpoint = await _db.Endpoints.FirstOrDefaultAsync(e => e.Id == dto.EndpointId);
            if (endpoint == null)
                throw new InvalidOperationException($"Endpoint ID {dto.EndpointId} not found.");

            // Constraint Check: Assigned + Reserved <= EntitlementQuantity
            if (license.AssignedQuantity + license.ReservedQuantity >= license.EntitlementQuantity)
            {
                throw new InvalidOperationException(
                    $"License entitlement capacity reached for '{license.ProductName}' ({license.AssignedQuantity}/{license.EntitlementQuantity} assigned). Cannot assign additional entitlements.");
            }

            var existingAssignment = await _db.LicenseAssignments
                .FirstOrDefaultAsync(a => a.LicenseId == dto.LicenseId && a.EndpointId == dto.EndpointId && a.AssignmentStatus == AssignmentStatus.Assigned);

            if (existingAssignment != null)
            {
                throw new InvalidOperationException($"Endpoint '{endpoint.Hostname}' is already assigned an active entitlement under license '{license.LicenseReference}'.");
            }

            var assignment = new LicenseAssignment
            {
                LicenseId = license.Id,
                EndpointId = endpoint.Id,
                ProductId = dto.ProductId ?? license.ProductName,
                AssignmentStatus = AssignmentStatus.Assigned,
                AssignedAt = DateTime.UtcNow,
                AssignedBy = username,
                Notes = dto.Notes
            };

            _db.LicenseAssignments.Add(assignment);

            // Update quantities
            license.AssignedQuantity += 1;
            license.AvailableQuantity = Math.Max(0, license.EntitlementQuantity - (license.AssignedQuantity + license.ReservedQuantity));
            license.UpdatedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync();
            await transaction.CommitAsync();

            await _auditLog.LogAsync(
                actor: username,
                action: "LicenseAssigned",
                target: endpoint.Hostname,
                result: "Success",
                details: new
                {
                    assignmentId = assignment.Id,
                    licenseReference = license.LicenseReference,
                    product = license.ProductName,
                    endpointId = endpoint.Id,
                    endpointHostname = endpoint.Hostname
                });

            return new LicenseAssignmentDto
            {
                Id = assignment.Id,
                LicenseId = license.Id,
                LicenseReference = license.LicenseReference,
                EndpointId = endpoint.Id,
                EndpointHostname = endpoint.Hostname,
                EndpointIpAddress = endpoint.IpAddress,
                ProductId = assignment.ProductId,
                AssignmentStatus = assignment.AssignmentStatus.ToString(),
                AssignedAt = assignment.AssignedAt,
                AssignedBy = assignment.AssignedBy,
                Notes = assignment.Notes
            };
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    public async Task<bool> ReleaseLicenseAsync(ReleaseLicenseRequestDto dto, string username)
    {
        using var transaction = await _db.Database.BeginTransactionAsync();

        try
        {
            var assignment = await _db.LicenseAssignments
                .Include(a => a.License)
                .Include(a => a.Endpoint)
                .FirstOrDefaultAsync(a => a.Id == dto.AssignmentId);

            if (assignment == null || assignment.AssignmentStatus != AssignmentStatus.Assigned)
                return false;

            assignment.AssignmentStatus = AssignmentStatus.Released;
            assignment.ReleasedAt = DateTime.UtcNow;
            assignment.ReleasedBy = username;
            if (!string.IsNullOrEmpty(dto.Notes)) assignment.Notes = dto.Notes;

            if (assignment.License != null)
            {
                assignment.License.AssignedQuantity = Math.Max(0, assignment.License.AssignedQuantity - 1);
                assignment.License.AvailableQuantity = Math.Max(0, assignment.License.EntitlementQuantity - (assignment.License.AssignedQuantity + assignment.License.ReservedQuantity));
                assignment.License.UpdatedAt = DateTime.UtcNow;
            }

            await _db.SaveChangesAsync();
            await transaction.CommitAsync();

            await _auditLog.LogAsync(
                actor: username,
                action: "LicenseReleased",
                target: assignment.Endpoint?.Hostname ?? assignment.EndpointId.ToString(),
                result: "Success",
                details: new
                {
                    assignmentId = assignment.Id,
                    licenseReference = assignment.License?.LicenseReference,
                    releasedBy = username
                });

            return true;
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    public async Task<LicenseAssignmentDto> TransferLicenseAsync(TransferLicenseRequestDto dto, string username)
    {
        using var transaction = await _db.Database.BeginTransactionAsync();

        try
        {
            var oldAssignment = await _db.LicenseAssignments
                .Include(a => a.License)
                .Include(a => a.Endpoint)
                .FirstOrDefaultAsync(a => a.Id == dto.AssignmentId);

            if (oldAssignment == null || oldAssignment.License == null)
                throw new InvalidOperationException("Source assignment not found.");

            var newEndpoint = await _db.Endpoints.FirstOrDefaultAsync(e => e.Id == dto.TargetEndpointId);
            if (newEndpoint == null)
                throw new InvalidOperationException("Target endpoint not found.");

            // Mark old assignment as Replaced
            oldAssignment.AssignmentStatus = AssignmentStatus.Replaced;
            oldAssignment.ReleasedAt = DateTime.UtcNow;
            oldAssignment.ReleasedBy = username;

            // Create new assignment
            var newAssignment = new LicenseAssignment
            {
                LicenseId = oldAssignment.LicenseId,
                EndpointId = newEndpoint.Id,
                ProductId = oldAssignment.ProductId,
                AssignmentStatus = AssignmentStatus.Assigned,
                AssignedAt = DateTime.UtcNow,
                AssignedBy = username,
                Notes = $"Transferred from {oldAssignment.Endpoint?.Hostname ?? "previous endpoint"}. {dto.Notes}".Trim()
            };

            _db.LicenseAssignments.Add(newAssignment);
            await _db.SaveChangesAsync();
            await transaction.CommitAsync();

            await _auditLog.LogAsync(
                actor: username,
                action: "LicenseTransferred",
                target: newEndpoint.Hostname,
                result: "Success",
                details: new
                {
                    licenseReference = oldAssignment.License.LicenseReference,
                    fromEndpoint = oldAssignment.Endpoint?.Hostname,
                    toEndpoint = newEndpoint.Hostname
                });

            return new LicenseAssignmentDto
            {
                Id = newAssignment.Id,
                LicenseId = newAssignment.LicenseId,
                LicenseReference = oldAssignment.License.LicenseReference,
                EndpointId = newEndpoint.Id,
                EndpointHostname = newEndpoint.Hostname,
                EndpointIpAddress = newEndpoint.IpAddress,
                ProductId = newAssignment.ProductId,
                AssignmentStatus = newAssignment.AssignmentStatus.ToString(),
                AssignedAt = newAssignment.AssignedAt,
                AssignedBy = newAssignment.AssignedBy,
                Notes = newAssignment.Notes
            };
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    public async Task<List<LicenseEntitlementDto>> GetEntitlementsAsync()
    {
        await EnsureCatalogSeededAsync();

        var entitlements = await _db.LicenseEntitlements.AsNoTracking().ToListAsync();
        if (entitlements.Count == 0)
        {
            var licenses = await _db.PerpetualLicenses.ToListAsync();
            foreach (var l in licenses)
            {
                var ent = new LicenseEntitlement
                {
                    LicenseId = l.Id,
                    ProductId = l.ProductName,
                    EntitlementType = EntitlementType.Perpetual,
                    Quantity = l.EntitlementQuantity,
                    AssignedQuantity = l.AssignedQuantity,
                    AvailableQuantity = l.AvailableQuantity,
                    ReservedQuantity = l.ReservedQuantity,
                    AgreementReference = l.AgreementReference,
                    Status = EntitlementStatus.Active
                };
                _db.LicenseEntitlements.Add(ent);
            }
            await _db.SaveChangesAsync();
            entitlements = await _db.LicenseEntitlements.AsNoTracking().ToListAsync();
        }

        return entitlements.Select(e => new LicenseEntitlementDto
        {
            Id = e.Id,
            LicenseId = e.LicenseId,
            ProductId = e.ProductId,
            EntitlementType = e.EntitlementType.ToString(),
            Quantity = e.Quantity,
            AssignedQuantity = e.AssignedQuantity,
            AvailableQuantity = e.AvailableQuantity,
            ReservedQuantity = e.ReservedQuantity,
            AgreementReference = e.AgreementReference,
            EffectiveDate = e.EffectiveDate,
            ExpirationDate = e.ExpirationDate,
            Status = e.Status.ToString(),
            CreatedAt = e.CreatedAt,
            UpdatedAt = e.UpdatedAt
        }).ToList();
    }

    public async Task<LicenseEntitlementDto> CreateEntitlementAsync(CreateLicenseEntitlementDto dto)
    {
        var entitlement = new LicenseEntitlement
        {
            LicenseId = dto.LicenseId,
            ProductId = dto.ProductId.Trim(),
            EntitlementType = dto.EntitlementType,
            Quantity = dto.Quantity,
            AssignedQuantity = 0,
            AvailableQuantity = dto.Quantity,
            ReservedQuantity = 0,
            AgreementReference = dto.AgreementReference?.Trim(),
            EffectiveDate = dto.EffectiveDate ?? DateTime.UtcNow,
            ExpirationDate = dto.ExpirationDate,
            Status = EntitlementStatus.Active
        };

        _db.LicenseEntitlements.Add(entitlement);
        await _db.SaveChangesAsync();

        return new LicenseEntitlementDto
        {
            Id = entitlement.Id,
            LicenseId = entitlement.LicenseId,
            ProductId = entitlement.ProductId,
            EntitlementType = entitlement.EntitlementType.ToString(),
            Quantity = entitlement.Quantity,
            AssignedQuantity = entitlement.AssignedQuantity,
            AvailableQuantity = entitlement.AvailableQuantity,
            ReservedQuantity = entitlement.ReservedQuantity,
            AgreementReference = entitlement.AgreementReference,
            EffectiveDate = entitlement.EffectiveDate,
            ExpirationDate = entitlement.ExpirationDate,
            Status = entitlement.Status.ToString(),
            CreatedAt = entitlement.CreatedAt,
            UpdatedAt = entitlement.UpdatedAt
        };
    }

    public async Task<List<LicensingProductDto>> GetProductCatalogAsync()
    {
        await EnsureCatalogSeededAsync();

        var products = await _db.LicensingProducts.AsNoTracking().ToListAsync();
        return products.Select(p => new LicensingProductDto
        {
            Id = p.Id,
            ProductId = p.ProductId,
            ProductName = p.ProductName,
            ProductFamily = p.ProductFamily,
            Version = p.Version,
            Edition = p.Edition,
            Architecture = p.Architecture,
            SupportedActivationTypes = JsonSerializer.Deserialize<List<string>>(p.SupportedActivationTypes) ?? [],
            SupportedLicenseTerms = JsonSerializer.Deserialize<List<string>>(p.SupportedLicenseTerms) ?? [],
            IsVolumeProduct = p.IsVolumeProduct,
            IsPerpetual = p.IsPerpetual,
            IsActive = p.IsActive
        }).ToList();
    }

    public async Task<PerpetualLicenseComplianceOverviewDto> GetComplianceOverviewAsync()
    {
        await EnsureCatalogSeededAsync();

        var licenses = await _db.PerpetualLicenses.AsNoTracking().ToListAsync();
        var alerts = await _db.LicenseComplianceAlerts.AsNoTracking().OrderByDescending(a => a.DetectedAt).Take(20).ToListAsync();

        int totalEntitlements = licenses.Sum(l => l.EntitlementQuantity);
        int assigned = licenses.Sum(l => l.AssignedQuantity);
        int available = licenses.Sum(l => l.AvailableQuantity);
        int reserved = licenses.Sum(l => l.ReservedQuantity);
        int unassigned = Math.Max(0, totalEntitlements - assigned);

        return new PerpetualLicenseComplianceOverviewDto
        {
            TotalEntitlements = totalEntitlements,
            Assigned = assigned,
            Available = available,
            Reserved = reserved,
            Unassigned = unassigned,
            ComplianceExceptionsCount = alerts.Count(a => !a.IsResolved && a.ComplianceStatus == LicenseComplianceStatus.OverAssigned),
            Alerts = alerts.Select(a => new LicenseComplianceAlertDto
            {
                Id = a.Id,
                LicenseId = a.LicenseId,
                ProductName = a.ProductName,
                ComplianceStatus = a.ComplianceStatus.ToString(),
                EntitlementCount = a.EntitlementCount,
                DetectedCount = a.DetectedCount,
                AssignedCount = a.AssignedCount,
                DetectedAt = a.DetectedAt,
                Message = a.Message,
                IsResolved = a.IsResolved
            }).ToList()
        };
    }

    public async Task<List<LicenseMatrixRowDto>> GetLicenseMatrixAsync()
    {
        return await Task.FromResult(new List<LicenseMatrixRowDto>
        {
            new() { LicenseTerm = "Perpetual", LicenseChannel = "Volume", ActivationType = "KMS", ManagedStatus = "Yes", MicrosoftGuidance = "Supported for enterprise volume activation via KMS host." },
            new() { LicenseTerm = "Perpetual", LicenseChannel = "Volume", ActivationType = "MAK", ManagedStatus = "Yes", MicrosoftGuidance = "Supported via Multiple Activation Key (Masked key registration)." },
            new() { LicenseTerm = "Perpetual", LicenseChannel = "Volume", ActivationType = "ADBA", ManagedStatus = "Yes", MicrosoftGuidance = "Supported via Active Directory-Based Activation for domain endpoints." },
            new() { LicenseTerm = "Perpetual", LicenseChannel = "Retail", ActivationType = "Retail", ManagedStatus = "Detect/Report", MicrosoftGuidance = "Retail licenses are not eligible for KMS activation workflow." },
            new() { LicenseTerm = "Perpetual", LicenseChannel = "OEM", ActivationType = "OEM", ManagedStatus = "Detect/Report", MicrosoftGuidance = "OEM hardware-bound digital entitlements cannot be converted to KMS." },
            new() { LicenseTerm = "Subscription", LicenseChannel = "Volume", ActivationType = "KMS/Other", ManagedStatus = "Product Dependent", MicrosoftGuidance = "Subscription channels follow distinct M365/Enterprise subscription rules." },
            new() { LicenseTerm = "Unknown", LicenseChannel = "Unknown", ActivationType = "Unknown", ManagedStatus = "Detect/Report", MicrosoftGuidance = "Unidentified licensing state requires administrative audit." }
        });
    }

    public async Task<byte[]> GeneratePerpetualReportCsvAsync()
    {
        var licenses = await GetLicensesAsync();

        var sb = new StringBuilder();
        sb.AppendLine("License Reference,Product Name,Product Family,Edition,License Term,License Channel,Activation Type,Entitlement Quantity,Assigned Quantity,Available Quantity,Reserved Quantity,Agreement Reference,Site,Department,Status");

        foreach (var l in licenses)
        {
            sb.AppendLine($"\"{l.LicenseReference}\",\"{l.ProductName}\",\"{l.ProductFamily}\",\"{l.Edition ?? ""}\",\"{l.LicenseTerm}\",\"{l.LicenseChannel}\",\"{l.ActivationType}\",{l.EntitlementQuantity},{l.AssignedQuantity},{l.AvailableQuantity},{l.ReservedQuantity},\"{l.AgreementReference ?? ""}\",\"{l.Site ?? ""}\",\"{l.Department ?? ""}\",\"{(l.IsActive ? "Active" : "Inactive")}\"");
        }

        return Encoding.UTF8.GetBytes(sb.ToString());
    }

    public async Task RunComplianceAuditAsync()
    {
        _logger.LogInformation("[COMPLIANCE JOB] PerpetualLicenseComplianceJob starting compliance calculation...");

        var licenses = await _db.PerpetualLicenses.ToListAsync();
        var endpoints = await _db.Endpoints.Include(e => e.SoftwareInventory).AsNoTracking().ToListAsync();

        foreach (var lic in licenses)
        {
            // Count detected endpoints matching this product family or name
            int detectedCount = endpoints.Count(e =>
                (lic.ProductFamily == ProductFamily.Office && e.SoftwareInventory.Any(s => s.SoftwareName.Contains("Office"))) ||
                (lic.ProductFamily == ProductFamily.Windows && e.DeviceType == "Windows"));

            if (lic.AssignedQuantity > lic.EntitlementQuantity || detectedCount > lic.EntitlementQuantity)
            {
                var existingAlert = await _db.LicenseComplianceAlerts
                    .FirstOrDefaultAsync(a => a.LicenseId == lic.Id && !a.IsResolved);

                if (existingAlert == null)
                {
                    _db.LicenseComplianceAlerts.Add(new LicenseComplianceAlert
                    {
                        LicenseId = lic.Id,
                        ProductName = lic.ProductName,
                        ComplianceStatus = LicenseComplianceStatus.OverAssigned,
                        EntitlementCount = lic.EntitlementQuantity,
                        AssignedCount = lic.AssignedQuantity,
                        DetectedCount = detectedCount,
                        DetectedAt = DateTime.UtcNow,
                        Message = $"Compliance Alert: Product '{lic.ProductName}' has {detectedCount} detected installations / {lic.AssignedQuantity} assignments exceeding authorized entitlement of {lic.EntitlementQuantity}."
                    });

                    await _auditLog.LogAsync(
                        actor: "PerpetualLicenseComplianceJob",
                        action: "ComplianceExceptionDetected",
                        target: lic.LicenseReference,
                        result: "Warning",
                        details: new
                        {
                            licenseId = lic.Id,
                            entitlements = lic.EntitlementQuantity,
                            assigned = lic.AssignedQuantity,
                            detected = detectedCount
                        });
                }
            }
        }

        await _db.SaveChangesAsync();
        _logger.LogInformation("[COMPLIANCE JOB] PerpetualLicenseComplianceJob audit completed successfully.");
    }

    private static PerpetualLicenseDto MapToDto(PerpetualLicense l)
    {
        return new PerpetualLicenseDto
        {
            Id = l.Id,
            LicenseReference = l.LicenseReference,
            ProductFamily = l.ProductFamily.ToString(),
            ProductName = l.ProductName,
            ProductVersion = l.ProductVersion,
            Edition = l.Edition,
            LicenseTerm = l.LicenseTerm.ToString(),
            LicenseChannel = l.LicenseChannel.ToString(),
            ActivationType = l.ActivationType.ToString(),
            AgreementReference = l.AgreementReference,
            PurchaseReference = l.PurchaseReference,
            EntitlementQuantity = l.EntitlementQuantity,
            AssignedQuantity = l.AssignedQuantity,
            AvailableQuantity = l.AvailableQuantity,
            ReservedQuantity = l.ReservedQuantity,
            EffectiveDate = l.EffectiveDate,
            PurchaseDate = l.PurchaseDate,
            ExpiryDate = l.ExpiryDate,
            IsActive = l.IsActive,
            Notes = l.Notes,
            SupportingDocumentRef = l.SupportingDocumentRef,
            MaskedKey = l.MaskedKey,
            Site = l.Site,
            Department = l.Department,
            CreatedAt = l.CreatedAt,
            UpdatedAt = l.UpdatedAt,
            CreatedBy = l.CreatedBy,
            UpdatedBy = l.UpdatedBy
        };
    }
}
