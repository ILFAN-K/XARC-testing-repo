'use client';

import { useState, useMemo } from 'react';
import DataTable from '@/components/tables/DataTable';
import type { DataTableColumn } from '@/components/tables/DataTable';
import StatusBadge from '@/components/common/StatusBadge';
import HealthBar from '@/components/common/HealthBar';
import SOPFilterToolbar from './SOPFilterToolbar';
import ActiveFilterChips from './ActiveFilterChips';
import type { LiveSOPEntry, SOPFilters } from '../types/dashboard.types';

/* ------------------------------------------------------------------ */
/*  LiveSOPTable — System Operations Panel                            */
/*  Production-ready: filter toolbar, active chips, CSV export,       */
/*  fixed-height scrollable table body with sticky header.            */
/* ------------------------------------------------------------------ */
interface LiveSOPTableProps {
  data: LiveSOPEntry[];
}

/* ---- Helpers ---- */
const INITIAL_FILTERS: SOPFilters = {
  search: '',
  status: [],
  license: [],
  module: [],
  health: [],
  lastSeen: '',
  organization: '',
};

const LICENSE_DOT: Record<string, string> = {
  Active: 'bg-emerald-500',
  Expiring: 'bg-amber-500',
  Expired: 'bg-red-500',
  'N/A': 'bg-gray-300',
};

const HEALTH_RANGES: Record<string, [number, number]> = {
  excellent: [90, 100],
  good: [75, 89],
  warning: [50, 74],
  critical: [0, 49],
};

function matchesLastSeen(lastSeen: string | null, filter: string): boolean {
  if (!filter) return true;
  if (!lastSeen) return filter === '>7d';

  const now = new Date();
  const seen = new Date(lastSeen);
  const diffMs = now.getTime() - seen.getTime();
  const diffMin = diffMs / 60000;
  const diffHours = diffMs / 3600000;
  const diffDays = diffMs / 86400000;

  switch (filter) {
    case '5m': return diffMin <= 5;
    case '1h': return diffHours <= 1;
    case 'today': return seen.toDateString() === now.toDateString();
    case '7d': return diffDays <= 7;
    case '>7d': return diffDays > 7;
    default: return true;
  }
}

