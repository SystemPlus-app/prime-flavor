'use client';

import { Fragment, useState } from 'react';
import type { Order } from '@/types/order';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { formatPrice } from '@/utils/pricing';
import { formatOrderId } from '@/utils/orderStatus';
import { useOrderStore } from '@/store/orderStore';

type Filter = 'all' | 'pending' | 'paid' | 'completed';

interface Props {
  orders: Order[];
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function formatDay(iso: string): string {
  const date = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';

  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() === today.getFullYear() ? undefined : 'numeric',
  });
}

function dayKey(iso: string): string {
  return new Date(iso).toDateString();
}

function itemsSummary(order: Order): string {
  const parts = order.items.map((i) => `${i.name}${i.quantity > 1 ? ` (${i.quantity}x)` : ''}`);
  const joined = parts.slice(0, 2).join(', ');
  return parts.length > 2 ? `${joined}...` : joined;
}

export function OrderTable({ orders }: Props) {
  const { updateStatus } = useOrderStore();
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');

  const filtered = orders.filter((o) => {
    if (filter === 'pending') return ['NEW', 'PREPARING', 'READY'].includes(o.status);
    if (filter === 'paid') return o.paymentStatus !== 'UNPAID';
    if (filter === 'completed') return o.status === 'COMPLETED';
    return true;
  }).filter((o) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      formatOrderId(o.orderNumber).toLowerCase().includes(q) ||
      (o.customerName?.toLowerCase().includes(q) ?? false)
    );
  });

  const filters: { id: Filter; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'pending', label: 'Pending' },
    { id: 'paid', label: 'Paid' },
    { id: 'completed', label: 'Completed' },
  ];

  const grouped = filtered.reduce<{ key: string; label: string; orders: Order[] }[]>((groups, order) => {
    const key = dayKey(order.createdAt);
    const existing = groups.find((group) => group.key === key);
    if (existing) {
      existing.orders.push(order);
    } else {
      groups.push({ key, label: formatDay(order.createdAt), orders: [order] });
    }
    return groups;
  }, []);

  return (
    <div className="flex-1 flex flex-col overflow-hidden px-4 pb-4">
      {/* filter bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-2">
        <div className="flex items-center gap-1 flex-wrap">
          <span className="text-cream-dim text-sm font-semibold mr-2">Recent Orders</span>
          {filters.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide transition-colors ${
                filter === f.id ? 'bg-orange text-white' : 'bg-card text-muted hover:text-cream border border-border'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm">🔍</span>
          <input
            type="text"
            placeholder="Search order or customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-card border border-border rounded-lg pl-8 pr-3 py-2 text-sm text-cream placeholder:text-muted outline-none focus:border-orange w-full sm:w-52"
          />
        </div>
      </div>

      {/* table */}
      <div className="flex-1 overflow-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-card">
              {['Order ID', 'Time', 'Customer', 'Items', 'Total', 'Status', 'Action'].map((h) => (
                <th
                  key={h}
                  className="text-left px-4 py-3 text-muted text-[11px] font-bold uppercase tracking-wider"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {grouped.map((group) => (
              <Fragment key={group.key}>
                <tr key={`${group.key}-header`} className="bg-base/95">
                  <td colSpan={7} className="px-4 py-2.5 border-b border-border">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-orange font-extrabold uppercase tracking-wider text-xs">{group.label}</span>
                      <span className="text-muted text-xs font-bold">{group.orders.length} orders</span>
                    </div>
                  </td>
                </tr>
                {group.orders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-border hover:bg-card/50 transition-colors"
                  >
                    <td className="px-4 py-3 font-mono font-bold text-cream text-xs">
                      {formatOrderId(order.orderNumber)}
                    </td>
                    <td className="px-4 py-3 text-cream-dim text-xs">{formatTime(order.createdAt)}</td>
                    <td className="px-4 py-3 font-semibold text-cream">{order.customerName ?? 'Walk-in'}</td>
                    <td className="px-4 py-3 text-cream-dim max-w-[200px] truncate">{itemsSummary(order)}</td>
                    <td className="px-4 py-3 font-bold text-cream">
                      {formatPrice(order.total)}
                      {order.paymentStatus === 'TICKET' && (
                        <span className="ml-1.5 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-[#3da855]">🎟️ Ticket</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {order.status === 'NEW' && (
                          <button
                            onClick={() => updateStatus(order.id, 'PREPARING')}
                            className="text-[10px] bg-[#3a2a08] text-[#d4a530] border border-[#d4a53050] px-2 py-1 rounded font-bold hover:bg-[#4a3a10] transition-colors"
                          >
                            Start
                          </button>
                        )}
                        {order.status === 'PREPARING' && (
                          <button
                            onClick={() => updateStatus(order.id, 'READY')}
                            className="text-[10px] bg-[#0a3018] text-[#3da855] border border-[#3da85550] px-2 py-1 rounded font-bold hover:bg-[#143a22] transition-colors"
                          >
                            Ready
                          </button>
                        )}
                        {order.status === 'READY' && (
                          <button
                            onClick={() => updateStatus(order.id, 'COMPLETED')}
                            className="text-[10px] bg-[#1a2a3a] text-cream-dim border border-border px-2 py-1 rounded font-bold hover:bg-border transition-colors"
                          >
                            Complete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </Fragment>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-muted text-sm">
                  No orders found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="text-muted text-xs mt-2 px-1">Showing {filtered.length} of {orders.length} orders</p>
    </div>
  );
}
