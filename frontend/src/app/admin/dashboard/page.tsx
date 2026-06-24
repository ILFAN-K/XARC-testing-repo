'use client';

import { useState, useEffect } from 'react';
import StatCard from '@/components/dashboard/StatCard';
import LicenseStatusCard from '@/features/admin/dashboard/components/LicenseStatusCard';
import AggregatePerformanceCard from '@/features/admin/dashboard/components/AggregatePerformanceCard';
import EfficiencyIndexCard from '@/features/admin/dashboard/components/EfficiencyIndexCard';
import LiveSOPTable from '@/features/admin/dashboard/components/LiveSOPTable';
import GenerateReportButton from '@/features/admin/dashboard/components/GenerateReportButton';
import {
  fetchDashboardSummary,
  fetchLicenseStatus,
  fetchPerformance,
  fetchModuleEfficiency,
  fetchLiveSOPEntries,
} from '@/features/admin/dashboard/services/dashboardApi';
import type {
  DashboardSummary,
  LicenseStatusData,
  PerformanceData,
  LiveSOPEntry,
  ModuleEfficiencyData,
} from '@/features/admin/dashboard/types/dashboard.types';
import { formatPercent } from '@/utils/formatters';

export default function AdminDashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [licenseStatus, setLicenseStatus] = useState<LicenseStatusData | null>(null);
  const [performance, setPerformance] = useState<PerformanceData | null>(null);
  const [moduleEfficiency, setModuleEfficiency] = useState<ModuleEfficiencyData | null>(null);
  const [sopEntries, setSopEntries] = useState<LiveSOPEntry[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [s, l, p, m, sop] = await Promise.all([
          fetchDashboardSummary(),
          fetchLicenseStatus(),
          fetchPerformance(),
          fetchModuleEfficiency(),
          fetchLiveSOPEntries(),
        ]);
        setSummary(s);
        setLicenseStatus(l);
        setPerformance(p);
        setModuleEfficiency(m);
        setSopEntries(sop);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Skeleton header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="h-7 w-48 animate-pulse rounded-md bg-gray-200" />
            <div className="mt-2 h-4 w-72 animate-pulse rounded-md bg-gray-200" />
          </div>
          <div className="h-9 w-36 animate-pulse rounded-md bg-gray-200" />
        </div>
        {/* Skeleton stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-gray-200" />
          ))}
        </div>
        {/* Skeleton analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 animate-pulse rounded-xl bg-gray-200" />
          ))}
        </div>
        {/* Skeleton table */}
        <div className="h-80 animate-pulse rounded-xl bg-gray-200" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <svg className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900">Failed to load dashboard</h2>
          <p className="mt-1 text-sm text-gray-500">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!summary || !licenseStatus || !performance || !moduleEfficiency || !sopEntries) {
    return null;
  }

  return (
    <div>
      {/* ---- Page header ---- */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Nexus Overview</h1>
          <p className="mt-1 text-sm text-gray-500">
            Real-time orchestration and system utilization metrics.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <GenerateReportButton />
        </div>
      </div>

      {/* ---- Statistics cards ---- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Registered PCs"
          value={summary.totalRegisteredPCs}
        />
        <StatCard
          title="Online Systems"
          value={summary.onlineSystems}
          metadata={{ type: 'dot', color: 'green' }}
        />
        <StatCard
          title="Total Licenses Purchased"
          value={summary.totalPurchasedLicenses}
        />
        <StatCard
          title="Active Licenses"
          value={summary.activeLicenses}
          metadata={{ type: 'text', label: `${formatPercent(summary.licenseUtilization)} utilization`, color: 'gray' }}
        />
      </div>

      {/* ---- Analytics section ---- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <LicenseStatusCard data={licenseStatus} />
        <AggregatePerformanceCard data={performance} />
        <EfficiencyIndexCard data={moduleEfficiency} />
      </div>

      {/* ---- Live SOP table ---- */}
      <LiveSOPTable data={sopEntries} />
    </div>
  );
}
