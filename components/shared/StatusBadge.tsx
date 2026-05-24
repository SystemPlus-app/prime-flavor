'use client';

import type { OrderStatus } from '@/types/order';

const styles: Record<OrderStatus, string> = {
  NEW: 'bg-[#e07030] text-white',
  PREPARING: 'bg-[#d4a530] text-[#1c1a18]',
  READY: 'bg-[#3da855] text-white',
  COMPLETED: 'bg-[#3a4a3a] text-[#7ab87a]',
  CANCELLED: 'bg-[#5a2020] text-[#d07070]',
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold tracking-wider uppercase ${styles[status]}`}
    >
      {status}
    </span>
  );
}
