'use client';

import { useMemo, useState } from 'react';

interface Props {
  onConfirm: (pagerNumber: number) => void;
  onBack: () => void;
}

const MAX_PAGER = 16;

const keypad = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
];

function isValidPager(value: string): boolean {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 1 && parsed <= MAX_PAGER;
}

export function PagerModal({ onConfirm, onBack }: Props) {
  const [value, setValue] = useState('');

  const valid = useMemo(() => isValidPager(value), [value]);

  function appendDigit(digit: string) {
    setValue((current) => {
      if (current.length >= 2) return current;
      if (current === '' && digit === '0') return current;
      return `${current}${digit}`;
    });
  }

  function backspace() {
    setValue((current) => current.slice(0, -1));
  }

  function clear() {
    setValue('');
  }

  function confirm() {
    if (!valid) return;
    onConfirm(Number(value));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-[420px] rounded-2xl border border-border bg-surface shadow-2xl overflow-hidden animate-float-up">
        <div className="px-6 pt-6 pb-4 border-b border-border">
          <p className="text-muted text-xs uppercase tracking-widest font-bold">Pickup step</p>
          <p className="text-cream font-extrabold text-2xl mt-1">Enter your pager number</p>
          <p className="text-muted text-sm mt-2">Use the pager number from 1 to 16.</p>
        </div>

        <div className="px-6 py-5 space-y-5">
          <div className="rounded-2xl border border-border bg-card px-4 py-4 text-center">
            <p className="text-muted text-[10px] uppercase tracking-widest font-bold">Pager Number</p>
            <p className={`font-extrabold tabular-nums leading-none mt-2 ${value ? 'text-5xl text-orange' : 'text-4xl text-muted'}`}>
              {value || '—'}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {keypad.flat().map((digit) => (
              <button
                key={digit}
                onClick={() => appendDigit(digit)}
                className="h-16 rounded-xl bg-card border border-border text-cream font-extrabold text-2xl hover:border-orange active:scale-[0.98] transition-colors"
              >
                {digit}
              </button>
            ))}
            <button
              onClick={clear}
              className="h-16 rounded-xl bg-card border border-border text-muted font-bold text-xs uppercase tracking-widest hover:text-cream hover:border-orange active:scale-[0.98] transition-colors"
            >
              Clear
            </button>
            <button
              onClick={() => appendDigit('0')}
              className="h-16 rounded-xl bg-card border border-border text-cream font-extrabold text-2xl hover:border-orange active:scale-[0.98] transition-colors"
            >
              0
            </button>
            <button
              onClick={backspace}
              className="h-16 rounded-xl bg-card border border-border text-muted font-bold text-xs uppercase tracking-widest hover:text-cream hover:border-orange active:scale-[0.98] transition-colors"
            >
              Back
            </button>
          </div>
        </div>

        <div className="border-t border-border p-4 flex gap-2">
          <button
            onClick={onBack}
            className="flex-1 py-3 rounded-xl border border-border bg-card text-cream-dim font-bold uppercase tracking-wide text-sm hover:border-orange transition-colors"
          >
            Back to Cart
          </button>
          <button
            onClick={confirm}
            disabled={!valid}
            className="flex-1 py-3 rounded-xl bg-orange hover:bg-orange-hover disabled:opacity-50 disabled:hover:bg-orange text-white font-extrabold uppercase tracking-wide text-sm transition-colors"
          >
            Continue to Pay
          </button>
        </div>
      </div>
    </div>
  );
}
