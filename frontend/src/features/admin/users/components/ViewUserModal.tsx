import { X } from 'lucide-react';
import type { User } from '../types/users.types';
import StatusBadge from '@/components/systems/StatusBadge';

interface ViewUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
}

export default function ViewUserModal({ isOpen, onClose, user }: ViewUserModalProps) {
  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>
      
      <div className="relative z-10 w-full max-w-md rounded-xl bg-white shadow-2xl ring-1 ring-black/5 animate-in slide-in-from-top-4 fade-in duration-200">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">User Details</h2>
          <button 
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-6">
          <div className="flex items-center gap-4 mb-8">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-xl font-bold text-gray-700 shadow-sm border border-gray-200">
              {(user.fullName || 'U').substring(0, 2).toUpperCase()}
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">{user.fullName || 'Unknown User'}</h3>
              <p className="text-sm text-gray-500">{user.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-y-6 gap-x-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">Role</p>
              <p className="text-sm font-medium text-gray-900 uppercase">{user.role}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">Status</p>
              <div className="inline-block">
                <StatusBadge 
                  status={user.status === 'ACTIVE' ? 'Online' : 'Offline'} 
                  label={
                    user.status === 'PENDING_INVITATION' ? 'Pending Invitation' :
                    user.status === 'ACTIVE' ? 'Active' :
                    user.status === 'INACTIVE' ? 'Inactive' :
                    user.status === 'SUSPENDED' ? 'Suspended' : user.status
                  } 
                />
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">Created Date</p>
              <p className="text-sm font-medium text-gray-900">{new Date(user.createdAt).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">Last Login</p>
              <p className="text-sm font-medium text-gray-900">{user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never'}</p>
            </div>
            <div className="col-span-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">User ID</p>
              <p className="text-sm font-medium text-gray-900 font-mono">{user.id}</p>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100 px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
