
import React, { useEffect, useRef } from 'react';
import { AppSettings } from '../types';

interface PopoverProps {
  isOpen: boolean;
  onClose: () => void;
  anchorEl: HTMLElement | null;
  children: React.ReactNode;
  settings: AppSettings;
  width?: string;
}

const Popover: React.FC<PopoverProps> = ({ isOpen, onClose, anchorEl, children, settings, width = 'w-64' }) => {
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node) && 
          anchorEl && !anchorEl.contains(event.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose, anchorEl]);

  if (!isOpen || !anchorEl) return null;

  const isRounded = settings.corners === 'rounded';
  const cornerClass = isRounded ? 'rounded-xl' : 'rounded-none';

  return (
    <div 
      ref={popoverRef}
      className={`absolute z-[100] mt-2 ${width} bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 ${cornerClass} animate-in fade-in slide-in-from-top-1 duration-200 overflow-hidden`}
      style={{
        top: anchorEl.offsetTop + anchorEl.offsetHeight,
        left: Math.min(anchorEl.offsetLeft, window.innerWidth - (parseInt(width) || 300) - 20),
      }}
    >
      {children}
    </div>
  );
};

export default Popover;
