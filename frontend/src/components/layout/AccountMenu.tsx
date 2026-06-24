'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  User, 
  Building, 
  Bell, 
  Palette, 
  Settings, 
  HelpCircle, 
  Info, 
  LogOut 
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

export default function AccountMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const initials = user?.fullName
    ? user.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || 'U';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const toggleMenu = () => setIsOpen(!isOpen);

  // Grouping menu items
  const menuGroups = [
    {
      label: 'Account',
      items: [
        { icon: User, label: 'My Profile', action: () => {} },
        { icon: Building, label: 'Organization Details', action: () => {} },
        { icon: Bell, label: 'Notification Preferences', action: () => {} },
        { icon: Palette, label: 'Appearance', action: () => {} },
        { icon: Settings, label: 'Account Settings', action: () => {} },
      ]
    },
    {
      label: 'Support',
      items: [
        { icon: HelpCircle, label: 'Help & Documentation', action: () => {} },
        { icon: Info, label: 'About XARC Nexus Hub', action: () => {} },
      ]
    }
  ];

  return (
    <div className="relative" ref={menuRef}>
      {/* User avatar button */}
      <button
        id="admin-user-menu"
        type="button"
        onClick={toggleMenu}
        aria-expanded={isOpen}
        aria-haspopup="true"
        className={`w-9 h-9 rounded-full text-white text-xs font-bold flex items-center justify-center transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
          ${isOpen ? 'bg-blue-600 shadow-md scale-105' : 'bg-gray-800 hover:bg-gray-700 hover:scale-105'}
        `}
        aria-label="User account menu"
      >
        {initials}
      </button>

      {/* Dropdown Menu using Framer Motion */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50 origin-top-right"
            role="menu"
            aria-orientation="vertical"
            aria-labelledby="admin-user-menu"
          >
            {/* User Information Section */}
            <div className="px-5 py-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
              <p className="text-sm font-bold text-gray-900 truncate" role="none">
                {user?.fullName || user?.email || 'Admin User'}
              </p>
              <p className="text-xs text-blue-600 font-medium mt-0.5 truncate flex items-center gap-1.5" role="none">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 block"></span>
                {user?.role || 'Administrator'}
              </p>
            </div>

            {/* Dynamic Sections */}
            <div className="max-h-[calc(100vh-120px)] overflow-y-auto">
              {menuGroups.map((group, index) => (
                <div key={index} className="py-2 border-b border-gray-50 last:border-b-0" role="none">
                  <div className="px-5 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider" role="none">
                    {group.label}
                  </div>
                  {group.items.map((item, itemIndex) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={itemIndex}
                        onClick={() => {
                          item.action();
                          setIsOpen(false);
                        }}
                        className="w-full text-left px-5 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600 group flex items-center transition-colors focus:outline-none focus:bg-gray-50"
                        role="menuitem"
                      >
                        <Icon className="mr-3 h-[18px] w-[18px] text-gray-400 group-hover:text-blue-500 transition-colors" aria-hidden="true" />
                        <span className="font-medium">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              ))}

              {/* Session Section */}
              <div className="py-2 bg-gray-50" role="none">
                <button
                  onClick={() => {
                    handleLogout();
                    setIsOpen(false);
                  }}
                  className="w-full text-left px-5 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center transition-colors focus:outline-none focus:bg-red-50 group"
                  role="menuitem"
                >
                  <LogOut className="mr-3 h-[18px] w-[18px] text-red-500 group-hover:text-red-600 transition-colors" aria-hidden="true" />
                  <span className="font-medium">Sign Out</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
