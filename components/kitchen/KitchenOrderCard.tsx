'use client';

import { useEffect, useState } from 'react';
import type { Order, OrderSource, OrderStatus } from '@/types/order';
import { formatElapsed, getElapsedSeconds, isLate } from '@/utils/orderStatus';
import { useOrderStore } from '@/store/orderStore';

interface Props {
  order: Order;
}

function headerBg(status: OrderStatus, late: boolean): string {
  if (late && status !== 'READY') return 'bg-[#5a1010]';
  if (status === 'NEW')       return 'bg-[#3a1a08]';
  if (status === 'PREPARING') return 'bg-[#3a2a08]';
  if (status === 'READY')     return 'bg-[#0a3018]';
  return 'bg-card';
}

function timerColor(late: boolean, status: OrderStatus): string {
  if (late && status !== 'READY') return 'text-[#ff6060]';
  if (status === 'READY')     return 'text-[#3da855]';
  if (status === 'PREPARING') return 'text-[#d4a530]';
  return 'text-[#e07030]';
}

function cardClasses(status: OrderStatus, late: boolean): string {
  if (late && status !== 'READY') return 'border-[#c83030] border-pulse-late';
  if (status === 'NEW')       return 'border-[#e07030] shadow-[0_0_0_1px_rgba(224,112,48,0.2)]';
  if (status === 'PREPARING') return 'border-[#d4a530] shadow-[0_0_0_1px_rgba(212,165,48,0.2)]';
  if (status === 'READY')     return 'border-[#3da855] shadow-[0_0_0_1px_rgba(61,168,85,0.25)]';
  return 'border-border';
}

function statusLabel(status: OrderStatus, late: boolean): { text: string; color: string } {
  if (late && status !== 'READY') return { text: 'LATE', color: 'text-[#ff6060]' };
  if (status === 'NEW')       return { text: 'NEW', color: 'text-[#e07030]' };
  if (status === 'PREPARING') return { text: 'COOKING', color: 'text-[#d4a530]' };
  if (status === 'READY')     return { text: 'READY', color: 'text-[#3da855]' };
  return { text: status, color: 'text-muted' };
}

