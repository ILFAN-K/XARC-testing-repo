'use client';

import SimpleBarChart from '@/components/charts/BarChart';
import type { PerformanceData } from '../types/dashboard.types';

/* ------------------------------------------------------------------ */
/*  AggregatePerformanceCard                                          */
/*  Dark card — total usage hours headline + subtle bar visualization */
/*  Hover tooltip shows date + usage hours per bar.                   */
/* ------------------------------------------------------------------ */
interface AggregatePerformanceCardProps {
  data: PerformanceData;
}

export default function AggregatePerformanceCard({ data }: AggregatePerformanceCardProps) {
  return (
    <div className="rounded-xl bg-[#141414] p-5 flex flex-col justify-between h-full overflow-hidden">
      <div>
        <p className="text-[10px] font-semibold tracking-[0.15em] text-gray-500 uppercase mb-3">
          Aggregate Performance
        </p>
        <p className="text-[38px] font-bold text-white leading-none">
          {data.totalUsageHours.toLocaleString()}h
        </p>
        <p className="text-[13px] text-gray-500 mt-2">
          Total System Usage Hours ({data.period})
        </p>
      </div>

      {/* Subtle dark bar visualization with tooltip */}
      <div className="mt-6 -mx-1">
        <SimpleBarChart
          data={data.dailyUsage}
          color="#2a2a2a"
          height={55}
          barSize={5}
          borderRadius={1}
          labels={data.dailyLabels}
          tooltipContent={(value, label) => (
            <div className="bg-white text-gray-900 px-3 py-2 rounded-lg shadow-lg text-xs border border-gray-200">
              <p className="text-gray-500 mb-0.5">{label || 'Day'}</p>
              <p className="font-semibold text-sm">{value.toFixed(1)} Hours</p>
            </div>
          )}
        />
      </div>
    </div>
  );
}
