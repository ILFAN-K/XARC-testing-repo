// ─── Health ───────────────────────────────────────────────────────

export interface SystemHealth {
  score: number;
  label: 'Healthy' | 'Warning' | 'Critical';
  breakdown: {
    cpu: string;
    ram: string;
    disk: string;
    agent: string;
    license: string;
  };
}

// ─── System Device (Frontend display model) ──────────────────────

export interface SystemDevice {
  id: string;
  systemName: string;
  deviceId: string;
  machineName: string;
  os: string;
  ipAddress: string | null;
  primaryMacAddress?: string | null;
  agentVersion: string | null;
  hardwareUuid?: string | null;
  networkInterfaces?: any;
  license: 'Licensed' | 'Unlicensed' | 'Pending';
  health: SystemHealth;
  heartbeat: string;
  status: 'Online' | 'Offline' | 'Warning';
  connectionStatus: 'Connected' | 'Disconnected';
  isDisabled: boolean;
  registeredAt: string | null;
  aggregatorInstalled?: boolean;
  aggregatorVersion?: string | null;
  aggregatorStatus?: string;
  identityStatus?: 'Healthy' | 'Warning' | 'Conflict';
  identityEventsCount?: number;
  recentIdentityEvents?: any[];
}

// ─── License ──────────────────────────────────────────────────────

export interface LicenseInfo {
  licenseId: string;
  moduleName: string;
  expiration: string;
  status: string;
  usageHrs: number;
}

// ─── Discovered Device ────────────────────────────────────────────

export interface DiscoveredDevice {
  machineName: string;
  deviceId: string;
  os: string | null;
  ipAddress: string | null;
  primaryMacAddress?: string | null;
  hardwareUuid?: string | null;
  agentVersion: string | null;
  discoveredAt: string;
  status: string;
  aggregatorInstalled?: boolean;
  aggregatorVersion?: string | null;
  aggregatorStatus?: string;
}
