namespace VRAgent.Services;

public class DeviceIdService
{
    private readonly ILogger<DeviceIdService> _logger;

    /// <summary>
    /// Uses AppContext.BaseDirectory so the device ID file is always next to
    /// the executable, regardless of working directory (important when running
    /// as a Windows Service where CWD is System32).
    /// </summary>
    private static readonly string FilePath =
        Path.Combine(AppContext.BaseDirectory, "device-id.txt");

    public DeviceIdService(ILogger<DeviceIdService> logger)
    {
        _logger = logger;
    }

    public string GetDeviceId()
    {
        try
        {
            if (File.Exists(FilePath))
            {
                var id = File.ReadAllText(FilePath).Trim();
                if (!string.IsNullOrEmpty(id))
                {
                    return id;
                }
            }

            string deviceId = $"DEV-{Guid.NewGuid():N}"
                .Substring(0, 12)
                .ToUpper();

            File.WriteAllText(FilePath, deviceId);
            _logger.LogInformation("Generated new Device ID: {DeviceId} at {Path}", deviceId, FilePath);

            return deviceId;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to read/write device ID file at {Path}", FilePath);
            // Fallback: generate a transient ID (won't persist across restarts)
            var fallback = $"DEV-{Guid.NewGuid():N}".Substring(0, 12).ToUpper();
            _logger.LogWarning("Using transient Device ID: {DeviceId}", fallback);
            return fallback;
        }
    }
}