import type {
  DashboardSummary,
  LicenseStatusData,
  TopLicensedModule,
  UpcomingExpiration,
  PerformanceData,
  EfficiencyData,
  LiveSOPEntry,
  ModuleEfficiencyData,
} from '../types/dashboard.types';

/* ------------------------------------------------------------------ */
/*  Mock data — mirrors exact NestJS API response shapes.             */
/*  Swap these with real fetch calls when backend endpoints are ready. */
/* ------------------------------------------------------------------ */

/** GET /admin/dashboard/summary */
export const MOCK_DASHBOARD_SUMMARY: DashboardSummary = {
  totalRegisteredPCs: 142,
  totalLicensedPCs: 128,
  onlineSystems: 112,
  offlineSystems: 16,
  activeLicenses: 124,
  totalPurchasedLicenses: 150,
  licenseUtilization: 82.7,
};

/** GET /admin/dashboard/license-status */
export const MOCK_LICENSE_STATUS: LicenseStatusData = {
  active: 124,
  expiring: 15,
  expired: 6,
};

/** License carousel — view 2: top licensed modules */
export const MOCK_TOP_LICENSED_MODULES: TopLicensedModule[] = [
  { name: 'Fire Safety', count: 42 },
  { name: 'Access Control', count: 38 },
  { name: 'HVAC', count: 28 },
  { name: 'CCTV', count: 22 },
  { name: 'Visitor Management', count: 15 },
];

/** License carousel — view 3: upcoming expirations */
export const MOCK_UPCOMING_EXPIRATIONS: UpcomingExpiration[] = [
  { moduleName: 'Fire Safety', deviceName: 'PC-103', expiresAt: '2026-06-20T00:00:00Z' },
  { moduleName: 'HVAC', deviceName: 'PC-108', expiresAt: '2026-06-25T00:00:00Z' },
  { moduleName: 'Access Control', deviceName: 'PC-112', expiresAt: '2026-07-01T00:00:00Z' },
  { moduleName: 'CCTV', deviceName: 'PC-115', expiresAt: '2026-07-10T00:00:00Z' },
];

/** GET /admin/dashboard/performance */
export const MOCK_PERFORMANCE: PerformanceData = {
  totalUsageHours: 1240,
  period: '30d',
  dailyUsage: [
    65, 72, 80, 55, 90, 85, 78, 92, 70, 88,
    95, 60, 75, 82, 91, 68, 77, 83, 89, 93,
    71, 66, 84, 79, 87, 94, 76, 81, 86, 73,
  ],
  dailyLabels: [
    'May 15', 'May 16', 'May 17', 'May 18', 'May 19', 'May 20', 'May 21',
    'May 22', 'May 23', 'May 24', 'May 25', 'May 26', 'May 27', 'May 28',
    'May 29', 'May 30', 'May 31', 'Jun 01', 'Jun 02', 'Jun 03', 'Jun 04',
    'Jun 05', 'Jun 06', 'Jun 07', 'Jun 08', 'Jun 09', 'Jun 10', 'Jun 11',
    'Jun 12', 'Jun 13',
  ],
};

/** GET /admin/dashboard/efficiency */
export const MOCK_EFFICIENCY: EfficiencyData = {
  percentage: 88,
  label: 'Module Resource Utilization',
  weeklyData: [62, 68, 75, 71, 80, 78, 85],
};

/** GET /admin/dashboard/module-efficiency */
export const MOCK_MODULE_EFFICIENCY: ModuleEfficiencyData = {
  averageUtilization: 87,
  modules: [
    { name: 'Fire Safety', utilization: 92 },
    { name: 'Access Control', utilization: 88 },
    { name: 'HVAC', utilization: 85 },
    { name: 'CCTV', utilization: 84 },
    { name: 'Visitor Management', utilization: 78 },
  ],
};

/** GET /admin/dashboard/live-sop */
export const MOCK_LIVE_SOP: LiveSOPEntry[] = [
  { id: '1', deviceId: 'DEV-101', systemName: 'PC-101', module: 'Fire Safety', license: 'Active', status: 'ONLINE', health: 92, lastSeen: '2026-06-13T05:40:00Z' },
  { id: '2', deviceId: 'DEV-102', systemName: 'PC-102', module: 'Access Control', license: 'Active', status: 'ONLINE', health: 88, lastSeen: '2026-06-13T05:41:00Z' },
  { id: '3', deviceId: 'DEV-103', systemName: 'PC-103', module: 'HVAC Monitoring', license: 'Expiring', status: 'ONLINE', health: 85, lastSeen: '2026-06-13T05:39:00Z' },
  { id: '4', deviceId: 'DEV-104', systemName: 'PC-104', module: 'Fire Safety', license: 'Active', status: 'OFFLINE', health: 45, lastSeen: '2026-06-12T14:00:00Z' },
  { id: '5', deviceId: 'DEV-105', systemName: 'PC-105', module: 'Surveillance', license: 'Expired', status: 'OFFLINE', health: 20, lastSeen: '2026-06-06T08:00:00Z' },
  { id: '6', deviceId: 'DEV-106', systemName: 'PC-106', module: 'Access Control', license: 'Active', status: 'ONLINE', health: 95, lastSeen: '2026-06-13T05:42:00Z' },
  { id: '7', deviceId: 'DEV-107', systemName: 'PC-107', module: 'Electrical', license: 'Active', status: 'ONLINE', health: 90, lastSeen: '2026-06-13T05:38:00Z' },
  { id: '8', deviceId: 'DEV-108', systemName: 'PC-108', module: 'Fire Safety', license: 'Expiring', status: 'ONLINE', health: 78, lastSeen: '2026-06-13T05:35:00Z' },
  { id: '9', deviceId: 'DEV-109', systemName: 'PC-109', module: 'CCTV', license: 'N/A', status: 'OFFLINE', health: 30, lastSeen: '2026-05-30T12:00:00Z' },
  { id: '10', deviceId: 'DEV-110', systemName: 'PC-110', module: 'Visitor Management', license: 'Active', status: 'ONLINE', health: 82, lastSeen: '2026-06-13T05:43:00Z' },
];
