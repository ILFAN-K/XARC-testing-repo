export interface User {
  id: string;
  fullName: string | null;
  email: string;
  role: string;
  status: 'PENDING_INVITATION' | 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | string;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  adminUsers: number;
  pendingInvitations: number;
}

export interface Role {
  id: string;
  name: string;
}

export interface PaginatedUsersResponse {
  items: User[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateUserRequest {
  fullName: string;
  email: string;
  role: string;
  sendInvitation?: boolean;
}

export interface UserProfile {
  id: string;
  fullName: string | null;
  email: string;
  role: string;
  status: string;
  createdAt: string;
  lastLoginAt: string | null;
  lastActivityAt: string | null;
}

export interface UserActivity {
  id: string;
  action: string;
  description: string;
  createdAt: string;
  metadata?: any;
}

export interface PaginatedActivityResponse {
  items: UserActivity[];
  total: number;
  page: number;
  limit: number;
}

export interface UserWorkspace {
  profile: UserProfile;
  activitySummary: {
    totalActions: number;
    lastActivityAt: string | null;
  };
  recentActivities: UserActivity[];
}
