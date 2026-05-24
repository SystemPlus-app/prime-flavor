'use client';

import { useState } from 'react';
import Link from 'next/link';
import { StatsRow } from '@/components/admin/StatsRow';
import { OrderTable } from '@/components/admin/OrderTable';
import { Clock } from '@/components/shared/Clock';
import { PINGate } from '@/components/shared/PINGate';
import { useOrderStore } from '@/store/orderStore';
import { products as allProducts } from '@/data/primeFlavorMenu';
import { formatPrice } from '@/utils/pricing';

type AdminTab = 'orders' | 'menu';

function AdminDashboard() {
  const { orders } = useOrderStore();
  const [tab, setTab] = useState<AdminTab>('orders');

  return (
    <div className="h-screen flex flex-col bg-base overflow-hidden">
      {/* top bar */}
      <header className="flex items-center justify-between px-5 py-3 bg-sidebar border-b border-border shrink-0">
        <div className="flex flex-col leading-none">
          <span className="text-orange font-extrabold text-base tracking-wide uppercase">Prime Flavor</span>
          <span className="text-muted text-[10px] tracking-widest uppercase">Admin Panel</span>
        </div>

        <div className="flex items-center gap-4">
          <Clock />
          <div className="flex items-center gap-2 ml-2">
            <Link
              href="/kitchen"
              className="text-muted hover:text-cream text-xs uppercase tracking-wide font-semibold px-3 py-1.5 rounded bg-card border border-border hover:border-orange transition-colors"
            >
              Kitchen
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

      {/* stats */}
      <StatsRow orders={orders} />

      {/* tab nav */}
      <div className="flex items-center gap-1 px-4 pb-2 shrink-0">
        <button
          onClick={() => setTab('orders')}
          className={`px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-wide transition-colors ${
            tab === 'orders' ? 'bg-orange text-white' : 'text-muted hover:text-cream'
          }`}
        >
          Order History
        </button>
        <button
          onClick={() => setTab('menu')}
          className={`px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-wide transition-colors ${
            tab === 'menu' ? 'bg-orange text-white' : 'text-muted hover:text-cream'
          }`}
        >
          Menu Management
        </button>
      </div>

      {/* content */}
      {tab === 'orders' && <OrderTable orders={orders} />}

      {tab === 'menu' && (
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          <div className="rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-card">
                  {['Item', 'Category', 'Price', 'Status'].map((h) => (
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
                {allProducts.map((p) => (
                  <tr key={p.id} className="border-b border-border hover:bg-card/50 transition-colors">
                    <td className="px-4 py-3 font-semibold text-cream">{p.name}</td>
                    <td className="px-4 py-3 text-cream-dim capitalize">{p.category}</td>
                    <td className="px-4 py-3 font-bold text-orange">{formatPrice(p.price)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wide ${
                          p.available
                            ? 'bg-[#1a3020] text-[#3da855]'
                            : 'bg-[#3a1a10] text-[#d07060]'
                        }`}
                      >
                        {p.available ? 'Available' : 'Sold Out'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminPage() {
  return (
    <PINGate routeLabel="Admin Dashboard">
      <AdminDashboard />
    </PINGate>
  );
}
