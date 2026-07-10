'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { Order, OrderItem, OrderStatus, OrderSource, PaymentStatus } from '@/types/order';
import type { Product } from '@/types/product';
import { products as menuProducts } from '@/data/primeFlavorMenu';
import { getSupabase } from '@/lib/supabase';
import { mapOrderRow } from '@/lib/orderMapper';
import { mapCustomProductRow } from '@/lib/customProductMapper';

type Availability = Record<string, boolean>;
type Visibility = Record<string, boolean>;
type PriceOverrides = Record<string, number>;
type ImageOverrides = Record<string, string>;

export interface NewCustomProduct {
  name: string;
  category: string;
  price: number;
  description?: string;
  imageUrl?: string;
  popular?: boolean;
}

export interface CustomProductEdit {
  name?: string;
  category?: string;
  price?: number;
  description?: string;
  imageUrl?: string;
  popular?: boolean;
}

function upsertProduct(list: Product[], product: Product): Product[] {
  const idx = list.findIndex((p) => p.id === product.id);
  if (idx === -1) return [...list, product];
  const next = [...list];
  next[idx] = product;
  return next;
}

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
  imageOverrides: ImageOverrides;
  customProducts: Product[];
  addOrder: (items: OrderItem[], customerName?: string, paymentStatus?: PaymentStatus, source?: OrderSource, notes?: string) => Promise<Order>;
  updateStatus: (id: string, status: OrderStatus) => Promise<void>;
  updatePayment: (id: string, paymentStatus: PaymentStatus) => Promise<void>;
  toggleAvailable: (productId: string) => Promise<void>;
  toggleVisible: (productId: string) => Promise<void>;
  updatePrice: (productId: string, price: number) => Promise<void>;
  updateImage: (productId: string, imageUrl: string) => Promise<void>;
  addCustomProduct: (input: NewCustomProduct) => Promise<Product>;
  updateCustomProduct: (id: string, input: CustomProductEdit) => Promise<void>;
  deleteCustomProduct: (id: string) => Promise<void>;
}

const OrderContext = createContext<OrderStoreValue | null>(null);

export function OrderStoreProvider({ children }: { children: React.ReactNode }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [availability, setAvailability] = useState<Availability>({});
  const [visibility, setVisibility] = useState<Visibility>({});
  const [priceOverrides, setPriceOverrides] = useState<PriceOverrides>({});
  const [imageOverrides, setImageOverrides] = useState<ImageOverrides>({});
  const [customProducts, setCustomProducts] = useState<Product[]>([]);

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
        const imageMap: ImageOverrides = {};
        for (const row of data ?? []) {
          availMap[row.product_id as string] = row.available as boolean;
          visMap[row.product_id as string] = (row.visible as boolean) ?? true;
          if (row.price !== null && row.price !== undefined) {
            priceMap[row.product_id as string] = Number(row.price);
          }
          if (row.image_url) {
            imageMap[row.product_id as string] = row.image_url as string;
          }
        }
        setAvailability(availMap);
        setVisibility(visMap);
        setPriceOverrides(priceMap);
        setImageOverrides(imageMap);
      });

    supabase
      .from('custom_products')
      .select('*')
      .then(({ data, error }) => {
        if (error) { console.error('Failed to load custom products', error); return; }
        setCustomProducts((data ?? []).map(mapCustomProductRow));
      });

    const channel = supabase
      .channel('prime-flavor-live')
      .on('postgres_changes', { event: '*', schema: 'prime_flavor', table: 'orders' }, (payload) => {
        if (payload.eventType === 'DELETE') return;
        setOrders((prev) => upsertOrder(prev, mapOrderRow(payload.new as Record<string, unknown>)));
      })
      .on('postgres_changes', { event: '*', schema: 'prime_flavor', table: 'product_availability' }, (payload) => {
        if (payload.eventType === 'DELETE') return;
        const row = payload.new as { product_id: string; available: boolean; visible?: boolean; price?: number | null; image_url?: string | null };
        setAvailability((prev) => ({ ...prev, [row.product_id]: row.available }));
        setVisibility((prev) => ({ ...prev, [row.product_id]: row.visible ?? true }));
        if (row.price !== null && row.price !== undefined) {
          setPriceOverrides((prev) => ({ ...prev, [row.product_id]: Number(row.price) }));
        }
        if (row.image_url) {
          setImageOverrides((prev) => ({ ...prev, [row.product_id]: row.image_url as string }));
        }
      })
      .on('postgres_changes', { event: '*', schema: 'prime_flavor', table: 'custom_products' }, (payload) => {
        if (payload.eventType === 'DELETE') {
          const oldRow = payload.old as { id: string };
          setCustomProducts((prev) => prev.filter((p) => p.id !== oldRow.id));
          return;
        }
        setCustomProducts((prev) => upsertProduct(prev, mapCustomProductRow(payload.new as Record<string, unknown>)));
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

  const updateImage = useCallback(async (productId: string, imageUrl: string) => {
    const current = imageOverrides[productId];
    setImageOverrides((prev) => ({ ...prev, [productId]: imageUrl }));
    const res = await fetch(`/api/availability/${productId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageUrl }),
    });
    if (!res.ok) {
      console.error('Failed to update image');
      setImageOverrides((prev) => {
        const next = { ...prev };
        if (current === undefined) delete next[productId];
        else next[productId] = current;
        return next;
      });
    }
  }, [imageOverrides]);

  const addCustomProduct = useCallback(async (input: NewCustomProduct): Promise<Product> => {
    const res = await fetch('/api/custom-products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    if (!res.ok) throw new Error('Failed to create product');
    const { product } = (await res.json()) as { product: Product };
    setCustomProducts((prev) => upsertProduct(prev, product));
    return product;
  }, []);

  const updateCustomProduct = useCallback(async (id: string, input: CustomProductEdit) => {
    const res = await fetch(`/api/custom-products/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    if (!res.ok) { console.error('Failed to update product'); return; }
    const { product } = (await res.json()) as { product: Product };
    setCustomProducts((prev) => upsertProduct(prev, product));
  }, []);

  const deleteCustomProduct = useCallback(async (id: string) => {
    const prev = customProducts;
    setCustomProducts((p) => p.filter((item) => item.id !== id));
    const res = await fetch(`/api/custom-products/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      console.error('Failed to delete product');
      setCustomProducts(prev);
    }
  }, [customProducts]);

  return (
    <OrderContext.Provider value={{
      orders, availability, visibility, priceOverrides, imageOverrides, customProducts,
      addOrder, updateStatus, updatePayment, toggleAvailable, toggleVisible, updatePrice,
      updateImage, addCustomProduct, updateCustomProduct, deleteCustomProduct,
    }}>
      {children}
    </OrderContext.Provider>
  );
}

export function useOrderStore(): OrderStoreValue {
  const ctx = useContext(OrderContext);
  if (!ctx) throw new Error('useOrderStore must be used inside OrderStoreProvider');
  return ctx;
}
