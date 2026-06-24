'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Plus, CheckCircle2 } from 'lucide-react';
import RegisterDeviceModal from './RegisterDeviceModal';

export default function SystemsHeader() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();

  const [toastConfig, setToastConfig] = useState<{ show: boolean; message: string; type: string }>({
    show: false,
    message: '',
    type: 'success'
  });

  useEffect(() => {
    if (searchParams.get('action') === 'register') {
      setIsModalOpen(true);
      // Clean up the URL so refreshing doesn't reopen the modal
      router.replace('/admin/systems');
    }
  }, [searchParams, router]);

  useEffect(() => {
    const handleNotification = (e: Event) => {
      const customEvent = e as CustomEvent;
      setToastConfig({
        show: true,
        message: customEvent.detail.message,
        type: customEvent.detail.type || 'success'
      });
      setTimeout(() => setToastConfig(prev => ({ ...prev, show: false })), 5000);
    };

    window.addEventListener('showNotification', handleNotification);
    return () => window.removeEventListener('showNotification', handleNotification);
  }, []);

  return (
    <>
      {toastConfig.show && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className={`flex items-center space-x-3 px-4 py-3 rounded-lg shadow-xl ${
            toastConfig.type === 'error' ? 'bg-red-900 text-white' : 'bg-gray-900 text-white'
          }`}>
            <CheckCircle2 className={`h-5 w-5 ${toastConfig.type === 'error' ? 'text-red-400' : 'text-emerald-400'}`} />
            <span className="text-[13px] font-medium">{toastConfig.message}</span>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Systems Inventory</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage and monitor hardware nodes across the XR Nexus infrastructure.
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center justify-center rounded-md bg-black px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Register Device
          </button>
        </div>
      </div>

      <RegisterDeviceModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
  );
}
