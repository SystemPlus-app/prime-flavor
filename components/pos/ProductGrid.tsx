'use client';

import { getProductsByCategory } from '@/data/primeFlavorMenu';
import type { Product } from '@/types/product';
import { ProductCard } from './ProductCard';

interface Props {
  category: string;
  onAdd: (product: Product) => void;
}

export function ProductGrid({ category, onAdd }: Props) {
  const items = getProductsByCategory(category);

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="grid grid-cols-3 gap-3 auto-rows-min">
        {items.map((product) => (
          <ProductCard key={product.id} product={product} onAdd={onAdd} />
        ))}
      </div>
    </div>
  );
}
