'use client';

import { useState } from 'react';
import {
  useFloating,
  autoUpdate,
  offset,
  flip,
  shift,
  useDismiss,
  useRole,
  useClick,
  useInteractions,
  FloatingPortal,
  FloatingFocusManager,
} from '@floating-ui/react';
import { MoreHorizontal, User, Activity, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface UserActionsMenuProps {
  userId: string;
  userName: string;
  userEmail: string;
}

export default function UserActionsMenu({
  userId,
  userName,
  userEmail,
}: UserActionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    placement: 'bottom-end',
    middleware: [
      offset(4),
      flip({ fallbackAxisSideDirection: 'start' }),
      shift({ padding: 8 }),
    ],
    whileElementsMounted: autoUpdate,
  });

  const click = useClick(context);
  const dismiss = useDismiss(context);
  const role = useRole(context);

  const { getReferenceProps, getFloatingProps } = useInteractions([
    click,
    dismiss,
    role,
  ]);

  return (
    <>
      <button
        ref={refs.setReference}
        {...getReferenceProps({
          onClick(e) {
            e.stopPropagation();
          }
        })}
        className={`flex h-8 w-8 items-center justify-center rounded transition-colors focus:outline-none ${
          isOpen ? 'bg-gray-100 text-gray-900 border-gray-200' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-900 border-transparent hover:border-gray-200'
        } border`}
        aria-label="User actions"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>

      {isOpen && (
        <FloatingPortal>
          <FloatingFocusManager context={context} modal={false}>
            <div
              ref={refs.setFloating}
              style={floatingStyles}
              {...getFloatingProps({
                onClick(e) {
                  e.stopPropagation();
                }
              })}
              className="z-50 w-64 rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none animate-in fade-in zoom-in-95 duration-100"
            >
              {/* Header */}
              <div className="px-3 py-2.5">
                <p className="text-sm font-semibold text-gray-900 truncate">{userName}</p>
                <p className="text-[11px] font-medium text-gray-500 truncate">{userEmail}</p>
              </div>
              
              <div className="border-t border-gray-100" />

              {/* Actions Body */}
              <div className="py-1.5 flex flex-col">
                <Link
                  href={`/admin/users/${userId}/profile`}
                  onClick={() => setIsOpen(false)}
                  className="flex w-full items-start px-3 py-2 text-[13px] font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                >
                  <User className="mr-2.5 mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                  <div className="flex flex-col text-left">
                    <span>View Profile</span>
                    <span className="text-[11px] font-normal text-gray-500">View user information and account details</span>
                  </div>
                </Link>

                <Link
                  href={`/admin/users/${userId}/activity`}
                  onClick={() => setIsOpen(false)}
                  className="flex w-full items-start px-3 py-2 text-[13px] font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                >
                  <Activity className="mr-2.5 mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                  <div className="flex flex-col text-left">
                    <span>View Activity</span>
                    <span className="text-[11px] font-normal text-gray-500">View login history and activity timeline</span>
                  </div>
                </Link>
              </div>

              <div className="border-t border-gray-100" />

              {/* Workspace Action */}
              <div className="p-1.5">
                <Link
                  href={`/admin/users/${userId}`}
                  onClick={() => setIsOpen(false)}
                  className="group flex w-full items-center justify-between rounded-md bg-gray-50 px-3 py-2 text-[13px] font-semibold text-gray-900 hover:bg-gray-100 transition-colors"
                >
                  <span>Open User Workspace</span>
                  <ArrowRight className="h-4 w-4 text-gray-400 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
            </div>
          </FloatingFocusManager>
        </FloatingPortal>
      )}
    </>
  );
}
