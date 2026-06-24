'use client';

/* ------------------------------------------------------------------ */
/*  ActiveFilterChips — removable filter pills + Reset all            */
/* ------------------------------------------------------------------ */
interface FilterChip {
  key: string;
  label: string;
}

interface ActiveFilterChipsProps {
  chips: FilterChip[];
  onRemove: (key: string) => void;
  onReset: () => void;
}

export default function ActiveFilterChips({ chips, onRemove, onReset }: ActiveFilterChipsProps) {
  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 px-5 py-3 border-b border-gray-100">
      {chips.map((chip) => (
        <span
          key={chip.key}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-100 text-xs font-medium text-gray-700"
        >
          {chip.label}
          <button
            type="button"
            onClick={() => onRemove(chip.key)}
            className="ml-0.5 w-3.5 h-3.5 rounded-full inline-flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-200 transition-colors"
            aria-label={`Remove ${chip.label} filter`}
          >
            <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </span>
      ))}
      <button
        type="button"
        onClick={onReset}
        className="text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors ml-1"
      >
        Reset Filters
      </button>
    </div>
  );
}
