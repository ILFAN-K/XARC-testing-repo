'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { Search, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import DataTable, { DataTableColumn } from '../tables/DataTable';
import { SystemDevice } from '../../types/system';
import StatusBadge from './StatusBadge';
import HealthIndicator from './HealthIndicator';
import ActionsMenu from './ActionsMenu';
import DeviceDetailsDrawer from './DeviceDetailsDrawer';
import { fetchDevices, DeviceResponse } from '../../services/devices.service';

type TabId = 'all' | 'Online' | 'Offline';
type SortKey = 'systemName' | 'status' | 'health' | 'heartbeat' | null;
type SortDir = 'asc' | 'desc';

// ─── Response → Display Model ─────────────────────────────────────

function mapDeviceToSystem(d: DeviceResponse): SystemDevice {
  const hasActive = d.licenses?.some(l => l.status === 'Active');
  const hasAny = d.licenses && d.licenses.length > 0;
  
  // Single source of truth: rely exactly on the backend's provided status
  const isOnline = d.status === 'ONLINE';

  return {
    id: d.id,
    systemName: d.friendlyName || d.machineName,
    deviceId: d.deviceId,
    machineName: d.machineName,
    os: d.os || 'Unknown',
    ipAddress: d.ipAddress,
    agentVersion: d.agentVersion,
    hardwareUuid: d.hardwareUuid,
    networkInterfaces: d.networkInterfaces,
    license: hasActive ? 'Licensed' : hasAny ? 'Pending' : 'Unlicensed',
    health: {
      score: d.healthScore ?? 0,
      label: (d.healthScore ?? 0) >= 80 ? 'Healthy' : (d.healthScore ?? 0) >= 50 ? 'Warning' : 'Critical',
      breakdown: {
        cpu: 'N/A',
        ram: 'N/A',
        disk: 'N/A',
        agent: isOnline ? 'Running' : 'Stopped',
        license: hasActive ? 'Valid' : hasAny ? 'Pending' : 'None',
      },
    },
    heartbeat: d.lastSeen ? formatTimeAgo(d.lastSeen) : 'Never',
    status: isOnline ? 'Online' : 'Offline',
    connectionStatus: d.connectionStatus,
    isDisabled: d.isDisabled,
    registeredAt: d.registeredAt,
    aggregatorInstalled: d.aggregatorInstalled,
    aggregatorVersion: d.aggregatorVersion,
    aggregatorStatus: d.aggregatorStatus,
  };
}

function formatTimeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s} sec ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ─── Component ────────────────────────────────────────────────────

