using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RemoteAdmin.Application.Dtos.Licensing;
using RemoteAdmin.Application.Interfaces.Licensing;

namespace RemoteAdmin.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class LicensingController : ControllerBase
{
    private readonly IKmsManagementService _kmsService;
    private readonly IKmsHealthService _healthService;
    private readonly IWindowsActivationService _winActivation;
    private readonly IOfficeActivationService _officeActivation;
    private readonly IActivationWaveService _waveService;
    private readonly IOfflinePackageService _offlineService;
    private readonly IPerpetualLicensingService _perpetualService;
    private readonly ILogger<LicensingController> _logger;

    public LicensingController(
        IKmsManagementService kmsService,
        IKmsHealthService healthService,
        IWindowsActivationService winActivation,
        IOfficeActivationService officeActivation,
        IActivationWaveService waveService,
        IOfflinePackageService offlineService,
        IPerpetualLicensingService perpetualService,
        ILogger<LicensingController> logger)
    {
        _kmsService = kmsService;
        _healthService = healthService;
        _winActivation = winActivation;
        _officeActivation = officeActivation;
        _waveService = waveService;
        _offlineService = offlineService;
        _perpetualService = perpetualService;
        _logger = logger;
    }

    [HttpGet("overview")]
    public async Task<IActionResult> GetOverview()
    {
        var overview = await _kmsService.GetOverviewAsync();
        return Ok(overview);
    }

    [HttpGet("kms-hosts")]
    public async Task<IActionResult> GetKmsHosts()
    {
        var hosts = await _kmsService.GetAllHostsAsync();
        return Ok(hosts);
    }

    [HttpGet("kms-hosts/{id}")]
    public async Task<IActionResult> GetKmsHostById(Guid id)
    {
        var host = await _kmsService.GetHostByIdAsync(id);
        if (host == null) return NotFound();
        return Ok(host);
    }

    [HttpPost("kms-hosts")]
    [Authorize(Policy = "Admin")]
    public async Task<IActionResult> CreateKmsHost([FromBody] CreateKmsHostDto dto)
    {
        var user = User.Identity?.Name ?? "Admin";
        var created = await _kmsService.CreateHostAsync(dto, user);
        return CreatedAtAction(nameof(GetKmsHostById), new { id = created.Id }, created);
    }

    [HttpPut("kms-hosts/{id}")]
    [Authorize(Policy = "Admin")]
    public async Task<IActionResult> UpdateKmsHost(Guid id, [FromBody] UpdateKmsHostDto dto)
    {
        var user = User.Identity?.Name ?? "Admin";
        var updated = await _kmsService.UpdateHostAsync(id, dto, user);
        if (updated == null) return NotFound();
        return Ok(updated);
    }

    [HttpDelete("kms-hosts/{id}")]
    [Authorize(Policy = "Admin")]
    public async Task<IActionResult> DeleteKmsHost(Guid id)
    {
        var user = User.Identity?.Name ?? "Admin";
        var success = await _kmsService.DeleteHostAsync(id, user);
        if (!success) return NotFound();
        return NoContent();
    }

    [HttpPost("kms-hosts/{id}/health-check")]
    public async Task<IActionResult> CheckKmsHostHealth(Guid id)
    {
        var result = await _healthService.CheckHealthAsync(id);
        return Ok(result);
    }

    [HttpGet("endpoints/{endpointId}")]
    public async Task<IActionResult> GetEndpointActivationStatus(Guid endpointId)
    {
        var win = await _winActivation.GetActivationStatusAsync(endpointId);
        var office = await _officeActivation.GetOfficeActivationStatusAsync(endpointId);
        return Ok(new { Windows = win, Office = office });
    }

    [HttpPost("endpoints/{endpointId}/activation-check")]
    [Authorize(Policy = "Operator")]
    public async Task<IActionResult> TriggerActivationCheck(Guid endpointId)
    {
        var user = User.Identity?.Name ?? "Operator";
        var res = await _winActivation.TriggerActivationAsync(endpointId, user);
        return Ok(res);
    }

    [HttpPost("endpoints/{endpointId}/configure-kms")]
    [Authorize(Policy = "Admin")]
    public async Task<IActionResult> ConfigureKmsClient(Guid endpointId, [FromBody] ConfigureKmsClientDto dto)
    {
        var user = User.Identity?.Name ?? "Admin";
        dto.EndpointId = endpointId;
        var res = await _winActivation.ConfigureKmsClientAsync(dto, user);
        return Ok(res);
    }

