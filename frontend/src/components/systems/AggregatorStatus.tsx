export default function AgentStatus({ connectionStatus }: { connectionStatus: 'Connected' | 'Disconnected' }) {
  const isConnected = connectionStatus === 'Connected';
  const dotColor = isConnected ? 'bg-emerald-500' : 'bg-gray-400';
  const dotRing = isConnected ? 'ring-emerald-500/20' : 'ring-gray-400/20';

  return (
    <div className="flex items-center space-x-2">
      <span className="relative flex h-2 w-2">
        {isConnected && <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-60 ${dotColor}`} />}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${dotColor} opacity-80 ring-4 ${dotRing}`} />
      </span>
      <span className="text-[13px] font-medium text-gray-900">{connectionStatus}</span>
    </div>
  );
}
