export default function StatusBadge({ 
  status, 
  heartbeat,
  label
}: { 
  status: 'Online' | 'Offline' | 'Warning';
  heartbeat?: string;
  label?: string;
}) {
  const getStyles = () => {
    switch (status) {
      case 'Online':
        return { text: 'text-gray-900', dot: 'text-emerald-500' };
      case 'Offline':
        return { text: 'text-gray-900', dot: 'text-red-500' };
      case 'Warning':
        return { text: 'text-gray-900', dot: 'text-yellow-500' };
      default:
        return { text: 'text-gray-500', dot: 'text-gray-400' };
    }
  };

  const { text, dot } = getStyles();

  return (
    <div className="flex flex-col space-y-0.5">
      <div className="flex items-center space-x-2">
        <div className={`h-2 w-2 rounded-full bg-current ${dot} opacity-80`} />
        <span className={`text-[13px] font-medium ${text}`}>{label || status}</span>
      </div>
      {heartbeat && (
        <span className="text-xs text-gray-500 pl-4">{heartbeat}</span>
      )}
    </div>
  );
}
