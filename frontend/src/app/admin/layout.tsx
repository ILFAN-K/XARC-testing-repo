'use client';

import AdminSidebar from '@/components/layout/AdminSidebar';
import AdminHeader from '@/components/layout/AdminHeader';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requiredRoles={['ADMIN', 'SUPERADMIN']}>
      <div
        className="font-sans min-h-screen bg-[#f5f5f5] text-gray-900 antialiased"
        style={{ colorScheme: 'light' }}
      >
        <AdminHeader />
        <AdminSidebar />
        <main className="ml-[240px] pt-[57px]">
          <div className="p-6">{children}</div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
