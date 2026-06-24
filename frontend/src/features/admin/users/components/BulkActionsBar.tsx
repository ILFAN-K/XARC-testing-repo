import { CheckCircle, Ban, Trash2, X } from 'lucide-react';

interface BulkActionsBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onActivate: () => void;
  onDeactivate: () => void;
  onDelete: () => void;
}

export default function BulkActionsBar({
  selectedCount,
  onClearSelection,
  onActivate,
  onDeactivate,
  onDelete,
}: BulkActionsBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-4 rounded-xl border border-gray-200 bg-white p-2 shadow-xl ring-1 ring-black/5 animate-in slide-in-from-bottom-10 fade-in duration-200">
      <div className="flex items-center gap-3 px-3">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-900 text-xs font-semibold text-white">
          {selectedCount}
        </span>
        <span className="text-sm font-medium text-gray-700">Users Selected</span>
      </div>

      <div className="h-6 w-px bg-gray-200"></div>

      <div className="flex items-center gap-1">
        <button
          onClick={onActivate}
          className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
        >
          <CheckCircle className="h-4 w-4 text-emerald-500" />
          Activate
        </button>
        <button
          onClick={onDeactivate}
          className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
        >
          <Ban className="h-4 w-4 text-amber-500" />
          Deactivate
        </button>
        <button
          onClick={onDelete}
          className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 hover:text-red-700"
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </button>
      </div>

      <div className="h-6 w-px bg-gray-200"></div>

      <button
        onClick={onClearSelection}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-600"
        aria-label="Clear selection"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
