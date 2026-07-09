import type { Order, OrderItem, OrderSource, PaymentStatus } from '@/types/order';

// Used when the Supabase write fails after a payment may have already been charged
// (Square terminal, cash, or in-store card) — the customer still needs a confirmation
// screen even if the order didn't make it to the kitchen's shared database.
export function buildFallbackOrder(params: {
  items: OrderItem[];
  customerName?: string;
  paymentStatus: PaymentStatus;
  source: OrderSource;
  subtotal: number;
  tax: number;
  total: number;
}): Order {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    orderNumber: Math.floor(Date.now() / 1000) % 100000,
    customerName: params.customerName?.trim() || undefined,
    items: params.items,
    subtotal: params.subtotal,
    tax: params.tax,
    total: params.total,
    paymentStatus: params.paymentStatus,
    status: 'NEW',
    source: params.source,
    createdAt: now,
    updatedAt: now,
  };
}