    [HttpPost("endpoints/{endpointId}/activate")]
    [Authorize(Policy = "Operator")]
    public async Task<IActionResult> TriggerActivate(Guid endpointId)
    {
        var user = User.Identity?.Name ?? "Operator";
        var res = await _winActivation.TriggerActivationAsync(endpointId, user);
        return Ok(res);
    }

    [HttpGet("waves")]
    public async Task<IActionResult> GetWaves()
    {
        var waves = await _waveService.GetAllWavesAsync();
        return Ok(waves);
    }

    [HttpPost("waves")]
    [Authorize(Policy = "Admin")]
    public async Task<IActionResult> CreateWave([FromBody] CreateActivationWaveDto dto)
    {
        var user = User.Identity?.Name ?? "Admin";
        var created = await _waveService.CreateWaveAsync(dto, user);
        return Ok(created);
    }

    [HttpPost("waves/{id}/start")]
    [Authorize(Policy = "Admin")]
    public async Task<IActionResult> StartWave(Guid id)
    {
        var user = User.Identity?.Name ?? "Admin";
        var success = await _waveService.StartWaveAsync(id, user);
        if (!success) return NotFound();
        return Ok(new { Message = "Activation wave started." });
    }

    [HttpPost("waves/{id}/pause")]
    [Authorize(Policy = "Admin")]
    public async Task<IActionResult> PauseWave(Guid id)
    {
        var user = User.Identity?.Name ?? "Admin";
        var success = await _waveService.PauseWaveAsync(id, user);
        if (!success) return NotFound();
        return Ok(new { Message = "Activation wave paused." });
    }

    [HttpPost("waves/{id}/resume")]
    [Authorize(Policy = "Admin")]
    public async Task<IActionResult> ResumeWave(Guid id)
    {
        var user = User.Identity?.Name ?? "Admin";
        var success = await _waveService.ResumeWaveAsync(id, user);
        if (!success) return NotFound();
        return Ok(new { Message = "Activation wave resumed." });
    }

    [HttpPost("waves/{id}/cancel")]
    [Authorize(Policy = "Admin")]
    public async Task<IActionResult> CancelWave(Guid id)
    {
        var user = User.Identity?.Name ?? "Admin";
        var success = await _waveService.CancelWaveAsync(id, user);
        if (!success) return NotFound();
        return Ok(new { Message = "Activation wave cancelled." });
    }

    [HttpGet("offline/history")]
    public async Task<IActionResult> GetOfflineHistory()
    {
        var history = await _offlineService.GetPackageHistoryAsync();
        return Ok(history);
    }

    [HttpPost("offline/export")]
    [Authorize(Policy = "Admin")]
    public async Task<IActionResult> ExportPackage([FromBody] ExportOfflinePackageRequestDto dto)
    {
        var user = User.Identity?.Name ?? "Admin";
        var json = await _offlineService.ExportPackageJsonAsync(dto, user);
        return File(System.Text.Encoding.UTF8.GetBytes(json), "application/json", $"RemoteAdmin-KMS-Package-{DateTime.UtcNow:yyyyMMddHHmmss}.json");
    }

    [HttpPost("offline/validate")]
    public async Task<IActionResult> ValidatePackage([FromBody] ImportOfflinePackageRequestDto dto)
    {
        var val = await _offlineService.ValidatePackageAsync(dto.PackageJsonContent);
        return Ok(val);
    }

    [HttpPost("offline/import")]
    [Authorize(Policy = "Admin")]
    public async Task<IActionResult> ImportPackage([FromBody] ImportOfflinePackageRequestDto dto)
    {
        var user = User.Identity?.Name ?? "Admin";
        var result = await _offlineService.ImportPackageAsync(dto, user);
        return Ok(result);
    }

    // ==========================================
    // PERPETUAL LICENSING ENDPOINTS (Req 39-62)
    // ==========================================

    [HttpGet("licenses")]
    public async Task<IActionResult> GetPerpetualLicenses(
        [FromQuery] string? product,
        [FromQuery] string? channel,
        [FromQuery] string? search)
    {
        var result = await _perpetualService.GetLicensesAsync(product, channel, search);
        return Ok(result);
    }

    [HttpGet("licenses/{id}")]
    public async Task<IActionResult> GetPerpetualLicenseById(Guid id)
    {
        var license = await _perpetualService.GetLicenseByIdAsync(id);
        if (license == null) return NotFound();
        return Ok(license);
    }

