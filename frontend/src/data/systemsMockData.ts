import { SystemDevice, LicenseInfo, DiscoveredDevice } from '../types/system';

export const mockSystems: SystemDevice[] = [
  {
    id: 'clk1',
    systemName: 'PC-101',
    deviceId: 'NEX-7781-A1',
    machineName: 'DESKTOP-PC101',
    os: 'Windows 11 Pro',
    ipAddress: null,
    agentVersion: '2.1.0',
    license: 'Licensed',
    health: {
      score: 98,
      label: 'Healthy',
      breakdown: { cpu: 'Normal', ram: 'Normal', disk: 'Normal', agent: 'Running', license: 'Valid' }
    },
    heartbeat: '5 sec ago',
    status: 'Online',
    connectionStatus: 'Connected',
    isDisabled: false,
    registeredAt: '2026-06-10T08:00:00Z',
  },
  {
    id: 'clk2',
    systemName: 'PC-102',
    deviceId: 'NEX-7782-B2',
    machineName: 'DESKTOP-PC102',
    os: 'Windows 11 Pro',
    ipAddress: null,
    agentVersion: '2.1.0',
    license: 'Licensed',
    health: {
      score: 92,
      label: 'Healthy',
      breakdown: { cpu: 'Normal', ram: 'Normal', disk: 'Normal', agent: 'Running', license: 'Valid' }
    },
    heartbeat: '30 sec ago',
    status: 'Online',
    connectionStatus: 'Connected',
    isDisabled: false,
    registeredAt: '2026-06-10T09:00:00Z',
  },
  {
    id: 'clk3',
    systemName: 'PC-103',
    deviceId: 'NEX-7783-C3',
    machineName: 'LAB-UBUNTU-01',
    os: 'Ubuntu 22.04',
    ipAddress: null,
    agentVersion: '2.0.8',
    license: 'Pending',
    health: {
      score: 45,
      label: 'Critical',
      breakdown: { cpu: 'High', ram: 'Critical', disk: 'Normal', agent: 'Stopped', license: 'Pending' }
    },
    heartbeat: '15 min ago',
    status: 'Offline',
    connectionStatus: 'Disconnected',
    isDisabled: false,
    registeredAt: '2026-06-11T14:30:00Z',
  },
];

export const mockLicenses: LicenseInfo[] = [
  {
    licenseId: 'L-9980-A',
    moduleName: 'Fire Safety VR',
    expiration: 'Oct 12, 2025',
    status: 'Active',
    usageHrs: 1240.5,
  },
  {
    licenseId: 'L-9981-B',
    moduleName: 'Electrical Safety',
    expiration: 'Dec 01, 2025',
    status: 'Active',
    usageHrs: 842.1,
  },
  {
    licenseId: 'L-9982-C',
    moduleName: 'Forklift Safety',
    expiration: 'Jan 15, 2026',
    status: 'Expiring',
    usageHrs: 312.8,
  },
];

export const mockDiscoveredDevices: DiscoveredDevice[] = [
  {
    machineName: 'DESKTOP-ABC',
    deviceId: 'DEV-123',
    os: 'Windows 11 Pro',
    ipAddress: '192.168.1.10',
    agentVersion: '2.1.0',
    discoveredAt: '2026-06-12T10:45:00Z',
    status: 'ONLINE',
  },
  {
    machineName: 'LAB-PC-01',
    deviceId: 'DEV-124',
    os: 'Windows 10 Enterprise',
    ipAddress: '192.168.1.11',
    agentVersion: '2.1.0',
    discoveredAt: '2026-06-12T11:20:00Z',
    status: 'ONLINE',
  },
  {
    machineName: 'LAB-PC-02',
    deviceId: 'DEV-125',
    os: 'Ubuntu 22.04 LTS',
    ipAddress: '192.168.1.12',
    agentVersion: '2.0.8',
    discoveredAt: '2026-06-11T09:15:00Z',
    status: 'OFFLINE',
  },
];
