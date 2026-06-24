'use client';

import { useState, useCallback, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Download, UserPlus } from 'lucide-react';
import { apiGet } from '@/services/api';

import {
  fetchUsers,
  fetchUserStats,
  deleteUser,
} from '../services/usersApi';
import type { User, UserStats } from '../types/users.types';

import UserStatCards from './UserStatCards';
import AdminAccountCard from './AdminAccountCard';
import UserFilters from './UserFilters';
import UsersTable from './UsersTable';
import EmptyState from './EmptyState';
import BulkActionsBar from './BulkActionsBar';

// Modals
import CreateUserModal from './CreateUserModal';
import DeleteConfirmationModal from './DeleteConfirmationModal';
import ViewUserModal from './ViewUserModal';

export default function UsersManager() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isCurrentUserLoading, setIsCurrentUserLoading] = useState(true);
  const [currentUserError, setCurrentUserError] = useState<string | null>(null);

  // API State
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStatsLoading, setIsStatsLoading] = useState(true);

  // Pagination State
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [totalItems, setTotalItems] = useState(0);

  // Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // Selection State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [viewUser, setViewUser] = useState<User | null>(null);

  // Delete State
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null); // 'bulk' or id
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Data Fetching
  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetchUsers({
        page,
        limit,
        search: searchQuery,
        role: roleFilter,
        status: statusFilter,
      });
      setUsers(response.items);
      setTotalItems(response.total);
    } catch (error) {
      console.error('Failed to load users', error);
      showToast('Failed to load users. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, searchQuery, roleFilter, statusFilter]);

  const loadStats = useCallback(async () => {
    setIsStatsLoading(true);
    try {
      const response = await fetchUserStats();
      setStats(response);
    } catch (error) {
      console.error('Failed to load stats', error);
    } finally {
      setIsStatsLoading(false);
    }
  }, []);

  const loadCurrentUser = useCallback(async () => {
    setIsCurrentUserLoading(true);
    setCurrentUserError(null);
    try {
      const res = await apiGet<{ success: boolean; user: any }>('/auth/me');
      if (res.success && res.user) {
        setCurrentUser(res.user);
      } else {
        setCurrentUserError('Failed to load user session.');
      }
    } catch (error: any) {
      console.error('Failed to load current user', error);
      setCurrentUserError(error.message || 'Error communicating with server.');
    } finally {
      setIsCurrentUserLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    loadCurrentUser();
  }, [loadCurrentUser]);

  useEffect(() => {
    if (searchParams.get('action') === 'create') {
      setIsCreateModalOpen(true);
      router.replace('/admin/users');
    }
  }, [searchParams, router]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [searchQuery, roleFilter, statusFilter]);

  // Actions
  const handleSelectRow = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === users.length && users.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(users.map(u => u.id)));
    }
  };

  const handleClearSelection = () => setSelectedIds(new Set());

  const handleActivate = (id: string) => {
    // Implement API call for activate later, for now just show toast
    showToast('Activate endpoint coming soon');
  };

  const handleDeactivate = (id: string) => {
    showToast('Deactivate endpoint coming soon');
  };

  const handleDeletePrompt = (id: string) => {
    setDeleteTarget(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (deleteTarget === 'bulk') {
      showToast('Bulk delete coming soon');
    } else if (deleteTarget) {
      try {
        await deleteUser(deleteTarget);
        showToast('User deleted successfully');
        loadUsers();
        loadStats();
        selectedIds.delete(deleteTarget);
        setSelectedIds(new Set(selectedIds));
      } catch (error) {
        showToast('Failed to delete user');
      }
    }
    setDeleteTarget(null);
    setIsDeleteModalOpen(false);
  };

  // Bulk Actions
  const handleBulkActivate = () => {
    showToast(`Bulk activate coming soon`);
  };

  const handleBulkDeactivate = () => {
    showToast(`Bulk deactivate coming soon`);
  };

  const handleBulkDeletePrompt = () => {
    setDeleteTarget('bulk');
    setIsDeleteModalOpen(true);
  };

  const handleUserCreated = () => {
    loadUsers();
    loadStats();
    // Do not auto-close the modal here so the Success State UX is visible.
    // The modal's 'Done' button or 'X' button will handle closing.
  };

  // Export CSV
  const exportCSV = useCallback(() => {
    if (users.length === 0) return;
    const headers = ['Name', 'Email', 'Role', 'Status', 'Created Date'];
    const rows = users.map(u => [u.fullName || 'Unknown', u.email, u.role, u.status, u.createdAt]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `users-export-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [users]);

  // Expose to window for external buttons to trigger modals/exports
  useEffect(() => {
    (window as any).triggerCreateUser = () => setIsCreateModalOpen(true);
    (window as any).triggerExportCSV = exportCSV;
    return () => {
      delete (window as any).triggerCreateUser;
      delete (window as any).triggerExportCSV;
    };
  }, [exportCSV]);

  // Helper toast dispatcher
  const showToast = (message: string) => {
    // In a real app this would trigger a global toast context.
    console.log('[Toast]', message);
  };

  return (
    <>
      {/* Page Header */}
      <div className="mb-10 flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Users Management</h1>
          <p className="mt-2 text-base text-gray-500">
            Manage users, roles and access permissions across the XR Nexus platform.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={exportCSV}
            className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-all hover:bg-gray-50 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2"
          >
            <Download className="mr-2 h-4 w-4 text-gray-500" />
            Export CSV
          </button>
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center justify-center rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-black hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2"
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Create New User
          </button>
        </div>
      </div>

      {/* User Statistics Section */}
      <UserStatCards 
        totalUsers={stats?.totalUsers || 0} 
        activeUsers={stats?.activeUsers || 0} 
        adminUsers={stats?.adminUsers || 0} 
        pendingInvitations={stats?.pendingInvitations || 0}
        isLoading={isStatsLoading}
      />

      {/* Administrator Account Section */}
      <AdminAccountCard 
        adminDetails={currentUser} 
        isLoading={isCurrentUserLoading}
        error={currentUserError}
      />

      {/* Filters & Search */}
      <UserFilters 
        searchQuery={searchQuery} onSearchChange={setSearchQuery}
        roleFilter={roleFilter} onRoleChange={setRoleFilter}
        statusFilter={statusFilter} onStatusChange={setStatusFilter}
      />

      {/* Data Table or Empty State */}
      {totalItems === 0 && !isLoading && !searchQuery && !roleFilter && !statusFilter ? (
        <EmptyState type="no-users" />
      ) : users.length === 0 && !isLoading ? (
        <EmptyState 
          type={searchQuery ? 'no-search' : 'no-filters'} 
          onClearFilters={() => { setSearchQuery(''); setRoleFilter(''); setStatusFilter(''); }} 
        />
      ) : (
        <UsersTable 
          users={users}
          isLoading={isLoading}
          totalItems={totalItems}
          currentPage={page}
          itemsPerPage={limit}
          selectedIds={selectedIds}
          onPageChange={setPage}
          onSelectRow={handleSelectRow}
          onSelectAll={handleSelectAll}
          onView={(u) => setViewUser(u)}
          onEdit={() => showToast('Edit modal coming soon')}
          onActivate={handleActivate}
          onDeactivate={handleDeactivate}
          onDelete={handleDeletePrompt}
        />
      )}

      {/* Bulk Actions */}
      <BulkActionsBar 
        selectedCount={selectedIds.size}
        onClearSelection={handleClearSelection}
        onActivate={handleBulkActivate}
        onDeactivate={handleBulkDeactivate}
        onDelete={handleBulkDeletePrompt}
      />

      {/* Modals */}
      <CreateUserModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
        onSuccess={handleUserCreated} 
        adminOrgName={currentUser?.organizationName || 'Not Assigned'}
      />

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        count={deleteTarget === 'bulk' ? selectedIds.size : 1}
        itemName={deleteTarget !== 'bulk' && deleteTarget ? users.find(u => u.id === deleteTarget)?.fullName || users.find(u => u.id === deleteTarget)?.email : undefined}
      />

      <ViewUserModal 
        isOpen={!!viewUser} 
        onClose={() => setViewUser(null)} 
        user={viewUser} 
      />
    </>
  );
}
