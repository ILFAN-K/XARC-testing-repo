'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Server } from 'lucide-react';
import ModulesHeader from '@/components/modules/ModulesHeader';
import ModuleFilters, { FilterStatus, SortOption } from '@/components/modules/ModuleFilters';
import ModuleGrid from '@/components/modules/ModuleGrid';
import AssignSystemsModal from '@/components/modules/AssignSystemsModal';
import PurchaseLicensesModal from '@/components/modules/PurchaseLicensesModal';
import type { Module } from '@/types/module';
import { fetchModules, fetchModuleDetails, removeModuleAssignment } from '@/services/modules.service';

export default function ModulesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentFilter, setCurrentFilter] = useState<FilterStatus>('All Modules');
  const [currentSort, setCurrentSort] = useState<SortOption>('Name');
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  
  const [modules, setModules] = useState<Module[]>([]);

  const loadModules = useCallback(async () => {
    const data = await fetchModules(searchQuery, currentFilter, currentSort);
    setModules(data);
  }, [searchQuery, currentFilter, currentSort]);

  useEffect(() => {
    loadModules();
  }, [loadModules]);

  const handleModuleSelect = useCallback((module: Module) => {
    setSelectedModule(module);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* Page header */}
      <ModulesHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Filters & Sort */}
      <ModuleFilters
        currentFilter={currentFilter}
        onFilterChange={setCurrentFilter}
        currentSort={currentSort}
        onSortChange={setCurrentSort}
      />

      {/* Module cards grid */}
      <ModuleGrid
        modules={modules}
        onModuleSelect={handleModuleSelect}
      />

      {/* Module Details Modal */}
      <AnimatePresence>
        {selectedModule && (
          <ModuleDetailsModal
            module={selectedModule}
            onClose={() => setSelectedModule(null)}
            onUpdate={() => {
              loadModules();
              // Optionally re-fetch the selected module directly if we want to keep it open
              fetchModuleDetails(selectedModule.id).then((updated: Module | null) => {
                if (updated) setSelectedModule(updated);
              });
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Module Details Modal                                               */
/* ------------------------------------------------------------------ */
function ModuleDetailsModal({
  module,
  onClose,
  onUpdate
}: {
  module: Module;
  onClose: () => void;
  onUpdate: () => void;
}) {
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [isPurchaseOpen, setIsPurchaseOpen] = useState(false);

  const utilizationPercent = module.purchasedLicenses > 0 
    ? Math.round((module.licensedSystems / module.purchasedLicenses) * 100) 
    : 0;

  return (
    <>
      {/* Backdrop */}
      <motion.div
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      {/* Panel */}
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.97 }}
        transition={{ duration: 0.2 }}
      >
        <div
          className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-[12px] border border-gray-200 bg-white shadow-xl flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors z-10"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="px-5 pt-5 pb-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 pr-8">{module.name}</h2>
            <p className="text-[13px] text-gray-500 mt-1">{module.description}</p>
            
            <div className="flex items-center gap-4 mt-3 text-[13px] font-medium text-gray-700">
              <span className="flex items-center gap-1.5">
                <span className="text-gray-400">Version:</span> {module.version}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="text-gray-400">License Type:</span> {module.licenseType}
              </span>
            </div>
          </div>

          {/* Body */}
          <div className="p-5 space-y-6">
            
            {/* License Capacity */}
            <div>
              <h3 className="text-[13px] font-semibold text-gray-900 mb-3 uppercase tracking-wide">License Allocation</h3>
              
              <div className="flex justify-between items-center bg-gray-50 p-3.5 rounded-lg border border-gray-100 mb-4">
                <div className="text-center px-2">
                  <div className="text-xl font-bold text-gray-900 leading-tight">{module.purchasedLicenses}</div>
                  <div className="text-[11px] font-medium text-gray-500 uppercase">Licenses<br/>Purchased</div>
                </div>
                <div className="h-8 w-px bg-gray-200"></div>
                <div className="text-center px-2">
                  <div className="text-xl font-bold text-gray-900 leading-tight">{module.licensedSystems}</div>
                  <div className="text-[11px] font-medium text-gray-500 uppercase">Systems<br/>Assigned</div>
                </div>
                <div className="h-8 w-px bg-gray-200"></div>
                <div className="text-center px-2">
                  <div className="text-xl font-bold text-gray-900 leading-tight">{module.availableLicenses}</div>
                  <div className="text-[11px] font-medium text-gray-500 uppercase">Available<br/>Licenses</div>
                </div>
              </div>
              
              {/* Utilization */}
              <div>
                <div className="flex items-center justify-between text-[13px] font-medium text-gray-700 mb-2">
                  <span>{module.licensedSystems} of {module.purchasedLicenses} licenses assigned.</span>
                  <span>{utilizationPercent}%</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-gray-200 overflow-hidden mb-1">
                  <div 
                    className={`h-full rounded-full ${utilizationPercent >= 90 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                    style={{ width: `${utilizationPercent}%` }}
                  />
                </div>
                <p className="text-[12px] text-gray-500 text-right">{module.availableLicenses} licenses available.</p>
              </div>
            </div>

            {/* Systems Assigned */}
            <div>
              <details className="group border border-gray-200 rounded-lg overflow-hidden [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 cursor-pointer select-none transition-colors">
                  <span className="text-[13px] font-semibold text-gray-900">
                    Systems Assigned ({module.assignedSystemsList.length})
                  </span>
                  <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide group-open:hidden">
                    ▼ Expand
                  </span>
                  <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide hidden group-open:block">
                    ▲ Collapse
                  </span>
                </summary>
                
                <div className="bg-white border-t border-gray-100">
                  {module.assignedSystemsList.length > 0 ? (
                    <div className="divide-y divide-gray-100 max-h-[240px] overflow-y-auto">
                      {module.assignedSystemsList.map((sys) => (
                        <div key={sys.id} className="flex items-center justify-between p-3 hover:bg-gray-50/50 transition-colors group/row">
                          <div>
                            <div className="text-[13px] font-medium text-gray-900">{sys.device?.machineName || sys.deviceId}</div>
                            {sys.device?.friendlyName && <div className="text-[12px] text-gray-500 mt-0.5">{sys.device.friendlyName}</div>}
                          </div>
                          <button
                            type="button"
                            onClick={async () => {
                              if (confirm('Are you sure you want to remove this assignment?')) {
                                try {
                                  await removeModuleAssignment(module.id, sys.id);
                                  onUpdate();
                                } catch (e) {
                                  alert('Failed to remove assignment');
                                }
                              }
                            }}
                            className="text-[12px] font-semibold text-gray-400 hover:text-red-600 transition-colors px-2 py-1 opacity-0 group-hover/row:opacity-100 focus:opacity-100"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-sm text-gray-500 text-center">
                      No systems currently assigned.
                    </div>
                  )}
                </div>
              </details>
            </div>

          </div>

          {/* Actions Footer */}
          <div className="px-5 py-3.5 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3 rounded-b-[12px] mt-auto">
            <button
              type="button"
              onClick={() => setIsPurchaseOpen(true)}
              className="px-4 py-2 h-9 rounded-lg border border-gray-200 bg-white text-gray-900 text-[13px] font-semibold hover:bg-gray-50 transition-colors shadow-sm"
            >
              Purchase Licenses
            </button>
            <button
              type="button"
              onClick={() => setIsAssignOpen(true)}
              className="px-4 py-2 h-9 rounded-lg bg-gray-900 text-white text-[13px] font-semibold hover:bg-gray-800 transition-colors shadow-sm"
            >
              Assign Systems
            </button>
          </div>
        </div>
      </motion.div>

      {/* Child Modals */}
      <AnimatePresence>
        {isAssignOpen && (
          <AssignSystemsModal
            module={module}
            onClose={() => setIsAssignOpen(false)}
            onSuccess={() => {
              setIsAssignOpen(false);
              onUpdate();
            }}
          />
        )}
        {isPurchaseOpen && (
          <PurchaseLicensesModal
            module={module}
            onClose={() => setIsPurchaseOpen(false)}
            onSuccess={() => {
              setIsPurchaseOpen(false);
              onUpdate();
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}
function DetailBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 rounded-lg border border-gray-100 bg-gray-50">
      <span className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">{label}</span>
      <span className="block text-sm font-semibold text-gray-900">{value}</span>
    </div>
  );
}


