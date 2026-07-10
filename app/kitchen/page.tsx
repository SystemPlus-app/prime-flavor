'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { KitchenOrderCard } from '@/components/kitchen/KitchenOrderCard';
import { Clock } from '@/components/shared/Clock';
import { PINGate } from '@/components/shared/PINGate';
import { categories, products } from '@/data/primeFlavorMenu';
import { useOrderStore } from '@/store/orderStore';
import type { OrderItem, OrderSource, PaymentStatus } from '@/types/order';
import type { Product } from '@/types/product';
import { formatPrice } from '@/utils/pricing';

type ManualSource = 'DOORDASH' | 'UBER_EATS' | 'GRUBHUB' | 'PHONE';

interface ManualLine {
  id: string;
  name: string;
  quantity: number;
  price: string;
  notes: string;
}

const sourceOptions: { value: ManualSource; label: string; paid: boolean }[] = [
  { value: 'DOORDASH', label: 'DoorDash', paid: true },
  { value: 'UBER_EATS', label: 'Uber Eats', paid: true },
  { value: 'GRUBHUB', label: 'Grubhub', paid: true },
  { value: 'PHONE', label: 'Phone', paid: false },
];

function blankLine(): ManualLine {
  return { id: crypto.randomUUID(), name: '', quantity: 1, price: '', notes: '' };
}

function platformLabel(source: OrderSource): string {
  if (source === 'DOORDASH') return 'DoorDash';
  if (source === 'UBER_EATS') return 'Uber Eats';
  if (source === 'GRUBHUB') return 'Grubhub';
  if (source === 'PHONE') return 'Phone';
  if (source === 'WEBSITE') return 'Online';
  return 'Kiosk';
}

function compactProductName(name: string): string {
  return name.replace('BBQ ', '').replace('Brazilian ', '');
}

