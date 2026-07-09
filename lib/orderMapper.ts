import type { Order } from '@/types/order';

export function mapOrderRow(row: Record<string, unknown>): Order {
  return {
    id: row.id as string,
    orderNumber: row.order_number as number,
    customerName: (row.customer_name as string | null) ?? undefined,
    items: row.items as Order['items'],
    subtotal: Number(row.subtotal),
    tax: Number(row.tax),
    total: Number(row.total),
    paymentStatus: row.payment_status as Order['paymentStatus'],
    status: row.status as Order['status'],
    source: row.source as Order['source'],
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    notes: (row.notes as string | null) ?? undefined,
  };
}
