'use client';

import { useState } from 'react';
import { STAFF_PIN, SESSION_KEY } from '@/lib/staffPin';
import Link from 'next/link';

interface Props {
  children: React.ReactNode;
  routeLabel: string;
}

export function PINGate({ children, routeLabel }: Props) {
  const [authorized, setAuthorized] = useState(() => (
    typeof window !== 'undefined' && sessionStorage.getItem(SESSION_KEY) === '1'
  ));
  const [pin, setPin] = useState('');
  const [shake, setShake] = useState(false);

  function pressDigit(d: string) {
    if (pin.length >= 4) return;
    const next = pin + d;
    setPin(next);
    if (next.length === 4) {
      setTimeout(() => verify(next), 120);
    }
  }

  function verify(p: string) {
    if (p === STAFF_PIN) {
      sessionStorage.setItem(SESSION_KEY, '1');
      setAuthorized(true);
    } else {
      setShake(true);
      setTimeout(() => {
        setShake(false);
        setPin('');
      }, 500);
    }
  }

  function backspace() {
    setPin((p) => p.slice(0, -1));
  }

  if (authorized) return <>{children}</>;

  const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'];

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-base gap-6 select-none">
      <div className="text-center">
        <p className="text-orange font-extrabold text-2xl tracking-wide uppercase">Prime Flavor</p>
        <p className="text-cream font-bold text-lg mt-1">Staff Access — {routeLabel}</p>
        <p className="text-muted text-sm mt-1">Enter your staff PIN to continue</p>
      </div>

      {/* dots */}
      <div className={`flex gap-4 transition-transform ${shake ? 'translate-x-2' : ''}`}>
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`w-4 h-4 rounded-full border-2 transition-colors ${
              i < pin.length ? 'bg-orange border-orange' : 'border-border'
            }`}
          />
        ))}
      </div>

      {/* numpad */}
      <div className="grid grid-cols-3 gap-3 w-64">
        {digits.map((d, i) => {
          if (d === '') return <div key={i} />;
          return (
            <button
              key={i}
              onClick={() => (d === '⌫' ? backspace() : pressDigit(d))}
              className={`h-16 rounded-xl font-bold text-xl transition-all active:scale-95 ${
                d === '⌫'
                  ? 'bg-card border border-border text-muted hover:text-cream hover:border-orange'
                  : 'bg-card border border-border text-cream hover:bg-border hover:border-orange'
              }`}
            >
              {d}
            </button>
          );
        })}
      </div>

      <Link
        href="/kiosk"
        className="text-muted text-sm hover:text-cream transition-colors mt-2"
      >
        ← Back to Kiosk
      </Link>
    </div>
  );
}
