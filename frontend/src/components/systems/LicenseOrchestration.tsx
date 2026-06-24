'use client';

import { useState, useEffect } from 'react';
import { KeyRound } from 'lucide-react';
import { fetchAvailableLicenses, LicenseResponse } from '../../services/devices.service';

export default function LicenseOrchestration() {
  const [licenses, setLicenses] = useState<LicenseResponse[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchAvailableLicenses();
        setLicenses(data);
      } catch {
        setLicenses([]);
      }
    };
    load();

    const handleRefresh = () => load();
    window.addEventListener('deviceStateChanged', handleRefresh);
    return () => window.removeEventListener('deviceStateChanged', handleRefresh);
  }, []);

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return iso;
    }
  };

  return (
    <div className="flex flex-col h-full rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center px-6 py-5 border-b border-gray-100">
        <KeyRound className="h-5 w-5 text-gray-500 mr-2" />
        <h2 className="text-base font-medium text-gray-900">License Orchestration</h2>
      </div>
      <div className="flex-1 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="px-6 py-4 font-medium text-gray-500 text-[13px]">Module</th>
              <th className="px-6 py-4 font-medium text-gray-500 text-[13px]">Status</th>
              <th className="px-6 py-4 font-medium text-gray-500 text-[13px] text-right">Expires</th>
            </tr>
          </thead>
          <tbody>
            {licenses.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-6 py-8 text-center text-sm text-gray-400">
                  No licenses assigned
                </td>
              </tr>
            ) : (
              licenses.map((license) => (
                <tr key={license.id} className="border-b border-gray-50 last:border-b-0 hover:bg-gray-50/50">
                  <td className="px-6 py-4 font-medium text-gray-900">{license.moduleName}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center rounded-sm px-2 py-0.5 text-[11px] font-medium ${
                      license.status === 'Active' ? 'bg-emerald-50 text-emerald-700' :
                      license.status === 'Expiring' ? 'bg-amber-50 text-amber-700' :
                      'bg-red-50 text-red-700'
                    }`}>
                      {license.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600 text-right">{formatDate(license.expiresAt)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
