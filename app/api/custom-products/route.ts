import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { mapCustomProductRow } from '@/lib/customProductMapper';
import { categories } from '@/data/primeFlavorMenu';

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export async function POST(req: NextRequest) {
  let body: { name?: string; category?: string; price?: number; description?: string; imageUrl?: string; popular?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { name, category, price, description, imageUrl, popular } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 });
  }
  if (!category || !categories.some((c) => c.id === category)) {
    return NextResponse.json({ error: 'category must be a valid category id' }, { status: 400 });
  }
  if (typeof price !== 'number' || !Number.isFinite(price) || price < 0) {
    return NextResponse.json({ error: 'price must be a non-negative number' }, { status: 400 });
  }

  const slug = slugify(name);
  const id = `custom-${slug}-${Date.now().toString(36)}`;

  const { data, error } = await getSupabaseAdmin()
    .from('custom_products')
    .insert({
      id,
      name: name.trim(),
      category,
      price,
      description: description?.trim() || null,
      image_url: imageUrl || null,
      popular: !!popular,
    })
    .select()
    .single();

  if (error || !data) {
    console.error('Failed to create custom product', error);
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }

  return NextResponse.json({ product: mapCustomProductRow(data) });
}
