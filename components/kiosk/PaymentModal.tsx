'use client';

import { useEffect, useState } from 'react';
import type { PaymentStatus } from '@/types/order';
import { formatPrice } from '@/utils/pricing';

interface Props {
  total: number;
  onSelect: (method: PaymentStatus) => void;
  onBack: () => void;
}

type ModalStep = 'select' | 'processing';
interface PaymentMethod {
  id: PaymentStatus;
  label: string;
  sublabel: string;
  icon: string;
  delay: number;
  accent?: boolean;
}

const methods: PaymentMethod[] = [
  {
    id: 'CARD',
    label: 'Credit / Debit Card',
    sublabel: 'Tap, insert, or swipe',
    icon: '💳',
    delay: 2000,
  },
  {
    id: 'CARD',
    label: 'Apple Pay',
    sublabel: 'Double-click side button on iPhone',
    icon: '',
    delay: 1500,
    accent: true,
  },
  {
    id: 'CASH',
    label: 'Pay at Counter',
    sublabel: 'Show your order number to a staff member',
    icon: '💵',
    delay: 500,
  },
];

export function PaymentModal({ total, onSelect, onBack }: Props) {
  const [step, setStep] = useState<ModalStep>('select');
  const [activeMethod, setActiveMethod] = useState<PaymentMethod | null>(null);

  function choose(method: PaymentMethod) {
    setActiveMethod(method);
    setStep('processing');
  }

  useEffect(() => {
    if (step !== 'processing' || !activeMethod) return;
    const id = setTimeout(() => onSelect(activeMethod.id), activeMethod.delay);
    return () => clearTimeout(id);
  }, [step, activeMethod, onSelect]);

  if (step === 'processing' && activeMethod) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
        <div className="bg-surface border border-border rounded-2xl w-80 p-10 flex flex-col items-center gap-5 animate-float-up">
          <div className="w-14 h-14 rounded-full border-2 border-orange border-t-transparent animate-spin" />
          <div className="text-center">
            <p className="text-cream font-extrabold text-lg">
              {activeMethod.id === 'CASH' ? 'Confirming...' : 'Processing...'}
            </p>
            <p className="text-muted text-sm mt-1">
              {activeMethod.id === 'CASH'
                ? 'Sending order to kitchen'
                : 'Please wait while we connect'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-surface border border-border rounded-2xl w-full max-w-[420px] flex flex-col shadow-2xl animate-float-up">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-border">
          <p className="text-muted text-xs uppercase tracking-widest font-bold mb-1">How would you like to pay?</p>
          <p className="text-orange font-extrabold text-3xl tabular-nums">{formatPrice(total)}</p>
        </div>

        {/* Methods */}
        <div className="p-5 space-y-3">
          {methods.map((m, i) => (
            <button
              key={i}
              onClick={() => choose(m)}
              className={`
                w-full flex items-center gap-4 px-5 py-4 rounded-2xl border text-left
                transition-all duration-150 active:scale-[0.98] group
                ${m.accent
                  ? 'bg-black border-zinc-700 hover:border-zinc-400'
                  : 'bg-card border-border hover:border-orange/60 hover:bg-card/80'
                }
              `}
            >
              {m.icon ? (
                <span className="text-2xl shrink-0">{m.icon}</span>
              ) : (
                <span className="text-white font-bold text-base leading-none shrink-0 tracking-tight">
                  ⌘ Pay
                </span>
              )}
              <div className="flex-1 min-w-0">
                <p className={`font-bold text-sm ${m.accent ? 'text-white' : 'text-cream'}`}>{m.label}</p>
                <p className={`text-xs mt-0.5 ${m.accent ? 'text-zinc-400' : 'text-muted'}`}>{m.sublabel}</p>
              </div>
              <span className={`text-lg opacity-40 group-hover:opacity-100 transition-opacity ${m.accent ? 'text-white' : 'text-cream'}`}>
                →
              </span>
            </button>
          ))}
        </div>

        <div className="px-6 pb-5">
          <button
            onClick={onBack}
            className="w-full py-2.5 text-muted hover:text-cream text-sm transition-colors uppercase tracking-wide font-semibold"
          >
            ← Back to Cart
          </button>
        </div>
      </div>
    </div>
  );
}
