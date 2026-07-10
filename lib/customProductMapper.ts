import type { Product } from '@/types/product';

export function mapCustomProductRow(row: Record<string, unknown>): Product {
  return {
    id: row.id as string,
    name: row.name as string,
    category: row.category as string,
    price: Number(row.price),
    description: (row.description as string) ?? undefined,
    popular: (row.popular as boolean) ?? false,
    available: true,
    image: (row.image_url as string) ?? undefined,
    custom: true,
  };
}
