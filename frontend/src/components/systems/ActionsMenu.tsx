'use client';

import { useState } from 'react';
import {
  useFloating,
  autoUpdate,
  offset,
  flip,
  shift,
  useDismiss,
  useRole,
  useClick,
  useInteractions,
  FloatingPortal,
  FloatingFocusManager,
} from '@floating-ui/react';
import { MoreHorizontal, Eye, Rocket, KeyRound, RotateCw, Pencil, Ban, CheckCircle, Loader2, Trash2, DownloadCloud } from 'lucide-react';
import { renameDevice, disableDevice, enableDevice, restartAgent, installAggregator } from '../../services/devices.service';
import LicenseManagementModal from './LicenseManagementModal';
import LaunchModuleModal from './LaunchModuleModal';
import RemoveDeviceModal from './RemoveDeviceModal';

interface ActionsMenuProps {
  status?: string;
  systemName?: string;
  deviceId?: string;
  isDisabled?: boolean;
  aggregatorStatus?: string;
  onAction?: () => void;
  onViewDevice?: () => void;
}

export default function ActionsMenu({
  status = 'Online',
  systemName = 'Unknown',
  deviceId = 'Unknown',
  isDisabled = false,
  aggregatorStatus = 'Missing',
  onAction,
  onViewDevice,
}: ActionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState('');
  const [renameError, setRenameError] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  const [licenseModalOpen, setLicenseModalOpen] = useState(false);
  const [launchModalOpen, setLaunchModalOpen] = useState(false);
  const [removeModalOpen, setRemoveModalOpen] = useState(false);

  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    placement: 'bottom-end',
    middleware: [
      offset(4),
      flip({ fallbackAxisSideDirection: 'start' }),
      shift({ padding: 8 }),
    ],
    whileElementsMounted: autoUpdate,
  });

  const click = useClick(context);
  const dismiss = useDismiss(context);
  const role = useRole(context);

  const { getReferenceProps, getFloatingProps } = useInteractions([
    click,
    dismiss,
    role,
  ]);

  const isOnline = status === 'Online' || status === 'ONLINE';

  const notifySuccess = (message: string) => {
    window.dispatchEvent(
      new CustomEvent('showNotification', {
        detail: { type: 'success', message },
      })
    );
    window.dispatchEvent(new Event('deviceStateChanged'));
    onAction?.();
  };

  const notifyError = (message: string) => {
    window.dispatchEvent(
      new CustomEvent('showNotification', {
        detail: { type: 'error', message },
      })
    );
  };

  const handleViewDevice = () => {
    setIsOpen(false);
    onViewDevice?.();
  };

  const handleRename = async () => {
    if (!newName.trim() || newName.trim().length < 3) {
      setRenameError('Must be at least 3 characters');
      return;
    }
    setActionLoading('rename');
    try {
      await renameDevice(deviceId, newName.trim());
      setIsRenaming(false);
      setNewName('');
      setRenameError('');
      setIsOpen(false);
      notifySuccess('Device renamed successfully');
    } catch (err: any) {
      setRenameError(err.message || 'Rename failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDisable = async () => {
    setActionLoading('disable');
    try {
      await disableDevice(deviceId);
      setIsOpen(false);
      notifySuccess('Device disabled successfully');
    } catch (err: any) {
      console.error('Disable failed:', err);
      notifyError('Failed to disable device');
    } finally {
      setActionLoading(null);
    }
  };

  const handleEnable = async () => {
    setActionLoading('enable');
    try {
      await enableDevice(deviceId);
      setIsOpen(false);
      notifySuccess('Device enabled successfully');
    } catch (err: any) {
      console.error('Enable failed:', err);
      notifyError('Failed to enable device');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRestart = async () => {
    setActionLoading('restart');
    try {
      await restartAgent(deviceId);
      setIsOpen(false);
      notifySuccess('Agent restart command sent');
    } catch (err: any) {
      console.error('Restart failed:', err);
      notifyError('Failed to restart agent');
    } finally {
      setActionLoading(null);
    }
  };

  const handleInstallAggregator = async () => {
    setActionLoading('installAggregator');
    try {
      await installAggregator(deviceId);
      setIsOpen(false);
      notifySuccess('Aggregator installation command sent');
    } catch (err: any) {
      console.error('Install failed:', err);
      notifyError('Failed to initiate aggregator installation');
    } finally {
      setActionLoading(null);
    }
  };

  const handleOpenLaunchModal = () => {
    setIsOpen(false);
    setLaunchModalOpen(true);
  };

  const handleOpenLicenseModal = () => {
    setIsOpen(false);
    setLicenseModalOpen(true);
  };

  const handleOpenRemoveModal = () => {
    setIsOpen(false);
    setRemoveModalOpen(true);
  };

  return (
    <>
      <button
        ref={refs.setReference}
        {...getReferenceProps()}
        className={`flex h-8 w-8 items-center justify-center rounded transition-colors focus:outline-none ${
          isOpen ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:bg-gray-100'
        }`}
        aria-label="Device actions"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>

      {isOpen && (
        <FloatingPortal>
          <FloatingFocusManager context={context} modal={false}>
            <div
              ref={refs.setFloating}
              style={floatingStyles}
              {...getFloatingProps()}
              className="z-50 w-64 rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
            >
              {/* Header */}
              <div className="px-3 py-2.5">
                <p className="text-sm font-semibold text-gray-900 truncate">{systemName}</p>
                <p className="text-[11px] font-medium text-gray-500 truncate">{deviceId}</p>
              </div>
              <div className="border-t border-gray-100" />

              {/* Actions */}
              <div className="py-1.5 flex flex-col">
                {/* --- Device Section --- */}
                <div className="px-3 py-1.5">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Device</span>
                </div>
                
                <button
                  onClick={handleViewDevice}
                  className="flex w-full items-center px-3 py-2 text-[13px] font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                >
                  <Eye className="mr-2.5 h-4 w-4 text-gray-400" />
                  View Details
                </button>

                {!isRenaming ? (
                  <button
                    onClick={() => setIsRenaming(true)}
                    className="flex w-full items-center px-3 py-2 text-[13px] font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                  >
                    <Pencil className="mr-2.5 h-4 w-4 text-gray-400" />
                    Rename Device
                  </button>
                ) : (
                  <div className="px-3 py-2 space-y-1.5 bg-gray-50/50">
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => { setNewName(e.target.value); setRenameError(''); }}
                      placeholder="New friendly name..."
                      className="w-full rounded border border-gray-200 px-2 py-1.5 text-xs focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                      autoFocus
                      onKeyDown={(e) => e.key === 'Enter' && handleRename()}
                    />
                    {renameError && <p className="text-[11px] text-red-500">{renameError}</p>}
                    <div className="flex space-x-1.5">
                      <button
                        onClick={handleRename}
                        disabled={actionLoading === 'rename'}
                        className="flex-1 inline-flex items-center justify-center rounded bg-gray-900 px-2 py-1.5 text-[11px] font-medium text-white hover:bg-gray-800 disabled:opacity-50"
                      >
                        {actionLoading === 'rename' && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                        Save
                      </button>
                      <button onClick={() => { setIsRenaming(false); setNewName(''); setRenameError(''); }} className="flex-1 rounded border border-gray-200 bg-white px-2 py-1.5 text-[11px] font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
                    </div>
                  </div>
                )}

                {isOnline && !isDisabled && (
                  <>
                    <div className="my-1.5 border-t border-gray-100" />
                    {/* --- Operations Section --- */}
                    <div className="px-3 py-1.5">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Operations</span>
                    </div>

                    <button
                      onClick={handleOpenLaunchModal}
                      className="flex w-full items-center px-3 py-2 text-[13px] font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                    >
                      <Rocket className="mr-2.5 h-4 w-4 text-gray-400" />
                      Launch Module
                    </button>

                    <button
                      onClick={handleOpenLicenseModal}
                      className="flex w-full items-center px-3 py-2 text-[13px] font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                    >
                      <KeyRound className="mr-2.5 h-4 w-4 text-gray-400" />
                      Manage Licenses
                    </button>

                    <button
                      onClick={handleRestart}
                      disabled={actionLoading === 'restart'}
                      className="flex w-full items-center px-3 py-2 text-[13px] font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors disabled:opacity-50"
                    >
                      {actionLoading === 'restart' ? (
                        <Loader2 className="mr-2.5 h-4 w-4 text-gray-400 animate-spin" />
                      ) : (
                        <RotateCw className="mr-2.5 h-4 w-4 text-gray-400" />
                      )}
                      Restart Agent
                    </button>

                    {(aggregatorStatus === 'Missing' || aggregatorStatus === 'Install Failed') && (
                      <button
                        onClick={handleInstallAggregator}
                        disabled={actionLoading === 'installAggregator'}
                        className="flex w-full items-center px-3 py-2 text-[13px] font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors disabled:opacity-50"
                      >
                        {actionLoading === 'installAggregator' ? (
                          <Loader2 className="mr-2.5 h-4 w-4 text-gray-400 animate-spin" />
                        ) : (
                          <DownloadCloud className="mr-2.5 h-4 w-4 text-gray-400" />
                        )}
                        Install Aggregator
                      </button>
                    )}
                  </>
                )}

                <div className="my-1.5 border-t border-gray-100" />
                {/* --- Danger Zone Section --- */}
                <div className="px-3 py-1.5">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-red-400">Danger Zone</span>
                </div>

                {isDisabled ? (
                  <button
                    onClick={handleEnable}
                    disabled={actionLoading === 'enable'}
                    className="group flex w-full items-center px-3 py-2 text-[13px] font-medium text-emerald-600 hover:bg-emerald-50 transition-colors disabled:opacity-50"
                  >
                    {actionLoading === 'enable' ? (
                      <Loader2 className="mr-2.5 h-4 w-4 text-emerald-500 animate-spin" />
                    ) : (
                      <CheckCircle className="mr-2.5 h-4 w-4 text-emerald-500 group-hover:text-emerald-600" />
                    )}
                    Enable Device
                  </button>
                ) : (
                  <button
                    onClick={handleDisable}
                    disabled={actionLoading === 'disable'}
                    className="group flex w-full items-center px-3 py-2 text-[13px] font-medium text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    {actionLoading === 'disable' ? (
                      <Loader2 className="mr-2.5 h-4 w-4 text-red-500 animate-spin" />
                    ) : (
                      <Ban className="mr-2.5 h-4 w-4 text-red-500 group-hover:text-red-600" />
                    )}
                    Disable Device
                  </button>
                )}

                <button
                  onClick={handleOpenRemoveModal}
                  className="group flex w-full items-center px-3 py-2 text-[13px] font-medium text-red-600 hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="mr-2.5 h-4 w-4 text-red-500 group-hover:text-red-600" />
                  Remove Device
                </button>
              </div>
            </div>
          </FloatingFocusManager>
        </FloatingPortal>
      )}

      <LicenseManagementModal
        isOpen={licenseModalOpen}
        onClose={() => setLicenseModalOpen(false)}
        deviceId={deviceId}
        systemName={systemName}
      />

      <LaunchModuleModal
        isOpen={launchModalOpen}
        onClose={() => setLaunchModalOpen(false)}
        deviceId={deviceId}
        systemName={systemName}
      />

      <RemoveDeviceModal
        isOpen={removeModalOpen}
        onClose={() => setRemoveModalOpen(false)}
        deviceId={deviceId}
        systemName={systemName}
      />
    </>
  );
}
