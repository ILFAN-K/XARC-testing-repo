'use client';

import { useState } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { removeDevice } from '../../services/devices.service';

interface RemoveDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  deviceId: string;
  systemName: string;
}

export default function RemoveDeviceModal({ isOpen, onClose, deviceId, systemName }: RemoveDeviceModalProps) {
  const [isRemoving, setIsRemoving] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleRemove = async () => {
    setIsRemoving(true);
    setError('');
    try {
      await removeDevice(deviceId);
      
      // Dispatch notifications
      window.dispatchEvent(
        new CustomEvent('showNotification', {
          detail: { type: 'success', message: 'Device removed successfully' },
        })
      );
      window.dispatchEvent(new Event('deviceStateChanged'));
      
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to remove device');
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <>
      <div 
        className="fixed inset-0 z-[60] bg-gray-900/40 backdrop-blur-sm transition-opacity" 
        onClick={() => !isRemoving && onClose()}
      />

      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col transform transition-all animate-in fade-in zoom-in-95 duration-200">
          
          <div className="px-6 py-6 border-b border-gray-100 bg-white">
            <div className="flex items-center space-x-3 text-red-600">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-red-600">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Remove Device</h2>
            </div>
          </div>

          <div className="px-6 py-6 bg-gray-50/50">
            <p className="text-sm font-medium text-gray-900 mb-4">
              This will remove <span className="font-bold">{systemName}</span> from XR Nexus.
            </p>
            
            <ul className="space-y-3 text-[13px] text-gray-600 list-disc pl-5">
              <li>Release assigned licenses</li>
              <li>Remove the device from Systems Inventory</li>
              <li>Preserve historical records</li>
              <li>Allow rediscovery if the agent reconnects</li>
            </ul>

            {error && (
              <div className="mt-4 p-3 bg-red-50 text-red-600 text-xs rounded-md border border-red-100">
                {error}
              </div>
            )}
          </div>

          <div className="px-6 py-4 border-t border-gray-100 bg-white flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isRemoving}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-900 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleRemove}
              disabled={isRemoving}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 disabled:opacity-50 transition-colors"
            >
              {isRemoving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Remove Device
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