function formatLastSeen(lastSeen: string | null): string {
  if (!lastSeen) return '—';
  const now = new Date();
  const seen = new Date(lastSeen);
  const diffMs = now.getTime() - seen.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return seen.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/* ---- Column definitions ---- */
const columns: DataTableColumn<LiveSOPEntry>[] = [
  {
    key: 'systemName',
    header: 'System Name',
    render: (row) => (
      <span className="font-semibold text-gray-900">{row.systemName}</span>
    ),
  },
  {
    key: 'module',
    header: 'Module',
  },
  {
    key: 'license',
    header: 'License',
    render: (row) => (
      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full shrink-0 ${LICENSE_DOT[row.license] ?? 'bg-gray-300'}`} />
        <span>{row.license}</span>
      </div>
    ),
  },
  {
    key: 'status',
    header: 'Status',
    render: (row) => <StatusBadge status={row.status} />,
  },
  {
    key: 'health',
    header: 'Health',
    render: (row) => <HealthBar value={row.health} />,
  },
  {
    key: 'lastSeen',
    header: 'Last Seen',
    render: (row) => (
      <span className="text-gray-500 text-xs">{formatLastSeen(row.lastSeen)}</span>
    ),
  },
];

/* ---- Health label map ---- */
const HEALTH_LABELS: Record<string, string> = {
  excellent: 'Excellent',
  good: 'Good',
  warning: 'Warning',
  critical: 'Critical',
};

const LAST_SEEN_LABELS: Record<string, string> = {
  '5m': 'Last 5 Min',
  '1h': 'Last Hour',
  'today': 'Today',
  '7d': 'Last 7 Days',
  '>7d': 'Offline > 7 Days',
};

export default function LiveSOPTable({ data }: LiveSOPTableProps) {
  const [filters, setFilters] = useState<SOPFilters>(INITIAL_FILTERS);

  // Extract dynamic module list from data
  const moduleOptions = useMemo(
    () => Array.from(new Set(data.map((d) => d.module).filter(Boolean))).sort(),
    [data],
  );

  // Apply filters
  const filteredData = useMemo(() => {
    return data.filter((row) => {
      // Search
      if (filters.search) {
        const q = filters.search.toLowerCase();
        const searchable = [
          row.systemName,
          row.deviceId,
          row.module,
        ].map((s) => s?.toLowerCase() ?? '');
        if (!searchable.some((s) => s.includes(q))) return false;
      }

      // Status
      if (filters.status.length > 0) {
        const rowStatus = row.status === 'ONLINE' ? 'Online' : 'Offline';
        if (!filters.status.includes(rowStatus)) return false;
      }

      // License
      if (filters.license.length > 0) {
        const licenseValue = row.license === 'N/A' ? 'Unlicensed' : row.license;
        if (!filters.license.includes(licenseValue)) return false;
      }

      // Module
      if (filters.module.length > 0) {
        if (!filters.module.includes(row.module)) return false;
      }

      // Health
      if (filters.health.length > 0) {
        const inRange = filters.health.some((h) => {
          const range = HEALTH_RANGES[h];
          return range && row.health >= range[0] && row.health <= range[1];
        });
        if (!inRange) return false;
      }

      // Last Seen
      if (filters.lastSeen) {
        if (!matchesLastSeen(row.lastSeen, filters.lastSeen)) return false;
      }

      return true;
    });
  }, [data, filters]);

  // Build filter chips
  const chips = useMemo(() => {
    const result: { key: string; label: string }[] = [];
    if (filters.search) result.push({ key: 'search', label: `"${filters.search}"` });
    filters.status.forEach((s) => result.push({ key: `status:${s}`, label: s }));
    filters.license.forEach((l) => result.push({ key: `license:${l}`, label: l }));
    filters.module.forEach((m) => result.push({ key: `module:${m}`, label: m }));
    filters.health.forEach((h) => result.push({ key: `health:${h}`, label: HEALTH_LABELS[h] || h }));
    if (filters.lastSeen) result.push({ key: 'lastSeen', label: LAST_SEEN_LABELS[filters.lastSeen] || filters.lastSeen });
    return result;
  }, [filters]);

  // Remove single filter chip
  const handleRemoveChip = (key: string) => {
    if (key === 'search') {
      setFilters((f) => ({ ...f, search: '' }));
    } else if (key === 'lastSeen') {
      setFilters((f) => ({ ...f, lastSeen: '' }));
    } else if (key.startsWith('status:')) {
      const val = key.replace('status:', '');
      setFilters((f) => ({ ...f, status: f.status.filter((s) => s !== val) }));
    } else if (key.startsWith('license:')) {
      const val = key.replace('license:', '');
      setFilters((f) => ({ ...f, license: f.license.filter((l) => l !== val) }));
    } else if (key.startsWith('module:')) {
      const val = key.replace('module:', '');
      setFilters((f) => ({ ...f, module: f.module.filter((m) => m !== val) }));
    } else if (key.startsWith('health:')) {
      const val = key.replace('health:', '');
      setFilters((f) => ({ ...f, health: f.health.filter((h) => h !== val) }));
    }
  };

  // CSV export
  const handleExportCSV = () => {
    const headers = ['System Name', 'Module', 'License', 'Status', 'Health', 'Last Seen'];
    const rows = filteredData.map((row) => [
      row.systemName,
      row.module,
      row.license,
      row.status,
      String(row.health),
      row.lastSeen || '',
    ]);

    const csvContent = [headers, ...rows]
      .map((r) => r.map((c) => `"${c}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const date = new Date().toISOString().split('T')[0];
    link.href = url;
    link.download = `live-sop-${date}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white">
      {/* ---- Table header ---- */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <h3 className="text-base font-semibold text-gray-900">
          Live SOP{' '}
          <span className="font-normal text-gray-500">(System Operations Panel)</span>
        </h3>
        <div className="flex items-center gap-4">
          <span className="text-xs text-gray-400">
            {filteredData.length} of {data.length} devices
          </span>
          <button
            id="btn-sop-export"
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
            </svg>
            Export CSV
          </button>
        </div>
      </div>

      {/* ---- Filter toolbar ---- */}
      <SOPFilterToolbar
        filters={filters}
        onChange={setFilters}
        moduleOptions={moduleOptions}
      />

      {/* ---- Active filter chips ---- */}
      <ActiveFilterChips
        chips={chips}
        onRemove={handleRemoveChip}
        onReset={() => setFilters(INITIAL_FILTERS)}
      />

      {/* ---- Scrollable data grid (fixed height ~5 rows) ---- */}
      <div className="overflow-auto max-h-[320px]">
        <div className="min-w-[700px]">
          <DataTable<LiveSOPEntry>
            columns={columns}
            data={filteredData}
            keyField="id"
          />
        </div>
      </div>
    </div>
  );
}
