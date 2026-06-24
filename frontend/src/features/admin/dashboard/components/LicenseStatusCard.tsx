'use client';

import { useState, useCallback } from 'react';
import DonutChart from '@/components/charts/DonutChart';
import type { LicenseStatusData } from '../types/dashboard.types';

/* ------------------------------------------------------------------ */
/*  LicenseStatusCard                                                 */
/*  Large donut (70%) + side information panel (30%).                  */
/*  Hover a segment → panel updates with type, count, percentage.     */
/*  No floating tooltips. No legend below. Clean enterprise layout.   */
/* ------------------------------------------------------------------ */
interface LicenseStatusCardProps {
  data: LicenseStatusData;
}

type LicenseKey = keyof LicenseStatusData;

const SEGMENTS: { key: LicenseKey; label: string; color: string }[] = [
  { key: 'active', label: 'Active', color: '#22c55e' },
  { key: 'expiring', label: 'Expiring', color: '#f97316' },
  { key: 'expired', label: 'Expired', color: '#ef4444' },
];

export default function LicenseStatusCard({ data }: LicenseStatusCardProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const total = data.active + data.expiring + data.expired;

  const chartData = SEGMENTS.map((s) => ({
    name: s.label,
    value: data[s.key],
    color: s.color,
  }));

  const handleSegmentHover = useCallback((index: number | null) => {
    setHoveredIndex(index);
  }, []);

  /* Derive what to show in the info panel */
  const activeSegment = hoveredIndex !== null ? SEGMENTS[hoveredIndex] : null;
  const activeCount = activeSegment ? data[activeSegment.key] : null;
  const activePct = activeCount !== null && total > 0
    ? ((activeCount / total) * 100).toFixed(1)
    : null;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 h-full flex flex-col">
      <h3 className="text-base font-semibold text-gray-900 mb-3 shrink-0">License Status</h3>

      {/* ---- 70 / 30 layout: chart | info panel ---- */}
      <div className="flex items-center flex-1 min-h-0 gap-3">
        {/* Donut — ~70% */}
        <div className="flex items-center justify-center" style={{ flex: '0 0 60%' }}>
          <DonutChart
            data={chartData}
            centerValue={String(total)}
            centerLabel="Licenses"
            size={170}
            innerRadius="62%"
            outerRadius="88%"
            activeIndex={hoveredIndex}
            onSegmentHover={handleSegmentHover}
          />
        </div>

        {/* Info panel — ~30% */}
        <div className="flex-1 min-w-0 flex flex-col justify-center py-1">
          {activeSegment && activeCount !== null ? (
            /* ---- Hovered state: show single segment detail ---- */
            <div className="transition-opacity duration-200">
              <div className="flex items-center gap-2 mb-1.5">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: activeSegment.color }}
                />
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  {activeSegment.label}
                </span>
              </div>
              <p className="text-[28px] font-bold text-gray-900 leading-none tabular-nums">
                {activeCount}
              </p>
              <p className="text-xs text-gray-500 mt-1">Licenses</p>
              <p
                className="text-sm font-semibold mt-2.5 tabular-nums"
                style={{ color: activeSegment.color }}
              >
                {activePct}%
              </p>
            </div>
          ) : (
            /* ---- Default state: show all three as compact list ---- */
            <div className="space-y-2.5">
              {SEGMENTS.map((seg) => {
                const count = data[seg.key];
                const pct = total > 0 ? ((count / total) * 100).toFixed(1) : '0.0';
                return (
                  <div
                    key={seg.key}
                    className="flex items-center gap-2"
                  >
                    <div className="p-1 -ml-1">
                      <div
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: seg.color }}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between">
                        <span className="text-xs text-gray-600">{seg.label}</span>
                        <span className="text-xs font-semibold text-gray-900 tabular-nums ml-2">
                          {count}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-400 tabular-nums">{pct}%</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
