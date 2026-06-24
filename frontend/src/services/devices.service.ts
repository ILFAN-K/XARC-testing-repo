import { apiGet, apiPost, apiPatch, apiDelete } from '@/services/api';

// ─── Types ────────────────────────────────────────────────────────

export interface DeviceResponse {
  id: string;
  deviceId: string;
  friendlyName: string | null;
  machineName: string;
  os: string | null;
  ipAddress: string | null;
  primaryMacAddress?: string | null;
  hardwareUuid?: string | null;
  networkInterfaces?: any;
  agentVersion: string | null;
  status: string;
  connectionStatus: 'Connected' | 'Disconnected';
  isRegistered: boolean;
  isDisabled: boolean;
  registeredAt: string | null;
  discoveredAt: string;
  lastSeen: string | null;
  healthScore: number;
  isCritical: boolean;
  organizationId: string;
  organization: { id: string; name: string };
  licenses: LicenseResponse[];
  identityStatus?: 'Healthy' | 'Warning' | 'Conflict';
  identityEventsCount?: number;
  recentIdentityEvents?: AuditLogResponse[];
  aggregatorInstalled: boolean;
  aggregatorVersion: string | null;
  aggregatorStatus: string;
  aggregatorVerifiedAt: string | null;
}

export interface DiscoveredDeviceResponse {
  deviceId: string;
  machineName: string;
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

export interface LicenseResponse {
  id: string;
  moduleName: string;
  status: string;
  expiresAt: string;
  deviceId: string;
  createdAt: string;
}

export interface DeviceHealthResponse {
  deviceId: string;
  healthScore: number;
  isCritical: boolean;
  breakdown: {
    cpu: number | null;
    memory: number | null;
    disk: number | null;
    agent: string;
    license: string;
  };
}

export interface DeviceCommandResponse {
  id: string;
  type: string;
  payload: Record<string, any> | null;
  status: string;
  createdBy: string | null;
  sentAt: string | null;
  completedAt: string | null;
  failureReason: string | null;
  createdAt: string;
}

export interface AuditLogResponse {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  performedBy: string | null;
  metadata: Record<string, any> | null;
  createdAt: string;
}

export interface DeviceActivityResponse {
  auditLogs: AuditLogResponse[];
  commands: DeviceCommandResponse[];
}

export interface CommandResult {
  success: boolean;
  deviceId: string;
  commandId: string;
  message: string;
}

export interface LaunchResult {
  deviceId: string;
  moduleId: string;
  moduleName: string;
  userId: string;
  status: string;
}

export interface StatsResponse {
  totalSystems: number;
  onlineSystems: number;
  offlineSystems: number;
  unlicensedSystems: number;
}

export interface NameCheckResponse {
  available: boolean;
  reason: string | null;
}

export interface ComplianceResponse {
  percentage: number;
  licensedSystems: number;
  totalRegistered: number;
  activeLicenses: number;
  expiringSoon: number;
  expired: number;
}

// ─── KPI Stats ────────────────────────────────────────────────────

/** GET /devices/stats — KPI card data */
export async function fetchStats(): Promise<StatsResponse> {
  return apiGet<StatsResponse>('/devices/stats');
}

// ─── Name Availability ────────────────────────────────────────────

/** GET /devices/check-name?name=X&deviceId=Y — Real-time friendly name validation */
export async function checkNameAvailability(name: string, deviceId?: string): Promise<NameCheckResponse> {
  const url = deviceId 
    ? `/devices/check-name?name=${encodeURIComponent(name)}&deviceId=${encodeURIComponent(deviceId)}`
    : `/devices/check-name?name=${encodeURIComponent(name)}`;
  return apiGet<NameCheckResponse>(url);
}

// ─── Compliance ───────────────────────────────────────────────────

/** GET /devices/compliance — License compliance metrics */
export async function fetchCompliance(): Promise<ComplianceResponse> {
  return apiGet<ComplianceResponse>('/devices/compliance');
}

// ─── Device Listing ───────────────────────────────────────────────

/** GET /devices — Registered devices for Systems Inventory */
export async function fetchDevices(): Promise<DeviceResponse[]> {
  return apiGet<DeviceResponse[]>('/devices');
}

/** GET /devices/online — Online devices */
export async function fetchOnlineDevices(): Promise<DeviceResponse[]> {
  return apiGet<DeviceResponse[]>('/devices/online');
}

/** GET /devices/discovered — Unregistered devices for Register Wizard */
export async function fetchDiscoveredDevices(): Promise<DiscoveredDeviceResponse[]> {
  return apiGet<DiscoveredDeviceResponse[]>('/devices/discovered');
}

/** GET /devices/:deviceId — Single device with full details */
export async function fetchDeviceById(deviceId: string): Promise<DeviceResponse> {
  return apiGet<DeviceResponse>(`/devices/${deviceId}`);
}

// ─── Device Registration ──────────────────────────────────────────

/** POST /devices/register */
export async function registerDevice(
  deviceId: string,
  friendlyName: string,
): Promise<DeviceResponse> {
  return apiPost<{ deviceId: string; friendlyName: string }, DeviceResponse>(
    '/devices/register',
    { deviceId, friendlyName },
  );
}

// ─── Device Management ────────────────────────────────────────────

/** PATCH /devices/:deviceId/name */
export async function renameDevice(
  deviceId: string,
  friendlyName: string,
): Promise<DeviceResponse> {
  return apiPatch<{ friendlyName: string }, DeviceResponse>(
    `/devices/${deviceId}/name`,
    { friendlyName },
  );
}

/** PATCH /devices/:deviceId/disable */
export async function disableDevice(deviceId: string): Promise<DeviceResponse> {
  return apiPatch<undefined, DeviceResponse>(`/devices/${deviceId}/disable`);
}

/** PATCH /devices/:deviceId/enable */
export async function enableDevice(deviceId: string): Promise<DeviceResponse> {
  return apiPatch<undefined, DeviceResponse>(`/devices/${deviceId}/enable`);
}

/** DELETE /devices/:deviceId */
export async function removeDevice(deviceId: string): Promise<DeviceResponse> {
  return apiDelete<DeviceResponse>(`/devices/${deviceId}`);
}

// ─── Command Execution ───────────────────────────────────────────

/** POST /devices/launch */
export async function launchModule(
  deviceId: string,
  moduleId: string,
  userId: string,
): Promise<LaunchResult> {
  return apiPost<{ deviceId: string; moduleId: string; userId: string }, LaunchResult>(
    '/devices/launch',
    { deviceId, moduleId, userId },
  );
}

export async function launchMultipleDevices(
  deviceIds: string[],
  moduleId: string,
  userId: string,
): Promise<CommandResult> {
  return apiPost<{ deviceIds: string[]; moduleId: string; userId: string }, CommandResult>(
    '/devices/launch-multiple',
    { deviceIds, moduleId, userId },
  );
}

/** GET /users */
export async function fetchUsers(): Promise<any[]> {
  return apiGet<any[]>('/users');
}

/** POST /devices/:deviceId/restart-agent */
export async function restartAgent(deviceId: string): Promise<CommandResult> {
  return apiPost<Record<string, never>, CommandResult>(
    `/devices/${deviceId}/restart-agent`,
    {},
  );
}

/** POST /devices/install-aggregator */
export async function installAggregatorBulk(deviceIds: string[], all: boolean = false): Promise<any> {
  return apiPost<any, any>(
    `/devices/install-aggregator`,
    { deviceIds, all },
  );
}

export async function installAggregator(deviceId: string): Promise<any> {
  const res = await installAggregatorBulk([deviceId]);
  if (res.results && res.results.length > 0) {
      return res.results[0];
  }
  return res;
}

// ─── License & Module Management ──────────────────────────────────

/** GET /modules */
export async function fetchModules(): Promise<any[]> {
  return apiGet<any[]>('/modules');
}

/** GET /devices/licenses/available */
export async function fetchAvailableLicenses(): Promise<LicenseResponse[]> {
  return apiGet<LicenseResponse[]>('/devices/licenses/available');
}

/** POST /devices/:deviceId/license */
export async function assignLicense(
  deviceId: string,
  moduleName: string,
  expiresAt?: string,
): Promise<LicenseResponse> {
  return apiPost<{ moduleName: string; expiresAt?: string }, LicenseResponse>(
    `/devices/${deviceId}/license`,
    { moduleName, ...(expiresAt && { expiresAt }) },
  );
}

/** DELETE /devices/:deviceId/license/:licenseId */
export async function revokeLicense(
  deviceId: string,
  licenseId: string,
): Promise<{ success: boolean; message: string }> {
  return apiDelete<{ success: boolean; message: string }>(
    `/devices/${deviceId}/license/${licenseId}`,
  );
}

// ─── Device Health & Metrics ──────────────────────────────────────

/** GET /devices/:deviceId/health */
export async function fetchDeviceHealth(deviceId: string): Promise<DeviceHealthResponse> {
  return apiGet<DeviceHealthResponse>(`/devices/${deviceId}/health`);
}

/** GET /devices/:deviceId/metrics */
export async function fetchDeviceMetrics(deviceId: string): Promise<any[]> {
  return apiGet<any[]>(`/devices/${deviceId}/metrics`);
}

// ─── Device Activity ──────────────────────────────────────────────

/** GET /devices/:deviceId/activity */
export async function fetchDeviceActivity(
  deviceId: string,
): Promise<DeviceActivityResponse> {
  return apiGet<DeviceActivityResponse>(`/devices/${deviceId}/activity`);
}
