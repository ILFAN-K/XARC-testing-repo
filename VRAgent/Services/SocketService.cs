using SocketIOClient;
using System.Diagnostics;
using System.Reflection;
using System.Text;
using System.Text.Json;

namespace VRAgent.Services;

public class SocketService
{
    private SocketIO? _socket;

    private readonly DeviceIdService _deviceIdService;
    private readonly HardwareInfoService _hardwareInfoService;
    private readonly AggregatorDetectionService _aggregatorDetectionService;
    private readonly IConfiguration _configuration;
    private readonly ILogger<SocketService> _logger;
    private readonly string _deviceId;

    // Guard against duplicate heartbeat loops on reconnect
    private int _heartbeatLoopRunning = 0;

    private static readonly TimeSpan DownloadTimeout = TimeSpan.FromMinutes(2);
    private static readonly TimeSpan InstallerTimeout = TimeSpan.FromMinutes(5);

    public SocketIO? Socket => _socket;

    public SocketService(
        DeviceIdService deviceIdService,
        HardwareInfoService hardwareInfoService,
        AggregatorDetectionService aggregatorDetectionService,
        IConfiguration configuration,
        ILogger<SocketService> logger)
    {
        _deviceIdService = deviceIdService;
        _hardwareInfoService = hardwareInfoService;
        _aggregatorDetectionService = aggregatorDetectionService;
        _configuration = configuration;
        _logger = logger;
        _deviceId = _deviceIdService.GetDeviceId();
    }

    private static string AgentVersion
    {
        get
        {
            var ver = Assembly.GetExecutingAssembly().GetName().Version;
            return ver != null ? $"{ver.Major}.{ver.Minor}.{ver.Build}" : "1.0.0";
        }
    }

