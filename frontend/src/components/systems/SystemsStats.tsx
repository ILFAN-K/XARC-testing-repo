'use client';

import { useState, useEffect } from 'react';
import { Monitor, Activity, PowerOff, ShieldAlert } from 'lucide-react';
import { fetchStats, StatsResponse } from '../../services/devices.service';

export default function SystemsStats() {
  const [data, setData] = useState<StatsResponse | null>(null);

  const loadStats = async () => {
    try {
      const stats = await fetchStats();
      setData(stats);
    } catch {
      // Fallback if API unavailable
      setData(null);
    }
  };

  useEffect(() => {
    loadStats();

    const handleRefresh = () => loadStats();
    window.addEventListener('deviceRegistered', handleRefresh);
    window.addEventListener('deviceStateChanged', handleRefresh);
    return () => {
      window.removeEventListener('deviceRegistered', handleRefresh);
      window.removeEventListener('deviceStateChanged', handleRefresh);
    };
  }, []);

  const stats = [
    { name: 'Total Systems', value: data?.totalSystems ?? '—', icon: Monitor, color: 'text-blue-600', bg: 'bg-blue-50' },
    { name: 'Online Systems', value: data?.onlineSystems ?? '—', icon: Activity, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { name: 'Offline Systems', value: data?.offlineSystems ?? '—', icon: PowerOff, color: 'text-gray-500', bg: 'bg-gray-100' },
    { name: 'Unlicensed Systems', value: data?.unlicensedSystems ?? '—', icon: ShieldAlert, color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.name}
            className="flex items-center rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-sm"
          >
            <div className={`flex h-11 w-11 items-center justify-center rounded-full ${stat.bg} mr-4`}>
              <Icon className={`h-5 w-5 ${stat.color}`} />
            </div>
            <div>
              <dt className="text-[13px] font-medium text-gray-500">
                {stat.name}
              </dt>
              <dd className="text-xl font-semibold text-gray-900">
                {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
              </dd>
            </div>
          </div>
        );
      })}
    </div>
  );
}
