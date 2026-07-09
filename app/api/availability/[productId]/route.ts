import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ productId: string }> }) {
  const { productId } = await params;

  let body: { available?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (typeof body.available !== 'boolean') {
    return NextResponse.json({ error: 'available must be a boolean' }, { status: 400 });
  }

  const { error } = await getSupabaseAdmin()
    .from('product_availability')
    .upsert({ product_id: productId, available: body.available, updated_at: new Date().toISOString() });

  if (error) {
    console.error('Failed to update availability', error);
    return NextResponse.json({ error: 'Failed to update availability' }, { status: 500 });
  }

  return NextResponse.json({ productId, available: body.available });
}
