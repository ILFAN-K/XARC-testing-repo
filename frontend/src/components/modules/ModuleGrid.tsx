'use client';

import { motion } from 'framer-motion';
import { Loader2, PackageOpen, AlertCircle } from 'lucide-react';
import ModuleCard from './ModuleCard';
import type { Module } from '@/types/module';

/* ------------------------------------------------------------------ */
/*  ModuleGrid                                                         */
/*  Responsive 3-column grid of module cards                           */
/* ------------------------------------------------------------------ */
interface ModuleGridProps {
  modules: Module[];
  /** Passed through to each ModuleCard for click handling */
  onModuleSelect?: (module: Module) => void;
  /** Show a loading skeleton state */
  isLoading?: boolean;
  /** Error message to display instead of the grid */
  error?: string | null;
}

export default function ModuleGrid({
  modules,
  onModuleSelect,
  isLoading = false,
  error = null,
}: ModuleGridProps) {
  /* ---- Loading state ---- */
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="rounded-[10px] border border-gray-200 bg-white p-5 animate-pulse"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 rounded-lg bg-gray-100" />
              <div className="w-16 h-6 rounded bg-gray-100" />
            </div>
            <div className="h-4 w-3/4 rounded bg-gray-100 mb-2" />
            <div className="h-3 w-1/2 rounded bg-gray-100 mb-4" />
            <div className="space-y-2">
              <div className="h-3 w-full rounded bg-gray-100" />
              <div className="h-3 w-full rounded bg-gray-100" />
            </div>
            <div className="border-t border-gray-100 mt-4 pt-3">
              <div className="h-3 w-24 rounded bg-gray-100 mb-1" />
              <div className="h-3 w-20 rounded bg-gray-100" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  /* ---- Error state ---- */
  if (error) {
    return (
      <motion.div
        className="mt-6 flex flex-col items-center justify-center py-16 rounded-[10px] border border-gray-200 bg-white"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <AlertCircle className="w-10 h-10 text-red-400 mb-3" />
        <p className="text-sm font-medium text-gray-900">Failed to load modules</p>
        <p className="text-xs text-gray-400 mt-1 max-w-xs text-center">{error}</p>
      </motion.div>
    );
  }

  /* ---- Empty state ---- */
  if (modules.length === 0) {
    return (
      <motion.div
        className="mt-6 flex flex-col items-center justify-center py-16 rounded-[10px] border border-gray-200 bg-white"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <PackageOpen className="w-10 h-10 text-gray-300 mb-3" />
        <p className="text-sm font-medium text-gray-900">No modules found</p>
        <p className="text-xs text-gray-400 mt-1">
          Try adjusting your search or deploy a new module.
        </p>
      </motion.div>
    );
  }

  /* ---- Normal grid ---- */
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
      {modules.map((mod, index) => (
        <ModuleCard
          key={mod.id}
          module={mod}
          index={index}
          onSelect={onModuleSelect}
        />
      ))}
    </div>
  );
}

