'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { Order, OrderItem, OrderStatus, OrderSource, PaymentStatus } from '@/types/order';
import { products as menuProducts } from '@/data/primeFlavorMenu';
import { getSupabase } from '@/lib/supabase';
import { mapOrderRow } from '@/lib/orderMapper';

type Availability = Record<string, boolean>;
type Visibility = Record<string, boolean>;
type PriceOverrides = Record<string, number>;

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
  visibility: Visibility;
  priceOverrides: PriceOverrides;
  addOrder: (items: OrderItem[], customerName?: string, paymentStatus?: PaymentStatus, source?: OrderSource, notes?: string) => Promise<Order>;
  updateStatus: (id: string, status: OrderStatus) => Promise<void>;
  updatePayment: (id: string, paymentStatus: PaymentStatus) => Promise<void>;
  toggleAvailable: (productId: string) => Promise<void>;
  toggleVisible: (productId: string) => Promise<void>;
  updatePrice: (productId: string, price: number) => Promise<void>;
}

const OrderContext = createContext<OrderStoreValue | null>(null);

export function OrderStoreProvider({ children }: { children: React.ReactNode }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [availability, setAvailability] = useState<Availability>({});
  const [visibility, setVisibility] = useState<Visibility>({});
  const [priceOverrides, setPriceOverrides] = useState<PriceOverrides>({});

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
        const availMap: Availability = {};
        const visMap: Visibility = {};
        const priceMap: PriceOverrides = {};
        for (const row of data ?? []) {
          availMap[row.product_id as string] = row.available as boolean;
          visMap[row.product_id as string] = (row.visible as boolean) ?? true;
          if (row.price !== null && row.price !== undefined) {
            priceMap[row.product_id as string] = Number(row.price);
          }
        }
        setAvailability(availMap);
        setVisibility(visMap);
        setPriceOverrides(priceMap);
      });

    const channel = supabase
      .channel('prime-flavor-live')
      .on('postgres_changes', { event: '*', schema: 'prime_flavor', table: 'orders' }, (payload) => {
        if (payload.eventType === 'DELETE') return;
        setOrders((prev) => upsertOrder(prev, mapOrderRow(payload.new as Record<string, unknown>)));
      })
      .on('postgres_changes', { event: '*', schema: 'prime_flavor', table: 'product_availability' }, (payload) => {
        if (payload.eventType === 'DELETE') return;
        const row = payload.new as { product_id: string; available: boolean; visible?: boolean; price?: number | null };
        setAvailability((prev) => ({ ...prev, [row.product_id]: row.available }));
        setVisibility((prev) => ({ ...prev, [row.product_id]: row.visible ?? true }));
        if (row.price !== null && row.price !== undefined) {
          setPriceOverrides((prev) => ({ ...prev, [row.product_id]: Number(row.price) }));
        }
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

  const toggleVisible = useCallback(async (productId: string) => {
    const current = visibility[productId] ?? true;
    const next = !current;
    setVisibility((prev) => ({ ...prev, [productId]: next }));
    const res = await fetch(`/api/availability/${productId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visible: next }),
    });
    if (!res.ok) {
      console.error('Failed to update visibility');
      setVisibility((prev) => ({ ...prev, [productId]: current }));
    }
  }, [visibility]);

  const updatePrice = useCallback(async (productId: string, price: number) => {
    const current = priceOverrides[productId] ?? menuProducts.find((p) => p.id === productId)?.price;
    setPriceOverrides((prev) => ({ ...prev, [productId]: price }));
    const res = await fetch(`/api/availability/${productId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ price }),
    });
    if (!res.ok) {
      console.error('Failed to update price');
      setPriceOverrides((prev) => {
        const next = { ...prev };
        if (current === undefined) delete next[productId];
        else next[productId] = current;
        return next;
      });
    }
  }, [priceOverrides]);

  return (
    <OrderContext.Provider value={{ orders, availability, visibility, priceOverrides, addOrder, updateStatus, updatePayment, toggleAvailable, toggleVisible, updatePrice }}>
      {children}
    </OrderContext.Provider>
  );
}

export function useOrderStore(): OrderStoreValue {
  const ctx = useContext(OrderContext);
  if (!ctx) throw new Error('useOrderStore must be used inside OrderStoreProvider');
  return ctx;
}
