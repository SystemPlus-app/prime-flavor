'use client';

import type { Product } from '@/types/product';
import { products as allProducts, withAvailability } from '@/data/primeFlavorMenu';
import { useOrderStore } from '@/store/orderStore';
import { formatPrice } from '@/utils/pricing';

interface CartItem {
  product: Product;
  quantity: number;
}

interface Props {
  cart: CartItem[];
  onAdd: (product: Product) => void;
}

function getSuggestions(cart: CartItem[], products: Product[]): Product[] {
  const inCartIds = new Set(cart.map((c) => c.product.id));
  const inCartCategories = new Set(cart.map((c) => c.product.category));
  const result: Product[] = [];

  if (!inCartCategories.has('drinks')) {
    const guarana = products.find((p) => p.id === 'guarana' && p.available && !inCartIds.has(p.id));
    if (guarana) result.push(guarana);
  }

  if (!inCartCategories.has('sides')) {
    const cb = products.find((p) => p.id === 'cheese-bread-box' && p.available && !inCartIds.has(p.id));
    if (cb) result.push(cb);
  }

  if (result.length < 2) {
    const garlic = products.find((p) => p.id === 'garlic-bread' && p.available && !inCartIds.has(p.id));
    if (garlic) result.push(garlic);
  }

  return result.slice(0, 2);
}

const suggestionEmoji: Record<string, string> = {
  guarana: '🧃',
  'cheese-bread-box': '🧀',
  'garlic-bread': '🫓',
  'potato-chips': '🍟',
  coke: '🥤',
};

export function UpsellSuggestions({ cart, onAdd }: Props) {
  const { availability } = useOrderStore();
  const products = withAvailability(allProducts, availability);
  const suggestions = getSuggestions(cart, products);
  if (suggestions.length === 0) return null;

  return (
    <div className="px-4 pb-2">
      <p className="text-muted text-[10px] uppercase tracking-widest font-bold mb-2">
        Add to your order
      </p>
      <div className="space-y-2">
        {suggestions.map((p) => (
          <button
            key={p.id}
            onClick={() => onAdd(p)}
            className="w-full flex items-center gap-3 bg-card border border-border hover:border-orange/50 rounded-xl px-3 py-2.5 transition-all active:scale-[0.98] group"
          >
            <span className="text-xl shrink-0">{suggestionEmoji[p.id] ?? '🍴'}</span>
            <div className="flex-1 text-left min-w-0">
              <p className="text-cream text-xs font-semibold leading-tight truncate">{p.name}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-orange font-bold text-xs">{formatPrice(p.price)}</span>
              <span className="w-6 h-6 rounded-lg bg-orange/20 border border-orange/40 group-hover:bg-orange group-hover:border-orange text-orange group-hover:text-white text-sm font-bold flex items-center justify-center transition-colors">
                +
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