function getPagerInfo(notes?: string): { pager?: string; rest?: string } {
  if (!notes) return {};
  const parts = notes.split('|').map((part) => part.trim()).filter(Boolean);
  let pager: string | undefined;
  const rest: string[] = [];

  for (const part of parts) {
    const match = part.match(/^pager\s*#?\s*(1[0-6]|[1-9])$/i);
    if (match && !pager) {
      pager = match[1];
      continue;
    }
    rest.push(part);
  }

  if (!pager) {
    const fallback = notes.match(/pager\s*#?\s*(1[0-6]|[1-9])/i);
    if (fallback) pager = fallback[1];
  }

  return { pager, rest: rest.length > 0 ? rest.join(' | ') : undefined };
}

function sourceBadge(source: OrderSource): { text: string; className: string } {
  if (source === 'DOORDASH') {
    return { text: 'DoorDash', className: 'bg-[#3a1010] border-[#ff4f4f]/50 text-[#ff7b7b]' };
  }
  if (source === 'UBER_EATS') {
    return { text: 'Uber Eats', className: 'bg-[#082615] border-[#30d070]/50 text-[#65e896]' };
  }
  if (source === 'GRUBHUB') {
    return { text: 'Grubhub', className: 'bg-[#2b1208] border-[#ff8a3d]/50 text-[#ffac70]' };
  }
  if (source === 'PHONE') {
    return { text: 'Phone', className: 'bg-[#101f3a] border-[#5a8dff]/50 text-[#8fb0ff]' };
  }
  if (source === 'WEBSITE') {
    return { text: 'Online', className: 'bg-blue-950/60 border-blue-500/40 text-blue-300' };
  }
  return { text: 'Kiosk', className: 'bg-orange-dim/40 border-orange/20 text-orange' };
}

export function KitchenOrderCard({ order }: Props) {
  const { updateStatus } = useOrderStore();
  const [elapsed, setElapsed] = useState(getElapsedSeconds(order.createdAt));

  useEffect(() => {
    const id = setInterval(() => setElapsed(getElapsedSeconds(order.createdAt)), 1000);
    return () => clearInterval(id);
  }, [order.createdAt]);

  const late = isLate(order.createdAt, 10);
  const label = statusLabel(order.status, late);
  const source = sourceBadge(order.source);
  const { pager, rest } = getPagerInfo(order.notes);

  return (
    <div className={`flex flex-col rounded-xl border bg-card overflow-hidden transition-shadow duration-500 ${cardClasses(order.status, late)}`}>
      {/* Header */}
      <div className={`flex items-center justify-between px-4 py-3 ${headerBg(order.status, late)}`}>
        <div className="flex items-center gap-2.5 flex-wrap">
          {late && order.status !== 'READY' && (
            <span className="text-[#ff6060] animate-pulse">⚠</span>
          )}
          <span className="text-cream font-extrabold text-xl tracking-tight">
            #{order.orderNumber}
          </span>
          <span className={`text-[10px] font-extrabold uppercase tracking-widest ${label.color}`}>
            {label.text}
          </span>
          <span className={`text-[9px] border font-extrabold uppercase tracking-widest px-2 py-0.5 rounded ${source.className}`}>
            {source.text}
          </span>
          {pager && (
            <span className="text-[10px] bg-[#0a3018] border border-[#3da855] text-[#7fe28f] font-extrabold uppercase tracking-widest px-2 py-1 rounded">
              Pager {pager}
            </span>
          )}
          {order.paymentStatus === 'UNPAID' && (
            <span className="text-[9px] bg-[#4a120f] border border-[#ff6060]/40 text-[#ff8a8a] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded">
              Needs payment
            </span>
          )}
        </div>

        <div className="flex flex-col items-end gap-0.5">
          {order.customerName && (
            <span className="text-cream-dim text-xs hidden xl:block">{order.customerName}</span>
          )}
          <div className={`flex items-center gap-1 font-mono font-bold text-lg ${timerColor(late, order.status)}`}>
            <span className="text-xs opacity-60">⏱</span>
            {formatElapsed(elapsed)}
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="flex-1 px-4 py-3 space-y-2.5 overflow-y-auto min-h-[80px]">
        {rest && (
          <div className="rounded-lg border border-[#d4a530]/30 bg-[#3a2a08]/35 px-3 py-2 text-[#e8c66a] text-xs font-semibold">
            {rest}
          </div>
        )}
        {order.items.map((item) => (
          <div key={item.id} className="flex items-start gap-3">
            <span className="text-orange font-extrabold text-base leading-tight w-8 shrink-0 tabular-nums">
              {item.quantity}×
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-cream font-semibold text-[15px] leading-tight">{item.name}</p>
              {item.notes && (
                <p className="text-[#d4a530] text-[11px] font-medium mt-0.5 flex items-start gap-1">
                  <span className="shrink-0 mt-px">⚠</span>
                  <span>{item.notes}</span>
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="border-t border-border p-3">
        {order.status === 'NEW' && (
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => updateStatus(order.id, 'NEW')}
              className="py-3 rounded-lg bg-card border border-border text-cream-dim font-bold text-sm uppercase tracking-wide hover:bg-border active:scale-95 transition-all flex items-center justify-center gap-1.5"
            >
              <span className="text-base">⏸</span> Hold
            </button>
            <button
              onClick={() => updateStatus(order.id, 'PREPARING')}
              className="py-3 rounded-lg bg-orange hover:bg-orange-hover active:scale-95 text-white font-bold text-sm uppercase tracking-wide transition-all flex items-center justify-center gap-1.5"
            >
              <span className="text-base">▶</span> Start
            </button>
          </div>
        )}

        {order.status === 'PREPARING' && (
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => updateStatus(order.id, 'NEW')}
              className="py-3 rounded-lg bg-card border border-border text-cream-dim font-bold text-sm uppercase tracking-wide hover:bg-border active:scale-95 transition-all flex items-center justify-center gap-1.5"
            >
              ↺ Reset
            </button>
            <button
              onClick={() => updateStatus(order.id, 'READY')}
              className="py-3 rounded-lg bg-[#3da855] hover:bg-[#2d9045] active:scale-95 text-white font-bold text-sm uppercase tracking-wide transition-all flex items-center justify-center gap-1.5"
            >
              <span>✓</span> Mark Ready
            </button>
          </div>
        )}

        {order.status === 'READY' && (
          <button
            onClick={() => updateStatus(order.id, 'COMPLETED')}
            className="w-full py-3 rounded-lg bg-[#1a3020] border border-[#3da855] text-[#3da855] font-bold text-sm uppercase tracking-wide hover:bg-[#243828] active:scale-95 transition-all"
          >
            ✓ Complete & Clear
          </button>
        )}
      </div>
    </div>
  );
}
