import type { OrderStatus } from '@/types/order';

export const STATUS_LABELS: Record<OrderStatus, string> = {
  NEW: 'NEW',
  PREPARING: 'PREPARING',
  READY: 'READY',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
};

export const STATUS_COLORS: Record<OrderStatus, string> = {
  NEW: '#e07030',
  PREPARING: '#d4a530',
  READY: '#3da855',
  COMPLETED: '#4a5a4a',
  CANCELLED: '#6a3030',
};

export const STATUS_BG: Record<OrderStatus, string> = {
  NEW: 'bg-status-new',
  PREPARING: 'bg-status-preparing',
  READY: 'bg-status-ready',
  COMPLETED: 'bg-status-completed',
  CANCELLED: 'bg-[#6a3030]',
};

export function getElapsedSeconds(createdAt: string): number {
  return Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000);
}

export function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function isLate(createdAt: string, thresholdMinutes = 10): boolean {
  return getElapsedSeconds(createdAt) > thresholdMinutes * 60;
}

export function formatOrderId(orderNumber: number): string {
  return `#BRZ-${orderNumber}`;
}
