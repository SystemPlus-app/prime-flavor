export type OrderStatus = 'NEW' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED';
export type PaymentStatus = 'UNPAID' | 'CASH' | 'CARD';
export type OrderSource = 'KIOSK' | 'WEBSITE' | 'DOORDASH' | 'UBER_EATS' | 'GRUBHUB' | 'PHONE';

export interface OrderItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
}

export interface Order {
  id: string;
  orderNumber: number;
  customerName?: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  source: OrderSource;
  createdAt: string;
  updatedAt: string;
  notes?: string;
}
