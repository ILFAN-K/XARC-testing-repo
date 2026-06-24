'use client';

import AccountMenu from './AccountMenu';

/* ------------------------------------------------------------------ */
/*  AdminHeader                                                       */
/*  Fixed top bar — XARC NEXUS branding, notification, account menu   */
/* ------------------------------------------------------------------ */
export default function AdminHeader() {
  return (
    <header className="fixed top-0 left-0 right-0 h-[57px] bg-white border-b border-gray-200 flex items-center justify-between px-6 z-50">
      {/* ---- Branding ---- */}
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-[15px] font-bold tracking-wide text-gray-900">
          XARC NEXUS HUB
        </span>
      </div>

      {/* ---- Right section: Notification + Account Menu ---- */}
      <div className="flex items-center gap-4">
        {/* Notification bell */}
        <button
          id="admin-notifications"
          type="button"
          className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
          aria-label="Notifications"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        </button>

        {/* Account Menu */}
        <AccountMenu />
      </div>
    </header>
  );
}
