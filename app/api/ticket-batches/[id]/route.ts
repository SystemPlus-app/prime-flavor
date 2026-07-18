import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { mapTicketBatchRow } from '@/lib/ticketBatchMapper';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let body: { label?: string; ticketStart?: number; ticketEnd?: number; allowedProductIds?: string[] | null; active?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (body.label !== undefined && !body.label.trim()) {
    return NextResponse.json({ error: 'label cannot be empty' }, { status: 400 });
  }
  if (body.ticketStart !== undefined && (!Number.isInteger(body.ticketStart) || body.ticketStart < 0)) {
    return NextResponse.json({ error: 'ticketStart must be a non-negative integer' }, { status: 400 });
  }
  if (body.ticketEnd !== undefined && !Number.isInteger(body.ticketEnd)) {
    return NextResponse.json({ error: 'ticketEnd must be an integer' }, { status: 400 });
  }
  if (body.allowedProductIds !== undefined && body.allowedProductIds !== null && !Array.isArray(body.allowedProductIds)) {
    return NextResponse.json({ error: 'allowedProductIds must be an array of product ids' }, { status: 400 });
  }

  const { data, error } = await getSupabaseAdmin()
    .from('ticket_batches')
    .update({
      ...(body.label !== undefined && { label: body.label.trim() }),
      ...(body.ticketStart !== undefined && { ticket_start: body.ticketStart }),
      ...(body.ticketEnd !== undefined && { ticket_end: body.ticketEnd }),
      ...(body.allowedProductIds !== undefined && {
        allowed_product_ids: body.allowedProductIds && body.allowedProductIds.length > 0 ? body.allowedProductIds : null,
      }),
      ...(body.active !== undefined && { active: body.active }),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error || !data) {
    console.error('Failed to update ticket batch', error);
    return NextResponse.json({ error: 'Failed to update ticket batch' }, { status: 500 });
  }

  return NextResponse.json({ batch: mapTicketBatchRow(data) });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const { error } = await getSupabaseAdmin()
    .from('ticket_batches')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Failed to delete ticket batch', error);
    return NextResponse.json({ error: 'Failed to delete ticket batch' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
