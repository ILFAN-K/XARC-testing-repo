'use client';

import { useState } from 'react';

/* ------------------------------------------------------------------ */
/*  HorizontalBarList — labeled horizontal progress bars              */
/*  Each bar shows: module name, colored fill, percentage value       */
/* ------------------------------------------------------------------ */
export interface HorizontalBarItem {
  name: string;
  value: number; // 0–100
}

interface HorizontalBarListProps {
  items: HorizontalBarItem[];
  /** Fill colour for the progress bars. */
  color?: string;
  /** Maximum value for the bar (default 100). */
  max?: number;
}

export default function HorizontalBarList({
  items,
  color = '#e97a2b',
  max = 100,
}: HorizontalBarListProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <div className="space-y-3">
      {items.map((item, index) => {
        const pct = Math.min((item.value / max) * 100, 100);
        const isHovered = hoveredIndex === index;

        return (
          <div
            key={item.name}
            className="group relative"
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            {/* Label row */}
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-gray-600 truncate mr-2">
                {item.name}
              </span>
              <span className="text-xs font-semibold text-gray-900 tabular-nums shrink-0">
                {item.value}%
              </span>
            </div>

            {/* Bar */}
            <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${pct}%`,
                  backgroundColor: color,
                  opacity: isHovered ? 1 : 0.75,
                }}
              />
            </div>

            {/* Hover tooltip */}
            {isHovered && (
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-3 py-1.5 rounded-lg shadow-lg text-xs whitespace-nowrap z-10 pointer-events-none">
                <p className="text-gray-400">{item.name}</p>
                <p className="font-semibold">{item.value}% Utilization</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
