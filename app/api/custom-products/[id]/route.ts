import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { mapCustomProductRow } from '@/lib/customProductMapper';
import { categories } from '@/data/primeFlavorMenu';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let body: { name?: string; category?: string; price?: number; description?: string; imageUrl?: string; popular?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (body.category !== undefined && !categories.some((c) => c.id === body.category)) {
    return NextResponse.json({ error: 'category must be a valid category id' }, { status: 400 });
  }
  if (body.price !== undefined && (typeof body.price !== 'number' || !Number.isFinite(body.price) || body.price < 0)) {
    return NextResponse.json({ error: 'price must be a non-negative number' }, { status: 400 });
  }

  const { data, error } = await getSupabaseAdmin()
    .from('custom_products')
    .update({
      ...(body.name !== undefined && { name: body.name.trim() }),
      ...(body.category !== undefined && { category: body.category }),
      ...(body.price !== undefined && { price: body.price }),
      ...(body.description !== undefined && { description: body.description?.trim() || null }),
      ...(body.imageUrl !== undefined && { image_url: body.imageUrl || null }),
      ...(body.popular !== undefined && { popular: body.popular }),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error || !data) {
    console.error('Failed to update custom product', error);
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }

  return NextResponse.json({ product: mapCustomProductRow(data) });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const { error } = await getSupabaseAdmin()
    .from('custom_products')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Failed to delete custom product', error);
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
