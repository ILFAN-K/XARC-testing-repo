'use client';

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { X, Search, RefreshCw, Info, CheckCircle2, ChevronLeft, ChevronRight, MonitorDot, Loader2, AlertTriangle } from 'lucide-react';
import {
  fetchDiscoveredDevices, registerDevice, checkNameAvailability,
  DiscoveredDeviceResponse,
} from '../../services/devices.service';

interface RegisterDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const STEPS = [
  { id: 1, label: 'Select Device' },
  { id: 2, label: 'Validation' },
  { id: 3, label: 'Device Info' },
  { id: 4, label: 'Registration' },
  { id: 5, label: 'Confirm' }
];

const VERIFICATION_CHECKS = [
  'Creating Device Record...',
  'Validating Registration Data...',
  'Saving Device Configuration...',
  'Updating Device Inventory...'
];

export default function RegisterDeviceModal({ isOpen, onClose }: RegisterDeviceModalProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [friendlyName, setFriendlyName] = useState('');
  const [friendlyNameError, setFriendlyNameError] = useState('');
  const [friendlyNameAvailable, setFriendlyNameAvailable] = useState(false);
  const [nameChecking, setNameChecking] = useState(false);
  
  // Discovered devices from API
  const [discoveredDevices, setDiscoveredDevices] = useState<DiscoveredDeviceResponse[]>([]);
  const [devicesLoading, setDevicesLoading] = useState(false);
  const [registrationError, setRegistrationError] = useState('');

  // Registration flow states
  const [isRegistering, setIsRegistering] = useState(false);
  const [completedChecks, setCompletedChecks] = useState<number[]>([]);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const nameCheckTimer = useRef<NodeJS.Timeout | null>(null);

  const loadDiscoveredDevices = useCallback(async () => {
    setDevicesLoading(true);
    try {
      const devices = await fetchDiscoveredDevices();
      setDiscoveredDevices(devices);
    } catch {
      setDiscoveredDevices([]);
    } finally {
      setDevicesLoading(false);
    }
  }, []);

  // Reset state and load devices when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
      setSearchQuery('');
      setSelectedDeviceId(null);
      setFriendlyName('');
      setFriendlyNameError('');
      setFriendlyNameAvailable(false);
      setNameChecking(false);
      setIsRegistering(false);
      setCompletedChecks([]);
      setIsSuccess(false);
      setRegistrationError('');
      loadDiscoveredDevices();
    }
  }, [isOpen, loadDiscoveredDevices]);

  const filteredDevices = useMemo(() => {
    if (!searchQuery) return discoveredDevices;
    const q = searchQuery.toLowerCase();
    return discoveredDevices.filter(d => 
      d.machineName.toLowerCase().includes(q) || d.deviceId.toLowerCase().includes(q)
    );
  }, [searchQuery, discoveredDevices]);

  const selectedDevice = discoveredDevices.find(d => d.deviceId === selectedDeviceId);

  // Validation Logic for Friendly Name (Real-time with API debounce)
  useEffect(() => {
    if (nameCheckTimer.current) clearTimeout(nameCheckTimer.current);

    if (!friendlyName) {
      setFriendlyNameError('');
      setFriendlyNameAvailable(false);
      setNameChecking(false);
      return;
    }

    const trimmed = friendlyName.trim();
    if (trimmed.length < 3) {
      setFriendlyNameError('Must be at least 3 characters.');
      setFriendlyNameAvailable(false);
      setNameChecking(false);
      return;
    }
    if (trimmed.length > 64) {
      setFriendlyNameError('Must be under 64 characters.');
      setFriendlyNameAvailable(false);
      setNameChecking(false);
      return;
    }

    // Debounce the API call
    setNameChecking(true);
    setFriendlyNameAvailable(false);
    setFriendlyNameError('');

    nameCheckTimer.current = setTimeout(async () => {
      try {
        const result = await checkNameAvailability(trimmed, selectedDeviceId || undefined);
        if (result.available) {
          setFriendlyNameError('');
          setFriendlyNameAvailable(true);
        } else {
          setFriendlyNameError(result.reason || 'Name unavailable');
          setFriendlyNameAvailable(false);
        }
      } catch {
        setFriendlyNameError('Unable to validate name');
        setFriendlyNameAvailable(false);
      } finally {
        setNameChecking(false);
      }
    }, 400);

    return () => {
      if (nameCheckTimer.current) clearTimeout(nameCheckTimer.current);
    };
  }, [friendlyName]);

  // Sequential Verification Logic
  useEffect(() => {
    if (isRegistering && !isSuccess && completedChecks.length < VERIFICATION_CHECKS.length) {
      const timer = setTimeout(() => {
        setCompletedChecks(prev => [...prev, prev.length]);
      }, 700);
      return () => clearTimeout(timer);
    } else if (isRegistering && !isSuccess && completedChecks.length === VERIFICATION_CHECKS.length) {
      finalizeRegistration();
    }
  }, [isRegistering, completedChecks, isSuccess]);

  const handleNext = () => {
    if (currentStep === 4) {
      if (!friendlyNameAvailable) {
        if (!friendlyName.trim()) setFriendlyNameError('Friendly Name is required.');
        return;
      }
    }
    setCurrentStep(prev => Math.min(prev + 1, 5));
  };
  
  const handlePrev = () => setCurrentStep(prev => Math.max(prev - 1, 1));
  
  const startRegistration = () => {
    setIsRegistering(true);
  };

  const finalizeRegistration = async () => {
    if (!selectedDevice) return;

    try {
      await registerDevice(selectedDevice.deviceId, friendlyName.trim());

      // Notify all listeners to refresh
      window.dispatchEvent(
        new CustomEvent('showNotification', {
          detail: { type: 'success', message: 'Device registered successfully' },
        })
      );
      window.dispatchEvent(new Event('deviceRegistered'));
      window.dispatchEvent(new Event('deviceStateChanged'));
      router.refresh();

      setIsSuccess(true);
    } catch (err: any) {
      setRegistrationError(err.message || 'Registration failed. Please try again.');
      setIsRegistering(false);
      setCompletedChecks([]);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-40 bg-gray-900/40 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        <div 
          className="w-full max-w-[900px] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col transform transition-all animate-in fade-in zoom-in-95 duration-200"
          style={{ maxHeight: '80vh' }}
        >
          
          {/* Header */}
          <div className="flex items-start justify-between px-8 py-6 border-b border-gray-100 bg-white flex-shrink-0">
            <div className="flex items-center space-x-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-50 text-orange-600">
                <MonitorDot className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {isSuccess ? 'Registration Complete' : 'Register Device'}
                </h2>
                <p className="mt-1 text-[13px] text-gray-500">
                  {isSuccess 
                    ? 'Device successfully onboarded to XR Nexus.' 
                    : 'Discover, validate, and register devices connected through XR Nexus Agent.'}
                </p>
              </div>
            </div>
            <button 
              onClick={onClose}
              disabled={isRegistering && !isSuccess}
              className="rounded-md bg-white p-1 text-gray-400 hover:text-gray-500 focus:outline-none transition-colors disabled:opacity-50"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Stepper (Hidden on Success) */}
          {!isSuccess && (
            <div className="px-8 py-6 bg-white border-b border-gray-50 flex-shrink-0">
              <div className="flex items-center justify-center max-w-3xl mx-auto">
                {STEPS.map((step, index) => {
                  const isActive = currentStep === step.id;
                  const isPast = currentStep > step.id;
                  
                  return (
                    <div key={step.id} className="flex items-center relative flex-1 last:flex-none">
                      <div className="flex items-center space-x-3 bg-white pr-4 z-10">
                        <div className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${
                          isActive || isPast ? 'bg-black text-white' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {step.id}
                        </div>
                        <span className={`text-[13px] font-medium ${
                          isActive ? 'text-gray-900' : 'text-gray-500'
                        }`}>
                          {step.label}
                        </span>
                      </div>
                      {/* Connecting Line */}
                      {index < STEPS.length - 1 && (
                        <div className="absolute top-1/2 left-0 w-full h-[1px] bg-gray-200 -z-0" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto bg-gray-50/30 px-8 py-8">
            <div className="max-w-4xl mx-auto">
              
              {/* STEP 1: Select Device */}
              {currentStep === 1 && !isSuccess && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                    <div className="p-6">
                      <h3 className="text-[15px] font-medium text-gray-900">Available Devices</h3>
                      <p className="mt-1 text-[13px] text-gray-500 mb-6">
                        Devices detected by XR Nexus Agent and available for registration.
                      </p>
                      
                      <div className="flex space-x-3 mb-6">
                        <div className="relative flex-1">
                          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <Search className="h-4 w-4 text-gray-400" />
                          </div>
                          <input
                            type="text"
                            className="block w-full rounded-md border border-gray-200 py-2 pl-9 pr-3 text-[13px] focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 placeholder:text-gray-400 text-gray-900 transition-colors"
                            placeholder="Search discovered devices..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                          />
                        </div>
                        <button
                          onClick={loadDiscoveredDevices}
                          disabled={devicesLoading}
                          className="flex items-center justify-center rounded-md border border-gray-200 bg-white px-3 py-2 text-gray-500 hover:bg-gray-50 transition-colors disabled:opacity-50"
                        >
                          <RefreshCw className={`h-4 w-4 ${devicesLoading ? 'animate-spin' : ''}`} />
                        </button>
                      </div>

                      <div className="rounded-lg border border-gray-100 overflow-hidden">
                        <table className="w-full text-left">
                          <thead>
                            <tr className="border-b border-gray-100 bg-gray-50/50">
                              <th className="w-12 px-4 py-3"></th>
                              <th className="px-4 py-3 text-[11px] font-medium text-gray-500 uppercase tracking-wider">Device Name</th>
                              <th className="px-4 py-3 text-[11px] font-medium text-gray-500 uppercase tracking-wider">Device ID</th>
                              <th className="px-4 py-3 text-[11px] font-medium text-gray-500 uppercase tracking-wider">IP Address</th>
                              <th className="px-4 py-3 text-[11px] font-medium text-gray-500 uppercase tracking-wider">OS</th>
                              <th className="px-4 py-3 text-[11px] font-medium text-gray-500 uppercase tracking-wider text-right">Agent Status</th>
                            </tr>
                          </thead>
                        <tbody>
                            {devicesLoading ? (
                              <tr>
                                <td colSpan={5} className="px-4 py-8 text-center">
                                  <Loader2 className="h-5 w-5 text-gray-400 animate-spin mx-auto" />
                                  <p className="text-[13px] text-gray-500 mt-2">Loading discovered devices...</p>
                                </td>
                              </tr>
                            ) : (
                              <>
                                {filteredDevices.map((device) => (
                              <tr 
                                key={device.deviceId} 
                                className={`border-b border-gray-50 last:border-b-0 cursor-pointer transition-colors ${
                                  selectedDeviceId === device.deviceId ? 'bg-blue-50/30' : 'hover:bg-gray-50/50'
                                }`}
                                onClick={() => setSelectedDeviceId(device.deviceId)}
                              >
                                <td className="px-4 py-3.5 text-center">
                                  <div className={`h-4 w-4 rounded-full border flex items-center justify-center ${
                                    selectedDeviceId === device.deviceId ? 'border-black' : 'border-gray-300'
                                  }`}>
                                    {selectedDeviceId === device.deviceId && (
                                      <div className="h-2 w-2 rounded-full bg-black" />
                                    )}
                                  </div>
                                </td>
                                <td className="px-4 py-3.5">
                                  <div className="flex items-center space-x-3">
                                    <MonitorDot className="h-4 w-4 text-gray-400" />
                                    <span className="font-medium text-[13px] text-gray-900">{device.machineName}</span>
                                  </div>
                                </td>
                                <td className="px-4 py-3.5 text-[13px] font-mono text-gray-600">
                                  {device.deviceId}
                                </td>
                                <td className="px-4 py-3.5 text-[13px] font-mono text-gray-600">
                                  {device.ipAddress || '—'}
                                </td>
                                <td className="px-4 py-3.5 text-[13px] text-gray-700">
                                  {device.os}
                                </td>
                                <td className="px-4 py-3.5 text-[13px] text-gray-500 text-right">
                                  {device.status}
                                </td>
                              </tr>
                            ))}
                            {filteredDevices.length === 0 && (
                              <tr>
                                <td colSpan={5} className="px-4 py-8 text-center text-[13px] text-gray-500">
                                  No discovered devices available.
                                </td>
                              </tr>
                            )}
                              </>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: Device Validation */}
              {currentStep === 2 && selectedDevice && !isSuccess && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden p-8">
                    <h3 className="text-base font-medium text-gray-900 mb-2">System Readiness Check</h3>
                    <p className="text-[13px] text-gray-500 mb-6">XR Nexus is validating required components before registration.</p>
                    
                    <ul className="space-y-4 mb-8">
                      <li className="flex items-center text-[13px] text-gray-700 bg-gray-50 rounded-lg p-3 border border-gray-100">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 mr-3" />
                        XR Nexus Agent Connected
                      </li>
                      <li className="flex items-center text-[13px] text-gray-700 bg-gray-50 rounded-lg p-3 border border-gray-100">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 mr-3" />
                        Hardware Information Available
                      </li>
                      <li className="flex items-center text-[13px] text-gray-700 bg-gray-50 rounded-lg p-3 border border-gray-100">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 mr-3" />
                        Network Connectivity Verified
                      </li>
                      <li className="flex items-center text-[13px] text-gray-700 bg-gray-50 rounded-lg p-3 border border-gray-100">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 mr-3" />
                        License Service Reachable
                      </li>
                    </ul>

                    <h4 className="text-sm font-semibold text-gray-900 mb-4">Aggregator Status</h4>
                    {(selectedDevice.aggregatorStatus === 'Installed & Running' || selectedDevice.aggregatorStatus === 'Installed but Stopped') ? (
                      <div className="rounded-xl border border-emerald-200 bg-emerald-50 shadow-sm p-5 flex items-start space-x-4">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 flex-shrink-0">
                          <CheckCircle2 className="h-5 w-5" />
                        </div>
                        <div>
                          <h5 className="text-[14px] font-medium text-emerald-900 mb-1">Aggregator Installed</h5>
                          <p className="text-[13px] text-emerald-700/80 mb-2">Version: {selectedDevice.aggregatorVersion || 'Unknown'}</p>
                          <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-100/50 border border-emerald-200/50">
                            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            <span className="text-[11px] font-medium text-emerald-700">{selectedDevice.aggregatorStatus}</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-amber-200 bg-amber-50 shadow-sm p-5 flex items-start space-x-4">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-amber-600 flex-shrink-0">
                          <AlertTriangle className="h-5 w-5" />
                        </div>
                        <div>
                          <h5 className="text-[14px] font-medium text-amber-900 mb-1">Aggregator Not Installed</h5>
                          <p className="text-[13px] text-amber-700/80 mb-4">This device cannot launch XR modules until Aggregator is installed.</p>
                          <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-amber-100/50 border border-amber-200/50">
                            <span className="text-[11px] font-medium text-amber-700">Registration can continue</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* STEP 3: Device Info */}
              {currentStep === 3 && selectedDevice && !isSuccess && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Identity Information */}
                    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden p-6">
                      <h3 className="text-sm font-semibold text-gray-900 mb-4">Identity Information</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-1">Device ID</label>
                          <div className="text-[13px] font-mono text-gray-900">{selectedDevice.deviceId}</div>
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-1">Hardware UUID</label>
                          <div className="text-[13px] font-mono text-gray-900">{selectedDevice.hardwareUuid || '—'}</div>
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-1">MAC Address</label>
                          <div className="text-[13px] font-mono text-gray-900">{selectedDevice.primaryMacAddress || '—'}</div>
                        </div>
                      </div>
                    </div>

                    {/* System Information */}
                    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden p-6">
                      <h3 className="text-sm font-semibold text-gray-900 mb-4">System Information</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-1">Machine Name</label>
                          <div className="text-[13px] text-gray-900">{selectedDevice.machineName}</div>
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-1">Operating System</label>
                          <div className="text-[13px] text-gray-900">{selectedDevice.os}</div>
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-1">Agent Version</label>
                          <div className="text-[13px] text-gray-900">{selectedDevice.agentVersion}</div>
                        </div>
                      </div>
                    </div>

                    {/* Network Information */}
                    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden p-6">
                      <h3 className="text-sm font-semibold text-gray-900 mb-4">Network Information</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-1">IP Address</label>
                          <div className="text-[13px] font-mono text-gray-900">{selectedDevice.ipAddress || '—'}</div>
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-1">Primary Adapter</label>
                          <div className="text-[13px] text-gray-900">Ethernet / Wi-Fi</div>
                        </div>
                      </div>
                    </div>

                    {/* Discovery Information */}
                    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden p-6">
                      <h3 className="text-sm font-semibold text-gray-900 mb-4">Discovery Information</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-1">Discovered At</label>
                          <div className="text-[13px] text-gray-900">{selectedDevice.discoveredAt}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4: Registration */}
              {currentStep === 4 && selectedDevice && !isSuccess && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-6">
                    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden p-8">
                      <h3 className="text-base font-medium text-gray-900 mb-6">Registration Settings</h3>
                      <div className="max-w-md">
                        <label htmlFor="friendlyName" className="block text-[13px] font-medium text-gray-700 mb-2">
                          Friendly Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id="friendlyName"
                          className={`block w-full rounded-md border ${friendlyNameError ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-200 focus:border-gray-900 focus:ring-gray-900'} py-2.5 px-3 text-[13px] focus:outline-none focus:ring-1 text-gray-900 transition-colors`}
                          placeholder="Enter a unique device name"
                          value={friendlyName}
                          onChange={(e) => setFriendlyName(e.target.value)}
                          autoComplete="off"
                        />
                        <div className="mt-2 min-h-[20px]">
                          {friendlyNameError && (
                            <p className="text-[12px] text-red-500 font-medium flex items-center">
                              <X className="h-3 w-3 mr-1" /> {friendlyNameError}
                            </p>
                          )}
                          {nameChecking && (
                            <p className="text-[12px] text-gray-400 font-medium flex items-center">
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" /> Checking...
                            </p>
                          )}
                          {friendlyNameAvailable && (
                            <p className="text-[12px] text-emerald-600 font-medium flex items-center">
                              <CheckCircle2 className="h-3 w-3 mr-1" /> Available
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-6">
                      <div className="flex items-start space-x-3 mb-4">
                        <Info className="h-5 w-5 text-blue-500 flex-shrink-0" />
                        <h4 className="text-[13px] font-semibold text-blue-900">Naming Guidelines</h4>
                      </div>
                      <p className="text-[12px] text-blue-800/80 mb-4">Choose a descriptive and unique name to identify this device in the inventory.</p>
                      <h5 className="text-[11px] font-bold text-blue-900 uppercase tracking-wider mb-2">Examples</h5>
                      <ul className="space-y-2 text-[12px] text-blue-800 font-mono">
                        <li>• VR-LAB-01</li>
                        <li>• SAFETY-TRAINER-03</li>
                        <li>• CHENNAI-HALL-A-02</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 5: Confirm */}
              {currentStep === 5 && selectedDevice && !isSuccess && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  {!isRegistering ? (
                    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden p-8">
                      <h3 className="text-base font-medium text-gray-900 mb-6">Registration Summary</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                        <div>
                          <h4 className="text-[12px] font-bold text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-2 mb-4">Registration</h4>
                          <div className="space-y-3">
                            <div>
                              <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-1">Friendly Name</p>
                              <p className="text-[13px] font-medium text-gray-900">{friendlyName.trim()}</p>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-[12px] font-bold text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-2 mb-4">Identity</h4>
                          <div className="space-y-3">
                            <div>
                              <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-1">Device ID</p>
                              <p className="text-[13px] font-mono text-gray-600">{selectedDevice.deviceId}</p>
                            </div>
                            <div>
                              <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-1">Hardware UUID</p>
                              <p className="text-[13px] font-mono text-gray-600">{selectedDevice.hardwareUuid || '—'}</p>
                            </div>
                            <div>
                              <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-1">MAC Address</p>
                              <p className="text-[13px] font-mono text-gray-600">{selectedDevice.primaryMacAddress || '—'}</p>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-[12px] font-bold text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-2 mb-4">System</h4>
                          <div className="space-y-3">
                            <div>
                              <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-1">Machine Name</p>
                              <p className="text-[13px] text-gray-900">{selectedDevice.machineName}</p>
                            </div>
                            <div>
                              <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-1">OS</p>
                              <p className="text-[13px] text-gray-900">{selectedDevice.os}</p>
                            </div>
                            <div>
                              <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-1">Agent Version</p>
                              <p className="text-[13px] text-gray-900">{selectedDevice.agentVersion}</p>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-[12px] font-bold text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-2 mb-4">Network & Aggregator</h4>
                          <div className="space-y-3">
                            <div>
                              <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-1">IP Address</p>
                              <p className="text-[13px] font-mono text-gray-900">{selectedDevice.ipAddress || '—'}</p>
                            </div>
                            <div>
                              <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-1">Aggregator Status</p>
                              <p className="text-[13px] text-gray-900">{selectedDevice.aggregatorStatus}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden p-8 flex flex-col items-center justify-center min-h-[300px]">
                      <h3 className="text-base font-medium text-gray-900 mb-8">Registration in Progress</h3>
                      
                      <ul className="space-y-6 w-full max-w-sm">
                        {VERIFICATION_CHECKS.map((check, index) => {
                          const isCompleted = completedChecks.includes(index);
                          const isActive = completedChecks.length === index;
                          const isPending = completedChecks.length < index;

                          return (
                            <li key={check} className="flex items-center text-[13px] font-medium">
                              <div className="w-8 flex justify-center mr-3">
                                {isCompleted && (
                                  <CheckCircle2 className="h-5 w-5 text-emerald-500 opacity-100 transition-opacity animate-in zoom-in" />
                                )}
                                {isActive && (
                                  <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
                                )}
                                {isPending && (
                                  <div className="h-2 w-2 rounded-full bg-gray-200" />
                                )}
                              </div>
                              <span className={`${isCompleted ? 'text-gray-900' : isActive ? 'text-gray-900' : 'text-gray-400'}`}>
                                {isCompleted ? check.replace('...', '') : check}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 6: Success Screen */}
              {isSuccess && selectedDevice && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="rounded-xl border border-emerald-100 bg-emerald-50/30 p-10 flex flex-col items-center text-center">
                    <div className="h-16 w-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6">
                      <CheckCircle2 className="h-8 w-8" />
                    </div>
                    <h3 className="text-2xl font-semibold text-gray-900 mb-2">Device Registered Successfully</h3>
                    <p className="text-sm text-gray-500 mb-8 max-w-md">
                      The device has been successfully registered and is now available throughout XR Nexus for monitoring, licensing, module deployment, and device management.
                    </p>
                    
                    <div className="w-full max-w-sm bg-white rounded-lg border border-gray-100 p-6 text-left shadow-sm mb-2">
                      <div className="space-y-4">
                        <div>
                          <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-1">Device Name</p>
                          <p className="text-[14px] font-semibold text-gray-900">{friendlyName.trim()}</p>
                        </div>
                        <div>
                          <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-1">Device ID</p>
                          <p className="text-[13px] font-mono text-gray-600">{selectedDevice.deviceId}</p>
                        </div>
                        <div>
                          <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-1">Registration Time</p>
                          <p className="text-[13px] text-gray-600">{new Date().toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-8 py-5 border-t border-gray-100 bg-white flex-shrink-0">
            {!isSuccess ? (
              <>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isRegistering}
                  className="rounded-md bg-white px-5 py-2 text-[13px] font-medium text-gray-700 border border-gray-200 hover:bg-gray-50 focus:outline-none transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <div className="flex items-center space-x-3">
                  {currentStep > 1 && !isRegistering && (
                    <button
                      type="button"
                      onClick={handlePrev}
                      className="inline-flex items-center justify-center rounded-md border border-gray-200 bg-white px-4 py-2 text-[13px] font-medium text-gray-700 hover:bg-gray-50 focus:outline-none transition-colors"
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </button>
                  )}
                  
                  {currentStep < 5 ? (
                    <button
                      type="button"
                      disabled={
                        (currentStep === 1 && !selectedDeviceId) ||
                        (currentStep === 4 && (!friendlyNameAvailable || nameChecking))
                      }
                      onClick={handleNext}
                      className="inline-flex items-center justify-center rounded-md bg-black px-5 py-2 text-[13px] font-medium text-white hover:bg-gray-800 focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={isRegistering}
                      onClick={startRegistration}
                      className="inline-flex items-center justify-center rounded-md bg-black px-6 py-2 text-[13px] font-medium text-white hover:bg-gray-800 focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isRegistering ? 'Registering...' : 'Register Device'}
                    </button>
                  )}
                </div>
              </>
            ) : (
              <div className="w-full flex justify-between items-center">
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex items-center justify-center rounded-md border border-gray-200 bg-white px-6 py-2 text-[13px] font-medium text-gray-700 hover:bg-gray-50 focus:outline-none transition-colors"
                >
                  Close
                </button>
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      // Logic for View Device can trigger router.push here if implemented, or we just rely on parent list.
                    }}
                    className="inline-flex items-center justify-center rounded-md bg-white border border-gray-200 px-6 py-2 text-[13px] font-medium text-gray-900 hover:bg-gray-50 focus:outline-none transition-colors"
                  >
                    View Device
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      // Trigger assign license UI flow here later.
                    }}
                    className="inline-flex items-center justify-center rounded-md bg-black px-6 py-2 text-[13px] font-medium text-white hover:bg-gray-800 focus:outline-none transition-colors"
                  >
                    Assign License
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </>
  );
}
