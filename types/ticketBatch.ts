export interface TicketBatch {
  id: string;
  label: string;
  ticketStart: number;
  ticketEnd: number;
  allowedProductIds: string[] | null; // null/empty = valid for any dish
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RedeemedTicket {
  batchId: string;
  ticketNumber: number;
  orderId?: string;
  redeemedAt: string;
}
