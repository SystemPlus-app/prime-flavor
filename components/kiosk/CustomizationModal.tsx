'use client';

import { useState } from 'react';
import type { Product } from '@/types/product';
import type { CustomizationGroup } from '@/data/customizations';
import { formatPrice } from '@/utils/pricing';

interface Props {
  product: Product;
  groups: CustomizationGroup[];
  onAdd: (notes: string, unitPrice: number, quantity: number) => void;
  onClose: () => void;
}

const productEmoji: Record<string, string> = {
  'bbq-picanha-plate': '🥩', 'bbq-chicken-plate': '🍗', 'bbq-chicken-bacon-plate': '🥓',
  'bbq-sausage-plate': '🌭', 'prime-bbq-plate': '🔥',
  'picanha-sandwich': '🥩', 'picanha-cheese-bread': '🧀', 'chicken-bacon-sandwich': '🥓', 'chicken-sandwich': '🍗',
  'sausage-sandwich': '🌭', 'sausage-cheese-bread-sandwich': '🌭', 'special-bbq-sandwich': '🌟',
  'bbq-picanha-skewer': '🥩', 'bbq-chicken-skewer': '🍗', 'bbq-chicken-bacon-skewer': '🥓',
  'bbq-sausage-skewer': '🌭', 'queijo-coalho-skewer': '🧀', 'prime-mixed-skewers': '🍢',
};