    public async Task ConnectAsync(string serverUrl, CancellationToken stoppingToken)
    {
        var agentKey = _configuration["AgentKey"] ?? "default-key";

        _socket = new SocketIO(
            new Uri(serverUrl),
            new SocketIOOptions
            {
                Auth = new Dictionary<string, string> { { "agentKey", agentKey } },
                Reconnection = true
            }
        );

        // Register event handlers BEFORE connecting to avoid race conditions
        RegisterEventHandlers(stoppingToken);

        _socket.OnConnected += async (_, _) =>
        {
            _logger.LogInformation("[CONNECT] Connected to backend. DeviceId={DeviceId} Machine={Machine}",
                _deviceId, Environment.MachineName);

            try
            {
                var hwUuid = _hardwareInfoService.GetHardwareUuid();
                var netInfo = _hardwareInfoService.GetNetworkInfo();
                var aggregator = _aggregatorDetectionService.DetectAggregator();

                await EmitAsync("register-device", new
                {
                    DeviceId = _deviceId,
                    MachineName = Environment.MachineName,
                    OS = Environment.OSVersion.ToString(),
                    AgentVersion,
                    HardwareUuid = hwUuid,
                    IPAddress = netInfo.PrimaryIPv4,
                    PrimaryMacAddress = netInfo.PrimaryMAC,
                    NetworkInterfaces = netInfo.Interfaces,
                    AggregatorInstalled = aggregator.Installed,
                    AggregatorVersion = aggregator.Version,
                    AggregatorRunning = aggregator.IsRunning
                });

                _logger.LogInformation("[REGISTER] Device registered successfully");

                // Start heartbeat loop only if not already running
                if (Interlocked.CompareExchange(ref _heartbeatLoopRunning, 1, 0) == 0)
                {
                    _ = StartHeartbeatLoopAsync(stoppingToken);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[REGISTER] Failed to register device");
            }
        };

        _socket.OnDisconnected += (_, reason) =>
        {
            _logger.LogWarning("[DISCONNECT] Disconnected from backend. Reason={Reason}. Auto-reconnect enabled.", reason);
        };

        _socket.OnReconnectAttempt += (_, attempt) =>
        {
            _logger.LogInformation("[RECONNECT] Attempting reconnection #{Attempt}", attempt);
        };

        await _socket.ConnectAsync();
    }

    private void RegisterEventHandlers(CancellationToken stoppingToken)
    {
        if (_socket == null) return;

        _socket.On("install-aggregator", async response =>
        {
            dynamic? payload = response.GetValue<dynamic>(0);
            if (payload == null)
            {
                _logger.LogWarning("[INSTALL] Null payload received, ignoring");
                return;
            }

            string commandId = payload.commandId?.ToString() ?? string.Empty;
            if (string.IsNullOrEmpty(commandId))
            {
                _logger.LogError("[INSTALL] Payload missing commandId");
                return;
            }

            _logger.LogInformation("[INSTALL] Command received. CommandId={CommandId}", commandId);
            await EmitAsync("command-status", new { CommandId = commandId, Status = "RECEIVED" });

            try
            {
                string? installerUrl = payload.installerUrl?.ToString();
                string installerArgs = payload.installerArguments?.ToString() ?? "/S";
                string? expectedChecksum = payload.checksum?.ToString();

                if (string.IsNullOrEmpty(installerUrl))
                {
                    throw new Exception("Payload missing installerUrl.");
                }

                _logger.LogInformation("[INSTALL] URL={Url} Args={Args}", installerUrl, installerArgs);

                // --- DOWNLOAD ---
                await EmitAsync("command-status", new { CommandId = commandId, Status = "EXECUTING" });

                string tempFile = Path.Combine(Path.GetTempPath(), $"aggregator_installer_{Guid.NewGuid():N}.exe");

                _logger.LogInformation("[DOWNLOAD] Starting download to {TempFile}", tempFile);
                using (var httpClient = new HttpClient { Timeout = DownloadTimeout })
                {
                    using var responseStream = await httpClient.GetStreamAsync(installerUrl, stoppingToken);
                    using var fs = new FileStream(tempFile, FileMode.Create, FileAccess.Write, FileShare.None);
                    await responseStream.CopyToAsync(fs, stoppingToken);
                }
                _logger.LogInformation("[DOWNLOAD] Download completed. Size={Size}KB",
                    new FileInfo(tempFile).Length / 1024);

                // --- CHECKSUM ---
                if (!string.IsNullOrEmpty(expectedChecksum))
                {
                    _logger.LogInformation("[VERIFY] Verifying SHA256 checksum");
                    using var sha256 = System.Security.Cryptography.SHA256.Create();
                    using var stream = File.OpenRead(tempFile);
                    var hashBytes = sha256.ComputeHash(stream);
                    var hashString = BitConverter.ToString(hashBytes).Replace("-", "").ToLowerInvariant();
                    if (hashString != expectedChecksum.ToLowerInvariant())
                    {
                        throw new Exception($"Checksum mismatch. Expected: {expectedChecksum}, Got: {hashString}");
                    }
                    _logger.LogInformation("[VERIFY] Checksum verified ✓");
                }

                // --- INSTALL ---
                _logger.LogInformation("[INSTALL] Starting installer process");
                var processStartInfo = new ProcessStartInfo
                {
                    FileName = tempFile,
                    Arguments = installerArgs,
                    UseShellExecute = false,
                    CreateNoWindow = true
                };

                var process = Process.Start(processStartInfo);
                if (process == null)
                {
                    throw new Exception("Failed to start installer process.");
                }

                _logger.LogInformation("[INSTALL] Waiting for installer exit (timeout={Timeout}min)", InstallerTimeout.TotalMinutes);

                using var cts = CancellationTokenSource.CreateLinkedTokenSource(stoppingToken);
                cts.CancelAfter(InstallerTimeout);

                try
                {
                    await process.WaitForExitAsync(cts.Token);
                    _logger.LogInformation("[INSTALL] Installer exited. ExitCode={ExitCode}", process.ExitCode);
                }
                catch (OperationCanceledException) when (!stoppingToken.IsCancellationRequested)
                {
                    // Installer timeout — kill the process
                    _logger.LogWarning("[INSTALL] Installer timed out after {Timeout}min, killing process", InstallerTimeout.TotalMinutes);
                    try { process.Kill(entireProcessTree: true); } catch { /* best effort */ }
                    throw new Exception($"Installer process timed out after {InstallerTimeout.TotalMinutes} minutes.");
                }

                // --- VERIFY ---
                _logger.LogInformation("[VERIFY] Checking aggregator installation");
                var aggregator = _aggregatorDetectionService.DetectAggregator();

                _logger.LogInformation("[VERIFY] Installed={Installed} Version={Version} Running={Running}",
                    aggregator.Installed, aggregator.Version, aggregator.IsRunning);

                if (!aggregator.Installed)
                {
                    throw new Exception("Installation completed but aggregator executable not found.");
                }

                // --- COMPLETE ---
                _logger.LogInformation("[COMPLETE] Aggregator installation succeeded ✓");
                await EmitAsync("command-status", new { CommandId = commandId, Status = "COMPLETED" });

                // Send immediate heartbeat with updated aggregator status
                await SendHeartbeatAsync();

                // Cleanup temp file
                CleanupTempFile(tempFile);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[FAILED] Aggregator installation failed");
                await EmitAsync("command-status", new { CommandId = commandId, Status = "FAILED", Message = ex.Message });
            }
        });

        _socket.On("launch-module", async response =>
        {
            dynamic? payload = response.GetValue<dynamic>(0);
            if (payload == null)
            {
                _logger.LogWarning("[LAUNCH] Null payload received, ignoring");
                return;
            }

            string commandId = payload.commandId?.ToString() ?? string.Empty;
            string moduleName = payload.module?.ToString() ?? "Unknown";
            string? userId = payload.userId?.ToString();

            if (string.IsNullOrEmpty(commandId))
            {
                _logger.LogError("[LAUNCH] Payload missing commandId");
                return;
            }

            _logger.LogInformation("[LAUNCH] Module={Module} CommandId={CommandId} UserId={UserId}",
                moduleName, commandId, userId ?? "N/A");

            await EmitAsync("command-status", new { CommandId = commandId, Status = "RECEIVED" });

            try
            {
                string launcherPath = _configuration["LauncherPath"] ?? string.Empty;
                if (string.IsNullOrEmpty(launcherPath) || !File.Exists(launcherPath))
                {
                    throw new Exception($"Launcher executable not found at: {launcherPath}");
                }

                await EmitAsync("command-status", new { CommandId = commandId, Status = "EXECUTING" });

                // Write mock aggregator data file for testing
                await WriteMockAggregatorData(payload, commandId, moduleName, userId);

                // Launch the application
                var processStartInfo = new ProcessStartInfo
                {
                    FileName = launcherPath,
                    UseShellExecute = true
                };

                // If using Notepad++, open the mock data file
                string mockLogPath = GetMockLogPath();
                string sessionFile = Path.Combine(mockLogPath, $"session_{commandId}.json");
                if (launcherPath.Contains("notepad++", StringComparison.OrdinalIgnoreCase)
                    || launcherPath.Contains("notepad", StringComparison.OrdinalIgnoreCase))
                {
                    processStartInfo.Arguments = $"\"{sessionFile}\"";
                }
                else
                {
                    processStartInfo.Arguments = $"--module \"{moduleName}\"";
                }

                var process = Process.Start(processStartInfo);
                if (process == null) throw new Exception("Failed to start launcher process.");

                _logger.LogInformation("[LAUNCH] Launcher started. PID={Pid}", process.Id);
                await EmitAsync("command-status", new
                {
                    CommandId = commandId,
                    Status = "COMPLETED",
                    Message = $"Module '{moduleName}' launched successfully"
                });

                _logger.LogInformation("[COMPLETE] Module '{Module}' launched ✓", moduleName);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[FAILED] Module launch failed");
                await EmitAsync("command-status", new { CommandId = commandId, Status = "FAILED", Message = ex.Message });
            }
        });
    }

    /// <summary>
    /// Writes all data that would normally be sent to the Aggregator into a JSON file
    /// and opens it in the mock launcher (Notepad++). This enables end-to-end testing
    /// of the Hub → Agent → Aggregator data pipeline.
    /// </summary>
    private async Task WriteMockAggregatorData(dynamic payload, string commandId, string moduleName, string? userId)
    {
        try
        {
            string mockLogPath = GetMockLogPath();
            Directory.CreateDirectory(mockLogPath);

            var netInfo = _hardwareInfoService.GetNetworkInfo();
            var aggregator = _aggregatorDetectionService.DetectAggregator();

            var sessionData = new Dictionary<string, object?>
            {
                ["_header"] = "═══ XARC NEXUS — Mock Aggregator Session ═══",
                ["timestamp"] = DateTime.UtcNow.ToString("O"),
                ["localTime"] = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss"),
                ["session"] = new Dictionary<string, object?>
                {
                    ["commandId"] = commandId,
                    ["moduleName"] = moduleName,
                    ["userId"] = userId,
                    ["deviceId"] = _deviceId,
                    ["machineName"] = Environment.MachineName,
                },
                ["device"] = new Dictionary<string, object?>
                {
                    ["deviceId"] = _deviceId,
                    ["machineName"] = Environment.MachineName,
                    ["os"] = Environment.OSVersion.ToString(),
                    ["agentVersion"] = AgentVersion,
                    ["ipAddress"] = netInfo.PrimaryIPv4,
                    ["primaryMac"] = netInfo.PrimaryMAC,
                },
                ["aggregator"] = new Dictionary<string, object?>
                {
                    ["installed"] = aggregator.Installed,
                    ["version"] = aggregator.Version,
                    ["running"] = aggregator.IsRunning,
                },
                ["rawPayload"] = payload?.ToString(),
            };

            string sessionFile = Path.Combine(mockLogPath, $"session_{commandId}.json");
            var json = JsonSerializer.Serialize(sessionData, new JsonSerializerOptions
            {
                WriteIndented = true,
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            });

            await File.WriteAllTextAsync(sessionFile, json);
            _logger.LogInformation("[MOCK] Session data written to {File}", sessionFile);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "[MOCK] Failed to write mock aggregator data (non-fatal)");
        }
    }

