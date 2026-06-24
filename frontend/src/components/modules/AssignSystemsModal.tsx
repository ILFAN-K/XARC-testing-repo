'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Monitor, Server, Laptop, ChevronDown, CheckSquare, Square } from 'lucide-react';
import type { Module } from '@/types/module';
import { fetchAvailableSystems, assignModuleToSystemsBulk } from '@/services/modules.service';

interface AssignSystemsModalProps {
  module: Module;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AssignSystemsModal({ module, onClose, onSuccess }: AssignSystemsModalProps) {
  const [systems, setSystems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadSystems() {
      try {
        setLoading(true);
        const available = await fetchAvailableSystems(module.id);
        setSystems(available);
      } catch (e) {
        setError('Failed to load available systems.');
      } finally {
        setLoading(false);
      }
    }
    loadSystems();
  }, [module.id]);

  const filteredSystems = systems.filter((sys) => {
    const q = searchQuery.toLowerCase();
    const nameMatch = sys.friendlyName?.toLowerCase().includes(q);
    const idMatch = sys.machineName?.toLowerCase().includes(q) || sys.deviceId?.toLowerCase().includes(q);
    return nameMatch || idMatch;
  });

  const remainingCapacity = module.availableLicenses - selectedIds.length;
  const isOverCapacity = remainingCapacity < 0;

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter(sysId => sysId !== id);
      } else {
        // Prevent adding if out of capacity
        if (remainingCapacity <= 0) return prev;
        return [...prev, id];
      }
    });
  };

  const handleSubmit = async () => {
    if (selectedIds.length === 0) return;
    if (isOverCapacity) return;

    try {
      setIsSubmitting(true);
      setError('');
      await assignModuleToSystemsBulk(module.id, selectedIds);
      onSuccess();
    } catch (e: any) {
      setError(e.response?.data?.message || e.message || 'Failed to assign systems in bulk.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.15 }}
        className="w-full max-w-md bg-white rounded-[16px] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <div>
            <h2 className="text-[16px] font-semibold text-gray-900">Assign Systems</h2>
            <p className="text-[13px] text-gray-500 mt-0.5">Select online systems for {module.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 flex-1 overflow-y-auto">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-600 text-[13px] font-medium border border-red-100">
              {error}
            </div>
          )}

          {/* Metrics */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
              <div className="text-[12px] font-medium text-gray-500 mb-1">Selected Systems</div>
              <div className="text-[18px] font-semibold text-gray-900">{selectedIds.length}</div>
            </div>
            <div className={`p-3 rounded-xl border ${remainingCapacity === 0 ? 'bg-amber-50 border-amber-100' : 'bg-emerald-50 border-emerald-100'}`}>
              <div className="text-[12px] font-medium text-gray-500 mb-1">Remaining Capacity</div>
              <div className={`text-[18px] font-semibold ${remainingCapacity === 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                {remainingCapacity} / {module.availableLicenses}
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search available systems..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-[13px] text-gray-900 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-shadow"
            />
          </div>

          {/* List */}
          <div className="space-y-2">
            {loading ? (
              <div className="p-4 text-center text-[13px] text-gray-500">Loading available systems...</div>
            ) : filteredSystems.length === 0 ? (
              <div className="p-4 text-center text-[13px] text-gray-500 border border-dashed border-gray-200 rounded-xl">
                {searchQuery ? 'No systems match your search.' : 'No available systems found.'}
              </div>
            ) : (
              filteredSystems.map((sys) => {
                const isSelected = selectedIds.includes(sys.id);
                const isDisabled = !isSelected && remainingCapacity <= 0;

                return (
                  <div
                    key={sys.id}
                    onClick={() => !isDisabled && toggleSelection(sys.id)}
                    className={`flex items-center p-3 rounded-xl border transition-colors ${
                      isDisabled 
                        ? 'bg-gray-50 border-gray-100 opacity-50 cursor-not-allowed' 
                        : isSelected
                          ? 'bg-blue-50 border-blue-200 cursor-pointer'
                          : 'bg-white border-gray-200 cursor-pointer hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="mr-3 text-blue-600">
                      {isSelected ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5 text-gray-300" />}
                    </div>
                    <div>
                      <div className="text-[13px] font-semibold text-gray-900 flex items-center gap-2">
                        {sys.friendlyName || sys.machineName}
                      </div>
                      {sys.friendlyName && (
                        <div className="text-[12px] text-gray-500 mt-0.5">{sys.machineName}</div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3 rounded-b-[16px] sticky bottom-0 z-10">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-[13px] font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || selectedIds.length === 0 || isOverCapacity}
            className="px-4 py-2 text-[13px] font-semibold text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting ? 'Assigning...' : `Assign ${selectedIds.length} System${selectedIds.length !== 1 ? 's' : ''}`}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
