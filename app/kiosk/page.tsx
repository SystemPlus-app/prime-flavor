'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Product } from '@/types/product';
import type { Order, OrderItem, PaymentStatus } from '@/types/order';
import { getProductsByCategory } from '@/data/primeFlavorMenu';
import { getCustomization } from '@/data/customizations';
import { useOrderStore } from '@/store/orderStore';
import { formatPrice, calcTax, calcTotal } from '@/utils/pricing';
import { formatOrderId } from '@/utils/orderStatus';
import { KioskSidebar } from '@/components/kiosk/KioskSidebar';
import { KioskProductCard } from '@/components/kiosk/KioskProductCard';
import { CustomizationModal } from '@/components/kiosk/CustomizationModal';
import { PaymentModal } from '@/components/kiosk/PaymentModal';
import { UpsellSuggestions } from '@/components/kiosk/UpsellSuggestions';
import { StaffKioskModal } from '@/components/shared/StaffKioskModal';
import type { CustomizationGroup } from '@/data/customizations';

// ── Types ─────────────────────────────────────────────────────────────────────

interface CartItem {
  lineId: string;
  product: Product;
  quantity: number;
  notes: string;
  unitPrice: number;
}

type KioskStep = 'browsing' | 'customizing' | 'payment' | 'confirmed';

interface PendingCustomization {
  product: Product;
  groups: CustomizationGroup[];
}

const RESET_SECONDS = 30;

// ── Order confirmation ────────────────────────────────────────────────────────

