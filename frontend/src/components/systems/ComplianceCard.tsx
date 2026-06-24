'use client';

import { useState, useEffect } from 'react';
import { ShieldCheck } from 'lucide-react';
import { fetchCompliance, ComplianceResponse } from '../../services/devices.service';

export default function ComplianceCard() {
  const [data, setData] = useState<ComplianceResponse | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const compliance = await fetchCompliance();
        setData(compliance);
      } catch {
        setData(null);
      }
    };
    load();

    const handleRefresh = () => load();
    window.addEventListener('deviceStateChanged', handleRefresh);
    return () => window.removeEventListener('deviceStateChanged', handleRefresh);
  }, []);

  const percentage = data?.percentage ?? 0;
  const strokeWidth = 8;
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const label = percentage >= 90 ? 'Optimized' : percentage >= 70 ? 'Moderate' : 'Needs Attention';

  return (
    <div className="flex flex-col rounded-xl border border-gray-200 bg-white p-6 shadow-sm h-full justify-between">
      <div>
        <div className="flex items-center mb-6">
          <ShieldCheck className="h-5 w-5 text-gray-500 mr-2" />
          <h3 className="text-sm font-medium text-gray-500">
            Compliance Status
          </h3>
        </div>
        
        <div className="flex items-start mb-6">
          <div className="relative h-20 w-20 flex-shrink-0 flex items-center justify-center">
            {/* Background Circle */}
            <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 80 80">
              <circle
                cx="40"
                cy="40"
                r={radius}
                className="text-gray-100"
                strokeWidth={strokeWidth}
                stroke="currentColor"
                fill="transparent"
              />
              {/* Progress Circle */}
              <circle
                cx="40"
                cy="40"
                r={radius}
                className="text-black"
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                stroke="currentColor"
                fill="transparent"
              />
            </svg>
            <span className="absolute text-xl font-bold text-gray-900">{percentage}%</span>
          </div>
          
          <div className="ml-4 flex flex-col justify-center h-20">
            <p className="text-sm font-medium text-gray-900">{label}</p>
            <div className="mt-2 space-y-1 text-xs">
              <div className="flex justify-between space-x-4">
                <span className="text-gray-500">Licensed Systems:</span>
                <span className="font-semibold text-gray-900">{data?.licensedSystems ?? '—'}</span>
              </div>
              <div className="flex justify-between space-x-4">
                <span className="text-gray-500">Expiring Soon:</span>
                <span className="font-semibold text-yellow-600">{data?.expiringSoon ?? '—'}</span>
              </div>
              <div className="flex justify-between space-x-4">
                <span className="text-gray-500">Expired:</span>
                <span className="font-semibold text-red-600">{data?.expired ?? '—'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <button
        type="button"
        className="w-full inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-600 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 transition-colors"
      >
        Renew Assets
      </button>
    </div>
  );
}
