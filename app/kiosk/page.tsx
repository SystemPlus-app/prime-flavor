'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Product } from '@/types/product';
import type { Order, OrderItem, PaymentStatus } from '@/types/order';
import { categories, getProductsByCategory, withAvailability, withPriceOverride, withImageOverride } from '@/data/primeFlavorMenu';
import { getCustomization } from '@/data/customizations';
import { useOrderStore } from '@/store/orderStore';
import { buildFallbackOrder } from '@/lib/orderFallback';
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
const LONG_PRESS_MS = 5000;

// ── Order confirmation ────────────────────────────────────────────────────────

function OrderConfirmation({ order, onReset }: { order: Order; onReset: () => void }) {
  const [secs, setSecs] = useState(RESET_SECONDS);
  const waitMin = useRef(Math.floor(Math.random() * 9) + 10);

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
    <div className="min-h-screen flex flex-col items-center justify-center bg-base gap-6 px-6 text-center py-10">
      <div className="relative flex items-center justify-center">
        <div className="absolute w-36 h-36 rounded-full bg-[#3da855]/10 animate-confirm-pulse" />
        <div className="absolute w-24 h-24 rounded-full bg-[#3da855]/10 animate-confirm-pulse" style={{ animationDelay: '0.3s' }} />
        <div className="relative w-20 h-20 rounded-full bg-[#0a3018] border-2 border-[#3da855] flex items-center justify-center shadow-[0_0_40px_rgba(61,168,85,0.3)]">
          <span className="text-[#3da855] text-3xl font-extrabold">✓</span>
        </div>
      </div>

      <div className="space-y-1">
        <p className="text-[#3da855] font-extrabold text-xl tracking-tight">Order Placed!</p>
        <p className="text-cream font-extrabold text-5xl tracking-tighter">{formatOrderId(order.orderNumber)}</p>
        <div className="flex items-center justify-center gap-2 mt-1">
          <span className="text-cream-dim text-sm">Estimated wait:</span>
          <span className="text-orange font-bold text-sm">~{waitMin.current} min</span>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl px-6 py-4 w-full max-w-sm">
        <p className="text-muted text-[10px] uppercase tracking-widest mb-3 font-bold">Order Summary</p>
        <div className="space-y-2">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between items-start gap-2">
              <div className="flex-1 min-w-0 text-left">
                <span className="text-cream-dim text-sm">
                  <span className="text-orange font-bold mr-1.5">{item.quantity}×</span>
                  {item.name}
                </span>
                {item.notes && <p className="text-muted text-xs mt-0.5 truncate">{item.notes}</p>}
              </div>
              <span className="text-cream text-sm font-semibold shrink-0">{formatPrice(item.price * item.quantity)}</span>
            </div>
          ))}
        </div>
        <div className="border-t border-border mt-3 pt-3 flex justify-between items-center">
          <span className="text-cream font-bold">Total</span>
          <span className="text-orange font-extrabold text-xl">{formatPrice(order.total)}</span>
        </div>
      </div>

      <div className="space-y-3 max-w-xs">
        <p className="text-cream-dim text-sm leading-relaxed">
          {isPaidOnline ? 'Payment confirmed. Your order is being prepared.' : 'Please pay at the counter. Show your order number to staff.'}
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

// ── Mobile category bar ───────────────────────────────────────────────────────

function MobileCategoryBar({ active, onSelect }: { active: string; onSelect: (id: string) => void }) {
  return (
    <div
      className="flex overflow-x-auto gap-2.5 px-4 py-3.5 border-b border-border shrink-0 bg-sidebar"
      style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
    >
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onSelect(cat.id)}
          className={`flex items-center gap-2 px-5 py-3.5 rounded-2xl shrink-0 font-extrabold text-base uppercase tracking-wide transition-colors ${
            active === cat.id
              ? 'bg-orange text-white'
              : 'bg-card border border-border text-cream-dim'
          }`}
        >
          <span className="text-2xl leading-none">{cat.icon}</span>
          <span>{cat.name}</span>
        </button>
      ))}
    </div>
  );
}

