import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ productId: string }> }) {
  const { productId } = await params;

  let body: { available?: boolean; visible?: boolean; price?: number; imageUrl?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (body.available === undefined && body.visible === undefined && body.price === undefined && body.imageUrl === undefined) {
    return NextResponse.json({ error: 'available, visible, price, or imageUrl must be provided' }, { status: 400 });
  }
  if (body.available !== undefined && typeof body.available !== 'boolean') {
    return NextResponse.json({ error: 'available must be a boolean' }, { status: 400 });
  }
  if (body.visible !== undefined && typeof body.visible !== 'boolean') {
    return NextResponse.json({ error: 'visible must be a boolean' }, { status: 400 });
  }
  if (body.price !== undefined && (typeof body.price !== 'number' || !Number.isFinite(body.price) || body.price < 0)) {
    return NextResponse.json({ error: 'price must be a non-negative number' }, { status: 400 });
  }

  const { error } = await getSupabaseAdmin()
    .from('product_availability')
    .upsert({
      product_id: productId,
      ...(body.available !== undefined && { available: body.available }),
      ...(body.visible !== undefined && { visible: body.visible }),
      ...(body.price !== undefined && { price: body.price }),
      ...(body.imageUrl !== undefined && { image_url: body.imageUrl || null }),
      updated_at: new Date().toISOString(),
    });

  if (error) {
    console.error('Failed to update availability', error);
    return NextResponse.json({ error: 'Failed to update availability' }, { status: 500 });
  }

  return NextResponse.json({ productId, available: body.available, visible: body.visible, price: body.price, imageUrl: body.imageUrl });
}
