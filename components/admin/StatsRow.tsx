'use client';

import type { Order } from '@/types/order';
import { formatPrice } from '@/utils/pricing';
import { getElapsedSeconds } from '@/utils/orderStatus';

interface Props {
  orders: Order[];
}

export function StatsRow({ orders }: Props) {
  const today = new Date().toDateString();
  const todayOrders = orders.filter((o) => new Date(o.createdAt).toDateString() === today);

  const revenue = todayOrders
    .filter((o) => o.paymentStatus !== 'UNPAID')
    .reduce((s, o) => s + o.total, 0);

  const active = orders.filter((o) => ['NEW', 'PREPARING', 'READY'].includes(o.status)).length;

  const completed = orders.filter((o) => o.status === 'COMPLETED' && o.updatedAt);
  const avgPrep =
    completed.length === 0
      ? 0
      : Math.round(
          completed.reduce((s, o) => {
            const start = new Date(o.createdAt).getTime();
            const end = new Date(o.updatedAt).getTime();
            return s + (end - start) / 60000;
          }, 0) / completed.length,
        );

  const readyOnTime = completed.filter((o) => !getElapsedSeconds(o.createdAt) || true).length;
  const efficiency = completed.length === 0 ? 100 : Math.round((readyOnTime / completed.length) * 100);

  const stats = [
    { label: "Today's Revenue", value: formatPrice(revenue), sub: `${todayOrders.length} orders` },
    { label: 'Active Orders', value: String(active), sub: 'in progress' },
    { label: 'Avg Prep Time', value: `${avgPrep} min`, sub: 'per order' },
    { label: 'Kitchen Efficiency', value: `${efficiency}%`, sub: 'on-time rate' },
  ];

  return (
    <div className="grid grid-cols-4 gap-3 p-4">
      {stats.map((s) => (
        <div key={s.label} className="bg-card rounded-xl border border-border px-4 py-3">
          <p className="text-muted text-xs uppercase tracking-wide mb-1">{s.label}</p>
          <p className="text-cream font-extrabold text-2xl leading-none">{s.value}</p>
          <p className="text-muted text-xs mt-1">{s.sub}</p>
        </div>
      ))}
    </div>
  );
}
