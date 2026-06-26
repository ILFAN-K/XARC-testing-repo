using System.Management;
using System.Net.NetworkInformation;
using System.Net.Sockets;

namespace VRAgent.Services;

public class HardwareInfoService
{
    private readonly ILogger<HardwareInfoService> _logger;

    public HardwareInfoService(ILogger<HardwareInfoService> logger)
    {
        _logger = logger;
    }

    public string GetHardwareUuid()
    {
        try
        {
            using var searcher = new ManagementObjectSearcher("SELECT UUID FROM Win32_ComputerSystemProduct");
            using var collection = searcher.Get();
            foreach (var item in collection)
            {
                var uuid = item["UUID"]?.ToString();
                if (!string.IsNullOrEmpty(uuid))
                {
                    return uuid;
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning("Failed to get Hardware UUID: {Error}", ex.Message);
        }
        
        return "UNKNOWN-UUID";
    }

    public NetworkInfo GetNetworkInfo()
    {
        var result = new NetworkInfo
        {
            Interfaces = new List<NetworkInterfaceData>()
        };

        try
        {
            foreach (var nic in NetworkInterface.GetAllNetworkInterfaces())
            {
                if (nic.OperationalStatus != OperationalStatus.Up)
                    continue;

                // Ignore Loopback
                if (nic.NetworkInterfaceType == NetworkInterfaceType.Loopback)
                    continue;

                var props = nic.GetIPProperties();
                var ipv4 = props.UnicastAddresses
                    .FirstOrDefault(ip => ip.Address.AddressFamily == AddressFamily.InterNetwork)?.Address.ToString();

                var mac = nic.GetPhysicalAddress().ToString();
                
                // Format MAC nicely (00:11:22:33:44:55)
                if (mac.Length == 12)
                {
                    mac = string.Join(":", Enumerable.Range(0, 6).Select(i => mac.Substring(i * 2, 2)));
                }

                if (!string.IsNullOrEmpty(ipv4))
                {
                    var data = new NetworkInterfaceData
                    {
                        Name = nic.Name,
                        Description = nic.Description,
                        Type = nic.NetworkInterfaceType.ToString(),
                        IPv4 = ipv4,
                        MAC = mac
                    };
                    
                    result.Interfaces.Add(data);

                    // Choose primary if not already selected. Prioritize physical adapters over virtual.
                    bool isVirtual = nic.Description.ToLower().Contains("virtual") || 
                                     nic.Description.ToLower().Contains("wsl") ||
                                     nic.Description.ToLower().Contains("hyper-v") ||
                                     nic.Description.ToLower().Contains("pseudo");

                    if (string.IsNullOrEmpty(result.PrimaryIPv4) && !isVirtual)
                    {
                        result.PrimaryIPv4 = ipv4;
                        result.PrimaryMAC = mac;
                    }
                }
            }

            // Fallback if no primary was selected (e.g. all are virtual like VPNs)
            if (string.IsNullOrEmpty(result.PrimaryIPv4) && result.Interfaces.Count > 0)
            {
                result.PrimaryIPv4 = result.Interfaces[0].IPv4;
                result.PrimaryMAC = result.Interfaces[0].MAC;
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning("Failed to get network info: {Error}", ex.Message);
        }

        return result;
    }
}

public class NetworkInfo
{
    public string? PrimaryIPv4 { get; set; }
    public string? PrimaryMAC { get; set; }
    public List<NetworkInterfaceData> Interfaces { get; set; } = new();
}

public class NetworkInterfaceData
{
    public string? Name { get; set; }
    public string? Description { get; set; }
    public string? Type { get; set; }
    public string? IPv4 { get; set; }
    public string? MAC { get; set; }
}
