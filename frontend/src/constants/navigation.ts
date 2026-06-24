import type { AdminNavGroup } from '@/types/common';

export const ADMIN_NAV_GROUPS: AdminNavGroup[] = [
  {
    items: [
      { key: 'dashboard', label: 'Dashboard', href: '/admin/dashboard' },
      { key: 'modules', label: 'Modules', href: '/admin/modules' },
      { key: 'systems', label: 'Systems', href: '/admin/systems' },
    ],
  },
  {
    items: [
      { key: 'users', label: 'Users', href: '/admin/users' },
      { key: 'monitoring', label: 'Monitoring', href: '/admin/monitoring' },
    ],
  },
  {
    items: [
      { key: 'reports', label: 'Reports', href: '/admin/reports' },
      { key: 'settings', label: 'Settings', href: '/admin/settings' },
    ],
  },
];

export const APP_VERSION = 'Nexus v2.4';
