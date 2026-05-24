'use client';

import { useRef, useState } from 'react';
import { categories } from '@/data/primeFlavorMenu';

interface Props {
  active: string;
  onSelect: (id: string) => void;
  onStaffActivate: () => void;
}

const LONG_PRESS_MS = 5000;

export function KioskSidebar({ active, onSelect, onStaffActivate }: Props) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [pressing, setPressing] = useState(false);

  function startPress() {
    setPressing(true);
    timerRef.current = setTimeout(() => {
      setPressing(false);
      onStaffActivate();
    }, LONG_PRESS_MS);
  }

  function cancelPress() {
    setPressing(false);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }

  return (
    <aside className="w-[128px] shrink-0 flex flex-col bg-sidebar border-r border-border overflow-hidden">
      {/* Logo — hidden long-press staff trigger */}
      <div
        onMouseDown={startPress}
        onMouseUp={cancelPress}
        onMouseLeave={cancelPress}
        onTouchStart={startPress}
        onTouchEnd={cancelPress}
        onTouchCancel={cancelPress}
        aria-hidden="true"
        className={`
          flex flex-col items-center justify-center gap-0.5 px-3 py-5 select-none cursor-default
          border-b border-border transition-opacity duration-300
          ${pressing ? 'opacity-40' : 'opacity-100'}
        `}
      >
        <span className="text-orange font-extrabold text-[13px] tracking-widest uppercase leading-none text-center">
          Prime<br />Flavor
        </span>
        <span className="text-muted text-[8px] tracking-widest uppercase mt-1">Brazilian BBQ</span>
      </div>

      {/* Category nav */}
      <nav className="flex-1 overflow-y-auto py-2 flex flex-col">
        {categories.map((cat) => {
          const isActive = cat.id === active;
          return (
            <button
              key={cat.id}
              onClick={() => onSelect(cat.id)}
              className={`
                relative flex flex-col items-center gap-1.5 py-4 px-2 transition-all duration-150
                ${isActive
                  ? 'bg-orange text-white'
                  : 'text-cream-dim hover:bg-card hover:text-cream'
                }
              `}
            >
              {isActive && (
                <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-white/40 rounded-r" />
              )}
              <span className="text-2xl leading-none">{cat.icon}</span>
              <span className="text-[10px] font-bold tracking-wider uppercase leading-tight text-center">
                {cat.name}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Bottom brand strip */}
      <div className="border-t border-border py-3 px-2 flex items-center justify-center">
        <span className="text-muted text-[8px] tracking-widest uppercase text-center leading-relaxed">
          Self-Order<br />Kiosk
        </span>
      </div>
    </aside>
  );
}
