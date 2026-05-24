import type { Order } from '@/types/order';

const now = Date.now();
const mins = (m: number) => new Date(now - m * 60 * 1000).toISOString();

export const mockOrders: Order[] = [
  {
    id: 'mock-1',
    orderNumber: 402,
    customerName: 'Ricardo Mendosa',
    items: [
      { id: 'i1', productId: 'bbq-picanha-skewer', name: 'BBQ Picanha Skewer', price: 13, quantity: 2 },
      { id: 'i2', productId: 'sausage-sandwich', name: 'Brazilian Sausage Sandwich', price: 15, quantity: 1 },
    ],
    subtotal: 41,
    tax: 3.28,
    total: 44.28,
    paymentStatus: 'UNPAID',
    status: 'NEW',
    createdAt: mins(13),
    updatedAt: mins(13),
  },
  {
    id: 'mock-2',
    orderNumber: 401,
    customerName: 'Isabella Silva',
    items: [
      { id: 'i3', productId: 'bbq-picanha-plate', name: 'BBQ Picanha Plate', price: 23, quantity: 1 },
      { id: 'i4', productId: 'garlic-bread', name: 'Garlic Bread', price: 8, quantity: 1 },
      { id: 'i5', productId: 'guarana', name: 'Guarana', price: 3.5, quantity: 1 },
    ],
    subtotal: 34.5,
    tax: 2.76,
    total: 37.26,
    paymentStatus: 'CARD',
    status: 'PREPARING',
    createdAt: mins(7),
    updatedAt: mins(5),
  },
  {
    id: 'mock-3',
    orderNumber: 399,
    customerName: 'Dante Alighieri',
    items: [
      { id: 'i6', productId: 'picanha-sandwich', name: 'Picanha Sandwich', price: 25, quantity: 2 },
      { id: 'i7', productId: 'coke', name: 'Coke', price: 3, quantity: 3 },
    ],
    subtotal: 59,
    tax: 4.72,
    total: 63.72,
    paymentStatus: 'CASH',
    status: 'READY',
    createdAt: mins(18),
    updatedAt: mins(2),
  },
  {
    id: 'mock-4',
    orderNumber: 398,
    customerName: 'Sophia Chen',
    items: [
      { id: 'i8', productId: 'special-bbq-sandwich', name: 'Special Brazilian BBQ Sandwich', price: 22, quantity: 1 },
      { id: 'i9', productId: 'potato-chips', name: 'Potato Chips', price: 5, quantity: 1 },
    ],
    subtotal: 27,
    tax: 2.16,
    total: 29.16,
    paymentStatus: 'CARD',
    status: 'COMPLETED',
    createdAt: mins(45),
    updatedAt: mins(30),
  },
  {
    id: 'mock-5',
    orderNumber: 397,
    customerName: 'Marco Polo',
    items: [
      { id: 'i10', productId: 'bbq-chicken-bacon-skewer', name: 'BBQ Chicken Bacon Skewer', price: 8, quantity: 3 },
      { id: 'i11', productId: 'cheese-bread-box', name: 'Cheese Bread Box', price: 8, quantity: 1 },
    ],
    subtotal: 32,
    tax: 2.56,
    total: 34.56,
    paymentStatus: 'CASH',
    status: 'COMPLETED',
    createdAt: mins(65),
    updatedAt: mins(50),
  },
];
