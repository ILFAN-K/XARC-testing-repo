'use client';

import HorizontalBarList from '@/components/charts/HorizontalBarList';
import type { ModuleEfficiencyData } from '../types/dashboard.types';

/* ------------------------------------------------------------------ */
/*  EfficiencyIndexCard                                               */
/*  Redesigned: horizontal bars per module + average KPI headline     */
/* ------------------------------------------------------------------ */
interface EfficiencyIndexCardProps {
  data: ModuleEfficiencyData;
}

export default function EfficiencyIndexCard({ data }: EfficiencyIndexCardProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 flex flex-col justify-between h-full">
      <div>
        <p className="text-[10px] font-semibold tracking-[0.15em] text-gray-500 uppercase mb-2">
          Efficiency Index
        </p>
        <p className="text-[38px] font-bold text-gray-900 leading-none">
          {data.averageUtilization}%
        </p>
        <p className="text-[13px] text-gray-500 mt-2">Average Module Utilization</p>
      </div>

      <div className="mt-5">
        <HorizontalBarList
          items={data.modules.map((m) => ({ name: m.name, value: m.utilization }))}
          color="#e97a2b"
        />
      </div>
    </div>
  );
}
