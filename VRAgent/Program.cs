using VRAgent;
using VRAgent.Services;

var builder = Host.CreateApplicationBuilder(args);

builder.Services.AddSingleton<DeviceIdService>();
builder.Services.AddSingleton<HardwareInfoService>();
builder.Services.AddSingleton<AggregatorDetectionService>();
builder.Services.AddSingleton<SocketService>();

builder.Services.AddHostedService<Worker>();

var host = builder.Build();
host.Run();