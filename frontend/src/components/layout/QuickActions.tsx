'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronRight, MonitorSmartphone, UserPlus, Box, KeyRound, Zap } from 'lucide-react';
import QuickLaunchModal from '../systems/QuickLaunchModal';

export default function QuickActions() {
  const [expanded, setExpanded] = useState(false);
  const [isLaunchModalOpen, setIsLaunchModalOpen] = useState(false);

    const actions = [
      { label: 'Register Device', icon: MonitorSmartphone, href: '/admin/systems?action=register' },
      { label: 'Create User', icon: UserPlus, href: '/admin/users?action=create' },
      { label: 'Launch Module', icon: Box, onClick: () => setIsLaunchModalOpen(true) },
      { label: 'Generate Access Code', icon: KeyRound, href: '/admin/settings' },
    ];
  
    return (
      <>
        <div className="mx-2 mb-2 mt-1 bg-gray-50/80 rounded-xl border border-gray-100 overflow-hidden transition-all duration-200">
          <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between px-3 py-2.5 text-[13px] font-semibold text-gray-800 hover:bg-gray-100 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-gray-600 fill-gray-200" />
            <span>Quick Actions</span>
          </div>
          {expanded ? (
            <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
          )}
        </button>
  
        <div
          className={`grid transition-all duration-200 ease-in-out ${
            expanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
          }`}
        >
          <div className="overflow-hidden">
            <div className="px-1.5 pb-1.5 pt-0">
              <ul className="space-y-0.5">
                {actions.map((action, i) => (
                  <li key={i}>
                    {action.onClick ? (
                      <button onClick={action.onClick} className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-[13px] font-medium text-gray-600 hover:bg-white hover:text-gray-900 hover:shadow-sm border border-transparent hover:border-gray-200 transition-all duration-150 text-left">
                        <action.icon className="w-4 h-4 text-gray-400 shrink-0" />
                        <span>{action.label}</span>
                      </button>
                    ) : (
                      <Link href={action.href!} className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-[13px] font-medium text-gray-600 hover:bg-white hover:text-gray-900 hover:shadow-sm border border-transparent hover:border-gray-200 transition-all duration-150">
                        <action.icon className="w-4 h-4 text-gray-400 shrink-0" />
                        <span>{action.label}</span>
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
      <QuickLaunchModal 
        isOpen={isLaunchModalOpen} 
        onClose={() => setIsLaunchModalOpen(false)} 
      />
    </>
  );
}
