import { Suspense } from 'react';
import SystemsHeader from '@/components/systems/SystemsHeader';
import SystemsStats from '@/components/systems/SystemsStats';
import SystemsTable from '@/components/systems/SystemsTable';
import LicenseOrchestration from '@/components/systems/LicenseOrchestration';
import ComplianceCard from '@/components/systems/ComplianceCard';

export default function SystemsPage() {
  return (
    <div className="flex flex-col h-full w-full max-w-[1600px] mx-auto">
      <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading systems module...</div>}>
        <SystemsHeader />
        <SystemsStats />
        <SystemsTable />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <LicenseOrchestration />
          </div>
          <div className="lg:col-span-1">
            <ComplianceCard />
          </div>
        </div>
      </Suspense>
    </div>
  );
}
