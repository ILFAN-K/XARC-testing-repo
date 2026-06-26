using VRAgent.Services;

namespace VRAgent;

public class Worker : BackgroundService
{
    private readonly ILogger<Worker> _logger;
    private readonly SocketService _socketService;
    private readonly IConfiguration _configuration;

    public Worker(
        ILogger<Worker> logger,
        SocketService socketService,
        IConfiguration configuration)
    {
        _logger = logger;
        _socketService = socketService;
        _configuration = configuration;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("═══ XARC Nexus VR Agent Started ═══");

        var serverUrl = _configuration["ServerUrl"] ?? "http://localhost:3001";
        _logger.LogInformation("Target backend: {ServerUrl}", serverUrl);

        try
        {
            await _socketService.ConnectAsync(serverUrl, stoppingToken);
            _logger.LogInformation("WebSocket connection established");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to connect to backend at {ServerUrl}", serverUrl);
        }

        // Keep the service alive until cancellation is requested.
        // Heartbeat and command handling run on their own async loops inside SocketService.
        try
        {
            await Task.Delay(Timeout.Infinite, stoppingToken);
        }
        catch (OperationCanceledException)
        {
            // Expected on shutdown
        }
    }

    public override async Task StopAsync(CancellationToken cancellationToken)
    {
        _logger.LogInformation("═══ XARC Nexus VR Agent Stopping ═══");

        await _socketService.DisconnectAsync();
        await base.StopAsync(cancellationToken);

        _logger.LogInformation("═══ XARC Nexus VR Agent Stopped ═══");
    }
}