import { apiGet, apiPost, apiDelete } from '@/services/api';
import type {
  User,
  UserStats,
  Role,
  PaginatedUsersResponse,
  CreateUserRequest,
  UserProfile,
  PaginatedActivityResponse,
  UserWorkspace,
} from '../types/users.types';

/** GET /admin/users */
export async function fetchUsers(params?: {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}): Promise<PaginatedUsersResponse> {
  const searchParams = new URLSearchParams();
  if (params) {
    if (params.page !== undefined) searchParams.set('page', String(params.page));
    if (params.limit !== undefined) searchParams.set('limit', String(params.limit));
    if (params.search) searchParams.set('search', params.search);
    if (params.role) searchParams.set('role', params.role);
    if (params.status) searchParams.set('status', params.status);
    if (params.sortBy) searchParams.set('sortBy', params.sortBy);
    if (params.sortOrder) searchParams.set('sortOrder', params.sortOrder);
  }
  
  const queryString = searchParams.toString();
  const url = `/admin/users${queryString ? `?${queryString}` : ''}`;
  
  return apiGet<PaginatedUsersResponse>(url);
}

/** GET /admin/users/stats */
export async function fetchUserStats(): Promise<UserStats> {
  return apiGet<UserStats>('/admin/users/stats');
}

/** GET /admin/users/roles */
export async function fetchRoles(): Promise<Role[]> {
  return apiGet<Role[]>('/admin/users/roles');
}

/** GET /admin/users/:id/profile */
export async function fetchUserProfile(id: string): Promise<UserProfile> {
  return apiGet<UserProfile>(`/admin/users/${id}/profile`);
}

/** GET /admin/users/:id/activity */
export async function fetchUserActivity(
  id: string,
  params?: { page?: number; limit?: number }
): Promise<PaginatedActivityResponse> {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set('page', String(params.page));
  if (params?.limit) searchParams.set('limit', String(params.limit));
  const queryString = searchParams.toString();
  
  return apiGet<PaginatedActivityResponse>(`/admin/users/${id}/activity${queryString ? `?${queryString}` : ''}`);
}

/** GET /admin/users/:id/workspace */
export async function fetchUserWorkspace(id: string): Promise<UserWorkspace> {
  return apiGet<UserWorkspace>(`/admin/users/${id}/workspace`);
}

/** POST /admin/users */
export async function createUser(data: CreateUserRequest): Promise<{ success: boolean; userId: string; invitationToken?: string }> {
  return apiPost('/admin/users', data);
}

/** POST /admin/users/:id/resend-invitation */
export async function resendInvitation(id: string): Promise<{ success: boolean; message: string }> {
  return apiPost(`/admin/users/${id}/resend-invitation`, {});
}

/** DELETE /admin/users/:id */
export async function deleteUser(id: string): Promise<{ success: boolean; message: string }> {
  return apiDelete(`/admin/users/${id}`);
}
