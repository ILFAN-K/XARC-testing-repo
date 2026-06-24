using SocketIOClient;
using System.Diagnostics;

namespace VRAgent.Services;

public class SocketService
{
    private SocketIO? _socket;

    private readonly DeviceIdService _deviceIdService;
    private readonly HardwareInfoService _hardwareInfoService;
    private readonly AggregatorDetectionService _aggregatorDetectionService;
    private readonly IConfiguration _configuration;
    private readonly string _deviceId;

    public SocketIO? Socket => _socket;

    public SocketService(
        DeviceIdService deviceIdService,
        HardwareInfoService hardwareInfoService,
        AggregatorDetectionService aggregatorDetectionService,
        IConfiguration configuration)
    {
        _deviceIdService = deviceIdService;
        _hardwareInfoService = hardwareInfoService;
        _aggregatorDetectionService = aggregatorDetectionService;
        _configuration = configuration;
        _deviceId = _deviceIdService.GetDeviceId();
    }

    public async Task ConnectAsync(
        string serverUrl)
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

        _socket.OnConnected += async (_, _) =>
        {
            Console.WriteLine("Connected to NestJS. Device ID: " + _deviceId);

            var hwUuid = _hardwareInfoService.GetHardwareUuid();
            var netInfo = _hardwareInfoService.GetNetworkInfo();
            var aggregator = _aggregatorDetectionService.DetectAggregator();

            await EmitAsync("register-device", new
            {
                DeviceId = _deviceId,
                MachineName = Environment.MachineName,
                OS = Environment.OSVersion.ToString(),
                AgentVersion = "1.0.0",
                HardwareUuid = hwUuid,
                IPAddress = netInfo.PrimaryIPv4,
                PrimaryMacAddress = netInfo.PrimaryMAC,
                NetworkInterfaces = netInfo.Interfaces,
                AggregatorInstalled = aggregator.Installed,
                AggregatorVersion = aggregator.Version,
                AggregatorRunning = aggregator.IsRunning
            });

            // Fire and forget heartbeat loop
            _ = StartHeartbeatLoopAsync();
        };

        _socket.OnDisconnected += (_, _) =>
        {
            Console.WriteLine("Disconnected from NestJS. Will attempt to reconnect automatically.");
        };

        await _socket.ConnectAsync();

        _socket.On("install-aggregator", async response =>
        {
            dynamic payload = response.GetValue<dynamic>(0);
            if (payload == null)
            {
                Console.WriteLine("Null payload received");
                return;
            }
            string commandId = payload.commandId;

            await EmitAsync("command-status", new { CommandId = commandId, Status = "RECEIVED" });

            try
            {
                Console.WriteLine("[INSTALL] Command Received");
                
                string? installerUrl = payload.installerUrl?.ToString();
                string installerArgs = payload.installerArguments?.ToString() ?? "/S";
                string? expectedChecksum = payload.checksum?.ToString();

                Console.WriteLine($"[INSTALL] URL: {installerUrl}");

                if (string.IsNullOrEmpty(installerUrl))
                {
                    throw new Exception("Payload missing installerUrl.");
                }

                string tempFile = Path.Combine(Path.GetTempPath(), "aggregator_installer.exe");

                Console.WriteLine("[INSTALL] Download Started");
                using (var httpClient = new System.Net.Http.HttpClient())
                {
                    var responseStream = await httpClient.GetStreamAsync(installerUrl);
                    using (var fs = new FileStream(tempFile, FileMode.Create))
                    {
                        await responseStream.CopyToAsync(fs);
                    }
                }
                
                Console.WriteLine("[INSTALL] Download Completed");
                Console.WriteLine($"[INSTALL] File: {tempFile}");

                if (!string.IsNullOrEmpty(expectedChecksum))
                {
                    using (var sha256 = System.Security.Cryptography.SHA256.Create())
                    {
                        using (var stream = File.OpenRead(tempFile))
                        {
                            var hashBytes = sha256.ComputeHash(stream);
                            var hashString = BitConverter.ToString(hashBytes).Replace("-", "").ToLowerInvariant();
                            if (hashString != expectedChecksum.ToLowerInvariant())
                            {
                                throw new Exception($"Checksum mismatch. Expected: {expectedChecksum}, Got: {hashString}");
                            }
                        }
                    }
                }

                var processStartInfo = new ProcessStartInfo
                {
                    FileName = tempFile,
                    Arguments = installerArgs,
                    UseShellExecute = false,
                    CreateNoWindow = true
                };

                Console.WriteLine("[INSTALL] Installer Started");

                var process = Process.Start(processStartInfo);
                if (process != null)
                {
                    Console.WriteLine("[INSTALL] Waiting For Exit");
                    await process.WaitForExitAsync();
                    Console.WriteLine($"[INSTALL] Exit Code: {process.ExitCode}");
                }

                Console.WriteLine("[INSTALL] Detection Started");
                
                var aggregator = _aggregatorDetectionService.DetectAggregator();
                
                Console.WriteLine($"[INSTALL] Installed: {aggregator.Installed}");
                Console.WriteLine($"[INSTALL] Version: {aggregator.Version}");
                Console.WriteLine($"[INSTALL] Running: {aggregator.IsRunning}");

                if (!aggregator.Installed)
                {
                    throw new Exception("Installation failed. Aggregator executable not found.");
                }

                await EmitAsync("command-status", new { CommandId = commandId, Status = "COMPLETED" });
                
                // Immediately send updated heartbeat
                var netInfo = _hardwareInfoService.GetNetworkInfo();
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
            catch (Exception ex)
            {
                Console.WriteLine($"[INSTALL ERROR] {ex}");
                await EmitAsync("command-status", new { CommandId = commandId, Status = "FAILED", Message = ex.Message });
            }
        });

        _socket.On("launch-module", async response =>
        {
            dynamic payload = response.GetValue<dynamic>(0);
            if (payload == null)
            {
                Console.WriteLine("Null payload received");
                return;
            }
            string commandId = payload.commandId;
            string moduleName = payload.module;

            await EmitAsync("command-status", new { CommandId = commandId, Status = "RECEIVED" });

            try
            {
                string launcherPath = _configuration["LauncherPath"] ?? string.Empty;
                if (string.IsNullOrEmpty(launcherPath) || !System.IO.File.Exists(launcherPath))
                {
                    throw new Exception($"Launcher executable not found at: {launcherPath}");
                }

                await EmitAsync("command-status", new { CommandId = commandId, Status = "EXECUTING" });

                var processStartInfo = new ProcessStartInfo
                {
                    FileName = launcherPath,
                    Arguments = $"--module \"{moduleName}\"",
                    UseShellExecute = true
                };

                var process = Process.Start(processStartInfo);
                if (process == null) throw new Exception("Failed to start process.");

                await EmitAsync("command-status", new { CommandId = commandId, Status = "COMPLETED", Message = "XR Module started successfully" });
            }
            catch (Exception ex)
            {
                await EmitAsync("command-status", new { CommandId = commandId, Status = "FAILED", Message = ex.Message });
            }
        });
    }

    private async Task StartHeartbeatLoopAsync()
    {
        while (true)
        {
            if (_socket != null && _socket.Connected)
            {
                try
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
                catch (Exception ex)
                {
                    Console.WriteLine($"Heartbeat failed: {ex.Message}");
                }
            }
            await Task.Delay(10000);
        }
    }

    private async Task EmitAsync(string eventName, object data)
    {
        if (_socket != null && _socket.Connected)
        {
            await _socket.EmitAsync(eventName, new[] { data });
        }
    }
}