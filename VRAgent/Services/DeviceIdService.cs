namespace VRAgent.Services;

public class DeviceIdService
{
    private const string FileName =
        "device-id.txt";

    public string GetDeviceId()
    {
        if (File.Exists(FileName))
        {
            return File.ReadAllText(
                FileName
            ).Trim();
        }

        string deviceId =
            $"DEV-{Guid.NewGuid():N}"
                .Substring(0, 12)
                .ToUpper();

        File.WriteAllText(
            FileName,
            deviceId
        );

        return deviceId;
    }
}