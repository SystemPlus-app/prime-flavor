'use client';

import { useState } from 'react';
import type { Product } from '@/types/product';
import { formatPrice } from '@/utils/pricing';
import { getCustomization } from '@/data/customizations';

interface Props {
  product: Product;
  onAdd: (product: Product) => void;
  quantity?: number;
  featured?: boolean;
}

// Real food photos (placed in /public/menu/)
const productPhoto: Record<string, string> = {
  'bbq-picanha-skewer':         '/menu/bbq-picanha.png',
  'bbq-sausage-skewer':         '/menu/bbq-sausage.png',
  'bbq-chicken-skewer':         '/menu/bbq-chicken.avif',
  'bbq-chicken-bacon-skewer':   '/menu/bbq-chicken-bacon.png',
  'queijo-coalho-skewer':       '/menu/queijo-coalho.png',
  'picanha-sandwich':           '/menu/picanha-sandwich.png',
  'picanha-cheese-bread':       '/menu/bbq-picanha.png',
  'chicken-bacon-sandwich':     '/menu/bbq-chicken-bacon.png',
  'sausage-sandwich':           '/menu/bbq-sausage.png',
  'sausage-cheese-bread-sandwich': '/menu/bbq-sausage.png',
  'special-bbq-sandwich':       '/menu/bbq-picanha.png',
  'bbq-picanha-plate':          '/menu/bbq-picanha-plate.png',
  'bbq-chicken-plate':          '/menu/bbq-chicken.avif',
  'bbq-chicken-bacon-plate':    '/menu/bbq-chicken-bacon-plate.avif',
  'bbq-sausage-plate':          '/menu/bbq-sausage.png',
  'prime-bbq-plate':            '/menu/bbq-picanha-plate.png',
  'cheese-bread-box':           '/menu/cheese-bread-box.png',
  'garlic-bread':               '/menu/garlic-bread.png',
  'potato-chips':               '/menu/potato-chips.avif',
  'caesar-salad':               '/menu/caesar-salad.avif',
  guarana:                      '/menu/guarana.webp',
  coke:                         '/menu/coke.webp',
};

// Per-product emoji (fallback when no photo)
const productEmoji: Record<string, string> = {
  'bbq-picanha-plate':       '🥩',
  'bbq-chicken-plate':       '🍗',
  'bbq-chicken-bacon-plate': '🥓',
  'bbq-sausage-plate':       '🌭',
  'prime-bbq-plate':         '🔥',
  'bbq-picanha-skewer':      '🥩',
  'bbq-sausage-skewer':      '🌭',
  'bbq-chicken-skewer':      '🍗',
  'bbq-chicken-bacon-skewer':'🥓',
  'queijo-coalho-skewer':    '🧀',
  'prime-mixed-skewers':     '🍢',
  'picanha-sandwich':        '🥩',
  'picanha-cheese-bread':    '🧀',
  'chicken-bacon-sandwich':  '🥓',
  'chicken-sandwich':        '🍗',
  'sausage-sandwich':        '🌭',
  'sausage-cheese-bread-sandwich':'🌭',
  'special-bbq-sandwich':    '🌟',
  'cheese-bread-box':        '🧀',
  'garlic-bread':            '🫓',
  'potato-chips':            '🍟',
  'rice-side':               '🍚',
  'beans-side':              '🫘',
  'fried-plantain':          '🍌',
  'caesar-salad':            '🥗',
  guarana:                   '🧃',
  coke:                      '🥤',
  'coke-zero':               '🥤',
};

