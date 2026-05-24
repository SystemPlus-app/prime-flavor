'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { Order, OrderItem, OrderStatus, PaymentStatus } from '@/types/order';
import { mockOrders } from '@/data/mockOrders';
import { calcTax, calcTotal } from '@/utils/pricing';

const STORAGE_KEY = 'prime-flavor-orders';
const COUNTER_KEY = 'prime-flavor-counter';

function loadOrders(): Order[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Order[];
  } catch {}
  return mockOrders;
}

function saveOrders(orders: Order[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
  } catch {}
}

function nextOrderNumber(): number {
  try {
    const n = parseInt(localStorage.getItem(COUNTER_KEY) ?? '410', 10);
    const next = isNaN(n) ? 411 : n + 1;
    localStorage.setItem(COUNTER_KEY, String(next));
    return next;
  } catch {
    return Math.floor(Math.random() * 9000) + 1000;
  }
}

interface OrderStoreValue {
  orders: Order[];
  addOrder: (items: OrderItem[], customerName?: string, paymentStatus?: PaymentStatus) => Order;
  updateStatus: (id: string, status: OrderStatus) => void;
  updatePayment: (id: string, paymentStatus: PaymentStatus) => void;
  toggleAvailable: (productId: string) => void;
}

const OrderContext = createContext<OrderStoreValue | null>(null);

export function OrderStoreProvider({ children }: { children: React.ReactNode }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setOrders(loadOrders());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          setOrders(JSON.parse(e.newValue));
        } catch {}
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [hydrated]);

  const mutate = useCallback((updater: (prev: Order[]) => Order[]) => {
    setOrders((prev) => {
      const next = updater(prev);
      saveOrders(next);
      return next;
    });
  }, []);

  const addOrder = useCallback(
    (items: OrderItem[], customerName?: string, paymentStatus: PaymentStatus = 'UNPAID'): Order => {
      const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
      const order: Order = {
        id: crypto.randomUUID(),
        orderNumber: nextOrderNumber(),
        customerName: customerName?.trim() || undefined,
        items,
        subtotal,
        tax: calcTax(subtotal),
        total: calcTotal(subtotal),
        paymentStatus,
        status: 'NEW',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      mutate((prev) => [order, ...prev]);
      return order;
    },
    [mutate],
  );

  const updateStatus = useCallback(
    (id: string, status: OrderStatus) => {
      mutate((prev) =>
        prev.map((o) =>
          o.id === id ? { ...o, status, updatedAt: new Date().toISOString() } : o,
        ),
      );
    },
    [mutate],
  );

  const updatePayment = useCallback(
    (id: string, paymentStatus: PaymentStatus) => {
      mutate((prev) =>
        prev.map((o) =>
          o.id === id ? { ...o, paymentStatus, updatedAt: new Date().toISOString() } : o,
        ),
      );
    },
    [mutate],
  );

  const toggleAvailable = useCallback((_productId: string) => {
    // placeholder for product availability — managed in admin
  }, []);

  return (
    <OrderContext.Provider value={{ orders, addOrder, updateStatus, updatePayment, toggleAvailable }}>
      {children}
    </OrderContext.Provider>
  );
}

export function useOrderStore(): OrderStoreValue {
  const ctx = useContext(OrderContext);
  if (!ctx) throw new Error('useOrderStore must be used inside OrderStoreProvider');
  return ctx;
}
