'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

/* ------------------------------------------------------------------ */
/*  DonutChart — reusable Recharts donut / ring chart wrapper         */
/* ------------------------------------------------------------------ */
export interface DonutChartDataItem {
  name: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  /** Segments to render. Each entry becomes a coloured arc. */
  data: DonutChartDataItem[];
  /** Large text shown in the centre hole. */
  centerValue?: string;
  /** Smaller caption below the centre value. */
  centerLabel?: string;
  /** Pixel width & height of the chart container. */
  size?: number;
  /** Recharts inner / outer radius strings (e.g. "65%"). */
  innerRadius?: string;
  outerRadius?: string;
  /** Enable hover tooltip on segments (floating black box). */
  showTooltip?: boolean;
  /** Optional formatter for tooltip value display. */
  tooltipFormatter?: (name: string, value: number) => { label: string; display: string };
  /** Controlled active segment index (for external hover sync). */
  activeIndex?: number | null;
  /** Callback when a segment is hovered. */
  onSegmentHover?: (index: number | null) => void;
}

/* ---- Custom tooltip ---- */
interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload: DonutChartDataItem }>;
  formatter?: (name: string, value: number) => { label: string; display: string };
}

function DonutTooltipContent({ active, payload, formatter }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const { name, value } = payload[0];
  const formatted = formatter
    ? formatter(name, value)
    : { label: name, display: String(value) };

  return (
    <div className="bg-gray-900 text-white px-3 py-2 rounded-lg shadow-lg text-xs">
      <p className="text-gray-400 mb-0.5">{formatted.label}</p>
      <p className="font-semibold text-sm">{formatted.display}</p>
    </div>
  );
}

export default function DonutChart({
  data,
  centerValue,
  centerLabel,
  size = 180,
  innerRadius = '65%',
  outerRadius = '85%',
  showTooltip = false,
  tooltipFormatter,
  activeIndex,
  onSegmentHover,
}: DonutChartProps) {
  const hasExternalHover = activeIndex !== undefined && onSegmentHover !== undefined;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            dataKey="value"
            stroke="none"
            startAngle={90}
            endAngle={-270}
            onMouseEnter={hasExternalHover ? (_, index) => onSegmentHover(index) : undefined}
            onMouseLeave={hasExternalHover ? () => onSegmentHover(null) : undefined}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color}
                opacity={hasExternalHover && activeIndex !== null && activeIndex !== index ? 0.3 : 1}
                strokeWidth={hasExternalHover && activeIndex === index ? 3 : 0}
                stroke={hasExternalHover && activeIndex === index ? entry.color : 'none'}
                style={{ transition: 'opacity 0.2s ease, stroke-width 0.2s ease', cursor: hasExternalHover ? 'pointer' : 'default' }}
              />
            ))}
          </Pie>
          {showTooltip && !hasExternalHover && (
            <Tooltip
              content={<DonutTooltipContent formatter={tooltipFormatter} />}
              cursor={false}
            />
          )}
        </PieChart>
      </ResponsiveContainer>

      {/* Centre overlay text */}
      {(centerValue || centerLabel) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          {centerValue && (
            <span className="text-[22px] font-bold text-gray-900">{centerValue}</span>
          )}
          {centerLabel && (
            <span className="text-xs text-gray-500 mt-0.5">{centerLabel}</span>
          )}
        </div>
      )}
    </div>
  );
}
