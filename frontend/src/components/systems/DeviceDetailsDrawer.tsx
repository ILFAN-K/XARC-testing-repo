'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  X, Monitor, Cpu, HardDrive, MemoryStick, Activity,
  Shield, Clock, ChevronRight, Loader2, AlertCircle, KeyRound, Terminal, Package, DownloadCloud
} from 'lucide-react';
import {
  fetchDeviceById, fetchDeviceHealth, fetchDeviceActivity, installAggregator,
  DeviceResponse, DeviceHealthResponse, DeviceActivityResponse,
} from '../../services/devices.service';

interface DeviceDetailsDrawerProps {
  deviceId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function DeviceDetailsDrawer({ deviceId, isOpen, onClose }: DeviceDetailsDrawerProps) {
  const [device, setDevice] = useState<DeviceResponse | null>(null);
  const [health, setHealth] = useState<DeviceHealthResponse | null>(null);
  const [activity, setActivity] = useState<DeviceActivityResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!deviceId) return;
    setLoading(true);
    setError(null);
    try {
      const [deviceData, healthData, activityData] = await Promise.all([
        fetchDeviceById(deviceId),
        fetchDeviceHealth(deviceId).catch(() => null),
        fetchDeviceActivity(deviceId).catch(() => ({ auditLogs: [], commands: [] })),
      ]);
      setDevice(deviceData);
      setHealth(healthData);
      setActivity(activityData);
    } catch (err: any) {
      setError(err.message || 'Failed to load device details');
    } finally {
      setLoading(false);
    }
  }, [deviceId]);

  useEffect(() => {
    if (isOpen && deviceId) {
      loadData();
    }
    if (!isOpen) {
      setDevice(null);
      setHealth(null);
      setActivity(null);
    }
  }, [isOpen, deviceId, loadData]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const formatDate = (iso: string | null) => {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
      });
    } catch { return iso; }
  };

  const formatTimeAgo = (iso: string | null) => {
    if (!iso) return 'Never';
    const diff = Date.now() - new Date(iso).getTime();
    const seconds = Math.floor(diff / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const isOnline = device?.status === 'ONLINE';

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px] transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-[540px] bg-white shadow-2xl border-l border-gray-200 flex flex-col animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="min-w-0 flex-1">
            {loading ? (
              <div className="h-6 w-48 bg-gray-100 rounded animate-pulse" />
            ) : (
              <>
                <h2 className="text-lg font-semibold text-gray-900 truncate">
                  {device?.friendlyName || device?.machineName || 'Device'}
                </h2>
                <p className="text-xs font-mono text-gray-500 mt-0.5">{device?.deviceId}</p>
              </>
            )}
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-6 space-y-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="space-y-3">
                  <div className="h-4 w-32 bg-gray-100 rounded animate-pulse" />
                  <div className="h-20 bg-gray-50 rounded-lg animate-pulse" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <AlertCircle className="h-10 w-10 text-red-400 mb-3" />
              <p className="text-sm font-medium text-gray-900">Failed to load device</p>
              <p className="text-xs text-gray-500 mt-1">{error}</p>
              <button
                onClick={loadData}
                className="mt-4 inline-flex items-center rounded-md bg-gray-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-800"
              >
                Retry
              </button>
            </div>
          ) : device ? (
            <div className="p-6 space-y-6">
              {/* ─── Identity Status ─── */}
              {device.identityStatus && (
                <Section title="Identity Status" icon={<Shield className="h-4 w-4" />}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        device.identityStatus === 'Healthy' ? 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20' :
                        device.identityStatus === 'Warning' ? 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20' :
                        'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/10'
                      }`}>
                        {device.identityStatus === 'Healthy' && <Shield className="mr-1.5 h-3 w-3" />}
                        {device.identityStatus === 'Warning' && <AlertCircle className="mr-1.5 h-3 w-3" />}
                        {device.identityStatus === 'Conflict' && <AlertCircle className="mr-1.5 h-3 w-3" />}
                        {device.identityStatus}
                      </span>
                      {device.identityEventsCount !== undefined && device.identityEventsCount > 0 && (
                        <span className="text-xs font-medium text-gray-500">
                          {device.identityEventsCount} Event{device.identityEventsCount !== 1 ? 's' : ''} (24h)
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {device.recentIdentityEvents && device.recentIdentityEvents.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Recent Events</p>
                      {device.recentIdentityEvents.map((event, i) => (
                        <div key={i} className="flex items-start gap-2 bg-gray-50 rounded p-2 border border-gray-100">
                          <AlertCircle className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${
                            event.action === 'DEVICE_IDENTITY_CONFLICT' || event.action === 'DUPLICATE_DEVICE_CONNECTION'
                              ? 'text-red-500' : 'text-amber-500'
                          }`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-gray-900 truncate">
                              {event.action.replace(/_/g, ' ')}
                            </p>
                            <p className="text-[10px] text-gray-500 mt-0.5">
                              {formatTimeAgo(event.createdAt)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Section>
              )}

              {/* ─── Overview ─── */}
              <Section title="Overview" icon={<Monitor className="h-4 w-4" />}>
                <div className="grid grid-cols-2 gap-3">
                  <InfoItem label="Status">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                      isOnline ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      <span className={`mr-1.5 h-1.5 w-1.5 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                      {isOnline ? 'Online' : 'Offline'}
                    </span>
                  </InfoItem>
                  <InfoItem label="Agent">
                    <span className={`text-sm font-medium ${device.connectionStatus === 'Connected' ? 'text-emerald-600' : 'text-gray-500'}`}>
                      {device.connectionStatus}
                    </span>
                  </InfoItem>
                  <InfoItem label="Health Score">
                    <span className={`text-sm font-semibold ${
                      device.healthScore >= 80 ? 'text-emerald-600' : device.healthScore >= 50 ? 'text-amber-600' : 'text-red-600'
                    }`}>
                      {device.healthScore}/100
                    </span>
                  </InfoItem>
                  <InfoItem label="Disabled">
                    <span className={`text-sm font-medium ${device.isDisabled ? 'text-red-600' : 'text-gray-500'}`}>
                      {device.isDisabled ? 'Yes' : 'No'}
                    </span>
                  </InfoItem>
                </div>
              </Section>

              {/* ─── Device Information ─── */}
              <Section title="Device Information" icon={<Cpu className="h-4 w-4" />}>
                <div className="grid grid-cols-2 gap-3">
                  <InfoItem label="Machine Name"><span className="text-sm text-gray-900">{device.machineName}</span></InfoItem>
                  <InfoItem label="Operating System"><span className="text-sm text-gray-900">{device.os || '—'}</span></InfoItem>
                  <InfoItem label="IP Address"><span className="text-sm font-mono text-gray-900">{device.ipAddress || '—'}</span></InfoItem>
                  <InfoItem label="Hardware UUID"><span className="text-sm font-mono text-gray-900">{device.hardwareUuid || '—'}</span></InfoItem>
                  <InfoItem label="Primary MAC Address"><span className="text-sm font-mono text-gray-900">{device.primaryMacAddress || '—'}</span></InfoItem>
                  <InfoItem label="Agent Version"><span className="text-sm font-mono text-gray-900">{device.agentVersion || '—'}</span></InfoItem>
                  <InfoItem label="Registered At"><span className="text-sm text-gray-900">{formatDate(device.registeredAt)}</span></InfoItem>
                  <InfoItem label="Last Seen"><span className="text-sm text-gray-900">{formatTimeAgo(device.lastSeen)}</span></InfoItem>
                </div>
                {device.networkInterfaces && Array.isArray(device.networkInterfaces) && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">Network Interfaces</p>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {device.networkInterfaces.map((nic: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center bg-gray-50 rounded px-3 py-1.5 text-xs">
                          <span className="font-medium text-gray-700 truncate max-w-[150px]">{nic.Name || nic.Description}</span>
                          <span className="font-mono text-gray-500">{nic.IPv4}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Section>

              {/* ─── Aggregator Information ─── */}
              <Section title="Aggregator Information" icon={<Package className="h-4 w-4" />}>
                <div className="grid grid-cols-2 gap-3">
                  <InfoItem label="Status">
                    {device.aggregatorStatus === 'Installed & Running' && (
                      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 border border-emerald-200/50 w-max">
                        Installed & Running
                      </span>
                    )}
                    {device.aggregatorStatus === 'Installed but Stopped' && (
                      <span className="inline-flex items-center rounded-full bg-gray-50 px-2 py-0.5 text-[11px] font-medium text-gray-700 border border-gray-200/50 w-max">
                        Installed but Stopped
                      </span>
                    )}
                    {device.aggregatorStatus === 'Installing' && (
                      <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700 border border-blue-200/50 w-max">
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" /> Installing
                      </span>
                    )}
                    {device.aggregatorStatus === 'Install Failed' && (
                      <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-700 border border-red-200/50 w-max">
                        Install Failed
                      </span>
                    )}
                    {device.aggregatorStatus === 'Missing' && (
                      <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700 border border-amber-200/50 w-max">
                        Missing
                      </span>
                    )}
                  </InfoItem>
                  <InfoItem label="Version"><span className="text-sm font-mono text-gray-900">{device.aggregatorVersion || '—'}</span></InfoItem>
                  <InfoItem label="Last Verified"><span className="text-sm text-gray-900">{formatDate(device.aggregatorVerifiedAt)}</span></InfoItem>
                </div>
                {device.status === 'ONLINE' && (device.aggregatorStatus === 'Missing' || device.aggregatorStatus === 'Install Failed') && (
                  <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end">
                    <button
                      onClick={async () => {
                        try {
                          await installAggregator(device.deviceId);
                          await loadData();
                        } catch (e: any) {
                          alert(e.message || 'Failed to initiate installation');
                        }
                      }}
                      className="inline-flex items-center rounded-md bg-gray-900 px-3 py-2 text-xs font-medium text-white shadow-sm hover:bg-gray-800 transition-colors"
                    >
                      <DownloadCloud className="mr-2 h-4 w-4" />
                      Install Aggregator
                    </button>
                  </div>
                )}
              </Section>

              {/* ─── License Information ─── */}
              <Section title="License Information" icon={<KeyRound className="h-4 w-4" />}>
                {device.licenses && device.licenses.length > 0 ? (
                  <div className="space-y-2">
                    {device.licenses.map((lic) => (
                      <div key={lic.id} className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2.5">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{lic.moduleName}</p>
                          <p className="text-xs text-gray-500 mt-0.5">Expires {formatDate(lic.expiresAt)}</p>
                        </div>
                        <span className={`inline-flex items-center rounded-sm px-2 py-0.5 text-[11px] font-medium ${
                          lic.status === 'Active' ? 'bg-emerald-50 text-emerald-700' :
                          lic.status === 'Expiring' ? 'bg-amber-50 text-amber-700' :
                          'bg-red-50 text-red-700'
                        }`}>
                          {lic.status}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 text-center py-4">No licenses assigned</p>
                )}
              </Section>

              {/* ─── Monitoring Summary ─── */}
              <Section title="Monitoring Summary" icon={<Activity className="h-4 w-4" />}>
                {health ? (
                  <div className="grid grid-cols-3 gap-3">
                    <MetricCard label="CPU" value={health.breakdown.cpu} unit="%" />
                    <MetricCard label="Memory" value={health.breakdown.memory} unit="%" />
                    <MetricCard label="Disk" value={health.breakdown.disk} unit="%" />
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 text-center py-4">No monitoring data available</p>
                )}
              </Section>

              {/* ─── Recent Activity ─── */}
              <Section title="Recent Activity" icon={<Clock className="h-4 w-4" />}>
                {activity && (activity.auditLogs.length > 0 || activity.commands.length > 0) ? (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {activity.auditLogs.slice(0, 10).map((log) => (
                      <div key={log.id} className="flex items-start space-x-3 rounded-lg border border-gray-50 px-3 py-2">
                        <Shield className="h-3.5 w-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-gray-900 truncate">
                            {log.action.replace(/_/g, ' ')}
                          </p>
                          <p className="text-[11px] text-gray-500">{formatTimeAgo(log.createdAt)}</p>
                        </div>
                      </div>
                    ))}
                    {activity.commands.slice(0, 10).map((cmd) => (
                      <div key={cmd.id} className="flex items-start space-x-3 rounded-lg border border-gray-50 px-3 py-2">
                        <Terminal className="h-3.5 w-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-gray-900 truncate">
                            {cmd.type.replace(/_/g, ' ')}
                            <span className={`ml-2 inline-flex rounded-sm px-1.5 py-0.5 text-[10px] font-medium ${
                              cmd.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700' :
                              cmd.status === 'FAILED' ? 'bg-red-50 text-red-700' :
                              cmd.status === 'SENT' ? 'bg-blue-50 text-blue-700' :
                              'bg-gray-50 text-gray-600'
                            }`}>{cmd.status}</span>
                          </p>
                          <p className="text-[11px] text-gray-500">{formatTimeAgo(cmd.createdAt)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 text-center py-4">No recent activity</p>
                )}
              </Section>
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}

// ─── Subcomponents ────────────────────────────────────────────────

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center space-x-2 mb-3">
        <span className="text-gray-400">{icon}</span>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{title}</h3>
      </div>
      <div className="rounded-lg border border-gray-100 bg-gray-50/30 p-3">
        {children}
      </div>
    </div>
  );
}

function InfoItem({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-medium text-gray-500 mb-0.5">{label}</p>
      {children}
    </div>
  );
}

function MetricCard({ label, value, unit }: { label: string; value: number | null; unit: string }) {
  const displayValue = value !== null ? `${Math.round(value)}${unit}` : '—';
  const color = value === null ? 'text-gray-400' :
    value < 60 ? 'text-emerald-600' :
    value < 85 ? 'text-amber-600' : 'text-red-600';

  return (
    <div className="flex flex-col items-center rounded-lg border border-gray-100 bg-white px-3 py-3">
      <span className="text-[11px] font-medium text-gray-500 mb-1">{label}</span>
      <span className={`text-lg font-bold ${color}`}>{displayValue}</span>
    </div>
  );
}
