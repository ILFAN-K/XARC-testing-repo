'use client';

import { Search } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

/* ------------------------------------------------------------------ */
/*  ModulesHeader                                                     */
/*  Page title + subtitle + search input + Purchase Module button     */
/* ------------------------------------------------------------------ */
interface ModulesHeaderProps {
  searchQuery?: string;
  onSearchChange?: (value: string) => void;
}

export default function ModulesHeader({
  searchQuery = '',
  onSearchChange,
}: ModulesHeaderProps) {
  return (
    <motion.div
      className="flex items-start justify-between"
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Modules</h1>
        <p className="text-sm text-gray-500 mt-1">Manage purchased modules and license allocations.</p>
      </div>

      <div className="flex items-center gap-3">
        {/* Search input */}
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400" />
          <input
            id="modules-search"
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange?.(e.target.value)}
            placeholder="Search modules..."
            className="w-[280px] h-[44px] pl-10 pr-4 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-all focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
          />
        </div>

        {/* Purchase Module primary button */}
        <Link
          href="/admin/modules/purchase"
          id="btn-purchase-module"
          className="inline-flex items-center gap-1.5 px-5 py-2 h-[44px] rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors"
        >
          Purchase Module
        </Link>
      </div>
    </motion.div>
  );
}
