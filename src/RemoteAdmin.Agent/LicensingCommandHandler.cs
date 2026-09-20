using System.Diagnostics;
using System.Security;
using System.Text.RegularExpressions;
using Microsoft.Extensions.Logging;

namespace RemoteAdmin.Agent;

public class LicensingCommandHandler
{
    private readonly ILogger<LicensingCommandHandler> _logger;

    public LicensingCommandHandler(ILogger<LicensingCommandHandler> logger)
    {
        _logger = logger;
    }

    public async Task<LicensingExecutionResult> ExecuteLicensingJobAsync(string jobType, string? configurationJson, CancellationToken cancellationToken)
    {
        _logger.LogInformation("Agent executing licensing job type '{JobType}'", jobType);

        try
        {
            return jobType switch
            {
                "KmsCheckActivation" => await ExecuteSlmgrCommandAsync("/dlv", cancellationToken),
                "KmsActivateClient" => await ExecuteSlmgrCommandAsync("/ato", cancellationToken),
                "KmsConfigureClient" => await ConfigureKmsClientAsync(configurationJson, cancellationToken),
                "OfficeCheckActivation" => await ExecuteOsppCommandAsync("/dstatus", cancellationToken),
                "OfficeActivateClient" => await ExecuteOsppCommandAsync("/act", cancellationToken),
                "KmsConnectivityTest" => await TestKmsConnectivityAsync(configurationJson, cancellationToken),
                _ => new LicensingExecutionResult
                {
                    Success = false,
                    ExitCode = -1,
                    ErrorMessage = $"Unsupported licensing job type '{jobType}'"
                }
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error executing licensing job '{JobType}'", jobType);
            return new LicensingExecutionResult
            {
                Success = false,
                ExitCode = -1,
                ErrorMessage = ex.Message
            };
        }
    }

    private async Task<LicensingExecutionResult> ExecuteSlmgrCommandAsync(string arguments, CancellationToken cancellationToken)
    {
        var system32Path = Environment.GetFolderPath(Environment.SpecialFolder.System);
        var slmgrPath = Path.Combine(system32Path, "slmgr.vbs");

        if (!File.Exists(slmgrPath))
        {
            return new LicensingExecutionResult
            {
                Success = false,
                ExitCode = 2,
                ErrorMessage = $"Windows slmgr.vbs not found at '{slmgrPath}'"
            };
        }

        return await RunVbsScriptAsync("cscript.exe", $"//NoLogo \"{slmgrPath}\" {arguments}", cancellationToken);
    }

    private async Task<LicensingExecutionResult> ConfigureKmsClientAsync(string? configJson, CancellationToken cancellationToken)
    {
        var kmsHost = ExtractConfigValue(configJson, "KmsHostname");
        var portStr = ExtractConfigValue(configJson, "Port") ?? "1688";

        if (string.IsNullOrWhiteSpace(kmsHost))
        {
            return new LicensingExecutionResult { Success = false, ExitCode = -1, ErrorMessage = "KMS Hostname is required." };
        }

        var arg = $"/skms {kmsHost}:{portStr}";
        return await ExecuteSlmgrCommandAsync(arg, cancellationToken);
    }

    private async Task<LicensingExecutionResult> ExecuteOsppCommandAsync(string arguments, CancellationToken cancellationToken)
    {
        var osppPath = FindOfficeOsppScriptPath();
        if (string.IsNullOrWhiteSpace(osppPath) || !File.Exists(osppPath))
        {
            return new LicensingExecutionResult
            {
                Success = false,
                ExitCode = 2,
                ErrorMessage = "Microsoft Office ospp.vbs licensing script not found on system."
            };
        }

        return await RunVbsScriptAsync("cscript.exe", $"//NoLogo \"{osppPath}\" {arguments}", cancellationToken);
    }

    private async Task<LicensingExecutionResult> TestKmsConnectivityAsync(string? configJson, CancellationToken cancellationToken)
    {
        var kmsHost = ExtractConfigValue(configJson, "KmsHostname") ?? "localhost";
        var port = int.TryParse(ExtractConfigValue(configJson, "Port"), out var p) ? p : 1688;

        var stopwatch = Stopwatch.StartNew();
        try
        {
            using var client = new System.Net.Sockets.TcpClient();
            var connectTask = client.ConnectAsync(kmsHost, port);
            var timeoutTask = Task.Delay(TimeSpan.FromSeconds(5), cancellationToken);

            var completed = await Task.WhenAny(connectTask, timeoutTask);
            stopwatch.Stop();

            if (completed == connectTask && client.Connected)
            {
                return new LicensingExecutionResult
                {
                    Success = true,
                    ExitCode = 0,
                    StandardOutput = $"TCP {port} connection to KMS Host '{kmsHost}' succeeded in {stopwatch.ElapsedMilliseconds} ms."
                };
            }
            else
            {
                return new LicensingExecutionResult
                {
                    Success = false,
                    ExitCode = 10060,
                    ErrorMessage = $"TCP {port} connection to KMS Host '{kmsHost}' timed out after 5000 ms."
                };
            }
        }
        catch (Exception ex)
        {
            stopwatch.Stop();
            return new LicensingExecutionResult
            {
                Success = false,
                ExitCode = -1,
                ErrorMessage = $"TCP {port} connection to KMS Host '{kmsHost}' failed: {ex.Message}"
            };
        }
    }

    private string? FindOfficeOsppScriptPath()
    {
        var candidates = new[]
        {
            @"C:\Program Files\Microsoft Office\Office16\OSPP.VBS",
            @"C:\Program Files (x86)\Microsoft Office\Office16\OSPP.VBS",
            @"C:\Program Files\Microsoft Office\Office15\OSPP.VBS",
            @"C:\Program Files (x86)\Microsoft Office\Office15\OSPP.VBS"
        };

        foreach (var path in candidates)
        {
            if (File.Exists(path)) return path;
        }

        return null;
    }

    private async Task<LicensingExecutionResult> RunVbsScriptAsync(string fileName, string arguments, CancellationToken cancellationToken)
    {
        var psi = new ProcessStartInfo
        {
            FileName = fileName,
            Arguments = arguments,
            UseShellExecute = false,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            CreateNoWindow = true
        };

        var startedAt = DateTime.UtcNow;
        using var process = new Process { StartInfo = psi };

        process.Start();

        var stdoutTask = process.StandardOutput.ReadToEndAsync();
        var stderrTask = process.StandardError.ReadToEndAsync();

        var waitForExitTask = process.WaitForExitAsync(cancellationToken);
        var timeoutTask = Task.Delay(TimeSpan.FromSeconds(30), cancellationToken);

        var completedTask = await Task.WhenAny(waitForExitTask, timeoutTask);

        if (completedTask == timeoutTask)
        {
            try { process.Kill(); } catch { }
            return new LicensingExecutionResult
            {
                Success = false,
                ExitCode = -1,
                ErrorMessage = "Licensing process timed out after 30 seconds."
            };
        }

        var stdout = await stdoutTask;
        var stderr = await stderrTask;

        var sanitizedStdout = SanitizeLogs(stdout);
        var sanitizedStderr = SanitizeLogs(stderr);

        return new LicensingExecutionResult
        {
            Success = process.ExitCode == 0,
            ExitCode = process.ExitCode,
            StandardOutput = sanitizedStdout,
            StandardError = sanitizedStderr,
            StartedAt = startedAt,
            CompletedAt = DateTime.UtcNow
        };
    }

    private static string SanitizeLogs(string input)
    {
        if (string.IsNullOrWhiteSpace(input)) return string.Empty;
        // Ensure license keys are masked if present
        return Regex.Replace(input, @"([A-Z0-9]{5}-){4}[A-Z0-9]{5}", "*****-*****-*****-*****-*****", RegexOptions.IgnoreCase);
    }

    private static string? ExtractConfigValue(string? json, string propertyName)
    {
        if (string.IsNullOrWhiteSpace(json)) return null;
        try
        {
            using var doc = System.Text.Json.JsonDocument.Parse(json);
            if (doc.RootElement.TryGetProperty(propertyName, out var prop))
            {
                return prop.GetString() ?? prop.GetRawText();
            }
        }
        catch { }
        return null;
    }
}

public class LicensingExecutionResult
{
    public bool Success { get; set; }
    public int ExitCode { get; set; }
    public string StandardOutput { get; set; } = "";
    public string StandardError { get; set; } = "";
    public string? ErrorMessage { get; set; }
    public DateTime StartedAt { get; set; } = DateTime.UtcNow;
    public DateTime CompletedAt { get; set; } = DateTime.UtcNow;
}
