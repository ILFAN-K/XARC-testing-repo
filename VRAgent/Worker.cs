using VRAgent.Services;

namespace VRAgent;

public class Worker : BackgroundService
{
    private readonly ILogger<Worker> _logger;
    private readonly SocketService _socketService;

    public Worker(
        ILogger<Worker> logger,
        SocketService socketService)
    {
        _logger = logger;
        _socketService = socketService;
    }

    protected override async Task ExecuteAsync(
        CancellationToken stoppingToken)
    {
        _logger.LogInformation(
            "VRAgent started."
        );

        try
        {
            await _socketService.ConnectAsync(
                "http://localhost:3001"
            );

            _logger.LogInformation(
                "Connected to backend."
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "Failed to connect to backend."
            );
        }

        while (!stoppingToken.IsCancellationRequested)
        {
            _logger.LogInformation(
                "Agent running at: {time}",
                DateTimeOffset.Now
            );

            await Task.Delay(
                10000,
                stoppingToken
            );
        }
    }

    public override async Task StopAsync(
        CancellationToken cancellationToken)
    {
        _logger.LogInformation(
            "VRAgent stopping..."
        );

        await base.StopAsync(
            cancellationToken
        );
    }
}