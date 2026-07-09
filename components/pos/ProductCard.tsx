'use client';

import type { Product } from '@/types/product';
import { formatPrice } from '@/utils/pricing';

interface Props {
  product: Product;
  onAdd: (product: Product) => void;
}

const categoryColors: Record<string, string> = {
  plates: '#6a3a20',
  skewers: '#4a3010',
  sandwiches: '#3a2a10',
  sides: '#1a3020',
  drinks: '#1a2a40',
};

export function ProductCard({ product, onAdd }: Props) {
  const bgColor = categoryColors[product.category] ?? '#2d2a26';

  return (
    <button
      onClick={() => product.available && onAdd(product)}
      disabled={!product.available}
      className={`
        relative flex flex-col rounded-lg overflow-hidden border text-left transition-all active:scale-95
        ${product.available
          ? 'border-border hover:border-orange hover:shadow-[0_0_0_1px_#e07030] cursor-pointer'
          : 'border-border opacity-50 cursor-not-allowed grayscale'
        }
      `}
    >
      {/* image placeholder */}
      <div
        className="w-full h-[90px] flex items-center justify-center relative"
        style={{ backgroundColor: bgColor }}
      >
        <span className="text-4xl select-none">
          {product.category === 'plates' && '🍽️'}
          {product.category === 'skewers' && '🍢'}
          {product.category === 'sandwiches' && '🥪'}
          {product.category === 'sides' && '🍞'}
          {product.category === 'drinks' && '🥤'}
        </span>
        {!product.available && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <span className="text-[10px] font-bold text-red-400 tracking-widest uppercase">Sold Out</span>
          </div>
        )}
        <div className="absolute top-1.5 right-1.5 bg-orange text-white text-[11px] font-bold px-1.5 py-0.5 rounded">
          {formatPrice(product.price)}
        </div>
      </div>

      {/* info */}
      <div className="flex items-center justify-between gap-1 px-2 py-2 bg-card">
        <span className="text-[12px] font-semibold text-cream leading-tight flex-1 min-w-0">
          {product.name}
        </span>
        {product.available && (
          <span className="shrink-0 w-7 h-7 flex items-center justify-center bg-orange hover:bg-orange-hover rounded text-white text-lg font-bold leading-none transition-colors">
            +
          </span>
        )}
      </div>
    </button>
  );
}