function ManualOrderModal({ onClose }: { onClose: () => void }) {
  const { addOrder } = useOrderStore();
  const [source, setSource] = useState<ManualSource>('DOORDASH');
  const [customerName, setCustomerName] = useState('');
  const [externalId, setExternalId] = useState('');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<ManualLine[]>([blankLine()]);
  const [category, setCategory] = useState('featured');
  const [query, setQuery] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function updateLine(id: string, patch: Partial<ManualLine>) {
    setLines((prev) => prev.map((line) => line.id === id ? { ...line, ...patch } : line));
  }

  function chooseProduct(id: string, productId: string) {
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    updateLine(id, { name: product.name, price: product.price.toFixed(2) });
  }

  function addProduct(product: Product) {
    setLines((prev) => {
      const empty = prev.find((line) => !line.name.trim());
      if (empty) {
        return prev.map((line) => line.id === empty.id
          ? { ...line, name: product.name, price: product.price.toFixed(2), quantity: 1 }
          : line);
      }
      return [...prev, {
        id: crypto.randomUUID(),
        name: product.name,
        quantity: 1,
        price: product.price.toFixed(2),
        notes: '',
      }];
    });
  }

  async function submit() {
    const validLines = lines
      .map((line) => ({
        ...line,
        name: line.name.trim(),
        quantity: Math.max(1, Math.floor(Number(line.quantity) || 1)),
        parsedPrice: Number(line.price),
      }))
      .filter((line) => line.name.length > 0);

    if (validLines.length === 0) {
      setError('Add at least one item.');
      return;
    }

    setSaving(true);
    setError('');

    const items: OrderItem[] = validLines.map((line) => ({
      id: crypto.randomUUID(),
      productId: `manual-${line.id}`,
      name: line.name,
      quantity: line.quantity,
      price: Number.isFinite(line.parsedPrice) && line.parsedPrice >= 0 ? line.parsedPrice : 0,
      notes: line.notes.trim() || undefined,
    }));

    const paymentStatus: PaymentStatus = source === 'PHONE' ? 'UNPAID' : 'CARD';
    const orderNotes = [
      `${platformLabel(source)} order${externalId.trim() ? ` #${externalId.trim()}` : ''}`,
      source === 'PHONE' ? 'Customer still needs to pay.' : '',
      notes.trim(),
    ].filter(Boolean).join(' | ');

    try {
      await addOrder(items, customerName.trim() || undefined, paymentStatus, source, orderNotes);
      onClose();
    } catch {
      setError('Could not create the order.');
    } finally {
      setSaving(false);
    }
  }

  const visibleProducts = products.filter((product) => {
    const matchesCategory = category === 'featured' ? product.popular : product.category === category;
    const matchesQuery = !query.trim() || product.name.toLowerCase().includes(query.trim().toLowerCase());
    return matchesCategory && matchesQuery;
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-3xl max-h-[92vh] overflow-hidden rounded-xl border border-border bg-surface shadow-2xl flex flex-col">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between gap-3">
          <div>
            <p className="text-cream font-extrabold text-lg">Add External Order</p>
            <p className="text-muted text-xs mt-0.5">DoorDash, Uber Eats, Grubhub, or phone order</p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-lg border border-border bg-card text-cream hover:border-orange transition-colors"
            aria-label="Close"
          >
            X
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {sourceOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setSource(option.value)}
                className={`rounded-lg border px-3 py-3 text-left transition-colors ${source === option.value ? 'border-orange bg-orange/15 text-cream' : 'border-border bg-card text-cream-dim hover:border-orange/60'}`}
              >
                <span className="block font-extrabold text-sm">{option.label}</span>
                <span className="block text-[11px] text-muted mt-0.5">{option.paid ? 'Paid in app' : 'Needs payment'}</span>
              </button>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-3">
            <label className="block">
              <span className="text-muted text-xs uppercase tracking-wide font-bold">Customer name</span>
              <input
                value={customerName}
                onChange={(event) => setCustomerName(event.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2.5 text-cream outline-none focus:border-orange"
                placeholder="Optional"
              />
            </label>
            <label className="block">
              <span className="text-muted text-xs uppercase tracking-wide font-bold">App order number</span>
              <input
                value={externalId}
                onChange={(event) => setExternalId(event.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2.5 text-cream outline-none focus:border-orange"
                placeholder="Optional"
              />
            </label>
          </div>

          <div className="rounded-lg border border-border bg-card p-3 space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
              <p className="text-muted text-xs uppercase tracking-wide font-bold">Tap menu items to add</p>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="rounded-lg border border-border bg-surface px-3 py-2 text-cream outline-none focus:border-orange text-sm md:w-64"
                placeholder="Search menu"
              />
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1">
              {categories.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setCategory(item.id)}
                  className={`shrink-0 px-3 py-2 rounded-lg border text-xs font-extrabold uppercase tracking-wide transition-colors ${category === item.id ? 'bg-orange text-white border-orange' : 'bg-surface text-muted border-border hover:text-cream hover:border-orange/60'}`}
                >
                  {item.name}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2 max-h-80 overflow-y-auto pr-1">
              {visibleProducts.map((product) => (
                <button
                  key={product.id}
                  onClick={() => addProduct(product)}
                  className="min-h-24 rounded-lg border border-border bg-surface p-3 text-left hover:border-orange/70 active:scale-[0.98] transition-all flex flex-col justify-between"
                >
                  <span className="text-cream font-bold text-sm leading-tight">{compactProductName(product.name)}</span>
                  <span className="text-orange font-extrabold text-sm mt-2">{formatPrice(product.price)}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-muted text-xs uppercase tracking-wide font-bold">Order items</p>
              <button
                onClick={() => setLines((prev) => [...prev, blankLine()])}
                className="px-3 py-2 rounded-lg border border-border bg-card text-cream text-xs font-bold uppercase tracking-wide hover:border-orange transition-colors"
              >
                Add Item
              </button>
            </div>

            {lines.map((line, index) => (
              <div key={line.id} className="rounded-lg border border-border bg-card p-3 space-y-2">
                <div className="grid md:grid-cols-[1.4fr_2fr_72px_96px_40px] gap-2">
                  <select
                    onChange={(event) => chooseProduct(line.id, event.target.value)}
                    defaultValue=""
                    className="rounded-lg border border-border bg-surface px-3 py-2 text-cream outline-none focus:border-orange min-w-0"
                  >
                    <option value="">Menu item</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>{product.name}</option>
                    ))}
                  </select>
                  <input
                    value={line.name}
                    onChange={(event) => updateLine(line.id, { name: event.target.value })}
                    className="rounded-lg border border-border bg-surface px-3 py-2 text-cream outline-none focus:border-orange min-w-0"
                    placeholder="Item name"
                  />
                  <input
                    type="number"
                    min="1"
                    value={line.quantity}
                    onChange={(event) => updateLine(line.id, { quantity: Number(event.target.value) })}
                    className="rounded-lg border border-border bg-surface px-3 py-2 text-cream outline-none focus:border-orange"
                    aria-label={`Quantity for item ${index + 1}`}
                  />
                  <input
                    inputMode="decimal"
                    value={line.price}
                    onChange={(event) => updateLine(line.id, { price: event.target.value })}
                    className="rounded-lg border border-border bg-surface px-3 py-2 text-cream outline-none focus:border-orange"
                    placeholder="Price"
                  />
                  <button
                    onClick={() => setLines((prev) => prev.length === 1 ? [blankLine()] : prev.filter((item) => item.id !== line.id))}
                    className="rounded-lg border border-border bg-surface text-muted hover:text-cream hover:border-orange transition-colors"
                    aria-label={`Remove item ${index + 1}`}
                  >
                    X
                  </button>
                </div>
                <input
                  value={line.notes}
                  onChange={(event) => updateLine(line.id, { notes: event.target.value })}
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-cream outline-none focus:border-orange"
                  placeholder="Item notes, modifiers, sauces, sides"
                />
              </div>
            ))}
          </div>

          <label className="block">
            <span className="text-muted text-xs uppercase tracking-wide font-bold">Order notes</span>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              className="mt-1 w-full min-h-20 rounded-lg border border-border bg-card px-3 py-2.5 text-cream outline-none focus:border-orange resize-y"
              placeholder="Pickup time, delivery notes, phone number, payment details"
            />
          </label>

          {error && <p className="text-[#ff8a8a] text-sm font-semibold">{error}</p>}
        </div>

        <div className="border-t border-border p-4 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-3 rounded-lg border border-border bg-card text-cream-dim font-bold uppercase tracking-wide text-sm hover:border-orange transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={saving}
            className="px-5 py-3 rounded-lg bg-orange hover:bg-orange-hover disabled:opacity-50 text-white font-bold uppercase tracking-wide text-sm transition-colors"
          >
            {saving ? 'Saving...' : 'Send to Kitchen'}
          </button>
        </div>
      </div>
    </div>
  );
}

function KitchenDisplay() {
  const { orders } = useOrderStore();
  const [, setTick] = useState(0);
  const [showManualOrder, setShowManualOrder] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 5000);
    return () => clearInterval(id);
  }, []);

  const activeOrders = orders.filter((o) => ['NEW', 'PREPARING', 'READY'].includes(o.status));
  const newCount = orders.filter((o) => o.status === 'NEW').length;
  const preparingCount = orders.filter((o) => o.status === 'PREPARING').length;
  const readyCount = orders.filter((o) => o.status === 'READY').length;

  return (
    <div className="h-screen flex flex-col bg-base overflow-hidden">
      {showManualOrder && <ManualOrderModal onClose={() => setShowManualOrder(false)} />}

      {/* top bar */}
      <header className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 bg-sidebar border-b border-border shrink-0">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-orange font-extrabold text-base tracking-widest uppercase">Kitchen Display</span>
          {activeOrders.length > 0 && (
            <div className="flex items-center gap-1.5 bg-orange px-3 py-1 rounded-full">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              <span className="text-white text-xs font-bold uppercase tracking-wide">{activeOrders.length} Active</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowManualOrder(true)}
            className="text-white bg-orange hover:bg-orange-hover text-xs uppercase tracking-wide font-bold px-3 py-1.5 rounded transition-colors"
          >
            Add Order
          </button>
          <Clock />
          <Link href="/admin" className="text-muted hover:text-cream text-xs uppercase tracking-wide font-semibold px-3 py-1.5 rounded bg-card border border-border hover:border-orange transition-colors">Admin</Link>
          <Link href="/kiosk" className="text-muted hover:text-cream text-xs uppercase tracking-wide font-semibold px-3 py-1.5 rounded bg-card border border-border hover:border-orange transition-colors">Kiosk</Link>
        </div>
      </header>

      {/* order grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeOrders.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center gap-4 text-muted">
            <span className="text-6xl">🔥</span>
            <p className="text-xl font-bold text-cream-dim">All caught up!</p>
            <p className="text-sm">No active orders right now.</p>
          </div>
        ) : (
          <div
            className="grid gap-4"
            style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))' }}
          >
            {activeOrders.map((order) => (
              <KitchenOrderCard key={order.id} order={order} />
            ))}
          </div>
        )}
      </div>

      {/* status bar */}
      <footer className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-sidebar border-t border-border shrink-0">
        <div className="flex items-center gap-4 flex-wrap text-sm">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#e07030]" /><span className="text-cream-dim font-semibold">NEW ({newCount})</span></span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#d4a530]" /><span className="text-cream-dim font-semibold">COOKING ({preparingCount})</span></span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#3da855]" /><span className="text-cream-dim font-semibold">READY ({readyCount})</span></span>
        </div>
        <span className="text-muted text-xs hidden sm:block">Station: Main Grill · Prime Flavor BBQ</span>
      </footer>
    </div>
  );
}

export default function KitchenPage() {
  return (
    <PINGate routeLabel="Kitchen Display">
      <KitchenDisplay />
    </PINGate>
  );
}
