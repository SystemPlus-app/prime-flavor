import type { RedeemedTicket, TicketBatch } from '@/types/ticketBatch';

export function mapTicketBatchRow(row: Record<string, unknown>): TicketBatch {
  return {
    id: row.id as string,
    label: row.label as string,
    ticketStart: Number(row.ticket_start),
    ticketEnd: Number(row.ticket_end),
    allowedProductIds: (row.allowed_product_ids as string[] | null) ?? null,
    active: row.active as boolean,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export function mapRedeemedTicketRow(row: Record<string, unknown>): RedeemedTicket {
  return {
    batchId: row.batch_id as string,
    ticketNumber: Number(row.ticket_number),
    orderId: (row.order_id as string | null) ?? undefined,
    redeemedAt: row.redeemed_at as string,
  };
}

export function formatTicketNumber(n: number): string {
  return String(n).padStart(7, '0');
}
