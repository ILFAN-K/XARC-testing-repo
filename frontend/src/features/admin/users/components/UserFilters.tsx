import { useState, useEffect } from 'react';
import { Search, RotateCcw } from 'lucide-react';
import { fetchRoles } from '../services/usersApi';
import type { Role } from '../types/users.types';

interface UserFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  roleFilter: string;
  onRoleChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
}

export default function UserFilters({
  searchQuery,
  onSearchChange,
  roleFilter,
  onRoleChange,
  statusFilter,
  onStatusChange,
}: UserFiltersProps) {
  const activeFiltersCount = (searchQuery ? 1 : 0) + (roleFilter ? 1 : 0) + (statusFilter ? 1 : 0);

  const [roles, setRoles] = useState<Role[]>([]);

  useEffect(() => {
    fetchRoles()
      .then(setRoles)
      .catch(err => console.error('Failed to load roles for filters', err));
  }, []);

  const handleClear = () => {
    onSearchChange('');
    onRoleChange('');
    onStatusChange('');
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 p-4 gap-4 bg-white rounded-t-xl border-x border-t border-gray-200">
      <div className="flex flex-col sm:flex-row items-center gap-4 flex-1">
        {/* Search */}
        <div className="relative max-w-sm w-full sm:w-64">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="block w-full rounded-md border border-gray-200 py-1.5 pl-9 pr-3 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 bg-gray-50/50 placeholder:text-gray-400 text-gray-900"
            placeholder="Search users by name or email..."
          />
        </div>

        {/* Dropdowns */}
        <div className="flex items-center gap-2">
          <select 
            value={roleFilter}
            onChange={(e) => onRoleChange(e.target.value)}
            className="block w-32 rounded-md border border-gray-200 py-1.5 pl-3 pr-8 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 bg-gray-50/50 text-gray-700 appearance-none cursor-pointer"
          >
            <option value="">All Roles</option>
            {roles.map(r => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
          <select 
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value)}
            className="block w-32 rounded-md border border-gray-200 py-1.5 pl-3 pr-8 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 bg-gray-50/50 text-gray-700 appearance-none cursor-pointer"
          >
            <option value="">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="PENDING_INVITATION">Pending</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {activeFiltersCount > 0 && (
          <span className="text-xs font-semibold text-gray-500">
            Filters Active ({activeFiltersCount})
          </span>
        )}
        <button 
          onClick={handleClear}
          disabled={activeFiltersCount === 0}
          className="flex h-8 items-center justify-center gap-2 rounded border border-gray-200 bg-white px-3 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          <RotateCcw className="h-4 w-4" />
          Clear
        </button>
      </div>
    </div>
  );
}
