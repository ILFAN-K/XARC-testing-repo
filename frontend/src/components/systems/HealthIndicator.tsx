'use client';

import { useState } from 'react';
import {
  useFloating,
  autoUpdate,
  offset,
  flip,
  shift,
  useHover,
  useFocus,
  useDismiss,
  useRole,
  useInteractions,
  FloatingPortal,
} from '@floating-ui/react';
import { SystemHealth } from '../../types/system';

export default function HealthIndicator({ health }: { health: SystemHealth }) {
  const [isOpen, setIsOpen] = useState(false);

  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    placement: 'right',
    middleware: [offset(10), flip(), shift({ padding: 8 })],
    whileElementsMounted: autoUpdate,
  });

  const hover = useHover(context, { move: false });
  const focus = useFocus(context);
  const dismiss = useDismiss(context);
  const role = useRole(context, { role: 'tooltip' });

  const { getReferenceProps, getFloatingProps } = useInteractions([
    hover,
    focus,
    dismiss,
    role,
  ]);

  const getStyles = () => {
    switch (health.label) {
      case 'Healthy':
        return { dot: 'text-emerald-500' };
      case 'Warning':
        return { dot: 'text-yellow-500' };
      case 'Critical':
        return { dot: 'text-red-500' };
      default:
        return { dot: 'text-gray-400' };
    }
  };

  const { dot } = getStyles();

  return (
    <>
      <div 
        ref={refs.setReference}
        {...getReferenceProps()}
        className="flex items-center group cursor-default w-max"
      >
        <div className="flex flex-col space-y-0.5">
          <div className="flex items-center space-x-1.5">
            <div className={`h-2 w-2 rounded-full bg-current ${dot} opacity-80`} />
            <span className="text-[13px] font-medium text-gray-900">{health.score}%</span>
          </div>
          <span className="text-xs text-gray-500 pl-3.5 leading-none">{health.label}</span>
        </div>
      </div>

      {isOpen && (
        <FloatingPortal>
          <div
            ref={refs.setFloating}
            style={floatingStyles}
            {...getFloatingProps()}
            className="z-50 w-48 rounded-md border border-gray-200 bg-white shadow-lg p-3 outline-none"
          >
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">CPU</span>
                <span className="font-medium text-gray-900">{health.breakdown.cpu}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">RAM</span>
                <span className="font-medium text-gray-900">{health.breakdown.ram}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Disk</span>
                <span className="font-medium text-gray-900">{health.breakdown.disk}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Agent</span>
                <span className="font-medium text-gray-900">{health.breakdown.agent}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">License</span>
                <span className="font-medium text-gray-900">{health.breakdown.license}</span>
              </div>
            </div>
          </div>
        </FloatingPortal>
      )}
    </>
  );
}
