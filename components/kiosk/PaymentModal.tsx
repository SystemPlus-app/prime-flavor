'use client';

import { useEffect, useRef, useState } from 'react';
import type { PaymentStatus } from '@/types/order';
import { formatPrice } from '@/utils/pricing';

export interface PaymentSelectMeta {
  ticketNumbers?: string[];
}

interface Props {
  total: number;
  referenceId: string;
  items: { productId: string; quantity: number }[];
  onSelect: (method: PaymentStatus, meta?: PaymentSelectMeta) => void;
  onBack: () => void;
}

type ModalStep = 'select' | 'sending' | 'waiting' | 'success' | 'error' | 'ticket';

interface CheckoutResponse {
  checkout?: { id: string; status: string; cancel_reason?: string };
  error?: string;
}

interface RedeemResponse {
  ok?: boolean;
  ticketNumbers?: string[];
  error?: string;
}

const POLL_INTERVAL_MS = 2000;
const MAX_POLL_ATTEMPTS = 90; // ~3 minutes

export function PaymentModal({ total, referenceId, items, onSelect, onBack }: Props) {
  const [step, setStep] = useState<ModalStep>('select');
  const [errorMessage, setErrorMessage] = useState('');
  const checkoutIdRef = useRef<string | null>(null);
  const pollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelledRef = useRef(false);

  const totalUnits = items.reduce((s, i) => s + i.quantity, 0);
  const [ticketDraft, setTicketDraft] = useState('');
  const [enteredTickets, setEnteredTickets] = useState<string[]>([]);
  const [ticketError, setTicketError] = useState('');
  const [redeeming, setRedeeming] = useState(false);

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

  function openTicketEntry() {
    setTicketDraft('');
    setEnteredTickets([]);
    setTicketError('');
    setStep('ticket');
  }

  function addTicketNumber() {
    const value = ticketDraft.trim();
    if (!/^\d{1,7}$/.test(value)) {
      setTicketError('Enter the number printed on the ticket (digits only).');
      return;
    }
    if (enteredTickets.includes(value)) {
      setTicketError('That ticket was already added.');
      return;
    }
    if (enteredTickets.length >= totalUnits) return;
    setEnteredTickets((prev) => [...prev, value]);
    setTicketDraft('');
    setTicketError('');
  }

  function removeTicketNumber(value: string) {
    setEnteredTickets((prev) => prev.filter((t) => t !== value));
    setTicketError('');
  }

  async function confirmTicketRedemption() {
    setRedeeming(true);
    setTicketError('');
    try {
      const res = await fetch('/api/ticket-redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketNumbers: enteredTickets, items }),
      });
      const data: RedeemResponse = await res.json();
      if (!res.ok || !data.ok) {
        setTicketError(data.error || 'Could not redeem these tickets.');
        setRedeeming(false);
        return;
      }
      onSelect('TICKET', { ticketNumbers: data.ticketNumbers ?? enteredTickets });
    } catch {
      setTicketError('Could not reach the server. Try again.');
      setRedeeming(false);
    }
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

  if (step === 'ticket') {
    const remaining = totalUnits - enteredTickets.length;
    const canConfirm = enteredTickets.length === totalUnits && !redeeming;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
        <div className="bg-surface border border-border rounded-2xl w-full max-w-[420px] flex flex-col shadow-2xl animate-float-up">
          <div className="px-6 pt-6 pb-4 border-b border-border">
            <p className="text-muted text-xs uppercase tracking-widest font-bold mb-1">Redeem Event Tickets</p>
            <p className="text-cream-dim text-sm">
              {remaining > 0
                ? `Enter ${remaining} more ticket number${remaining !== 1 ? 's' : ''} — one per plate (${enteredTickets.length}/${totalUnits} added)`
                : `All ${totalUnits} ticket number${totalUnits !== 1 ? 's' : ''} added`}
            </p>
          </div>

          <div className="p-5 flex flex-col gap-3">
            <div className="flex gap-2">
              <input
                type="text"
                inputMode="numeric"
                maxLength={7}
                value={ticketDraft}
                onChange={(e) => setTicketDraft(e.target.value.replace(/[^\d]/g, ''))}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTicketNumber(); } }}
                placeholder="0000001"
                disabled={enteredTickets.length >= totalUnits}
                className="flex-1 bg-card border border-border rounded-xl px-4 py-3 text-sm text-cream font-mono placeholder:text-muted outline-none focus:border-orange transition-colors disabled:opacity-50"
              />
              <button
                onClick={addTicketNumber}
                disabled={enteredTickets.length >= totalUnits}
                className="px-4 py-3 rounded-xl bg-card border border-border text-cream font-bold text-sm hover:border-orange transition-colors disabled:opacity-50"
              >
                Add
              </button>
            </div>

            {enteredTickets.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {enteredTickets.map((t) => (
                  <span key={t} className="inline-flex items-center gap-1.5 bg-card border border-border rounded-full pl-3 pr-1.5 py-1 text-xs font-mono text-cream-dim">
                    {t}
                    <button onClick={() => removeTicketNumber(t)} className="w-4 h-4 rounded-full bg-border hover:bg-red-500 hover:text-white text-muted flex items-center justify-center text-[10px] transition-colors">✕</button>
                  </span>
                ))}
              </div>
            )}

            {ticketError && <p className="text-red-400 text-xs">{ticketError}</p>}

            <button
              onClick={confirmTicketRedemption}
              disabled={!canConfirm}
              className={`w-full py-3.5 rounded-xl font-extrabold text-sm uppercase tracking-widest transition-all ${
                canConfirm
                  ? 'bg-orange hover:bg-orange-hover text-white active:scale-[0.98]'
                  : 'bg-card border border-border text-muted cursor-not-allowed'
              }`}
            >
              {redeeming ? 'Checking tickets…' : 'Confirm Redemption'}
            </button>
          </div>

          <div className="px-6 pb-5">
            <button
              onClick={() => setStep('select')}
              className="w-full py-2.5 text-muted hover:text-cream text-sm transition-colors uppercase tracking-wide font-semibold"
            >
              ← Back
            </button>
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

          <button
            onClick={openTicketEntry}
            className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl border text-left transition-all duration-150 active:scale-[0.98] group bg-card border-border hover:border-orange/60 hover:bg-card/80"
          >
            <span className="text-2xl shrink-0">🎟️</span>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm text-cream">Redeem Event Ticket</p>
              <p className="text-xs mt-0.5 text-muted">Have a paper ticket from the event host? Use it here</p>
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
