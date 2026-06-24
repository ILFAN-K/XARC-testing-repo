'use client';

import {
  BarChart as RechartsBarChart,
  Bar,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import type { ReactNode } from 'react';

/* ------------------------------------------------------------------ */
/*  SimpleBarChart — thin wrapper over Recharts BarChart              */
/*  Accepts a plain number[] and renders clean, minimal bars.         */
/* ------------------------------------------------------------------ */
interface SimpleBarChartProps {
  /** Array of numeric values — one bar per entry. */
  data: number[];
  /** Fill colour for every bar. */
  color?: string;
  /** Chart container height in px. */
  height?: number;
  /** Width of each bar in px. */
  barSize?: number;
  /** Top-corner radius. */
  borderRadius?: number;
  /** Optional labels for each bar (used in tooltips). */
  labels?: string[];
  /** Custom tooltip render function. Return null to hide tooltip. */
  tooltipContent?: (value: number, label: string) => ReactNode;
}

/* ---- Custom tooltip ---- */
interface BarTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; payload: { label?: string } }>;
  renderContent?: (value: number, label: string) => ReactNode;
}

function BarTooltipContent({ active, payload, renderContent }: BarTooltipProps) {
  if (!active || !payload || payload.length === 0 || !renderContent) return null;
  const { value } = payload[0];
  const label = payload[0].payload.label || '';
  return <>{renderContent(value, label)}</>;
}

export default function SimpleBarChart({
  data,
  color = '#d1d5db',
  height = 80,
  barSize = 14,
  borderRadius = 2,
  labels,
  tooltipContent,
}: SimpleBarChartProps) {
  const chartData = data.map((value, index) => ({
    value,
    index,
    label: labels?.[index] ?? '',
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsBarChart
        data={chartData}
        margin={{ top: 4, right: 0, bottom: 0, left: 0 }}
      >
        <XAxis dataKey="index" hide />
        <YAxis hide domain={[0, 'auto']} />
        {tooltipContent && (
          <Tooltip
            content={<BarTooltipContent renderContent={tooltipContent} />}
            cursor={false}
          />
        )}
        <Bar
          dataKey="value"
          fill={color}
          radius={[borderRadius, borderRadius, 0, 0]}
          barSize={barSize}
        />
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}
