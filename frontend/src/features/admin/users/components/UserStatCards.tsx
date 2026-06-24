import { Users, CheckCircle, ShieldCheck, Clock } from 'lucide-react';
import StatCard from '@/components/dashboard/StatCard';

interface UserStatCardsProps {
  totalUsers: number;
  activeUsers: number;
  adminUsers: number;
  pendingInvitations: number;
  isLoading?: boolean;
}

export default function UserStatCards({
  totalUsers,
  activeUsers,
  adminUsers,
  pendingInvitations,
  isLoading,
}: UserStatCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm animate-pulse h-28">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-gray-200" />
              <div className="flex flex-col gap-2">
                <div className="h-4 w-24 rounded bg-gray-200" />
                <div className="h-6 w-12 rounded bg-gray-200" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <StatCard
        title="Total Users"
        value={totalUsers}
        icon={<Users className="h-5 w-5 text-gray-400" />}
      />
      <StatCard
        title="Active Users"
        value={activeUsers}
        icon={<CheckCircle className="h-5 w-5 text-emerald-500" />}
        metadata={{ type: 'dot', color: 'green' }}
      />
      <StatCard
        title="Admin Users"
        value={adminUsers}
        icon={<ShieldCheck className="h-5 w-5 text-blue-500" />}
      />
      <StatCard
        title="Pending Invitations"
        value={pendingInvitations}
        icon={<Clock className="h-5 w-5 text-amber-500" />}
      />
    </div>
  );
}