function OrderConfirmation({ order, onReset }: { order: Order; onReset: () => void }) {
  const [secs, setSecs] = useState(RESET_SECONDS);
  const waitMin = useRef(Math.floor(Math.random() * 9) + 10); // 10–18 min

  useEffect(() => {
    const id = setInterval(() => {
      setSecs((s) => {
        if (s <= 1) { clearInterval(id); onReset(); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [onReset]);

  const isPaidOnline = order.paymentStatus === 'CARD';

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-base gap-7 px-8 text-center">
      {/* Animated checkmark */}
      <div className="relative flex items-center justify-center">
        <div className="absolute w-40 h-40 rounded-full bg-[#3da855]/10 animate-confirm-pulse" />
        <div className="absolute w-28 h-28 rounded-full bg-[#3da855]/10 animate-confirm-pulse" style={{ animationDelay: '0.3s' }} />
        <div className="relative w-24 h-24 rounded-full bg-[#0a3018] border-2 border-[#3da855] flex items-center justify-center shadow-[0_0_40px_rgba(61,168,85,0.3)]">
          <span className="text-[#3da855] text-4xl font-extrabold">✓</span>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-[#3da855] font-extrabold text-2xl tracking-tight">Order Placed!</p>
        <p className="text-cream font-extrabold text-6xl tracking-tighter">
          {formatOrderId(order.orderNumber)}
        </p>
        <div className="flex items-center justify-center gap-2 mt-1">
          <span className="text-cream-dim text-sm">Estimated wait:</span>
          <span className="text-orange font-bold text-sm">~{waitMin.current} min</span>
        </div>
      </div>

      {/* Order summary */}
      <div className="bg-card border border-border rounded-2xl px-8 py-5 max-w-md w-full">
        <p className="text-muted text-[10px] uppercase tracking-widest mb-4 font-bold">Order Summary</p>
        <div className="space-y-2">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between items-start gap-2">
              <div className="flex-1 min-w-0 text-left">
                <span className="text-cream-dim text-sm">
                  <span className="text-orange font-bold mr-1.5">{item.quantity}×</span>
                  {item.name}
                </span>
                {item.notes && (
                  <p className="text-muted text-xs mt-0.5 truncate">{item.notes}</p>
                )}
              </div>
              <span className="text-cream text-sm font-semibold shrink-0">
                {formatPrice(item.price * item.quantity)}
              </span>
            </div>
          ))}
        </div>
        <div className="border-t border-border mt-4 pt-4 flex justify-between items-center">
          <span className="text-cream font-bold">Total</span>
          <span className="text-orange font-extrabold text-xl">{formatPrice(order.total)}</span>
        </div>
      </div>

      <div className="space-y-3 max-w-sm">
        <p className="text-cream-dim text-sm leading-relaxed">
          {isPaidOnline
            ? 'Payment confirmed. Your order is being prepared.'
            : 'Please pay at the counter. Show your order number to staff.'}
        </p>
        <button
          onClick={onReset}
          className="px-10 py-3.5 rounded-full bg-orange hover:bg-orange-hover text-white font-extrabold text-sm uppercase tracking-widest transition-colors active:scale-95"
        >
          New Order
        </button>
        <p className="text-muted text-xs">Screen resets in {secs}s</p>
      </div>
    </div>
  );
}

// ── Cart panel ────────────────────────────────────────────────────────────────

interface CartPanelProps {
  cart: CartItem[];
  customerName: string;
  onNameChange: (v: string) => void;
  onAdjust: (lineId: string, delta: number) => void;
  onClear: () => void;
  onPlace: () => void;
  onUpsellAdd: (product: Product) => void;
}

function CartPanel({ cart, customerName, onNameChange, onAdjust, onClear, onPlace, onUpsellAdd }: CartPanelProps) {
  const subtotal = cart.reduce((s, c) => s + c.unitPrice * c.quantity, 0);
  const tax = calcTax(subtotal);
  const total = calcTotal(subtotal);
  const itemCount = cart.reduce((s, c) => s + c.quantity, 0);
  const hasItems = cart.length > 0;

  // Build CartItem shape expected by UpsellSuggestions
  const upsellCart = cart.map((c) => ({ product: c.product, quantity: c.quantity }));

  return (
    <aside className="w-[360px] shrink-0 flex flex-col bg-surface border-l border-border">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
        <div>
          <span className="text-cream font-extrabold text-base uppercase tracking-wide">Your Order</span>
          {hasItems && (
            <span className="ml-2 text-xs bg-orange text-white font-bold px-1.5 py-0.5 rounded-full">
              {itemCount}
            </span>
          )}
        </div>
        {hasItems && (
          <button
            onClick={onClear}
            className="text-muted text-xs hover:text-cream transition-colors uppercase tracking-wide"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Name */}
      <div className="px-4 pt-3 pb-1 shrink-0">
        <input
          type="text"
          placeholder="Your name (for pickup)"
          value={customerName}
          onChange={(e) => onNameChange(e.target.value)}
          className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm text-cream placeholder:text-muted outline-none focus:border-orange transition-colors"
        />
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {!hasItems && (
          <div className="h-full flex flex-col items-center justify-center gap-4 text-muted py-16">
            <span className="text-6xl opacity-30 animate-bounce" style={{ animationDuration: '2s' }}>🛒</span>
            <div className="text-center">
              <p className="text-sm font-semibold text-cream-dim">Your cart is empty</p>
              <p className="text-xs mt-1 leading-relaxed">
                Tap any item on the left to start your order
              </p>
            </div>
          </div>
        )}

        {cart.map((item) => (
          <div key={item.lineId} className="bg-card rounded-xl border border-border p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-cream text-[13px] font-semibold leading-tight">{item.product.name}</p>
                {item.notes && (
                  <p className="text-muted text-[11px] mt-0.5 leading-snug">{item.notes}</p>
                )}
                <p className="text-orange text-sm font-bold mt-0.5">
                  {formatPrice(item.unitPrice * item.quantity)}
                  {item.quantity > 1 && (
                    <span className="text-muted font-normal text-xs ml-1">
                      ({formatPrice(item.unitPrice)} each)
                    </span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => onAdjust(item.lineId, -1)}
                  className="w-8 h-8 rounded-lg bg-border hover:bg-orange hover:text-white text-cream flex items-center justify-center font-bold text-base transition-colors active:scale-95"
                >
                  −
                </button>
                <span className="text-cream font-extrabold text-base w-6 text-center tabular-nums">
                  {item.quantity}
                </span>
                <button
                  onClick={() => onAdjust(item.lineId, 1)}
                  className="w-8 h-8 rounded-lg bg-border hover:bg-orange hover:text-white text-cream flex items-center justify-center font-bold text-base transition-colors active:scale-95"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Upsell suggestions */}
      {hasItems && (
        <UpsellSuggestions cart={upsellCart} onAdd={onUpsellAdd} />
      )}

      {/* Totals + Place Order */}
      <div className="border-t border-border shrink-0">
        {hasItems && (
          <div className="px-5 py-3 space-y-1.5 border-b border-border">
            <div className="flex justify-between text-sm text-muted">
              <span>Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-muted">
              <span>Tax (10.25%)</span>
              <span>{formatPrice(tax)}</span>
            </div>
            <div className="flex justify-between items-baseline pt-1">
              <span className="text-cream font-extrabold text-base">Total</span>
              <span className="text-orange font-extrabold text-2xl tabular-nums">{formatPrice(total)}</span>
            </div>
          </div>
        )}

        <div className="p-4 space-y-2">
          <button
            onClick={onPlace}
            disabled={!hasItems}
            className={`
              w-full py-4 rounded-2xl font-extrabold text-base uppercase tracking-widest transition-all
              ${hasItems
                ? 'bg-orange hover:bg-orange-hover text-white shadow-[0_4px_24px_rgba(224,112,48,0.35)] hover:shadow-[0_4px_28px_rgba(224,112,48,0.5)] active:scale-[0.98]'
                : 'bg-card border border-border text-muted cursor-not-allowed'
              }
            `}
          >
            {hasItems ? `Place Order · ${formatPrice(total)}` : 'Add items to order'}
          </button>
          {!hasItems && (
            <p className="text-muted text-[10px] text-center leading-relaxed">
              Choose from the menu on the left
            </p>
          )}
        </div>
      </div>
    </aside>
  );
}

// ── Main kiosk page ───────────────────────────────────────────────────────────

export default function KioskPage() {
  const { addOrder } = useOrderStore();

  const [step, setStep] = useState<KioskStep>('browsing');
  const [category, setCategory] = useState('featured');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [pendingCustomization, setPendingCustomization] = useState<PendingCustomization | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const products = getProductsByCategory(category);

  useEffect(() => {
    gridRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [category]);

  // Add product — opens customization modal if needed, otherwise merges directly
  function handleProductAdd(product: Product) {
    if (!product.available) return;
    const groups = getCustomization(product.id);
    if (groups) {
      setPendingCustomization({ product, groups });
      setStep('customizing');
      return;
    }
    // No customization: merge by product id
    setCart((prev) => {
      const idx = prev.findIndex((c) => c.product.id === product.id && c.notes === '');
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], quantity: updated[idx].quantity + 1 };
        return updated;
      }
      return [...prev, {
        lineId: crypto.randomUUID(),
        product,
        quantity: 1,
        notes: '',
        unitPrice: product.price,
      }];
    });
  }

  // Called by CustomizationModal — always a new line item
  function handleCustomizationAdd(notes: string, unitPrice: number, quantity: number) {
    if (!pendingCustomization) return;
    const { product } = pendingCustomization;
    setCart((prev) => [...prev, {
      lineId: crypto.randomUUID(),
      product,
      quantity,
      notes,
      unitPrice,
    }]);
    setPendingCustomization(null);
    setStep('browsing');
  }

  function handleCustomizationClose() {
    setPendingCustomization(null);
    setStep('browsing');
  }

  function adjustQty(lineId: string, delta: number) {
    setCart((prev) => {
      const updated = prev.map((c) => {
        if (c.lineId !== lineId) return c;
        return { ...c, quantity: c.quantity + delta };
      });
      return updated.filter((c) => c.quantity > 0);
    });
  }

  function handlePlaceOrder() {
    if (cart.length === 0) return;
    setStep('payment');
  }

  function handlePaymentSelect(method: PaymentStatus) {
    const items: OrderItem[] = cart.map((c) => ({
      id: crypto.randomUUID(),
      productId: c.product.id,
      name: c.product.name,
      price: c.unitPrice,
      quantity: c.quantity,
      notes: c.notes || undefined,
    }));
    const order = addOrder(items, customerName.trim() || undefined, method);
    setConfirmedOrder(order);
    setCart([]);
    setCustomerName('');
    setStep('confirmed');
  }

  function handlePaymentBack() {
    setStep('browsing');
  }

  const handleReset = useCallback(() => {
    setConfirmedOrder(null);
    setStep('browsing');
    setCategory('featured');
  }, []);

  if (step === 'confirmed' && confirmedOrder) {
    return <OrderConfirmation order={confirmedOrder} onReset={handleReset} />;
  }

  // Cart quantity map for product card indicators (sum across all lines per product)
  const cartQty: Record<string, number> = {};
  cart.forEach((c) => {
    cartQty[c.product.id] = (cartQty[c.product.id] ?? 0) + c.quantity;
  });

  // Total for payment modal
  const subtotal = cart.reduce((s, c) => s + c.unitPrice * c.quantity, 0);
  const total = calcTotal(subtotal);

  return (
    <div className="h-screen flex overflow-hidden bg-base">
      {showStaffModal && <StaffKioskModal onClose={() => setShowStaffModal(false)} />}

      {/* Customization modal */}
      {step === 'customizing' && pendingCustomization && (
        <CustomizationModal
          product={pendingCustomization.product}
          groups={pendingCustomization.groups}
          onAdd={handleCustomizationAdd}
          onClose={handleCustomizationClose}
        />
      )}

      {/* Payment modal */}
      {step === 'payment' && (
        <PaymentModal
          total={total}
          onSelect={handlePaymentSelect}
          onBack={handlePaymentBack}
        />
      )}

      {/* Left sidebar */}
      <KioskSidebar
        active={category}
        onSelect={setCategory}
        onStaffActivate={() => setShowStaffModal(true)}
      />

      {/* Center product grid */}
      <div ref={gridRef} className="flex-1 overflow-y-auto">
        {/* Category header */}
        <div className="sticky top-0 z-10 px-6 py-4 bg-base/95 backdrop-blur-sm border-b border-border">
          <h2 className="text-cream font-extrabold text-xl tracking-tight">
            {category === 'featured' ? '⭐ Featured Items' : (
              <>
                {category.charAt(0).toUpperCase() + category.slice(1)}
                <span className="text-muted font-normal text-sm ml-2">
                  {products.length} item{products.length !== 1 ? 's' : ''}
                </span>
              </>
            )}
          </h2>
        </div>

        {/* Grid */}
        <div className="p-5">
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
            {products.map((product) => (
              <KioskProductCard
                key={product.id}
                product={product}
                onAdd={handleProductAdd}
                quantity={cartQty[product.id] ?? 0}
                featured={category === 'featured'}
              />
            ))}
          </div>
          {products.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-3 py-20 text-muted">
              <span className="text-4xl">🍴</span>
              <p className="text-sm">No items in this category</p>
            </div>
          )}
        </div>
      </div>

      {/* Right cart panel */}
      <CartPanel
        cart={cart}
        customerName={customerName}
        onNameChange={setCustomerName}
        onAdjust={adjustQty}
        onClear={() => setCart([])}
        onPlace={handlePlaceOrder}
        onUpsellAdd={handleProductAdd}
      />
    </div>
  );
}
