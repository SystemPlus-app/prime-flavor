import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { mapOrderRow } from '@/lib/orderMapper';
import { calcTax, calcTotal } from '@/utils/pricing';
import type { OrderItem, OrderSource, PaymentStatus } from '@/types/order';

export async function POST(req: NextRequest) {
  let body: { items?: OrderItem[]; customerName?: string; paymentStatus?: PaymentStatus; source?: OrderSource; notes?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { items, customerName, paymentStatus = 'UNPAID', source = 'KIOSK', notes } = body;

  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: 'items must be a non-empty array' }, { status: 400 });
  }

  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);

  const { data, error } = await getSupabaseAdmin()
    .from('orders')
    .insert({
      customer_name: customerName?.trim() || null,
      items,
      subtotal,
      tax: calcTax(subtotal),
      total: calcTotal(subtotal),
      payment_status: paymentStatus,
      status: 'NEW',
      source,
      notes: notes?.trim() || null,
    })
    .select()
    .single();

  if (error || !data) {
    console.error('Failed to create order', error);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }

  return NextResponse.json({ order: mapOrderRow(data) });
}