    [HttpPost("licenses")]
    [Authorize(Policy = "Admin")]
    public async Task<IActionResult> CreatePerpetualLicense([FromBody] CreatePerpetualLicenseDto dto)
    {
        var user = User.Identity?.Name ?? "Admin";
        var created = await _perpetualService.CreateLicenseAsync(dto, user);
        return CreatedAtAction(nameof(GetPerpetualLicenseById), new { id = created.Id }, created);
    }

    [HttpPut("licenses/{id}")]
    [Authorize(Policy = "Admin")]
    public async Task<IActionResult> UpdatePerpetualLicense(Guid id, [FromBody] UpdatePerpetualLicenseDto dto)
    {
        var user = User.Identity?.Name ?? "Admin";
        var updated = await _perpetualService.UpdateLicenseAsync(id, dto, user);
        if (updated == null) return NotFound();
        return Ok(updated);
    }

    [HttpDelete("licenses/{id}")]
    [Authorize(Policy = "Admin")]
    public async Task<IActionResult> DeletePerpetualLicense(Guid id)
    {
        var user = User.Identity?.Name ?? "Admin";
        var success = await _perpetualService.DeleteLicenseAsync(id, user);
        if (!success) return NotFound();
        return NoContent();
    }

    [HttpGet("licenses/{id}/assignments")]
    public async Task<IActionResult> GetLicenseAssignments(Guid id)
    {
        var assignments = await _perpetualService.GetAssignmentsAsync(licenseId: id);
        return Ok(assignments);
    }

    [HttpPost("licenses/{id}/assign")]
    [Authorize(Policy = "Operator")]
    public async Task<IActionResult> AssignLicense(Guid id, [FromBody] AssignLicenseRequestDto dto)
    {
        dto.LicenseId = id;
        var user = User.Identity?.Name ?? "Operator";
        try
        {
            var assignment = await _perpetualService.AssignLicenseAsync(dto, user);
            return Ok(assignment);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { Message = ex.Message });
        }
    }

    [HttpPost("licenses/{id}/release")]
    [Authorize(Policy = "Operator")]
    public async Task<IActionResult> ReleaseLicense(Guid id, [FromBody] ReleaseLicenseRequestDto dto)
    {
        var user = User.Identity?.Name ?? "Operator";
        try
        {
            var success = await _perpetualService.ReleaseLicenseAsync(dto, user);
            if (!success) return NotFound();
            return Ok(new { Message = "License released successfully." });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { Message = ex.Message });
        }
    }

    [HttpPost("licenses/{id}/transfer")]
    [Authorize(Policy = "Operator")]
    public async Task<IActionResult> TransferLicense(Guid id, [FromBody] TransferLicenseRequestDto dto)
    {
        var user = User.Identity?.Name ?? "Operator";
        try
        {
            var assignment = await _perpetualService.TransferLicenseAsync(dto, user);
            return Ok(assignment);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { Message = ex.Message });
        }
    }

    [HttpGet("compliance")]
    public async Task<IActionResult> GetCompliance()
    {
        var compliance = await _perpetualService.GetComplianceOverviewAsync();
        return Ok(compliance);
    }

    [HttpPost("compliance/run")]
    [Authorize(Policy = "Admin")]
    public async Task<IActionResult> RunComplianceCheck()
    {
        await _perpetualService.RunComplianceAuditAsync();
        return Ok(new { Message = "Compliance audit completed." });
    }

    [HttpGet("products")]
    public async Task<IActionResult> GetProducts()
    {
        var products = await _perpetualService.GetProductCatalogAsync();
        return Ok(products);
    }

    [HttpGet("entitlements")]
    public async Task<IActionResult> GetEntitlements()
    {
        var entitlements = await _perpetualService.GetEntitlementsAsync();
        return Ok(entitlements);
    }

    [HttpGet("matrix")]
    public async Task<IActionResult> GetLicenseMatrix()
    {
        var matrix = await _perpetualService.GetLicenseMatrixAsync();
        return Ok(matrix);
    }

    [HttpGet("reports/perpetual")]
    public async Task<IActionResult> ExportPerpetualReport()
    {
        var bytes = await _perpetualService.GeneratePerpetualReportCsvAsync();
        return File(bytes, "text/csv", $"Perpetual_License_Report_{DateTime.UtcNow:yyyyMMdd}.csv");
    }
}