// Per-product cinematic gradient (radial, warm lit from above)
const productBg: Record<string, string> = {
  'bbq-picanha-plate':       'radial-gradient(ellipse at 55% 60%, #7a2d10 0%, #3d1508 45%, #1c0a04 100%)',
  'prime-bbq-plate':         'radial-gradient(ellipse at 50% 55%, #8a3212 0%, #451808 45%, #1c0a04 100%)',
  'bbq-chicken-plate':       'radial-gradient(ellipse at 50% 60%, #6a3e10 0%, #351f08 45%, #160e04 100%)',
  'bbq-chicken-bacon-plate': 'radial-gradient(ellipse at 50% 60%, #5a2e10 0%, #2d1708 45%, #130c04 100%)',
  'bbq-sausage-plate':       'radial-gradient(ellipse at 50% 60%, #5a1e0c 0%, #2d0f06 45%, #130804 100%)',
  'bbq-picanha-skewer':      'radial-gradient(ellipse at 45% 65%, #6a2a08 0%, #351504 50%, #160902 100%)',
  'bbq-sausage-skewer':      'radial-gradient(ellipse at 45% 65%, #4e1e08 0%, #270f04 50%, #110702 100%)',
  'bbq-chicken-skewer':      'radial-gradient(ellipse at 45% 65%, #5a3a08 0%, #2d1d04 50%, #130e02 100%)',
  'bbq-chicken-bacon-skewer':'radial-gradient(ellipse at 45% 65%, #4a2a08 0%, #251504 50%, #110a02 100%)',
  'queijo-coalho-skewer':    'radial-gradient(ellipse at 50% 60%, #4a3a10 0%, #251d08 50%, #110f04 100%)',
  'picanha-sandwich':        'radial-gradient(ellipse at 50% 60%, #5a2a08 0%, #2d1504 50%, #130902 100%)',
  'picanha-cheese-bread':    'radial-gradient(ellipse at 50% 60%, #503810 0%, #281c08 50%, #120e04 100%)',
  'chicken-bacon-sandwich':  'radial-gradient(ellipse at 50% 60%, #4a2e08 0%, #251704 50%, #110b02 100%)',
  'sausage-sandwich':        'radial-gradient(ellipse at 50% 60%, #421808 0%, #210c04 50%, #0f0602 100%)',
  'sausage-cheese-bread-sandwich':'radial-gradient(ellipse at 50% 60%, #3e2208 0%, #1f1104 50%, #0e0802 100%)',
  'special-bbq-sandwich':    'radial-gradient(ellipse at 50% 60%, #622a08 0%, #311504 50%, #160902 100%)',
  'cheese-bread-box':        'radial-gradient(ellipse at 50% 60%, #4a3a0c 0%, #251d06 50%, #110f03 100%)',
  'garlic-bread':            'radial-gradient(ellipse at 50% 60%, #3e3010 0%, #1f1808 50%, #0e0d04 100%)',
  'potato-chips':            'radial-gradient(ellipse at 50% 60%, #3a2e08 0%, #1d1704 50%, #0e0d02 100%)',
  'caesar-salad':            'radial-gradient(ellipse at 50% 60%, #1a3a18 0%, #0d1e0c 50%, #060f06 100%)',
  guarana:                   'radial-gradient(ellipse at 50% 60%, #1e2e08 0%, #0f1704 50%, #060c02 100%)',
  coke:                      'radial-gradient(ellipse at 50% 60%, #1a0e08 0%, #0d0704 50%, #060402 100%)',
};

const categoryBg: Record<string, string> = {
  plates:     'radial-gradient(ellipse at 55% 60%, #6a2510 0%, #351208 50%, #180904 100%)',
  skewers:    'radial-gradient(ellipse at 45% 65%, #5a2208 0%, #2d1104 50%, #130802 100%)',
  sandwiches: 'radial-gradient(ellipse at 50% 60%, #4a2208 0%, #251104 50%, #110802 100%)',
  sides:      'radial-gradient(ellipse at 50% 60%, #3a2e0c 0%, #1d1706 50%, #0e0d03 100%)',
  salads:     'radial-gradient(ellipse at 50% 60%, #1a3a18 0%, #0d1e0c 50%, #060f06 100%)',
  drinks:     'radial-gradient(ellipse at 50% 60%, #081525 0%, #040c13 50%, #020608 100%)',
};

