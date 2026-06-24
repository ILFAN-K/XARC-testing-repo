import { Suspense } from 'react';
import UsersManager from '@/features/admin/users/components/UsersManager';

export default function UsersPage() {
  return (
    <div className="flex flex-col mx-auto max-w-[1600px] w-full">
      <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading users module...</div>}>
        <UsersManager />
      </Suspense>
    </div>
  );
}
