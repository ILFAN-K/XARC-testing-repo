'use client';

import { useState, useEffect } from 'react';
import { X, KeyRound, Loader2, CheckCircle2 } from 'lucide-react';
import { assignLicense, revokeLicense, fetchModules, fetchDeviceById } from '../../services/devices.service';

interface ModuleResponse {
  id: string;
  name: string;
  description: string;
}

interface LicenseManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  deviceId: string;
  systemName: string;
}

export default function LicenseManagementModal({
  isOpen,
  onClose,
  deviceId,
  systemName,
}: LicenseManagementModalProps) {
  const [modules, setModules] = useState<ModuleResponse[]>([]);
  const [initialAssigned, setInitialAssigned] = useState<Record<string, string>>({}); // moduleName -> licenseId
  const [selectedModules, setSelectedModules] = useState<Set<string>>(new Set()); // moduleNames
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    
    setIsLoading(true);
    Promise.all([
      fetchModules(),
      fetchDeviceById(deviceId),
    ])
      .then(([modulesData, deviceData]) => {
        setModules(modulesData);
        
        const assigned: Record<string, string> = {};
        const selected = new Set<string>();
        
        deviceData.licenses.forEach((lic) => {
          assigned[lic.moduleName] = lic.id;
          selected.add(lic.moduleName);
        });
        
        setInitialAssigned(assigned);
        setSelectedModules(selected);
      })
      .catch((err) => {
        setError('Failed to load license data');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [isOpen, deviceId]);

  const reset = () => {
    setIsSubmitting(false);
    setError('');
    setSuccess(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const toggleModule = (moduleName: string) => {
    const next = new Set(selectedModules);
    if (next.has(moduleName)) {
      next.delete(moduleName);
    } else {
      next.add(moduleName);
    }
    setSelectedModules(next);
  };

  const handleUpdate = async () => {
    setIsSubmitting(true);
    setError('');
    
    const toAssign = Array.from(selectedModules).filter(name => !initialAssigned[name]);
    const toRevoke = Object.entries(initialAssigned)
      .filter(([name]) => !selectedModules.has(name))
      .map(([_, licenseId]) => licenseId);

    try {
      const promises: Promise<any>[] = [];
      
      for (const name of toAssign) {
        promises.push(assignLicense(deviceId, name));
      }
      for (const licenseId of toRevoke) {
        promises.push(revokeLicense(deviceId, licenseId));
      }

      await Promise.all(promises);
      
      setSuccess(true);
      window.dispatchEvent(
        new CustomEvent('showNotification', {
          detail: { type: 'success', message: 'Licenses updated successfully' },
        })
      );
      window.dispatchEvent(new Event('deviceStateChanged'));
      setTimeout(() => handleClose(), 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to update licenses');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-[2px]" onClick={handleClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="relative w-full max-w-md rounded-xl bg-white shadow-2xl ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div className="flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-50 text-blue-600">
                <KeyRound className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900">Manage Licenses</h3>
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
                <p className="text-sm font-semibold text-gray-900">Licenses Updated</p>
                <p className="text-xs text-gray-500 mt-1">
                  License assignments have been synchronized.
                </p>
              </div>
            ) : isLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-6 w-6 text-gray-400 animate-spin" />
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-600 mb-4">
                  Select the modules you want to license for this device.
                </p>
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {modules.map((mod) => (
                    <div
                      key={mod.id}
                      onClick={() => toggleModule(mod.name)}
                      className={`group cursor-pointer rounded-lg border p-3 transition-all ${
                        selectedModules.has(mod.name)
                          ? 'border-gray-900 bg-gray-50/80 shadow-sm'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className={`text-sm font-medium ${selectedModules.has(mod.name) ? 'text-gray-900' : 'text-gray-700'}`}>
                            {mod.name}
                          </span>
                          <span className="text-xs text-gray-500 line-clamp-1 mt-0.5">
                            {mod.description}
                          </span>
                        </div>
                        <div className={`ml-3 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full transition-colors ${
                          selectedModules.has(mod.name) ? 'bg-gray-900 text-white' : 'border border-gray-300 text-transparent group-hover:border-gray-400'
                        }`}>
                          <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={3} />
                        </div>
                      </div>
                    </div>
                  ))}
                  {modules.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-6">No modules available.</p>
                  )}
                </div>

                {error && (
                  <p className="mt-4 text-sm text-red-600 font-medium flex items-center">
                    <X className="h-4 w-4 mr-1.5" /> {error}
                  </p>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          {!success && (
            <div className="flex items-center justify-end space-x-3 px-6 py-4 border-t border-gray-100 bg-gray-50/50 rounded-b-xl">
              <button
                onClick={handleClose}
                className="rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdate}
                disabled={isSubmitting || isLoading}
                className="inline-flex items-center rounded-md bg-black px-5 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Licenses
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
