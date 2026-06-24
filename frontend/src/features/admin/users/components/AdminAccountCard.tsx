import { Settings } from 'lucide-react';
import Link from 'next/link';

interface AdminAccountCardProps {
  adminDetails: {
    fullName?: string;
    email?: string;
    status?: string;
    lastLoginAt?: string;
    createdAt?: string;
    id?: string;
    role?: string;
    organizationId?: string | null;
    organizationName?: string | null;
  } | null;
  isLoading?: boolean;
  error?: string | null;
}

export default function AdminAccountCard({ adminDetails, isLoading, error }: AdminAccountCardProps) {
  if (isLoading) {
    return (
      <div className="mb-8 flex flex-col justify-between gap-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm lg:flex-row lg:items-center animate-pulse">
        <div className="flex items-center gap-4 lg:w-[30%] shrink-0">
          <div className="h-16 w-16 rounded-full bg-gray-200" />
          <div className="flex flex-col gap-2">
            <div className="h-5 w-32 rounded bg-gray-200" />
            <div className="h-4 w-40 rounded bg-gray-200" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !adminDetails) {
    return (
      <div className="mb-8 flex items-center justify-between gap-6 rounded-xl border border-red-200 bg-red-50 p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600 font-bold text-2xl">
            !
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-red-800">Administrator Details Unavailable</h2>
            <p className="text-sm font-medium text-red-600">{error || 'Could not load current user session.'}</p>
          </div>
        </div>
      </div>
    );
  }

  const name = adminDetails.fullName || 'Unnamed Administrator';
  const email = adminDetails.email || 'No email provided';
  const role = adminDetails.role || 'Unknown Role';
  
  // Organization logic
  const orgName = adminDetails.organizationId 
    ? (adminDetails.organizationName || 'Unknown Organization') 
    : 'Not Assigned';
  
  const status = adminDetails.status === 'ACTIVE' ? 'Active' : (adminDetails.status || 'Unknown');
  
  // Format last login
  let lastLoginDisplay = 'Never Logged In';
  if (adminDetails.lastLoginAt) {
    const date = new Date(adminDetails.lastLoginAt);
    lastLoginDisplay = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
  
  // Extract initials
  const initials = name
    .split(' ')
    .filter(Boolean)
    .map(n => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <div className="mb-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-md">
      <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr_1fr_1fr_1fr_auto] gap-x-10 gap-y-6 items-center w-full">
        
        {/* Avatar + Identity */}
        <div className="flex items-center gap-4 shrink-0 min-w-[250px]">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gray-800 to-gray-900 text-white text-lg font-bold tracking-wider shadow-inner">
            {initials}
          </div>
          <div className="flex flex-col">
            <h2 className="text-xl font-bold tracking-tight text-gray-900 leading-tight">{name}</h2>
            <p className="text-sm font-medium text-gray-500 mt-0.5">{email}</p>
          </div>
        </div>
        
        {/* ROLE */}
        <div className="flex flex-col justify-center">
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Role</span>
          <div className="mt-2 flex items-start">
            <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-[12px] font-bold text-blue-700 shadow-sm">
              {role}
            </span>
          </div>
        </div>
        
        {/* ORGANIZATION */}
        <div className="flex flex-col justify-center">
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Organization</span>
          <span className="mt-2 text-[14px] font-bold text-gray-900 break-words">
            {orgName}
          </span>
        </div>
        
        {/* STATUS */}
        <div className="flex flex-col justify-center">
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Status</span>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-[10px] leading-none text-emerald-500">●</span>
            <span className="text-[14px] font-bold text-gray-900 leading-none">{status}</span>
          </div>
        </div>
        
        {/* LAST LOGIN */}
        <div className="flex flex-col justify-center">
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Last Login</span>
          <span className="mt-2 text-[14px] font-bold text-gray-900">
            {lastLoginDisplay}
          </span>
        </div>

        {/* Manage Account Button */}
        <div className="flex shrink-0 lg:justify-end">
          <Link
            href="/settings/account"
            className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition-all hover:bg-gray-50 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2"
          >
            <Settings className="mr-2 h-4 w-4 text-gray-500" />
            Manage Account
          </Link>
        </div>

      </div>
    </div>
  );
}
