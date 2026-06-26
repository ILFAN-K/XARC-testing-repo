using System.Diagnostics;
using System.IO;
using System.ServiceProcess;

namespace VRAgent.Services;

public class AggregatorDetectionService
{
    private readonly ILogger<AggregatorDetectionService> _logger;

    // Cache detection result for 30 seconds to avoid repeated registry/process scans
    private AggregatorStatus? _cachedStatus;
    private DateTime _cacheExpiry = DateTime.MinValue;
    private static readonly TimeSpan CacheDuration = TimeSpan.FromSeconds(30);

    public AggregatorDetectionService(ILogger<AggregatorDetectionService> logger)
    {
        _logger = logger;
    }

    public AggregatorStatus DetectAggregator()
    {
        if (_cachedStatus != null && DateTime.UtcNow < _cacheExpiry)
        {
            return _cachedStatus;
        }

        var status = DetectAggregatorInternal();
        _cachedStatus = status;
        _cacheExpiry = DateTime.UtcNow + CacheDuration;
        return status;
    }

    /// <summary>
    /// Force a fresh detection, bypassing the cache.
    /// Called after installation to get an accurate result.
    /// </summary>
    public AggregatorStatus DetectAggregatorFresh()
    {
        _cachedStatus = null;
        _cacheExpiry = DateTime.MinValue;
        return DetectAggregator();
    }

    private AggregatorStatus DetectAggregatorInternal()
    {
        string? installPath = null;
        
        // Primary Detection: Registry
        try
        {
            using (var key = Microsoft.Win32.Registry.LocalMachine.OpenSubKey(@"SOFTWARE\Notepad++"))
            {
                if (key != null)
                {
                    installPath = key.GetValue(null) as string;
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogDebug("Registry detection failed: {Error}", ex.Message);
        }

        // Secondary Detection: Default Paths if Registry fails
        if (string.IsNullOrEmpty(installPath))
        {
            string[] possiblePaths = {
                @"C:\Program Files\Notepad++",
                @"C:\Program Files (x86)\Notepad++"
            };

            foreach (var p in possiblePaths)
            {
                if (Directory.Exists(p))
                {
                    installPath = p;
                    break;
                }
            }
        }

        // Validate installation path
        if (!string.IsNullOrEmpty(installPath))
        {
            string exePath = Path.Combine(installPath, "notepad++.exe");
            if (File.Exists(exePath))
            {
                var status = new AggregatorStatus { Installed = true, Version = "Unknown", IsRunning = false };

                try
                {
                    var versionInfo = FileVersionInfo.GetVersionInfo(exePath);
                    status.Version = versionInfo.FileVersion ?? versionInfo.ProductVersion;
                }
                catch (Exception ex)
                {
                    _logger.LogDebug("Version detection failed: {Error}", ex.Message);
                }

                // Service Verification (Dual-Mode: Dev vs Prod)
                try
                {
                    // Prod mode: check for actual service
                    using (var sc = new ServiceController("XarcAggregator"))
                    {
                        status.IsRunning = (sc.Status == ServiceControllerStatus.Running);
                    }
                }
                catch
                {
                    // Dev mode fallback: check for Notepad++ process
                    var processes = Process.GetProcessesByName("notepad++");
                    status.IsRunning = processes.Length > 0;
                }

                return status;
            }
        }

        return new AggregatorStatus { Installed = false, IsRunning = false };
    }
}

public class AggregatorStatus
{
    public bool Installed { get; set; }
    public string? Version { get; set; }
    public bool IsRunning { get; set; }
}
