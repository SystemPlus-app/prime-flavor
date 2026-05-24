'use client';

import { categories } from '@/data/primeFlavorMenu';
import type { Category } from '@/types/product';

interface Props {
  activeCategory: string;
  onSelect: (id: string) => void;
}

const categoryIcons: Record<string, string> = {
  featured: '★',
  skewers: '⚡',
  sandwiches: '▦',
  plates: '◎',
  sides: '◇',
  drinks: '◉',
};

export function CategorySidebar({ activeCategory, onSelect }: Props) {
  return (
    <aside className="flex flex-col bg-sidebar w-[90px] shrink-0 border-r border-border">
      <div className="flex flex-col items-center py-3 gap-1 flex-1 overflow-y-auto">
        {categories.map((cat: Category) => {
          const active = cat.id === activeCategory;
          return (
            <button
              key={cat.id}
              onClick={() => onSelect(cat.id)}
              className={`
                w-full flex flex-col items-center gap-1 py-3 px-1 rounded-none transition-colors
                ${active ? 'bg-orange text-white' : 'text-cream-dim hover:bg-card hover:text-cream'}
              `}
            >
              <span className="text-xl leading-none">{categoryIcons[cat.id] ?? '·'}</span>
              <span className="text-[10px] font-semibold tracking-wide uppercase leading-tight text-center">
                {cat.name}
              </span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
