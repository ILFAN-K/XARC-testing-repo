'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, CheckSquare, Square, ChevronRight, ChevronLeft, Rocket, MonitorSmartphone, Box, User, Loader2 } from 'lucide-react';
import { fetchOnlineDevices, fetchUsers, launchMultipleDevices } from '@/services/devices.service';
import { getAvailableModulesForLaunch } from '@/services/modules.service';

interface QuickLaunchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function QuickLaunchModal({ isOpen, onClose }: QuickLaunchModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  
  // Data
  const [onlineSystems, setOnlineSystems] = useState<any[]>([]);
  const [availableModules, setAvailableModules] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  
  // Selections
  const [selectedDeviceIds, setSelectedDeviceIds] = useState<string[]>([]);
  const [selectedModuleId, setSelectedModuleId] = useState<string>('');
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  
  // UI States
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen && step === 1) {
      loadOnlineSystems();
    }
  }, [isOpen, step]);

  useEffect(() => {
    if (step === 2) {
      loadAvailableModules();
    }
  }, [step, selectedDeviceIds]);

  useEffect(() => {
    if (step === 3) {
      loadUsers();
    }
  }, [step]);

  const loadOnlineSystems = async () => {
    try {
      setIsLoading(true);
      const data = await fetchOnlineDevices();
      setOnlineSystems(data);
    } catch (e) {
      setError('Failed to load online systems.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadAvailableModules = async () => {
    try {
      setIsLoading(true);
      const data = await getAvailableModulesForLaunch(selectedDeviceIds);
      setAvailableModules(data);
    } catch (e) {
      setError('Failed to load available modules.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const data = await fetchUsers();
      setUsers(data);
    } catch (e) {
      setError('Failed to load users.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetAndClose = () => {
    setStep(1);
    setSelectedDeviceIds([]);
    setSelectedModuleId('');
    setSelectedUserId('');
    setSearchQuery('');
    setError('');
    setSuccess(false);
    onClose();
  };

  const handleLaunch = async () => {
    if (!selectedModuleId || selectedDeviceIds.length === 0 || !selectedUserId) return;
    
    try {
      setIsSubmitting(true);
      setError('');
      await launchMultipleDevices(selectedDeviceIds, selectedModuleId, selectedUserId);
      setSuccess(true);
      window.dispatchEvent(
        new CustomEvent('showNotification', {
          detail: { type: 'success', message: `Launched successfully on ${selectedDeviceIds.length} system(s)` },
        })
      );
      setTimeout(() => resetAndClose(), 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to launch module.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredSystems = onlineSystems.filter(sys => 
    sys.friendlyName?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    sys.machineName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleDevice = (id: string) => {
    setSelectedDeviceIds(prev => 
      prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]
    );
  };

  const toggleAllDevices = () => {
    if (selectedDeviceIds.length === filteredSystems.length && filteredSystems.length > 0) {
      setSelectedDeviceIds([]);
    } else {
      setSelectedDeviceIds(filteredSystems.map(s => s.deviceId));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={isSubmitting ? undefined : resetAndClose} />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <Rocket className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-[16px] font-semibold text-gray-900">Launch Module</h2>
              <p className="text-[13px] text-gray-500 mt-0.5">
                {step === 1 && 'Step 1: Select Target Systems'}
                {step === 2 && 'Step 2: Select Module'}
                {step === 3 && 'Step 3: Select User & Launch'}
              </p>
            </div>
          </div>
          <button
            onClick={resetAndClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-100 h-1">
          <div 
            className="bg-blue-600 h-1 transition-all duration-300"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-[13px] font-medium">
              {error}
            </div>
          )}
          
          {success ? (
            <div className="flex flex-col items-center justify-center py-10">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
                <Rocket className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Launch Initiated!</h3>
              <p className="text-[13px] text-gray-500 text-center max-w-[250px]">
                The command has been successfully sent to {selectedDeviceIds.length} system(s).
              </p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="relative flex-1 mr-4">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search online systems..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 text-[13px] bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 transition-shadow"
                      />
                    </div>
                    <button 
                      onClick={toggleAllDevices}
                      className="text-[13px] font-medium text-blue-600 hover:text-blue-700 whitespace-nowrap"
                    >
                      {selectedDeviceIds.length === filteredSystems.length && filteredSystems.length > 0 ? 'Clear All' : 'Select All'}
                    </button>
                  </div>

                  <div className="bg-gray-50 border border-gray-100 rounded-xl p-2 max-h-[250px] overflow-y-auto space-y-1">
                    {isLoading ? (
                      <div className="p-4 text-center text-[13px] text-gray-500 flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" /> Loading online systems...
                      </div>
                    ) : filteredSystems.length === 0 ? (
                      <div className="p-4 text-center text-[13px] text-gray-500">
                        No online systems found.
                      </div>
                    ) : (
                      filteredSystems.map(sys => {
                        const isSelected = selectedDeviceIds.includes(sys.deviceId);
                        return (
                          <div
                            key={sys.deviceId}
                            onClick={() => toggleDevice(sys.deviceId)}
                            className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${
                              isSelected ? 'bg-blue-50 border-blue-200' : 'bg-white border-transparent hover:border-gray-200'
                            }`}
                          >
                            <div className={`mr-3 ${isSelected ? 'text-blue-600' : 'text-gray-300'}`}>
                              {isSelected ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                            </div>
                            <div>
                              <div className="text-[13px] font-semibold text-gray-900 flex items-center gap-2">
                                <MonitorSmartphone className="w-4 h-4 text-gray-400" />
                                {sys.friendlyName || sys.machineName}
                              </div>
                              <div className="text-[12px] text-gray-500 mt-0.5 ml-6">{sys.deviceId}</div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                  <div className="text-[13px] font-medium text-gray-600 text-right">
                    Selected: {selectedDeviceIds.length} system(s)
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-4"
                >
                  <p className="text-[13px] text-gray-600 mb-2">
                    Showing modules that are assigned and valid for ALL {selectedDeviceIds.length} selected systems:
                  </p>
                  <div className="bg-gray-50 border border-gray-100 rounded-xl p-2 max-h-[300px] overflow-y-auto space-y-1">
                    {isLoading ? (
                      <div className="p-4 text-center text-[13px] text-gray-500 flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" /> Checking licenses...
                      </div>
                    ) : availableModules.length === 0 ? (
                      <div className="p-4 text-center text-[13px] text-gray-500 border border-dashed border-gray-200 rounded-xl">
                        No common modules assigned to all selected systems.
                      </div>
                    ) : (
                      availableModules.map(mod => {
                        const isSelected = selectedModuleId === mod.id;
                        return (
                          <div
                            key={mod.id}
                            onClick={() => setSelectedModuleId(mod.id)}
                            className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${
                              isSelected ? 'bg-blue-50 border-blue-200' : 'bg-white border-transparent hover:border-gray-200'
                            }`}
                          >
                            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center mr-3">
                              <Box className="w-5 h-5 text-gray-500" />
                            </div>
                            <div className="flex-1">
                              <div className="text-[13px] font-semibold text-gray-900">{mod.name}</div>
                              <div className="text-[12px] text-gray-500 truncate max-w-[280px]">{mod.description}</div>
                            </div>
                            <div className={`ml-3 ${isSelected ? 'text-blue-600' : 'text-transparent'}`}>
                              <CheckSquare className="w-5 h-5" />
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-4"
                >
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 mb-4 space-y-2">
                    <div className="flex justify-between text-[13px]">
                      <span className="text-gray-500">Target Systems:</span>
                      <span className="font-semibold text-gray-900">{selectedDeviceIds.length} systems</span>
                    </div>
                    <div className="flex justify-between text-[13px]">
                      <span className="text-gray-500">Module:</span>
                      <span className="font-semibold text-gray-900">{availableModules.find(m => m.id === selectedModuleId)?.name}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[13px] font-medium text-gray-700 mb-2">Select User Account</label>
                    {isLoading ? (
                      <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-[13px] text-gray-500 flex items-center gap-2">
                         <Loader2 className="w-4 h-4 animate-spin" /> Loading users...
                      </div>
                    ) : (
                      <div className="space-y-1 max-h-[180px] overflow-y-auto bg-gray-50 p-2 border border-gray-100 rounded-xl">
                        {users.map(u => (
                          <div
                            key={u.id}
                            onClick={() => setSelectedUserId(u.id)}
                            className={`flex items-center p-2.5 rounded-lg border cursor-pointer transition-colors ${
                              selectedUserId === u.id ? 'bg-blue-50 border-blue-200' : 'bg-white border-transparent hover:border-gray-200'
                            }`}
                          >
                            <User className="w-4 h-4 text-gray-400 mr-3" />
                            <div className="text-[13px] font-semibold text-gray-900">{u.name} <span className="font-normal text-gray-500 ml-1">({u.email})</span></div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>

        {/* Footer */}
        {!success && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between rounded-b-2xl z-10">
            <button
              onClick={() => step > 1 ? setStep((s) => (s - 1) as any) : resetAndClose()}
              disabled={isSubmitting}
              className="px-4 py-2 text-[13px] font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
            >
              {step > 1 ? 'Back' : 'Cancel'}
            </button>
            
            {step < 3 ? (
              <button
                onClick={() => setStep((s) => (s + 1) as any)}
                disabled={(step === 1 && selectedDeviceIds.length === 0) || (step === 2 && !selectedModuleId) || isLoading}
                className="px-4 py-2 text-[13px] font-semibold text-white bg-gray-900 rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleLaunch}
                disabled={!selectedUserId || isSubmitting}
                className="px-6 py-2 text-[13px] font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors shadow-sm shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmitting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Launching...</>
                ) : (
                  <><Rocket className="w-4 h-4" /> Launch</>
                )}
              </button>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}
