'use client';

import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

export type FilterStatus = 'All Modules' | 'Available Capacity' | 'Near Capacity' | 'Fully Utilized';
export type SortOption = 'Name' | 'License Usage' | 'Recently Updated';

interface ModuleFiltersProps {
  currentFilter: FilterStatus;
  onFilterChange: (filter: FilterStatus) => void;
  currentSort: SortOption;
  onSortChange: (sort: SortOption) => void;
}

export default function ModuleFilters({
  currentFilter,
  onFilterChange,
  currentSort,
  onSortChange,
}: ModuleFiltersProps) {
  const filters: FilterStatus[] = ['All Modules', 'Available Capacity', 'Near Capacity', 'Fully Utilized'];
  const sorts: SortOption[] = ['Name', 'License Usage', 'Recently Updated'];

  return (
    <motion.div
      className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-6 border-b border-gray-200 pb-4"
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
    >
      {/* Left side: Filter Buttons */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-hide">
        {filters.map((filter) => {
          const isActive = currentFilter === filter;
          return (
            <button
              key={filter}
              onClick={() => onFilterChange(filter)}
              className={`px-3.5 py-1.5 rounded-full text-[13px] font-medium whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-gray-900 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {filter}
            </button>
          );
        })}
      </div>

      {/* Right side: Sort Dropdown (Simulated with native select for simplicity/reliability) */}
      <div className="flex items-center gap-3 shrink-0">
        <span className="text-[13px] font-medium text-gray-500">Sort By:</span>
        <div className="relative">
          <select
            value={currentSort}
            onChange={(e) => onSortChange(e.target.value as SortOption)}
            className="appearance-none pl-3 pr-8 py-1.5 rounded-lg border border-gray-200 bg-white text-[13px] font-medium text-gray-900 outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 cursor-pointer"
          >
            {sorts.map((sort) => (
              <option key={sort} value={sort}>
                {sort}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
        </div>
      </div>
    </motion.div>
  );
}