// ── Desktop cart panel ────────────────────────────────────────────────────────

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
  const upsellCart = cart.map((c) => ({ product: c.product, quantity: c.quantity }));

  return (
    <aside className="w-[360px] shrink-0 flex flex-col bg-surface border-l border-border">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
        <div>
          <span className="text-cream font-extrabold text-base uppercase tracking-wide">Your Order</span>
          {hasItems && <span className="ml-2 text-xs bg-orange text-white font-bold px-1.5 py-0.5 rounded-full">{itemCount}</span>}
        </div>
        {hasItems && (
          <button onClick={onClear} className="text-muted text-xs hover:text-cream transition-colors uppercase tracking-wide">Clear all</button>
        )}
      </div>

      <div className="px-4 pt-3 pb-1 shrink-0">
        <input
          type="text"
          placeholder="Your name (for pickup)"
          value={customerName}
          onChange={(e) => onNameChange(e.target.value)}
          className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm text-cream placeholder:text-muted outline-none focus:border-orange transition-colors"
        />
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {!hasItems && (
          <div className="h-full flex flex-col items-center justify-center gap-4 text-muted py-16">
            <span className="text-6xl opacity-30 animate-bounce" style={{ animationDuration: '2s' }}>🛒</span>
            <div className="text-center">
              <p className="text-sm font-semibold text-cream-dim">Your cart is empty</p>
              <p className="text-xs mt-1 leading-relaxed">Tap any item on the left to start your order</p>
            </div>
          </div>
        )}
        {cart.map((item) => (
          <div key={item.lineId} className="bg-card rounded-xl border border-border p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-cream text-[13px] font-semibold leading-tight">{item.product.name}</p>
                {item.notes && <p className="text-muted text-[11px] mt-0.5 leading-snug">{item.notes}</p>}
                <p className="text-orange text-sm font-bold mt-0.5">
                  {formatPrice(item.unitPrice * item.quantity)}
                  {item.quantity > 1 && <span className="text-muted font-normal text-xs ml-1">({formatPrice(item.unitPrice)} each)</span>}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => onAdjust(item.lineId, -1)} className="w-8 h-8 rounded-lg bg-border hover:bg-orange hover:text-white text-cream flex items-center justify-center font-bold text-base transition-colors active:scale-95">−</button>
                <span className="text-cream font-extrabold text-base w-6 text-center tabular-nums">{item.quantity}</span>
                <button onClick={() => onAdjust(item.lineId, 1)} className="w-8 h-8 rounded-lg bg-border hover:bg-orange hover:text-white text-cream flex items-center justify-center font-bold text-base transition-colors active:scale-95">+</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {hasItems && <UpsellSuggestions cart={upsellCart} onAdd={onUpsellAdd} />}

      <div className="border-t border-border shrink-0">
        {hasItems && (
          <div className="px-5 py-3 space-y-1.5 border-b border-border">
            <div className="flex justify-between text-sm text-muted"><span>Subtotal</span><span>{formatPrice(subtotal)}</span></div>
            <div className="flex justify-between text-sm text-muted"><span>Tax (10.25%)</span><span>{formatPrice(tax)}</span></div>
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
            className={`w-full py-4 rounded-2xl font-extrabold text-base uppercase tracking-widest transition-all ${
              hasItems
                ? 'bg-orange hover:bg-orange-hover text-white shadow-[0_4px_24px_rgba(224,112,48,0.35)] active:scale-[0.98]'
                : 'bg-card border border-border text-muted cursor-not-allowed'
            }`}
          >
            {hasItems ? `Place Order · ${formatPrice(total)}` : 'Add items to order'}
          </button>
        </div>
      </div>
    </aside>
  );
}

// ── Mobile cart drawer ────────────────────────────────────────────────────────

interface MobileCartDrawerProps extends CartPanelProps {
  show: boolean;
  onClose: () => void;
}

function MobileCartDrawer({ cart, show, customerName, onNameChange, onAdjust, onClear, onPlace, onClose, onUpsellAdd }: MobileCartDrawerProps) {
  const subtotal = cart.reduce((s, c) => s + c.unitPrice * c.quantity, 0);
  const tax = calcTax(subtotal);
  const total = calcTotal(subtotal);
  const itemCount = cart.reduce((s, c) => s + c.quantity, 0);
  const hasItems = cart.length > 0;
  const upsellCart = cart.map((c) => ({ product: c.product, quantity: c.quantity }));

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/60 transition-opacity duration-300 ${show ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      {/* Sheet */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 bg-surface border-t border-border rounded-t-2xl transition-transform duration-300 ease-out flex flex-col`}
        style={{ maxHeight: '85vh', transform: show ? 'translateY(0)' : 'translateY(100%)' }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border shrink-0">
          <div>
            <span className="text-cream font-extrabold text-base uppercase tracking-wide">Your Order</span>
            {hasItems && <span className="ml-2 text-xs bg-orange text-white font-bold px-1.5 py-0.5 rounded-full">{itemCount}</span>}
          </div>
          <div className="flex items-center gap-3">
            {hasItems && <button onClick={onClear} className="text-muted text-xs hover:text-cream uppercase tracking-wide">Clear all</button>}
            <button onClick={onClose} className="text-muted hover:text-cream text-xl w-8 h-8 flex items-center justify-center rounded-lg hover:bg-card transition-colors">✕</button>
          </div>
        </div>

        {/* Name input */}
        <div className="px-4 pt-3 pb-1 shrink-0">
          <input
            type="text"
            placeholder="Your name (for pickup)"
            value={customerName}
            onChange={(e) => onNameChange(e.target.value)}
            className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm text-cream placeholder:text-muted outline-none focus:border-orange transition-colors"
          />
        </div>

        {/* Items (scrollable) */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 min-h-0">
          {!hasItems && (
            <div className="flex flex-col items-center justify-center gap-3 py-10 text-muted">
              <span className="text-5xl opacity-30">🛒</span>
              <p className="text-sm font-semibold text-cream-dim">Your cart is empty</p>
            </div>
          )}
          {cart.map((item) => (
            <div key={item.lineId} className="bg-card rounded-xl border border-border p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-cream text-[13px] font-semibold leading-tight">{item.product.name}</p>
                  {item.notes && <p className="text-muted text-[11px] mt-0.5 leading-snug">{item.notes}</p>}
                  <p className="text-orange text-sm font-bold mt-0.5">
                    {formatPrice(item.unitPrice * item.quantity)}
                    {item.quantity > 1 && <span className="text-muted font-normal text-xs ml-1">({formatPrice(item.unitPrice)} ea)</span>}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => onAdjust(item.lineId, -1)} className="w-8 h-8 rounded-lg bg-border hover:bg-orange hover:text-white text-cream flex items-center justify-center font-bold active:scale-95 transition-colors">−</button>
                  <span className="text-cream font-extrabold text-base w-6 text-center tabular-nums">{item.quantity}</span>
                  <button onClick={() => onAdjust(item.lineId, 1)} className="w-8 h-8 rounded-lg bg-border hover:bg-orange hover:text-white text-cream flex items-center justify-center font-bold active:scale-95 transition-colors">+</button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Upsell */}
        {hasItems && <UpsellSuggestions cart={upsellCart} onAdd={onUpsellAdd} />}

        {/* Footer */}
        <div className="border-t border-border shrink-0">
          {hasItems && (
            <div className="px-5 py-3 space-y-1 border-b border-border">
              <div className="flex justify-between text-sm text-muted"><span>Subtotal</span><span>{formatPrice(subtotal)}</span></div>
              <div className="flex justify-between text-sm text-muted"><span>Tax (10.25%)</span><span>{formatPrice(tax)}</span></div>
              <div className="flex justify-between items-baseline pt-1">
                <span className="text-cream font-extrabold">Total</span>
                <span className="text-orange font-extrabold text-xl tabular-nums">{formatPrice(total)}</span>
              </div>
            </div>
          )}
          <div className="p-4">
            <button
              onClick={onPlace}
              disabled={!hasItems}
              className={`w-full py-4 rounded-2xl font-extrabold text-sm uppercase tracking-widest transition-all ${
                hasItems
                  ? 'bg-orange hover:bg-orange-hover text-white shadow-[0_4px_24px_rgba(224,112,48,0.35)] active:scale-[0.98]'
                  : 'bg-card border border-border text-muted cursor-not-allowed'
              }`}
            >
              {hasItems ? `Place Order · ${formatPrice(total)}` : 'Add items to order'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Main kiosk page ───────────────────────────────────────────────────────────

export default function KioskPage() {
  const { addOrder, availability, visibility, priceOverrides, imageOverrides, customProducts } = useOrderStore();

  const [step, setStep] = useState<KioskStep>('browsing');
  const [category, setCategory] = useState('featured');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);
  const [paymentReferenceId, setPaymentReferenceId] = useState('');
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [showMobileCart, setShowMobileCart] = useState(false);
  const [pendingCustomization, setPendingCustomization] = useState<PendingCustomization | null>(null);

  // Long-press for mobile header logo
  const mobilePressRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [mobilePressing, setMobilePressing] = useState(false);

  const desktopGridRef = useRef<HTMLDivElement>(null);
  const mobileGridRef = useRef<HTMLDivElement>(null);

  // Swipe-to-change-category and scroll-to-end auto-advance (mobile/portrait grid only)
  const categoryIds = categories.map((c) => c.id);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const autoAdvancingRef = useRef(false);

  function goToAdjacentCategory(direction: 1 | -1) {
    const idx = categoryIds.indexOf(category);
    const nextIdx = idx + direction;
    if (nextIdx >= 0 && nextIdx < categoryIds.length) setCategory(categoryIds[nextIdx]);
  }

  function handleMobileTouchStart(e: React.TouchEvent) {
    const t = e.touches[0];
    touchStartRef.current = { x: t.clientX, y: t.clientY };
  }

  function handleMobileTouchEnd(e: React.TouchEvent) {
    const start = touchStartRef.current;
    touchStartRef.current = null;
    if (!start) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    const SWIPE_THRESHOLD = 60;
    if (Math.abs(dx) > SWIPE_THRESHOLD && Math.abs(dx) > Math.abs(dy) * 1.5) {
      goToAdjacentCategory(dx < 0 ? 1 : -1);
    }
  }

  function handleMobileScroll(e: React.UIEvent<HTMLDivElement>) {
    const el = e.currentTarget;
    const scrollable = el.scrollHeight - el.clientHeight;
    if (scrollable < 80 || autoAdvancingRef.current) return;
    const distanceFromBottom = scrollable - el.scrollTop;
    if (distanceFromBottom < 40) {
      const idx = categoryIds.indexOf(category);
      if (idx < categoryIds.length - 1) {
        autoAdvancingRef.current = true;
        setCategory(categoryIds[idx + 1]);
      }
    }
  }

  const customForCategory = category === 'featured'
    ? customProducts.filter((p) => p.popular)
    : customProducts.filter((p) => p.category === category);
  const products = withImageOverride(
    withPriceOverride(withAvailability([...getProductsByCategory(category), ...customForCategory], availability), priceOverrides),
    imageOverrides,
  ).filter((p) => visibility[p.id] !== false);

  useEffect(() => {
    desktopGridRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    mobileGridRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    const timer = setTimeout(() => { autoAdvancingRef.current = false; }, 500);
    return () => clearTimeout(timer);
  }, [category]);

  // Close mobile cart when a modal opens
  useEffect(() => {
    if (step === 'payment' || step === 'customizing') setShowMobileCart(false);
  }, [step]);

  function startMobilePress() {
    setMobilePressing(true);
    mobilePressRef.current = setTimeout(() => {
      setMobilePressing(false);
      setShowStaffModal(true);
    }, LONG_PRESS_MS);
  }

  function cancelMobilePress() {
    setMobilePressing(false);
    if (mobilePressRef.current) { clearTimeout(mobilePressRef.current); mobilePressRef.current = null; }
  }

  function handleProductAdd(product: Product) {
    if (!product.available) return;
    const groups = getCustomization(product.id);
    if (groups) {
      setPendingCustomization({ product, groups });
      setStep('customizing');
      return;
    }
    setCart((prev) => {
      const idx = prev.findIndex((c) => c.product.id === product.id && c.notes === '');
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], quantity: updated[idx].quantity + 1 };
        return updated;
      }
      return [...prev, { lineId: crypto.randomUUID(), product, quantity: 1, notes: '', unitPrice: product.price }];
    });
  }

  function handleCustomizationAdd(notes: string, unitPrice: number, quantity: number) {
    if (!pendingCustomization) return;
    const { product } = pendingCustomization;
    setCart((prev) => [...prev, { lineId: crypto.randomUUID(), product, quantity, notes, unitPrice }]);
    setPendingCustomization(null);
    setStep('browsing');
  }

  function handleCustomizationClose() {
    setPendingCustomization(null);
    setStep('browsing');
  }

  function adjustQty(lineId: string, delta: number) {
    setCart((prev) =>
      prev.map((c) => c.lineId !== lineId ? c : { ...c, quantity: c.quantity + delta }).filter((c) => c.quantity > 0)
    );
  }

  function handlePlaceOrder() {
    if (cart.length === 0) return;
    setPaymentReferenceId(`kiosk-${Date.now()}`);
    setStep('payment');
  }

  async function handlePaymentSelect(method: PaymentStatus) {
    const items: OrderItem[] = cart.map((c) => ({
      id: crypto.randomUUID(),
      productId: c.product.id,
      name: c.product.name,
      price: c.unitPrice,
      quantity: c.quantity,
      notes: c.notes || undefined,
    }));
    try {
      const order = await addOrder(items, customerName.trim() || undefined, method);
      setConfirmedOrder(order);
    } catch (err) {
      // Payment may already be charged (CARD) — never strand the customer without
      // a confirmation screen just because the order failed to save to the kitchen.
      console.error('Failed to save order — showing local confirmation as fallback', err);
      const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
      setConfirmedOrder(buildFallbackOrder({
        items,
        customerName,
        paymentStatus: method,
        source: 'KIOSK',
        subtotal,
        tax: calcTax(subtotal),
        total: calcTotal(subtotal),
      }));
    }
    setCart([]);
    setCustomerName('');
    setStep('confirmed');
  }

  const handleReset = useCallback(() => {
    setConfirmedOrder(null);
    setStep('browsing');
    setCategory('featured');
  }, []);

  if (step === 'confirmed' && confirmedOrder) {
    return <OrderConfirmation order={confirmedOrder} onReset={handleReset} />;
  }

  const cartQty: Record<string, number> = {};
  cart.forEach((c) => { cartQty[c.product.id] = (cartQty[c.product.id] ?? 0) + c.quantity; });

  const subtotal = cart.reduce((s, c) => s + c.unitPrice * c.quantity, 0);
  const total = calcTotal(subtotal);
  const itemCount = cart.reduce((s, c) => s + c.quantity, 0);
  const hasItems = cart.length > 0;

  const categoryLabel = category === 'featured'
    ? '⭐ Featured Items'
    : category.charAt(0).toUpperCase() + category.slice(1);

  return (
    <div className="h-screen overflow-hidden bg-base">
      {/* Shared overlays */}
      {showStaffModal && <StaffKioskModal onClose={() => setShowStaffModal(false)} />}

      {step === 'customizing' && pendingCustomization && (
        <CustomizationModal
          product={pendingCustomization.product}
          groups={pendingCustomization.groups}
          onAdd={handleCustomizationAdd}
          onClose={handleCustomizationClose}
        />
      )}

      {step === 'payment' && (
        <PaymentModal
          total={total}
          referenceId={paymentReferenceId}
          onSelect={handlePaymentSelect}
          onBack={() => setStep('browsing')}
        />
      )}

      {/* ── MOBILE layout (hidden on lg+) ─────────────────────────────────── */}
      <div className="flex flex-col h-full lg:hidden">
        {/* Mobile header */}
        <header className="flex items-center justify-between px-4 py-3 bg-sidebar border-b border-border shrink-0">
          <div
            onMouseDown={startMobilePress}
            onMouseUp={cancelMobilePress}
            onMouseLeave={cancelMobilePress}
            onTouchStart={startMobilePress}
            onTouchEnd={cancelMobilePress}
            onTouchCancel={cancelMobilePress}
            aria-hidden="true"
            className={`select-none cursor-default transition-opacity duration-300 ${mobilePressing ? 'opacity-40' : 'opacity-100'}`}
          >
            <span className="text-orange font-extrabold text-sm tracking-widest uppercase leading-none">Prime Flavor</span>
            <span className="text-muted text-[9px] tracking-widest uppercase block mt-0.5">Brazilian BBQ · Venice Beach</span>
          </div>

          <button
            onClick={() => setShowMobileCart(true)}
            className="relative w-11 h-11 rounded-xl bg-card border border-border flex items-center justify-center active:scale-95 transition-transform"
          >
            <span className="text-xl">🛒</span>
            {hasItems && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-orange text-white text-[10px] font-extrabold flex items-center justify-center shadow-lg">
                {itemCount > 9 ? '9+' : itemCount}
              </span>
            )}
          </button>
        </header>

        {/* Category horizontal scroll */}
        <MobileCategoryBar active={category} onSelect={setCategory} />

        {/* Product grid */}
        <div
          ref={mobileGridRef}
          className="flex-1 overflow-y-auto"
          onTouchStart={handleMobileTouchStart}
          onTouchEnd={handleMobileTouchEnd}
          onScroll={handleMobileScroll}
        >
          <div className="p-3 grid grid-cols-2 gap-3">
            {products.map((product) => (
              <KioskProductCard
                key={product.id}
                product={product}
                onAdd={handleProductAdd}
                quantity={cartQty[product.id] ?? 0}
                featured={false}
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

        {/* Mobile bottom bar — shown when cart has items */}
        <div className={`shrink-0 p-3 border-t border-border bg-surface transition-all duration-300 ${hasItems ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'}`}>
          <button
            onClick={() => setShowMobileCart(true)}
            className="w-full py-3.5 rounded-2xl bg-orange text-white font-extrabold text-sm uppercase tracking-wide flex items-center justify-between px-5 active:scale-[0.98] transition-transform shadow-[0_4px_20px_rgba(224,112,48,0.4)]"
          >
            <span className="bg-white/20 px-2.5 py-1 rounded-lg text-xs font-extrabold">
              {itemCount} item{itemCount !== 1 ? 's' : ''}
            </span>
            <span>View Order</span>
            <span className="font-mono">{formatPrice(total)}</span>
          </button>
        </div>

        {/* Mobile cart drawer */}
        <MobileCartDrawer
          cart={cart}
          show={showMobileCart}
          customerName={customerName}
          onNameChange={setCustomerName}
          onAdjust={adjustQty}
          onClear={() => setCart([])}
          onPlace={() => { setShowMobileCart(false); setTimeout(handlePlaceOrder, 300); }}
          onClose={() => setShowMobileCart(false)}
          onUpsellAdd={handleProductAdd}
        />
      </div>

      {/* ── DESKTOP layout (hidden below lg) ──────────────────────────────── */}
      <div className="hidden lg:flex h-full">
        <KioskSidebar
          active={category}
          onSelect={setCategory}
          onStaffActivate={() => setShowStaffModal(true)}
        />

        <div ref={desktopGridRef} className="flex-1 overflow-y-auto" onScroll={handleMobileScroll}>
          <div className="sticky top-0 z-10 px-6 py-4 bg-base/95 backdrop-blur-sm border-b border-border">
            <h2 className="text-cream font-extrabold text-xl tracking-tight">
              {categoryLabel}
              {category !== 'featured' && (
                <span className="text-muted font-normal text-sm ml-2">
                  {products.length} item{products.length !== 1 ? 's' : ''}
                </span>
              )}
            </h2>
          </div>

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
    </div>
  );
}
