import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { mapOrderRow } from '@/lib/orderMapper';
import type { OrderStatus, PaymentStatus } from '@/types/order';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let body: { status?: OrderStatus; paymentStatus?: PaymentStatus };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!body.status && !body.paymentStatus) {
    return NextResponse.json({ error: 'status or paymentStatus is required' }, { status: 400 });
  }

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.status) patch.status = body.status;
  if (body.paymentStatus) patch.payment_status = body.paymentStatus;

  const { data, error } = await getSupabaseAdmin()
    .from('orders')
    .update(patch)
    .eq('id', id)
    .select()
    .single();

  if (error || !data) {
    console.error('Failed to update order', error);
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }

  return NextResponse.json({ order: mapOrderRow(data) });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const { error } = await getSupabaseAdmin()
    .from('orders')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Failed to delete order', error);
    return NextResponse.json({ error: 'Failed to delete order' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
