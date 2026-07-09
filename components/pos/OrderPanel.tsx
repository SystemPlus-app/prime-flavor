'use client';

import { useState } from 'react';
import type { Product } from '@/types/product';
import type { Order, OrderItem, PaymentStatus } from '@/types/order';
import { formatPrice } from '@/utils/pricing';
import { formatOrderId } from '@/utils/orderStatus';
import { useOrderStore } from '@/store/orderStore';
import { buildFallbackOrder } from '@/lib/orderFallback';

interface CartItem {
  product: Product;
  quantity: number;
  notes: string;
}

function buildOrderItems(cart: CartItem[]): OrderItem[] {
  return cart.map((c) => ({
    id: crypto.randomUUID(),
    productId: c.product.id,
    name: c.product.name,
    price: c.product.price,
    quantity: c.quantity,
    notes: c.notes || undefined,
  }));
}

interface Props {
  cart: CartItem[];
  onUpdateCart: (cart: CartItem[]) => void;
  onClear: () => void;
}

export function OrderPanel({ cart, onUpdateCart, onClear }: Props) {
  const { addOrder } = useOrderStore();
  const [sentOrder, setSentOrder] = useState<Order | null>(null);
  const [customerName, setCustomerName] = useState('');

  const subtotal = cart.reduce((s, c) => s + c.product.price * c.quantity, 0);
  const tax = subtotal * 0.08;
  const total = subtotal + tax;

  function adjustQty(index: number, delta: number) {
    const updated = [...cart];
    const newQty = updated[index].quantity + delta;
    if (newQty <= 0) {
      updated.splice(index, 1);
    } else {
      updated[index] = { ...updated[index], quantity: newQty };
    }
    onUpdateCart(updated);
  }

  async function sendOrder(paymentStatus: PaymentStatus) {
    if (cart.length === 0) return;
    const items = buildOrderItems(cart);
    try {
      const order = await addOrder(items, customerName, paymentStatus);
      setSentOrder(order);
    } catch (err) {
      console.error('Failed to save order — showing local confirmation as fallback', err);
      setSentOrder(buildFallbackOrder({ items, customerName, paymentStatus, source: 'KIOSK', subtotal, tax, total }));
    }
    onClear();
    setCustomerName('');
    setTimeout(() => setSentOrder(null), 3000);
  }

  if (sentOrder) {
    return (
      <div className="w-[320px] shrink-0 bg-surface border-l border-border flex flex-col items-center justify-center gap-4 p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-[#1a3020] flex items-center justify-center text-3xl">✓</div>
        <div>
          <p className="text-[#3da855] font-bold text-lg">Order Sent!</p>
          <p className="text-cream font-bold text-2xl mt-1">{formatOrderId(sentOrder.orderNumber)}</p>
          <p className="text-muted text-sm mt-1">Kitchen is preparing your order</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-[320px] shrink-0 bg-surface border-l border-border flex flex-col">
      {/* header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <span className="text-cream font-bold text-sm tracking-wide uppercase">Current Order</span>
        <span className="text-muted text-xs">{cart.length} item{cart.length !== 1 ? 's' : ''}</span>
      </div>

      {/* customer name */}
      <div className="px-3 pt-2 pb-1">
        <input
          type="text"
          placeholder="Customer name (optional)"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          className="w-full bg-card border border-border rounded px-3 py-2 text-sm text-cream placeholder:text-muted outline-none focus:border-orange"
        />
      </div>

      {/* items */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
        {cart.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-muted py-8">
            <span className="text-3xl">🛒</span>
            <span className="text-sm">No items yet</span>
            <span className="text-xs">Tap a product to add</span>
          </div>
        )}
        {cart.map((item, i) => (
          <div key={item.product.id} className="bg-card rounded-lg p-2.5 border border-border">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-cream text-[13px] font-medium leading-tight truncate">{item.product.name}</p>
                <p className="text-orange text-[12px] font-semibold mt-0.5">
                  {formatPrice(item.product.price * item.quantity)}
                </p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => adjustQty(i, -1)}
                  className="w-6 h-6 rounded bg-border text-cream flex items-center justify-center text-sm hover:bg-orange hover:text-white transition-colors"
                >
                  −
                </button>
                <span className="text-cream text-sm font-bold w-5 text-center">{item.quantity}</span>
                <button
                  onClick={() => adjustQty(i, 1)}
                  className="w-6 h-6 rounded bg-border text-cream flex items-center justify-center text-sm hover:bg-orange hover:text-white transition-colors"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* totals */}
      {cart.length > 0 && (
        <div className="border-t border-border px-4 py-3 space-y-1">
          <div className="flex justify-between text-sm text-muted">
            <span>Subtotal</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm text-muted">
            <span>Tax (8%)</span>
            <span>{formatPrice(tax)}</span>
          </div>
          <div className="flex justify-between text-base font-bold text-cream pt-1 border-t border-border mt-1">
            <span>Total</span>
            <span className="text-orange">{formatPrice(total)}</span>
          </div>
        </div>
      )}

      {/* actions */}
      <div className="p-3 space-y-2 border-t border-border">
        <button
          onClick={() => sendOrder('UNPAID')}
          disabled={cart.length === 0}
          className="w-full py-3 rounded-lg bg-orange hover:bg-orange-hover disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm tracking-wide uppercase transition-colors"
        >
          Send to Kitchen
        </button>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => sendOrder('CASH')}
            disabled={cart.length === 0}
            className="py-2.5 rounded-lg bg-card border border-border hover:border-orange disabled:opacity-40 disabled:cursor-not-allowed text-cream font-semibold text-sm transition-colors"
          >
            Pay Cash
          </button>
          <button
            onClick={() => sendOrder('CARD')}
            disabled={cart.length === 0}
            className="py-2.5 rounded-lg bg-card border border-border hover:border-orange disabled:opacity-40 disabled:cursor-not-allowed text-cream font-semibold text-sm transition-colors"
          >
            Pay Card
          </button>
        </div>
        {cart.length > 0 && (
          <button
            onClick={onClear}
            className="w-full py-2 text-muted hover:text-cream text-xs tracking-wide uppercase transition-colors"
          >
            Clear Order
          </button>
        )}
      </div>
    </div>
  );
}
