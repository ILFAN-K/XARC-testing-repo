/* ------------------------------------------------------------------ */
/*  Dashboard API response types                                      */
/*  Structures match the planned NestJS endpoint contracts:           */
/*    GET /admin/dashboard/summary                                    */
/*    GET /admin/dashboard/license-status                             */
/*    GET /admin/dashboard/performance                                */
/*    GET /admin/dashboard/efficiency                                 */
/*    GET /admin/dashboard/live-sop                                   */
/* ------------------------------------------------------------------ */

/** GET /admin/dashboard/summary */
export interface DashboardSummary {
  totalRegisteredPCs: number;
  totalLicensedPCs: number;
  onlineSystems: number;
  offlineSystems: number;
  activeLicenses: number;
  totalPurchasedLicenses: number;
  licenseUtilization: number;
}

/** GET /admin/dashboard/license-status */
export interface LicenseStatusData {
  active: number;
  expiring: number;
  expired: number;
}

/** Top licensed module — used in License Status carousel view 2 */
export interface TopLicensedModule {
  name: string;
  count: number;
}

/** Upcoming expiration — used in License Status carousel view 3 */
export interface UpcomingExpiration {
  moduleName: string;
  deviceName: string;
  expiresAt: string;
}

/** GET /admin/dashboard/performance */
export interface PerformanceData {
  totalUsageHours: number;
  period: string;
  dailyUsage: number[];
  dailyLabels?: string[];
}

/** GET /admin/dashboard/efficiency */
export interface EfficiencyData {
  percentage: number;
  label: string;
  weeklyData: number[];
}

/** Single row in the Live SOP table — GET /admin/dashboard/live-sop */
export interface LiveSOPEntry {
  id: string;
  deviceId: string;
  systemName: string;
  module: string;
  license: 'Active' | 'Expiring' | 'Expired' | 'N/A';
  status: 'ONLINE' | 'OFFLINE';
  health: number;
  lastSeen: string | null;
}

/** Paginated wrapper for Live SOP entries. */
export interface LiveSOPResponse {
  entries: LiveSOPEntry[];
  total: number;
  page: number;
  pageSize: number;
}

/** GET /admin/dashboard/module-efficiency */
export interface ModuleEfficiency {
  name: string;
  utilization: number;
}

export interface ModuleEfficiencyData {
  averageUtilization: number;
  modules: ModuleEfficiency[];
}

/** Filter state for the Live SOP table */
export interface SOPFilters {
  search: string;
  status: string[];
  license: string[];
  module: string[];
  health: string[];
  lastSeen: string;
  organization: string;
}
