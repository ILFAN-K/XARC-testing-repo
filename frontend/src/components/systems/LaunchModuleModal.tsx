'use client';

import { useState, useEffect } from 'react';
import { X, Rocket, Loader2, MonitorSmartphone, User } from 'lucide-react';
import { launchModule, fetchModules, fetchDeviceById, fetchUsers, fetchOnlineDevices } from '../../services/devices.service';

interface ModuleResponse {
  id: string;
  name: string;
  description: string;
  category: string;
  version: string;
}

interface LaunchModuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  deviceId?: string;
  systemName?: string;
}

export default function LaunchModuleModal({
  isOpen,
  onClose,
  deviceId,
  systemName,
}: LaunchModuleModalProps) {
  const [modules, setModules] = useState<ModuleResponse[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [onlineDevices, setOnlineDevices] = useState<any[]>([]);
  
  const [selectedDeviceId, setSelectedDeviceId] = useState(deviceId || '');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedModuleId, setSelectedModuleId] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (deviceId) {
      setSelectedDeviceId(deviceId);
    } else if (!isOpen) {
      setSelectedDeviceId('');
    }
  }, [deviceId, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    
    setIsLoading(true);
    
    if (!selectedDeviceId) {
      fetchOnlineDevices()
        .then(data => {
          setOnlineDevices(data);
        })
        .catch(err => {
          setError('Failed to load online devices');
        })
        .finally(() => {
          setIsLoading(false);
        });
      return;
    }

    Promise.all([
      fetchModules(),
      fetchDeviceById(selectedDeviceId),
      fetchUsers()
    ])
      .then(([modulesData, deviceData, usersData]) => {
        const activeLicenses = new Set(
          deviceData.licenses
            .filter((l: any) => l.status === 'Active')
            .map((l: any) => l.moduleName)
        );
        const licensedModules = modulesData.filter((m: any) => activeLicenses.has(m.name));
        setModules(licensedModules);
        setUsers(usersData);
      })
      .catch(err => {
        setError('Failed to load required data');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [isOpen, selectedDeviceId]);

  const reset = () => {
    setSelectedModuleId('');
    setSelectedUserId('');
    if (!deviceId) setSelectedDeviceId('');
    setIsSubmitting(false);
    setError('');
    setSuccess(false);
    setSearchQuery('');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleLaunch = async () => {
    if (!selectedDeviceId) {
      setError('Please select a device');
      return;
    }
    if (!selectedModuleId) {
      setError('Please select a module');
      return;
    }
    if (!selectedUserId) {
      setError('Please select a user to launch for');
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      await launchModule(selectedDeviceId, selectedModuleId, selectedUserId);
      setSuccess(true);
      window.dispatchEvent(
        new CustomEvent('showNotification', {
          detail: { type: 'success', message: 'Module launch command sent successfully' },
        })
      );
      window.dispatchEvent(new Event('deviceStateChanged'));
      setTimeout(() => handleClose(), 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to launch module');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredModules = modules.filter(m =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-[2px]" onClick={handleClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="relative w-full max-w-lg rounded-xl bg-white shadow-2xl ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div className="flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-50 text-blue-600">
                <Rocket className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900">Launch Module</h3>
                <p className="text-xs text-gray-500 mt-0.5 truncate max-w-[300px]">
                  {deviceId ? `${systemName} · ${deviceId}` : 'Select target and module'}
                </p>
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
              <div className="flex flex-col items-center py-8">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 mb-3">
                  <Rocket className="h-6 w-6 text-emerald-600" />
                </div>
                <p className="text-sm font-semibold text-gray-900">Launch Command Sent</p>
                <p className="text-xs text-gray-500 mt-1">
                  The module is being deployed to the device.
                </p>
              </div>
            ) : (
              <>
                {!deviceId && (
                  <div className="mb-6">
                    <label className="block text-[13px] font-medium text-gray-700 mb-1.5 flex items-center">
                      <MonitorSmartphone className="h-3.5 w-3.5 mr-1.5 text-gray-400" /> 1. Select Device
                    </label>
                    <select
                      value={selectedDeviceId}
                      onChange={(e) => { 
                        setSelectedDeviceId(e.target.value); 
                        setSelectedModuleId(''); 
                        setSelectedUserId(''); 
                        setError(''); 
                      }}
                      className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 bg-white"
                      disabled={isLoading && !onlineDevices.length}
                    >
                      <option value="" disabled>Select an online device...</option>
                      {onlineDevices
                        .filter(d => d.isRegistered !== false && d.isDisabled !== true && (d.licenses && d.licenses.length > 0))
                        .map(d => (
                        <option key={d.deviceId} value={d.deviceId}>{d.friendlyName || d.deviceId}</option>
                      ))}
                    </select>
                  </div>
                )}

                {selectedDeviceId && (
                  <>
                    <div className="mb-4">
                      <label className="block text-[13px] font-medium text-gray-700 mb-1.5 flex items-center">
                        <Rocket className="h-3.5 w-3.5 mr-1.5 text-gray-400" /> {deviceId ? '1' : '2'}. Select Module
                      </label>
                      <input
                        type="text"
                        placeholder="Search licensed modules..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 placeholder:text-gray-400"
                      />
                    </div>

                    {isLoading ? (
                      <div className="flex flex-col items-center justify-center py-10 space-y-3">
                        <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />
                        <p className="text-xs font-medium text-gray-500">Loading modules...</p>
                      </div>
                    ) : (
                      <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
                        {filteredModules.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-8 text-center bg-gray-50/50 rounded-lg border border-dashed border-gray-200">
                            <Rocket className="h-6 w-6 text-gray-300 mb-2" />
                            <p className="text-[13px] font-medium text-gray-900">No modules found</p>
                            <p className="text-xs text-gray-500 mt-0.5">Try adjusting your search query.</p>
                          </div>
                        ) : (
                          filteredModules.map((mod) => (
                            <div
                              key={mod.id}
                              onClick={() => { setSelectedModuleId(mod.id); setError(''); }}
                              className={`group cursor-pointer rounded-lg border p-2.5 transition-all ${
                                selectedModuleId === mod.id
                                  ? 'border-gray-900 bg-gray-50/80 shadow-sm'
                                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50/50'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3 w-full">
                                  <div className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border transition-colors ${
                                    selectedModuleId === mod.id ? 'border-gray-900 bg-white' : 'border-gray-300 bg-white'
                                  }`}>
                                    {selectedModuleId === mod.id && <div className="h-2 w-2 rounded-full bg-gray-900" />}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                      <p className={`text-sm font-medium truncate pr-2 ${selectedModuleId === mod.id ? 'text-gray-900' : 'text-gray-700'}`}>
                                        {mod.name}
                                      </p>
                                      <span className="inline-flex items-center rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600 whitespace-nowrap">
                                        {mod.category}
                                      </span>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1 line-clamp-1 pr-4">
                                      {mod.description}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}

                    {selectedModuleId && (
                      <div className="mt-6 pt-6 border-t border-gray-100 animate-in fade-in slide-in-from-top-2 duration-300">
                        <label className="block text-[13px] font-medium text-gray-700 mb-1.5 flex items-center">
                          <User className="h-3.5 w-3.5 mr-1.5 text-gray-400" /> {deviceId ? '2' : '3'}. Target User
                        </label>
                        <select
                          value={selectedUserId}
                          onChange={(e) => { setSelectedUserId(e.target.value); setError(''); }}
                          className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 bg-white"
                        >
                          <option value="" disabled>Select a user to launch the module for...</option>
                          {users.map(u => (
                            <option key={u.id} value={u.id}>{u.email || u.id}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </>
                )}

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
                onClick={handleLaunch}
                disabled={isSubmitting || !selectedDeviceId || !selectedModuleId || !selectedUserId}
                className="inline-flex items-center rounded-md bg-black px-5 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Rocket className="mr-2 h-4 w-4" />
                )}
                Launch Module
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