export default function SystemsTable() {
  const [systems, setSystems] = useState<SystemDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortKey, setSortKey] = useState<SortKey>(null);
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [drawerDeviceId, setDrawerDeviceId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const itemsPerPage = 5;

  const loadDevices = useCallback(async () => {
    try {
      const devices = await fetchDevices();
      setSystems(devices.map(mapDeviceToSystem));
    } catch (err) {
      console.error('Failed to load devices:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDevices();
  }, [loadDevices]);

  useEffect(() => {
    const handleRefresh = () => loadDevices();
    window.addEventListener('deviceRegistered', handleRefresh);
    window.addEventListener('deviceStateChanged', handleRefresh);
    return () => {
      window.removeEventListener('deviceRegistered', handleRefresh);
      window.removeEventListener('deviceStateChanged', handleRefresh);
    };
  }, [loadDevices]);

  const filteredData = useMemo(() => {
    return systems.filter((system) => {
      if (activeTab === 'Online' && system.status !== 'Online') return false;
      if (activeTab === 'Offline' && system.status !== 'Offline') return false;

      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          system.systemName.toLowerCase().includes(query) ||
          system.deviceId.toLowerCase().includes(query) ||
          system.os.toLowerCase().includes(query)
        );
      }

      return true;
    });
  }, [systems, activeTab, searchQuery]);

  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData;

    return [...filteredData].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'systemName': cmp = a.systemName.localeCompare(b.systemName); break;
        case 'status': cmp = a.status.localeCompare(b.status); break;
        case 'health': cmp = a.health.score - b.health.score; break;
        case 'heartbeat': cmp = a.heartbeat.localeCompare(b.heartbeat); break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filteredData, sortKey, sortDir]);

  const totalItems = sortedData.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedData.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedData, currentPage]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
    setCurrentPage(1);
  };

  const SortHeader = ({ label, sortField }: { label: string; sortField: SortKey }) => (
    <button
      onClick={() => handleSort(sortField)}
      className="inline-flex items-center space-x-1 text-left group"
    >
      <span>{label}</span>
      <span className="text-gray-300 group-hover:text-gray-500 transition-colors">
        {sortKey === sortField ? (
          sortDir === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
        ) : (
          <ChevronDown className="h-3 w-3 opacity-0 group-hover:opacity-100" />
        )}
      </span>
    </button>
  );

  const openDrawer = (deviceId: string) => {
    setDrawerDeviceId(deviceId);
    setDrawerOpen(true);
  };

  const columns: DataTableColumn<SystemDevice>[] = [
    {
      key: 'status',
      header: <SortHeader label="Status" sortField="status" />,
      render: (row) => <StatusBadge status={row.status as any} heartbeat={row.heartbeat} />,
    },
    {
      key: 'systemName',
      header: <SortHeader label="System Name" sortField="systemName" />,
      render: (row) => (
        <button
          onClick={() => openDrawer(row.deviceId)}
          className="font-medium text-gray-900 cursor-pointer hover:underline text-left"
        >
          {row.systemName}
        </button>
      ),
    },
    {
      key: 'deviceId',
      header: 'Device ID',
      render: (row) => <span className="font-mono text-sm text-gray-600">{row.deviceId}</span>,
    },
    {
      key: 'license',
      header: 'License',
      render: (row) => {
        if (row.license === 'Licensed') {
          return (
            <span className="inline-flex items-center rounded-full bg-gray-900 px-2 py-0.5 text-[10px] font-medium text-white shadow-sm w-max">
              Licensed
            </span>
          );
        }
        if (row.license === 'Pending') {
          return (
            <span className="inline-flex items-center rounded-full border border-amber-500/30 bg-amber-50 text-amber-700 px-2 py-0.5 text-[10px] font-medium shadow-sm w-max">
              Pending
            </span>
          );
        }
        return (
          <span className="inline-flex items-center rounded-full border border-gray-200 bg-white px-2 py-0.5 text-[10px] font-medium text-gray-600 shadow-sm w-max">
            Unlicensed
          </span>
        );
      },
    },
    {
      key: 'aggregator',
      header: 'Aggregator',
      render: (row) => {
        if (row.aggregatorStatus === 'Installed & Running') {
          return (
            <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 border border-emerald-200/50 w-max">
              Installed & Running
            </span>
          );
        }
        if (row.aggregatorStatus === 'Installed but Stopped') {
          return (
            <span className="inline-flex items-center rounded-full bg-gray-50 px-2 py-0.5 text-[10px] font-medium text-gray-700 border border-gray-200/50 w-max">
              Installed but Stopped
            </span>
          );
        }
        if (row.aggregatorStatus === 'Installing') {
          return (
            <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700 border border-blue-200/50 w-max">
              <Loader2 className="h-3 w-3 mr-1 animate-spin" /> Installing
            </span>
          );
        }
        if (row.aggregatorStatus === 'Install Failed') {
          return (
            <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-medium text-red-700 border border-red-200/50 w-max">
              Install Failed
            </span>
          );
        }
        return (
          <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700 border border-amber-200/50 w-max">
            Missing
          </span>
        );
      },
    },
    {
      key: 'health',
      header: <SortHeader label="Health" sortField="health" />,
      render: (row) => <HealthIndicator health={row.health} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div className="flex justify-center pr-4">
          <ActionsMenu
            status={row.status}
            systemName={row.systemName}
            deviceId={row.deviceId}
            isDisabled={row.isDisabled}
            aggregatorStatus={row.aggregatorStatus}
            onViewDevice={() => openDrawer(row.deviceId)}
          />
        </div>
      ),
      className: 'text-center pr-4',
    },
  ];

  return (
    <>
      <div className="flex flex-col rounded-xl border border-gray-200 bg-white shadow-sm mb-8 overflow-visible">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 p-4 gap-4">
          {/* Tabs */}
          <div className="flex rounded-md border border-gray-200 bg-gray-50/50 p-1">
            <button
              onClick={() => { setActiveTab('all'); setCurrentPage(1); }}
              className={`px-4 py-1.5 text-sm font-medium rounded ${
                activeTab === 'all'
                  ? 'bg-white text-gray-900 shadow-sm ring-1 ring-gray-200'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              All Systems
            </button>
            <button
              onClick={() => { setActiveTab('Online'); setCurrentPage(1); }}
              className={`px-4 py-1.5 text-sm font-medium rounded ${
                activeTab === 'Online'
                  ? 'bg-white text-gray-900 shadow-sm ring-1 ring-gray-200'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Online
            </button>
            <button
              onClick={() => { setActiveTab('Offline'); setCurrentPage(1); }}
              className={`px-4 py-1.5 text-sm font-medium rounded ${
                activeTab === 'Offline'
                  ? 'bg-white text-gray-900 shadow-sm ring-1 ring-gray-200'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Offline
            </button>
          </div>

          {/* Search */}
          <div className="relative max-w-sm w-full sm:w-64">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full rounded-md border border-gray-200 py-1.5 pl-9 pr-3 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 bg-gray-50/50 placeholder:text-gray-400 text-gray-900"
              placeholder="Filter systems..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center h-[280px]">
            <Loader2 className="h-6 w-6 text-gray-400 animate-spin" />
            <span className="ml-3 text-sm text-gray-500">Loading devices...</span>
          </div>
        ) : systems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[280px] text-center">
            <p className="text-sm font-medium text-gray-900">No registered devices</p>
            <p className="text-xs text-gray-500 mt-1">Register a device to see it here.</p>
          </div>
        ) : (
          <div className="min-h-[280px]">
            <DataTable
              columns={columns}
              data={paginatedData}
              keyField="deviceId"
            />
          </div>
        )}

        {/* Footer / Pagination */}
        <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50/50 px-5 py-3">
          <span className="text-xs text-gray-500">
            Showing {totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}–
            {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} systems
          </span>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="inline-flex h-8 w-8 items-center justify-center rounded border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="inline-flex h-8 w-8 items-center justify-center rounded border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <DeviceDetailsDrawer
        deviceId={drawerDeviceId}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </>
  );
}
