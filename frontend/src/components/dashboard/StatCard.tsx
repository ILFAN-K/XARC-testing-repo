import type { ReactNode } from 'react';

/* ------------------------------------------------------------------ */
/*  Metadata variants — discriminated union for type-safe rendering   */
/* ------------------------------------------------------------------ */
type StatCardMetadata =
  | { type: 'badge'; label: string; color: 'green' | 'red' | 'orange' }
  | { type: 'dot'; color: 'green' | 'red' | 'orange' | 'gray' }
  | { type: 'text'; label: string; color: 'green' | 'red' | 'orange' | 'gray' };

export interface StatCardProps {
  /** Card heading, e.g. "Total Licensed PCs" */
  title: string;
  /** Primary metric value */
  value: string | number;
  /** Optional trailing indicator beside the value */
  metadata?: StatCardMetadata;
  /** Optional icon rendered in the card (future use) */
  icon?: ReactNode;
}

/* ---- colour look-ups ---- */
const BADGE_COLORS: Record<string, string> = {
  green: 'bg-emerald-50 text-emerald-600',
  red: 'bg-red-50 text-red-600',
  orange: 'bg-orange-50 text-orange-600',
};

const DOT_COLORS: Record<string, string> = {
  green: 'bg-emerald-500',
  red: 'bg-red-500',
  orange: 'bg-orange-500',
  gray: 'bg-gray-400',
};

const TEXT_COLORS: Record<string, string> = {
  green: 'text-emerald-600',
  red: 'text-red-500',
  orange: 'text-orange-500',
  gray: 'text-gray-500',
};

/* ---- metadata renderer ---- */
function MetadataSlot({ meta }: { meta: StatCardMetadata }) {
  switch (meta.type) {
    case 'badge':
      return (
        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-semibold ${BADGE_COLORS[meta.color]}`}>
          {meta.label}
        </span>
      );
    case 'dot':
      return <span className={`w-2 h-2 rounded-full ${DOT_COLORS[meta.color]}`} />;
    case 'text':
      return (
        <span className={`text-sm font-medium ${TEXT_COLORS[meta.color]}`}>
          {meta.label}
        </span>
      );
  }
}

/* ------------------------------------------------------------------ */
/*  StatCard — reusable stat metric card                              */
/* ------------------------------------------------------------------ */
export default function StatCard({ title, value, metadata, icon }: StatCardProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-5 py-4 transition-shadow hover:shadow-sm">
      <p className="text-xs font-medium text-gray-500 mb-2">{title}</p>
      <div className="flex items-center gap-2">
        {icon && <span className="shrink-0">{icon}</span>}
        <span className="text-[26px] font-bold leading-tight text-gray-900">
          {value}
        </span>
        {metadata && <MetadataSlot meta={metadata} />}
      </div>
    </div>
  );
}
