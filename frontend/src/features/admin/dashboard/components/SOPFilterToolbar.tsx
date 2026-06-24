'use client';

import { useState, useRef, useEffect } from 'react';
import type { SOPFilters } from '../types/dashboard.types';

/* ------------------------------------------------------------------ */
/*  SOPFilterToolbar — production-ready filter bar above Live SOP     */
/* ------------------------------------------------------------------ */
interface SOPFilterToolbarProps {
  filters: SOPFilters;
  onChange: (filters: SOPFilters) => void;
  moduleOptions: string[];
}

/* ---- Dropdown wrapper ---- */
interface FilterDropdownProps {
  label: string;
  isActive: boolean;
  children: React.ReactNode;
}

function FilterDropdown({ label, isActive, children }: FilterDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition-all whitespace-nowrap ${
          isActive
            ? 'border-gray-900 bg-gray-900 text-white'
            : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
        }`}
      >
        {label}
        <svg className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-20 min-w-[180px] py-1 max-h-56 overflow-y-auto">
          {children}
        </div>
      )}
    </div>
  );
}

/* ---- Checkbox option ---- */
interface CheckOptionProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function CheckOption({ label, checked, onChange }: CheckOptionProps) {
  return (
    <label className="flex items-center gap-2.5 px-3 py-2 hover:bg-gray-50 cursor-pointer transition-colors">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-3.5 h-3.5 rounded border-gray-300 text-gray-900 focus:ring-gray-900/20"
      />
      <span className="text-xs text-gray-700">{label}</span>
    </label>
  );
}

/* ---- Radio option ---- */
interface RadioOptionProps {
  label: string;
  selected: boolean;
  onSelect: () => void;
}

function RadioOption({ label, selected, onSelect }: RadioOptionProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full text-left px-3 py-2 text-xs transition-colors ${
        selected ? 'bg-gray-100 text-gray-900 font-medium' : 'text-gray-700 hover:bg-gray-50'
      }`}
    >
      {label}
    </button>
  );
}

/* ---- Status options ---- */
const STATUS_OPTIONS = ['Online', 'Offline'];
const LICENSE_OPTIONS = ['Active', 'Expiring', 'Expired', 'Unlicensed'];
const HEALTH_OPTIONS = [
  { label: 'Excellent (90–100)', value: 'excellent' },
  { label: 'Good (75–89)', value: 'good' },
  { label: 'Warning (50–74)', value: 'warning' },
  { label: 'Critical (0–49)', value: 'critical' },
];
const LAST_SEEN_OPTIONS = [
  { label: 'All', value: '' },
  { label: 'Last 5 Minutes', value: '5m' },
  { label: 'Last Hour', value: '1h' },
  { label: 'Today', value: 'today' },
  { label: 'Last 7 Days', value: '7d' },
  { label: 'Offline > 7 Days', value: '>7d' },
];

export default function SOPFilterToolbar({
  filters,
  onChange,
  moduleOptions,
}: SOPFilterToolbarProps) {
  const toggleArray = (arr: string[], value: string) =>
    arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];

  return (
    <div className="flex flex-wrap items-center gap-2 px-5 py-3 border-b border-gray-100">
      {/* Search */}
      <div className="relative">
        <input
          id="sop-search"
          type="text"
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          placeholder="Search systems…"
          className="w-[200px] h-8 pl-8 pr-3 rounded-lg border border-gray-200 bg-white text-xs text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 transition-colors"
        />
        <svg
          className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400"
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
      </div>

      {/* Status */}
      <FilterDropdown label="Status" isActive={filters.status.length > 0}>
        {STATUS_OPTIONS.map((opt) => (
          <CheckOption
            key={opt}
            label={opt}
            checked={filters.status.includes(opt)}
            onChange={() => onChange({ ...filters, status: toggleArray(filters.status, opt) })}
          />
        ))}
      </FilterDropdown>

      {/* License */}
      <FilterDropdown label="License" isActive={filters.license.length > 0}>
        {LICENSE_OPTIONS.map((opt) => (
          <CheckOption
            key={opt}
            label={opt}
            checked={filters.license.includes(opt)}
            onChange={() => onChange({ ...filters, license: toggleArray(filters.license, opt) })}
          />
        ))}
      </FilterDropdown>

      {/* Module */}
      <FilterDropdown label="Module" isActive={filters.module.length > 0}>
        {moduleOptions.length > 0 ? (
          moduleOptions.map((opt) => (
            <CheckOption
              key={opt}
              label={opt}
              checked={filters.module.includes(opt)}
              onChange={() => onChange({ ...filters, module: toggleArray(filters.module, opt) })}
            />
          ))
        ) : (
          <div className="px-3 py-2 text-xs text-gray-400">No modules found</div>
        )}
      </FilterDropdown>

      {/* Health */}
      <FilterDropdown label="Health" isActive={filters.health.length > 0}>
        {HEALTH_OPTIONS.map((opt) => (
          <CheckOption
            key={opt.value}
            label={opt.label}
            checked={filters.health.includes(opt.value)}
            onChange={() => onChange({ ...filters, health: toggleArray(filters.health, opt.value) })}
          />
        ))}
      </FilterDropdown>

      {/* Last Seen */}
      <FilterDropdown label="Last Seen" isActive={filters.lastSeen !== ''}>
        {LAST_SEEN_OPTIONS.map((opt) => (
          <RadioOption
            key={opt.value}
            label={opt.label}
            selected={filters.lastSeen === opt.value}
            onSelect={() => onChange({ ...filters, lastSeen: opt.value })}
          />
        ))}
      </FilterDropdown>

      {/* Organization — Future-ready (disabled) */}
      <div className="relative group">
        <button
          type="button"
          disabled
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-xs font-medium text-gray-400 cursor-not-allowed whitespace-nowrap"
        >
          Organization
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-gray-900 text-white text-[10px] rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          Coming Soon
        </div>
      </div>
    </div>
  );
}
