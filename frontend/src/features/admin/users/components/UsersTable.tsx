'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { User } from '../types/users.types';
import DataTable, { DataTableColumn } from '@/components/tables/DataTable';
import StatusBadge from '@/components/systems/StatusBadge';
import UserActionsMenu from './UserActionsMenu';

interface UsersTableProps {
  users: User[];
  isLoading: boolean;
  totalItems: number;
  currentPage: number;
  itemsPerPage: number;
  selectedIds: Set<string>;
  onPageChange: (page: number) => void;
  onSelectRow: (id: string) => void;
  onSelectAll: () => void;
  onView: (user: User) => void;
  onEdit: (user: User) => void;
  onActivate: (id: string) => void;
  onDeactivate: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function UsersTable({
  users,
  isLoading,
  totalItems,
  currentPage,
  itemsPerPage,
  selectedIds,
  onPageChange,
  onSelectRow,
  onSelectAll,
  onView,
  onEdit,
  onActivate,
  onDeactivate,
  onDelete,
}: UsersTableProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));

  const allSelected = users.length > 0 && users.every(u => selectedIds.has(u.id));
  const someSelected = users.some(u => selectedIds.has(u.id)) && !allSelected;

  const columns: DataTableColumn<User>[] = [
    {
      key: 'checkbox',
      header: (
        <div className="flex items-center justify-center">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
            checked={allSelected}
            ref={(input) => {
              if (input) input.indeterminate = someSelected;
            }}
            onChange={onSelectAll}
          />
        </div>
      ),
      render: (row) => (
        <div className="flex items-center justify-center">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
            checked={selectedIds.has(row.id)}
            onChange={() => onSelectRow(row.id)}
          />
        </div>
      ),
      className: 'w-12 text-center',
    },
    {
      key: 'user',
      header: <div className="text-left">User</div>,
      render: (row) => {
        const name = row.fullName || 'Unknown User';
        const initials = name.substring(0, 2).toUpperCase();
        return (
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-700 shadow-sm border border-gray-200 shrink-0">
              {initials}
            </div>
            <div className="font-semibold text-gray-900 truncate max-w-[200px]">{name}</div>
          </div>
        );
      },
      className: 'text-left',
    },
    {
      key: 'email',
      header: <div className="text-left">Email Address</div>,
      render: (row) => <div className="text-left text-gray-500 truncate max-w-[250px]">{row.email}</div>,
      className: 'text-left',
    },
    {
      key: 'role',
      header: <div className="text-center">Role</div>,
      render: (row) => (
        <div className="text-center">
          <span className="text-gray-600 uppercase text-xs font-medium tracking-wider">
            {row.role}
          </span>
        </div>
      ),
      className: 'text-center',
    },
    {
      key: 'status',
      header: <div className="text-center">Status</div>,
      render: (row) => {
        // Map backend enums to UI-friendly labels
        let statusLabel = row.status;
        let badgeType = 'Offline'; // fallback
        if (row.status === 'PENDING_INVITATION') { statusLabel = 'Pending Invitation'; badgeType = 'Offline'; }
        if (row.status === 'ACTIVE') { statusLabel = 'Active'; badgeType = 'Online'; }
        if (row.status === 'INACTIVE') { statusLabel = 'Inactive'; badgeType = 'Offline'; }
        if (row.status === 'SUSPENDED') { statusLabel = 'Suspended'; badgeType = 'Offline'; }

        return (
          <div className="flex justify-center">
            <StatusBadge status={badgeType as any} label={statusLabel} />
          </div>
        );
      },
      className: 'text-center',
    },
    {
      key: 'actions',
      header: <div className="text-center">Actions</div>,
      render: (row) => (
        <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
          <UserActionsMenu
            userId={row.id}
            userName={row.fullName || row.email}
            userEmail={row.email}
          />
        </div>
      ),
      className: 'text-center w-24',
    },
  ];

  return (
    <div className="flex flex-col rounded-b-xl border-x border-b border-gray-200 bg-white shadow-sm overflow-visible -mt-px [&_table]:table-auto relative">
      <div className="min-h-[280px]">
        {isLoading ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
              <span className="text-sm font-medium text-gray-600">Loading users...</span>
            </div>
          </div>
        ) : null}
        <DataTable columns={columns} data={users} keyField="id" />
      </div>

      <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50/50 px-5 py-3 rounded-b-xl">
        <span className="text-xs font-medium text-gray-500">
          Showing {totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}–
          {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} users
        </span>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1 || isLoading}
            className="inline-flex h-8 w-8 items-center justify-center rounded border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages || totalPages === 0 || isLoading}
            className="inline-flex h-8 w-8 items-center justify-center rounded border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
