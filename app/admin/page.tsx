'use client';

import { useState } from 'react';
import Link from 'next/link';
import { StatsRow } from '@/components/admin/StatsRow';
import { OrderTable } from '@/components/admin/OrderTable';
import { Clock } from '@/components/shared/Clock';
import { PINGate } from '@/components/shared/PINGate';
import { useOrderStore } from '@/store/orderStore';
import { products as allProducts, withAvailability, withPriceOverride } from '@/data/primeFlavorMenu';

type AdminTab = 'orders' | 'menu';

function EditablePrice({ price, onSave }: { price: number; onSave: (price: number) => void }) {
  const [value, setValue] = useState(price.toFixed(2));

  function commit() {
    const parsed = Number.parseFloat(value);
    if (!Number.isFinite(parsed) || parsed < 0) {
      setValue(price.toFixed(2));
      return;
    }
    if (parsed !== price) onSave(parsed);
    setValue(parsed.toFixed(2));
  }

  return (
    <div className="flex items-center gap-1 font-bold text-orange">
      <span>$</span>
      <input
        type="number"
        step="0.01"
        min="0"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
        className="w-20 bg-transparent border-b border-transparent hover:border-border focus:border-orange outline-none text-orange font-bold"
      />
    </div>
  );
}

function AdminDashboard() {
  const { orders, availability, visibility, priceOverrides, toggleAvailable, toggleVisible, updatePrice } = useOrderStore();
  const [tab, setTab] = useState<AdminTab>('orders');
  const menuProducts = withPriceOverride(withAvailability(allProducts, availability), priceOverrides);

  return (
    <div className="h-screen flex flex-col bg-base overflow-hidden">
      {/* top bar */}
      <header className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 bg-sidebar border-b border-border shrink-0">
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
                  {['Item', 'Category', 'Price', 'Status', 'Kiosk Menu'].map((h) => (
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
                {menuProducts.map((p) => (
                  <tr key={p.id} className="border-b border-border hover:bg-card/50 transition-colors">
                    <td className="px-4 py-3 font-semibold text-cream">{p.name}</td>
                    <td className="px-4 py-3 text-cream-dim capitalize">{p.category}</td>
                    <td className="px-4 py-3">
                      <EditablePrice key={p.price} price={p.price} onSave={(price) => updatePrice(p.id, price)} />
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleAvailable(p.id)}
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wide transition-colors cursor-pointer ${
                          p.available
                            ? 'bg-[#1a3020] text-[#3da855] hover:bg-[#22402a]'
                            : 'bg-[#3a1a10] text-[#d07060] hover:bg-[#4a2216]'
                        }`}
                      >
                        {p.available ? 'Available' : 'Sold Out'}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleVisible(p.id)}
                        title="Hide temporarily for events without pulling the item permanently"
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wide transition-colors cursor-pointer ${
                          visibility[p.id] !== false
                            ? 'bg-[#1a2a3a] text-[#5ca3d0] hover:bg-[#20344a]'
                            : 'bg-[#332a1a] text-[#d0a35c] hover:bg-[#4a3a20]'
                        }`}
                      >
                        {visibility[p.id] !== false ? 'Shown' : 'Hidden'}
                      </button>
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
