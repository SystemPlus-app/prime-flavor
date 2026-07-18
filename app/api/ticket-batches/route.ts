import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { mapTicketBatchRow } from '@/lib/ticketBatchMapper';

export async function POST(req: NextRequest) {
  let body: { label?: string; ticketStart?: number; ticketEnd?: number; allowedProductIds?: string[]; active?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { label, ticketStart, ticketEnd, allowedProductIds, active = true } = body;

  if (!label?.trim()) {
    return NextResponse.json({ error: 'label is required' }, { status: 400 });
  }
  if (!Number.isInteger(ticketStart) || (ticketStart as number) < 0) {
    return NextResponse.json({ error: 'ticketStart must be a non-negative integer' }, { status: 400 });
  }
  if (!Number.isInteger(ticketEnd) || (ticketEnd as number) < (ticketStart as number)) {
    return NextResponse.json({ error: 'ticketEnd must be an integer greater than or equal to ticketStart' }, { status: 400 });
  }
  if (allowedProductIds !== undefined && !Array.isArray(allowedProductIds)) {
    return NextResponse.json({ error: 'allowedProductIds must be an array of product ids' }, { status: 400 });
  }

  const { data, error } = await getSupabaseAdmin()
    .from('ticket_batches')
    .insert({
      label: label.trim(),
      ticket_start: ticketStart,
      ticket_end: ticketEnd,
      allowed_product_ids: allowedProductIds && allowedProductIds.length > 0 ? allowedProductIds : null,
      active,
    })
    .select()
    .single();

  if (error || !data) {
    console.error('Failed to create ticket batch', error);
    return NextResponse.json({ error: 'Failed to create ticket batch' }, { status: 500 });
  }

  return NextResponse.json({ batch: mapTicketBatchRow(data) });
}
