export const ROLE_DASHBOARDS: Record<string, string> = {
  SUPERADMIN: '/super-admin/dashboard',
  ADMIN: '/admin/dashboard',
  INSTRUCTOR: '/instructor/dashboard',
  TRAINEE: '/trainee/dashboard',
  MANAGER: '/admin/dashboard',
};

export function getDashboardPath(role: string): string {
  return ROLE_DASHBOARDS[role] || '/login';
}

export const ROLE_LABELS: Record<string, string> = {
  SUPERADMIN: 'Super Admin',
  ADMIN: 'Admin',
  INSTRUCTOR: 'Instructor',
  TRAINEE: 'Trainee',
  MANAGER: 'Manager',
};