export function KioskProductCard({ product, onAdd, quantity = 0, featured = false }: Props) {
  const [justAdded, setJustAdded] = useState(false);

  const photo = product.image ?? productPhoto[product.id] ?? null;
  const emoji = productEmoji[product.id] ?? '🍴';
  const bg = productBg[product.id] ?? categoryBg[product.category] ?? categoryBg.plates;
  const inCart = quantity > 0;
  const hasCustomization = !!getCustomization(product.id);
  const imgHeight = featured ? 200 : 150;

  function handleAdd(e: React.MouseEvent) {
    e.stopPropagation();
    if (!product.available) return;
    onAdd(product);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 400);
  }

  return (
    <div
      className={`
        flex flex-col rounded-2xl overflow-hidden border transition-all duration-200 group
        ${justAdded ? 'animate-card-add' : ''}
        ${product.available
          ? inCart
            ? 'border-orange shadow-[0_0_0_1px_#e07030] cursor-pointer'
            : 'border-border hover:border-orange/60 hover:shadow-[0_0_18px_rgba(224,112,48,0.12)] cursor-pointer'
          : 'border-border opacity-50 cursor-not-allowed'
        }
      `}
      onClick={handleAdd}
    >
      {/* Image area */}
      <div
        className="relative flex items-center justify-center overflow-hidden shrink-0"
        style={{ height: `${imgHeight}px`, background: bg }}
      >
        {/* Photo or emoji */}
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photo}
            alt={product.name}
            className="absolute inset-0 w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <span
            className="relative z-0 select-none transition-transform duration-300 group-hover:scale-110"
            style={{
              fontSize: featured ? '72px' : '64px',
              lineHeight: 1,
              filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.6))',
            }}
          >
            {emoji}
          </span>
        )}

        {/* Bottom gradient scrim (always shown over photo) */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.55) 100%)' }}
        />

        {/* Popular badge */}
        {product.popular && (
          <div className="absolute top-3 left-3 z-10 flex items-center gap-1 bg-orange px-2.5 py-1 rounded-full shadow-lg">
            <span className="text-[9px] font-extrabold text-white uppercase tracking-widest">★ Popular</span>
          </div>
        )}

        {/* Cart count indicator */}
        {inCart && (
          <div className="absolute top-3 right-3 z-10 w-7 h-7 rounded-full bg-orange border-2 border-base flex items-center justify-center shadow-lg">
            <span className="text-white text-[12px] font-extrabold">{quantity}</span>
          </div>
        )}

        {/* Sold out */}
        {!product.available && (
          <div className="absolute inset-0 z-10 bg-black/65 flex items-center justify-center">
            <span className="text-[11px] font-extrabold text-red-400 uppercase tracking-widest">Sold Out</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col flex-1 bg-card px-4 py-3 gap-2">
        <div className="flex-1">
          <h3 className={`text-cream font-bold leading-snug ${featured ? 'text-[16px]' : 'text-[14px]'}`}>
            {product.name}
          </h3>
          {product.description && (
            <p className="text-muted text-[11px] mt-1 leading-relaxed line-clamp-2">
              {product.description}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 pt-1">
          <span className={`text-orange font-extrabold leading-none ${featured ? 'text-xl' : 'text-lg'}`}>
            {formatPrice(product.price)}
          </span>
          {product.available && (
            <button
              onClick={handleAdd}
              className={`
                flex items-center gap-1.5 rounded-xl font-bold uppercase tracking-wide
                transition-all duration-150 active:scale-95 shrink-0
                ${featured ? 'px-5 py-3 text-sm' : 'px-4 py-2.5 text-xs'}
                ${inCart
                  ? 'bg-orange text-white hover:bg-orange-hover shadow-[0_2px_12px_rgba(224,112,48,0.3)]'
                  : 'bg-orange/15 text-orange border border-orange/35 hover:bg-orange hover:text-white hover:border-orange'
                }
              `}
            >
              <span className="text-base leading-none">+</span>
              <span>{hasCustomization ? 'Options' : 'Add'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
