'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { Order, OrderItem, OrderStatus, OrderSource, PaymentStatus } from '@/types/order';
import { products as menuProducts } from '@/data/primeFlavorMenu';
import { getSupabase } from '@/lib/supabase';
import { mapOrderRow } from '@/lib/orderMapper';

type Availability = Record<string, boolean>;

function upsertOrder(list: Order[], order: Order): Order[] {
  const idx = list.findIndex((o) => o.id === order.id);
  if (idx === -1) return [order, ...list];
  const next = [...list];
  next[idx] = order;
  return next;
}

interface OrderStoreValue {
  orders: Order[];
  availability: Availability;
  addOrder: (items: OrderItem[], customerName?: string, paymentStatus?: PaymentStatus, source?: OrderSource, notes?: string) => Promise<Order>;
  updateStatus: (id: string, status: OrderStatus) => Promise<void>;
  updatePayment: (id: string, paymentStatus: PaymentStatus) => Promise<void>;
  toggleAvailable: (productId: string) => Promise<void>;
}

const OrderContext = createContext<OrderStoreValue | null>(null);

export function OrderStoreProvider({ children }: { children: React.ReactNode }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [availability, setAvailability] = useState<Availability>({});

  useEffect(() => {
    const supabase = getSupabase();

    supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) { console.error('Failed to load orders', error); return; }
        setOrders((data ?? []).map(mapOrderRow));
      });

    supabase
      .from('product_availability')
      .select('*')
      .then(({ data, error }) => {
        if (error) { console.error('Failed to load availability', error); return; }
        const map: Availability = {};
        for (const row of data ?? []) map[row.product_id as string] = row.available as boolean;
        setAvailability(map);
      });

    const channel = supabase
      .channel('prime-flavor-live')
      .on('postgres_changes', { event: '*', schema: 'prime_flavor', table: 'orders' }, (payload) => {
        if (payload.eventType === 'DELETE') return;
        setOrders((prev) => upsertOrder(prev, mapOrderRow(payload.new as Record<string, unknown>)));
      })
      .on('postgres_changes', { event: '*', schema: 'prime_flavor', table: 'product_availability' }, (payload) => {
        if (payload.eventType === 'DELETE') return;
        const row = payload.new as { product_id: string; available: boolean };
        setAvailability((prev) => ({ ...prev, [row.product_id]: row.available }));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const addOrder = useCallback(
    async (items: OrderItem[], customerName?: string, paymentStatus: PaymentStatus = 'UNPAID', source: OrderSource = 'KIOSK', notes?: string): Promise<Order> => {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, customerName, paymentStatus, source, notes }),
      });
      if (!res.ok) throw new Error('Failed to create order');
      const { order } = (await res.json()) as { order: Order };
      setOrders((prev) => upsertOrder(prev, order));
      return order;
    },
    [],
  );

  const updateStatus = useCallback(async (id: string, status: OrderStatus) => {
    const res = await fetch(`/api/orders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) { console.error('Failed to update order status'); return; }
    const { order } = (await res.json()) as { order: Order };
    setOrders((prev) => upsertOrder(prev, order));
  }, []);

  const updatePayment = useCallback(async (id: string, paymentStatus: PaymentStatus) => {
    const res = await fetch(`/api/orders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentStatus }),
    });
    if (!res.ok) { console.error('Failed to update order payment'); return; }
    const { order } = (await res.json()) as { order: Order };
    setOrders((prev) => upsertOrder(prev, order));
  }, []);

  const toggleAvailable = useCallback(async (productId: string) => {
    const current = availability[productId] ?? menuProducts.find((p) => p.id === productId)?.available ?? true;
    const next = !current;
    setAvailability((prev) => ({ ...prev, [productId]: next }));
    const res = await fetch(`/api/availability/${productId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ available: next }),
    });
    if (!res.ok) {
      console.error('Failed to update availability');
      setAvailability((prev) => ({ ...prev, [productId]: current }));
    }
  }, [availability]);

  return (
    <OrderContext.Provider value={{ orders, availability, addOrder, updateStatus, updatePayment, toggleAvailable }}>
      {children}
    </OrderContext.Provider>
  );
}

export function useOrderStore(): OrderStoreValue {
  const ctx = useContext(OrderContext);
  if (!ctx) throw new Error('useOrderStore must be used inside OrderStoreProvider');
  return ctx;
}
