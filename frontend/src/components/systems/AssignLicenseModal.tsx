'use client';

import { useState } from 'react';
import { X, KeyRound, Loader2 } from 'lucide-react';
import { assignLicense } from '../../services/devices.service';

interface AssignLicenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  deviceId: string;
  systemName: string;
}

const AVAILABLE_MODULES = [
  'Fire Safety VR',
  'Electrical Safety',
  'Forklift Safety',
  'Confined Space Entry',
  'Chemical Handling',
  'Height Safety',
  'Machine Guarding',
  'Lockout Tagout',
];

export default function AssignLicenseModal({ isOpen, onClose, deviceId, systemName }: AssignLicenseModalProps) {
  const [selectedModule, setSelectedModule] = useState('');
  const [customModule, setCustomModule] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const reset = () => {
    setSelectedModule('');
    setCustomModule('');
    setIsSubmitting(false);
    setError('');
    setSuccess(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleAssign = async () => {
    const moduleName = selectedModule === '__custom__' ? customModule.trim() : selectedModule;
    if (!moduleName) {
      setError('Please select a module');
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      await assignLicense(deviceId, moduleName);
      setSuccess(true);
      window.dispatchEvent(new Event('deviceRegistered'));
      window.dispatchEvent(new Event('deviceStateChanged'));
      setTimeout(() => handleClose(), 1500);
    } catch (err: any) {
      setError(err.statusText || err.message || 'Failed to assign license');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-[2px]" onClick={handleClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="relative w-full max-w-md rounded-xl bg-white shadow-2xl ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div className="flex items-center space-x-2">
              <KeyRound className="h-5 w-5 text-gray-500" />
              <div>
                <h3 className="text-base font-semibold text-gray-900">Assign License</h3>
                <p className="text-xs text-gray-500 mt-0.5 truncate max-w-[280px]">{systemName} · {deviceId}</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="flex h-8 w-8 items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-5">
            {success ? (
              <div className="flex flex-col items-center py-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 mb-3">
                  <KeyRound className="h-6 w-6 text-emerald-600" />
                </div>
                <p className="text-sm font-semibold text-gray-900">License Assigned</p>
                <p className="text-xs text-gray-500 mt-1">
                  {selectedModule === '__custom__' ? customModule : selectedModule} has been assigned.
                </p>
              </div>
            ) : (
              <>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Module</label>
                <div className="space-y-1.5 max-h-48 overflow-y-auto rounded-lg border border-gray-200 p-1.5">
                  {AVAILABLE_MODULES.map((mod) => (
                    <button
                      key={mod}
                      onClick={() => { setSelectedModule(mod); setError(''); }}
                      className={`flex w-full items-center rounded-md px-3 py-2 text-sm transition-colors ${
                        selectedModule === mod
                          ? 'bg-gray-900 text-white'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {mod}
                    </button>
                  ))}
                  <button
                    onClick={() => { setSelectedModule('__custom__'); setError(''); }}
                    className={`flex w-full items-center rounded-md px-3 py-2 text-sm transition-colors ${
                      selectedModule === '__custom__'
                        ? 'bg-gray-900 text-white'
                        : 'text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    Other Module...
                  </button>
                </div>

                {selectedModule === '__custom__' && (
                  <input
                    type="text"
                    value={customModule}
                    onChange={(e) => { setCustomModule(e.target.value); setError(''); }}
                    placeholder="Enter module name..."
                    className="mt-3 w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 placeholder:text-gray-400"
                    autoFocus
                  />
                )}

                {error && (
                  <p className="mt-3 text-sm text-red-600 font-medium">{error}</p>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          {!success && (
            <div className="flex items-center justify-end space-x-3 px-6 py-4 border-t border-gray-100">
              <button
                onClick={handleClose}
                className="rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAssign}
                disabled={isSubmitting || (!selectedModule)}
                className="inline-flex items-center rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Assign License
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