export function CustomizationModal({ product, groups, onAdd, onClose }: Props) {
  const [selectedMulti, setSelectedMulti] = useState<Record<string, Set<string>>>({});
  const [selectedSingle, setSelectedSingle] = useState<Record<string, string>>({});
  const [qty, setQty] = useState(1);

  const emoji = productEmoji[product.id] ?? '🍴';

  const upcharge = groups.reduce((sum, g) => {
    if (g.multi) {
      const sel = selectedMulti[g.id] ?? new Set<string>();
      return sum + g.options.filter((o) => sel.has(o.id)).reduce((s, o) => s + o.price, 0);
    } else {
      const id = selectedSingle[g.id];
      const opt = g.options.find((o) => o.id === id);
      return sum + (opt?.price ?? 0);
    }
  }, 0);

  const unitPrice = product.price + upcharge;

  function toggleMulti(groupId: string, optionId: string) {
    const group = groups.find((g) => g.id === groupId);

    setSelectedMulti((prev) => {
      const cur = new Set(prev[groupId] ?? []);
      if (cur.has(optionId)) {
        cur.delete(optionId);
      } else {
        if (group?.maxSelections && cur.size >= group.maxSelections) return prev;
        cur.add(optionId);
      }
      return { ...prev, [groupId]: cur };
    });
  }

  function buildNotes(): string {
    const parts: string[] = [];
    groups.forEach((g) => {
      if (g.multi) {
        const sel = selectedMulti[g.id] ?? new Set<string>();
        g.options.filter((o) => sel.has(o.id)).forEach((o) => parts.push(o.label));
      } else {
        const id = selectedSingle[g.id];
        const opt = g.options.find((o) => o.id === id);
        if (opt) parts.push(opt.label);
      }
    });
    return parts.join(', ');
  }

  const canAdd = groups.every((g) => {
    if (!g.required) return true;
    return g.multi
      ? (selectedMulti[g.id]?.size ?? 0) > 0
      : !!selectedSingle[g.id];
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-surface border border-border rounded-2xl w-full max-w-[500px] max-h-[88vh] flex flex-col shadow-2xl animate-float-up">
        {/* Header */}
        <div className="flex items-start gap-4 p-5 border-b border-border shrink-0">
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl shrink-0"
            style={{ background: 'radial-gradient(ellipse at 50% 60%, #3a1a08 0%, #1a0a04 100%)' }}
          >
            {emoji}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-cream font-extrabold text-lg leading-tight">{product.name}</h2>
            {product.description && (
              <p className="text-muted text-xs mt-0.5 leading-relaxed">{product.description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-muted hover:text-cream text-xl leading-none shrink-0 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-card transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Options — scrollable */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {groups.map((group) => (
            <div key={group.id}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-cream font-bold text-sm uppercase tracking-wide">{group.label}</span>
                {group.required && (
                  <span className="text-[10px] font-bold text-orange uppercase tracking-wide bg-orange/10 border border-orange/30 px-1.5 py-0.5 rounded-full">
                    Required
                  </span>
                )}
                {group.multi && group.maxSelections && (
                  <span className="text-[10px] text-muted">Max {group.maxSelections}</span>
                )}
                {!group.multi && !group.required && (
                  <span className="text-[10px] text-muted">Pick one</span>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {group.options.map((opt) => {
                  const isSelected = group.multi
                    ? (selectedMulti[group.id]?.has(opt.id) ?? false)
                    : selectedSingle[group.id] === opt.id;
                  const multiCount = selectedMulti[group.id]?.size ?? 0;
                  const maxReached = group.multi && !!group.maxSelections && multiCount >= group.maxSelections;
                  const isDisabled = maxReached && !isSelected;

                  return (
                    <button
                      key={opt.id}
                      onClick={() =>
                        isDisabled
                          ? undefined
                          : group.multi
                          ? toggleMulti(group.id, opt.id)
                          : setSelectedSingle((p) => ({ ...p, [group.id]: opt.id }))
                      }
                      disabled={isDisabled}
                      className={`
                        flex items-center gap-1.5 px-4 py-2.5 rounded-xl border font-semibold text-sm
                        transition-all duration-150 active:scale-95
                        ${isSelected
                          ? 'bg-orange/20 border-orange text-orange'
                          : isDisabled
                            ? 'bg-card border-border text-muted opacity-45 cursor-not-allowed'
                          : 'bg-card border-border text-cream-dim hover:border-orange/50 hover:text-cream'
                        }
                      `}
                    >
                      {isSelected && <span className="text-orange">✓</span>}
                      <span>{opt.label}</span>
                      {opt.price > 0 && (
                        <span className={`text-xs ${isSelected ? 'text-orange' : 'text-muted'}`}>
                          +{formatPrice(opt.price)}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer — sticky */}
        <div className="p-5 border-t border-border space-y-3 shrink-0">
          {/* Quantity + unit price */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-muted text-sm">Quantity</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="w-9 h-9 rounded-xl bg-card border border-border text-cream font-bold flex items-center justify-center hover:bg-border transition-colors"
                >
                  −
                </button>
                <span className="text-cream font-extrabold text-lg w-6 text-center tabular-nums">{qty}</span>
                <button
                  onClick={() => setQty((q) => Math.min(20, q + 1))}
                  className="w-9 h-9 rounded-xl bg-card border border-border text-cream font-bold flex items-center justify-center hover:bg-border transition-colors"
                >
                  +
                </button>
              </div>
            </div>
            <div className="text-right">
              {upcharge > 0 && (
                <p className="text-muted text-xs">
                  {formatPrice(product.price)} + {formatPrice(upcharge)}
                </p>
              )}
              <p className="text-orange font-extrabold text-xl">{formatPrice(unitPrice * qty)}</p>
            </div>
          </div>

          <button
            onClick={() => { if (canAdd) { onAdd(buildNotes(), unitPrice, qty); } }}
            disabled={!canAdd}
            className={`
              w-full py-4 rounded-2xl font-extrabold text-base uppercase tracking-widest transition-all active:scale-[0.98]
              ${canAdd
                ? 'bg-orange hover:bg-orange-hover text-white shadow-[0_4px_20px_rgba(224,112,48,0.3)]'
                : 'bg-card border border-border text-muted cursor-not-allowed'
              }
            `}
          >
            {canAdd ? `Add ${qty > 1 ? `${qty}× ` : ''}to Order` : 'Select required options'}
          </button>
        </div>
      </div>
    </div>
  );
}
