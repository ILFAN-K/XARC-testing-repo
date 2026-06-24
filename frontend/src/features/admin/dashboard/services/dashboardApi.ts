import { apiGet } from '@/services/api';
import type {
  DashboardSummary,
  LicenseStatusData,
  PerformanceData,
  EfficiencyData,
  LiveSOPEntry,
  ModuleEfficiencyData,
} from '../types/dashboard.types';

export async function fetchDashboardSummary(): Promise<DashboardSummary> {
  return apiGet<DashboardSummary>('/admin/dashboard/summary');
}

export async function fetchLicenseStatus(): Promise<LicenseStatusData> {
  return apiGet<LicenseStatusData>('/admin/dashboard/license-status');
}

export async function fetchPerformance(): Promise<PerformanceData> {
  return apiGet<PerformanceData>('/admin/dashboard/performance');
}

export async function fetchEfficiency(): Promise<EfficiencyData> {
  return apiGet<EfficiencyData>('/admin/dashboard/efficiency');
}

export async function fetchLiveSOPEntries(): Promise<LiveSOPEntry[]> {
  return apiGet<LiveSOPEntry[]>('/admin/dashboard/live-sop');
}

export async function fetchModuleEfficiency(): Promise<ModuleEfficiencyData> {
  return apiGet<ModuleEfficiencyData>('/admin/dashboard/module-efficiency');
}
