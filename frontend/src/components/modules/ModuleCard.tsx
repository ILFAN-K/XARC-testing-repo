'use client';

import { motion } from 'framer-motion';
import { Flame, Zap, Forklift, Shield, HardHat, Box } from 'lucide-react';
import type { Module } from '@/types/module';

/* ------------------------------------------------------------------ */
/*  Icon map                                                           */
/* ------------------------------------------------------------------ */
const ICON_MAP: Record<string, React.ElementType> = {
  flame: Flame,
  zap: Zap,
  forklift: Forklift,
  shield: Shield,
  'hard-hat': HardHat,
  box: Box,
};

/* ------------------------------------------------------------------ */
/*  ModuleCard                                                         */
/* ------------------------------------------------------------------ */
interface ModuleCardProps {
  module: Module;
  index: number;
  /** Called when the card is clicked — opens module details */
  onSelect?: (module: Module) => void;
}

export default function ModuleCard({ module, index, onSelect }: ModuleCardProps) {
  const IconComponent = ICON_MAP[module.iconKey] || Box;
  
  // Utilization logic
  const utilizationPercent = module.purchasedLicenses > 0 
    ? Math.round((module.licensedSystems / module.purchasedLicenses) * 100) 
    : 0;
    
  let health = 'Healthy';
  let healthColor = 'text-emerald-600';
  let barColor = 'bg-emerald-500';
  
  if (module.availableLicenses === 0) {
    health = 'Exhausted';
    healthColor = 'text-red-600';
    barColor = 'bg-red-500';
  } else if (utilizationPercent >= 90) {
    health = 'Near Capacity';
    healthColor = 'text-amber-600';
    barColor = 'bg-amber-500';
  }

  return (
    <motion.div
      onClick={() => onSelect?.(module)}
      className="flex flex-col bg-white rounded-[12px] border border-gray-200 overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-md hover:border-gray-300"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
    >
      {/* ---- Card body ---- */}
      <div className="px-5 pt-5 pb-5 flex-1 flex flex-col">
        {/* Icon */}
        <div className="w-10 h-10 rounded-lg border border-gray-200 bg-white flex items-center justify-center mb-4">
          <IconComponent className="w-5 h-5 text-gray-700" />
        </div>

        {/* Title + description */}
        <h3 className="text-[16px] font-semibold text-gray-900 leading-snug">
          {module.name}
        </h3>
        <p className="text-[13px] text-gray-500 mt-1 mb-6">{module.description}</p>

        {/* Concise metrics */}
        <div className="mt-auto">
          <div className="text-[13px] font-medium text-gray-900 mb-2">
            {module.licensedSystems} / {module.purchasedLicenses} Licenses Assigned
          </div>
          
          <div className="text-[13px] font-medium text-gray-900 mb-3">
            {module.availableLicenses} {module.availableLicenses === 1 ? 'License' : 'Licenses'} Available
          </div>
          
          <div className="flex items-center gap-3">
            <div className="h-1.5 flex-1 rounded-full bg-gray-100 overflow-hidden">
              <motion.div 
                className={`h-full rounded-full ${utilizationPercent >= 90 ? 'bg-amber-500' : 'bg-gray-900'}`}
                initial={{ width: 0 }}
                animate={{ width: `${utilizationPercent}%` }}
                transition={{ duration: 0.8, delay: 0.3 }}
              />
            </div>
            <span className="text-[12px] font-medium text-gray-500 whitespace-nowrap">{utilizationPercent}% Utilized</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}