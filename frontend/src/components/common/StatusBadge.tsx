/* ------------------------------------------------------------------ */
/*  StatusBadge — coloured pill for ONLINE / OFFLINE states           */
/* ------------------------------------------------------------------ */
interface StatusBadgeProps {
  status: 'ONLINE' | 'OFFLINE';
}

const STATUS_STYLES: Record<string, string> = {
  ONLINE: 'bg-emerald-600 text-white',
  OFFLINE: 'bg-red-500 text-white',
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-[3px] rounded text-[10px] font-bold tracking-wider ${STATUS_STYLES[status] ?? ''}`}
    >
      {status}
    </span>
  );
}