    private string GetMockLogPath()
    {
        return _configuration["MockAggregatorLogPath"]
            ?? Path.Combine(AppContext.BaseDirectory, "mock-aggregator-sessions");
    }

    private async Task StartHeartbeatLoopAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("[HEARTBEAT] Heartbeat loop started (interval=10s)");

        try
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                if (_socket != null && _socket.Connected)
                {
                    try
                    {
                        await SendHeartbeatAsync();
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning("[HEARTBEAT] Failed: {Error}", ex.Message);
                    }
                }

                await Task.Delay(10_000, stoppingToken);
            }
        }
        catch (OperationCanceledException)
        {
            // Expected on shutdown
        }
        finally
        {
            Interlocked.Exchange(ref _heartbeatLoopRunning, 0);
            _logger.LogInformation("[HEARTBEAT] Heartbeat loop stopped");
        }
    }

    private async Task SendHeartbeatAsync()
    {
        var netInfo = _hardwareInfoService.GetNetworkInfo();
        var aggregator = _aggregatorDetectionService.DetectAggregator();
        await EmitAsync("heartbeat", new
        {
            DeviceId = _deviceId,
            IPAddress = netInfo.PrimaryIPv4,
            PrimaryMacAddress = netInfo.PrimaryMAC,
            NetworkInterfaces = netInfo.Interfaces,
            AggregatorInstalled = aggregator.Installed,
            AggregatorVersion = aggregator.Version,
            AggregatorRunning = aggregator.IsRunning
        });
    }

    private async Task EmitAsync(string eventName, object data)
    {
        if (_socket != null && _socket.Connected)
        {
            await _socket.EmitAsync(eventName, new[] { data });
        }
        else
        {
            _logger.LogWarning("Cannot emit '{Event}' — socket not connected", eventName);
        }
    }

    public async Task DisconnectAsync()
    {
        if (_socket != null)
        {
            _logger.LogInformation("[DISCONNECT] Disconnecting from backend");
            await _socket.DisconnectAsync();
            _socket.Dispose();
            _socket = null;
        }
    }

    private void CleanupTempFile(string filePath)
    {
        try
        {
            if (File.Exists(filePath))
            {
                File.Delete(filePath);
                _logger.LogDebug("[CLEANUP] Deleted temp file {File}", filePath);
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning("[CLEANUP] Failed to delete temp file {File}: {Error}", filePath, ex.Message);
        }
    }
}