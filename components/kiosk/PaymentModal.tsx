'use client';

import { useEffect, useRef, useState } from 'react';
import type { PaymentStatus } from '@/types/order';
import { formatPrice } from '@/utils/pricing';

interface Props {
  total: number;
  referenceId: string;
  onSelect: (method: PaymentStatus) => void;
  onBack: () => void;
}

type ModalStep = 'select' | 'sending' | 'waiting' | 'success' | 'error';

interface CheckoutResponse {
  checkout?: { id: string; status: string; cancel_reason?: string };
  error?: string;
}

const POLL_INTERVAL_MS = 2000;
const MAX_POLL_ATTEMPTS = 90; // ~3 minutes

export function PaymentModal({ total, referenceId, onSelect, onBack }: Props) {
  const [step, setStep] = useState<ModalStep>('select');
  const [errorMessage, setErrorMessage] = useState('');
  const checkoutIdRef = useRef<string | null>(null);
  const pollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelledRef = useRef(false);

  useEffect(() => {
    return () => {
      cancelledRef.current = true;
      if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current);
    };
  }, []);

  async function cancelActiveCheckout() {
    const id = checkoutIdRef.current;
    if (!id) return;
    try {
      await fetch(`/api/terminal-checkout/${id}`, { method: 'DELETE' });
    } catch {
      // best-effort cancel — terminal will time out on its own if this fails
    }
  }

  async function pollCheckout(checkoutId: string, attempt = 0) {
    if (cancelledRef.current) return;

    if (attempt >= MAX_POLL_ATTEMPTS) {
      setErrorMessage('Payment timed out on the terminal.');
      setStep('error');
      return;
    }

    try {
      const res = await fetch(`/api/terminal-checkout/${checkoutId}`);
      const data: CheckoutResponse = await res.json();
      if (cancelledRef.current) return;

      if (!res.ok || !data.checkout) {
        setErrorMessage(data.error || 'Lost connection to the terminal.');
        setStep('error');
        return;
      }

      const { status, cancel_reason } = data.checkout;

      if (status === 'COMPLETED') {
        setStep('success');
        setTimeout(() => {
          if (!cancelledRef.current) onSelect('CARD');
        }, 1200);
        return;
      }

      if (status === 'CANCELED') {
        setErrorMessage(cancel_reason === 'TIMED_OUT' ? 'Payment timed out on the terminal.' : 'Payment was canceled.');
        setStep('error');
        return;
      }

      pollTimeoutRef.current = setTimeout(() => pollCheckout(checkoutId, attempt + 1), POLL_INTERVAL_MS);
    } catch {
      if (cancelledRef.current) return;
      pollTimeoutRef.current = setTimeout(() => pollCheckout(checkoutId, attempt + 1), POLL_INTERVAL_MS);
    }
  }

  async function chargeCard() {
    setStep('sending');
    setErrorMessage('');
    try {
      const res = await fetch('/api/terminal-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: total,
          referenceId,
          note: `Prime Flavor Kiosk · ${referenceId}`,
        }),
      });
      const data: CheckoutResponse = await res.json();

      if (!res.ok || !data.checkout) {
        setErrorMessage(data.error || 'Could not start checkout on the terminal.');
        setStep('error');
        return;
      }

      checkoutIdRef.current = data.checkout.id;
      setStep('waiting');
      pollCheckout(data.checkout.id);
    } catch {
      setErrorMessage('Could not reach the payment terminal.');
      setStep('error');
    }
  }

  function payAtCounter() {
    setStep('sending');
    setTimeout(() => onSelect('CASH'), 500);
  }

  function retry() {
    checkoutIdRef.current = null;
    setStep('select');
    setErrorMessage('');
  }

  async function handleBackFromWaiting() {
    await cancelActiveCheckout();
    checkoutIdRef.current = null;
    setStep('select');
  }

  if (step === 'waiting') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
        <div className="bg-surface border border-border rounded-2xl w-80 p-10 flex flex-col items-center gap-5 animate-float-up">
          <div className="w-14 h-14 rounded-full border-2 border-orange border-t-transparent animate-spin" />
          <div className="text-center">
            <p className="text-cream font-extrabold text-lg">Aguardando pagamento na maquininha...</p>
            <p className="text-muted text-sm mt-1">Tap, insert, or swipe the card on the terminal</p>
            <p className="text-orange font-extrabold text-2xl mt-3 tabular-nums">{formatPrice(total)}</p>
          </div>
          <button
            onClick={handleBackFromWaiting}
            className="text-muted hover:text-cream text-xs uppercase tracking-wide font-semibold mt-2"
          >
            Cancel payment
          </button>
        </div>
      </div>
    );
  }

  if (step === 'sending') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
        <div className="bg-surface border border-border rounded-2xl w-80 p-10 flex flex-col items-center gap-5 animate-float-up">
          <div className="w-14 h-14 rounded-full border-2 border-orange border-t-transparent animate-spin" />
          <p className="text-cream font-extrabold text-lg">Sending to terminal...</p>
        </div>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
        <div className="bg-surface border border-border rounded-2xl w-80 p-10 flex flex-col items-center gap-5 animate-float-up">
          <div className="w-16 h-16 rounded-full bg-[#0a3018] border-2 border-[#3da855] flex items-center justify-center">
            <span className="text-[#3da855] text-3xl font-extrabold">✓</span>
          </div>
          <div className="text-center">
            <p className="text-[#3da855] font-extrabold text-lg">Payment approved!</p>
            <p className="text-muted text-sm mt-1">Sending your order to the kitchen...</p>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'error') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
        <div className="bg-surface border border-border rounded-2xl w-80 p-8 flex flex-col items-center gap-5 animate-float-up">
          <div className="w-14 h-14 rounded-full bg-red-950 border-2 border-red-500 flex items-center justify-center">
            <span className="text-red-500 text-2xl font-extrabold">✕</span>
          </div>
          <div className="text-center">
            <p className="text-cream font-extrabold text-lg">Payment failed</p>
            <p className="text-muted text-sm mt-1">{errorMessage}</p>
          </div>
          <div className="flex flex-col gap-2 w-full">
            <button
              onClick={retry}
              className="w-full py-3 rounded-xl bg-orange hover:bg-orange-hover text-white font-bold text-sm uppercase tracking-wide transition-colors active:scale-[0.98]"
            >
              Try Again
            </button>
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
          <button
            onClick={chargeCard}
            className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl border text-left transition-all duration-150 active:scale-[0.98] group bg-card border-border hover:border-orange/60 hover:bg-card/80"
          >
            <span className="text-2xl shrink-0">💳</span>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm text-cream">Card / Tap to Pay</p>
              <p className="text-xs mt-0.5 text-muted">Tap, insert, or swipe on the terminal</p>
            </div>
            <span className="text-lg opacity-40 group-hover:opacity-100 transition-opacity text-cream">→</span>
          </button>

          <button
            onClick={payAtCounter}
            className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl border text-left transition-all duration-150 active:scale-[0.98] group bg-card border-border hover:border-orange/60 hover:bg-card/80"
          >
            <span className="text-2xl shrink-0">💵</span>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm text-cream">Pay at Counter</p>
              <p className="text-xs mt-0.5 text-muted">Show your order number to a staff member</p>
            </div>
            <span className="text-lg opacity-40 group-hover:opacity-100 transition-opacity text-cream">→</span>
          </button>
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
