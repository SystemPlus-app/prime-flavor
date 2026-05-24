'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { KitchenOrderCard } from '@/components/kitchen/KitchenOrderCard';
import { Clock } from '@/components/shared/Clock';
import { PINGate } from '@/components/shared/PINGate';
import { useOrderStore } from '@/store/orderStore';

function KitchenDisplay() {
  const { orders } = useOrderStore();
  const [, setTick] = useState(0);

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
      {/* top bar */}
      <header className="flex items-center justify-between px-5 py-3 bg-sidebar border-b border-border shrink-0">
        <div className="flex items-center gap-4">
          <span className="text-orange font-extrabold text-base tracking-widest uppercase">Kitchen Display</span>
          {activeOrders.length > 0 && (
            <div className="flex items-center gap-1.5 bg-orange px-3 py-1 rounded-full">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              <span className="text-white text-xs font-bold uppercase tracking-wide">
                {activeOrders.length} Active
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          <Clock />
          <div className="flex items-center gap-2 ml-2">
            <Link
              href="/admin"
              className="text-muted hover:text-cream text-xs uppercase tracking-wide font-semibold px-3 py-1.5 rounded bg-card border border-border hover:border-orange transition-colors"
            >
              Admin
            </Link>
            <Link
              href="/kiosk"
              className="text-muted hover:text-cream text-xs uppercase tracking-wide font-semibold px-3 py-1.5 rounded bg-card border border-border hover:border-orange transition-colors"
            >
              Kiosk
            </Link>
          </div>
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
      <footer className="flex items-center justify-between px-5 py-2.5 bg-sidebar border-t border-border shrink-0">
        <div className="flex items-center gap-5 text-sm">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#e07030]" />
            <span className="text-cream-dim font-semibold">NEW ({newCount})</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#d4a530]" />
            <span className="text-cream-dim font-semibold">COOKING ({preparingCount})</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#3da855]" />
            <span className="text-cream-dim font-semibold">READY ({readyCount})</span>
          </span>
        </div>
        <span className="text-muted text-xs">Station: Main Grill · Prime Flavor BBQ</span>
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
