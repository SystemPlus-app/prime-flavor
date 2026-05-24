'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { STAFF_PIN, SESSION_KEY } from '@/lib/staffPin';

interface Props {
  onClose: () => void;
}

type ModalStep = 'pin' | 'menu';

export function StaffKioskModal({ onClose }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<ModalStep>('pin');
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
      setStep('menu');
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

  function goTo(path: string) {
    onClose();
    router.push(path);
  }

  const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-surface border border-border rounded-2xl p-8 w-80 flex flex-col items-center gap-5 shadow-2xl">
        {step === 'pin' && (
          <>
            <div className="text-center">
              <p className="text-orange font-extrabold text-lg tracking-wide uppercase">Staff Access</p>
              <p className="text-muted text-sm mt-1">Enter staff PIN</p>
            </div>

            {/* dots */}
            <div className={`flex gap-4 transition-transform ${shake ? 'translate-x-2' : ''}`}>
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`w-3.5 h-3.5 rounded-full border-2 transition-colors ${
                    i < pin.length ? 'bg-orange border-orange' : 'border-border'
                  }`}
                />
              ))}
            </div>

            {/* numpad */}
            <div className="grid grid-cols-3 gap-2.5 w-full">
              {digits.map((d, i) => {
                if (d === '') return <div key={i} />;
                return (
                  <button
                    key={i}
                    onClick={() => (d === '⌫' ? backspace() : pressDigit(d))}
                    className={`h-14 rounded-xl font-bold text-lg transition-all active:scale-95 ${
                      d === '⌫'
                        ? 'bg-card border border-border text-muted hover:text-cream'
                        : 'bg-card border border-border text-cream hover:bg-border'
                    }`}
                  >
                    {d}
                  </button>
                );
              })}
            </div>

            <button
              onClick={onClose}
              className="text-muted text-sm hover:text-cream transition-colors"
            >
              Cancel
            </button>
          </>
        )}

        {step === 'menu' && (
          <>
            <div className="text-center">
              <p className="text-[#3da855] font-extrabold text-lg">Access Granted</p>
              <p className="text-muted text-sm mt-1">Where do you want to go?</p>
            </div>

            <div className="flex flex-col gap-3 w-full">
              <button
                onClick={() => goTo('/kitchen')}
                className="w-full py-4 rounded-xl bg-[#3a1a08] border border-[#e0703060] text-orange font-bold text-sm uppercase tracking-wide hover:bg-[#4a2210] transition-colors"
              >
                🔥 Kitchen Display
              </button>
              <button
                onClick={() => goTo('/admin')}
                className="w-full py-4 rounded-xl bg-card border border-border text-cream font-bold text-sm uppercase tracking-wide hover:bg-border transition-colors"
              >
                📊 Admin Dashboard
              </button>
              <button
                onClick={() => goTo('/')}
                className="w-full py-3 rounded-xl bg-transparent border border-border text-muted font-semibold text-sm hover:text-cream hover:border-orange transition-colors"
              >
                Exit Kiosk Mode
              </button>
            </div>

            <button
              onClick={onClose}
              className="text-muted text-xs hover:text-cream transition-colors"
            >
              ← Stay on Kiosk
            </button>
          </>
        )}
      </div>
    </div>
  );
}
