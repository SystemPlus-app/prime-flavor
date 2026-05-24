'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { categories, products } from '@/data/primeFlavorMenu';
import { useOrderStore } from '@/store/orderStore';
import { formatPrice, calcTax, calcTotal } from '@/utils/pricing';
import { formatOrderId } from '@/utils/orderStatus';
import type { Product } from '@/types/product';
import type { Order, OrderItem } from '@/types/order';

// ── Types ─────────────────────────────────────────────────────────────────────

interface CartLine {
  lineId: string;
  product: Product;
  quantity: number;
}

// ── Menu image map ────────────────────────────────────────────────────────────

const IMG: Record<string, string> = {
  'bbq-picanha-skewer':       '/menu/bbq-picanha.png',
  'bbq-sausage-skewer':       '/menu/bbq-sausage.png',
  'bbq-chicken-skewer':       '/menu/bbq-chicken.avif',
  'bbq-chicken-bacon-skewer': '/menu/bbq-chicken-bacon.png',
  'queijo-coalho-skewer':     '/menu/queijo-coalho.png',
  'picanha-sandwich':         '/menu/picanha-sandwich.png',
  'picanha-cheese-bread':     '/menu/picanha-sandwich.png',
  'chicken-bacon-sandwich':   '/menu/bbq-chicken-bacon.png',
  'sausage-sandwich':         '/menu/bbq-sausage.png',
  'sausage-cheese-bread-sandwich': '/menu/bbq-sausage.png',
  'special-bbq-sandwich':     '/menu/picanha-sandwich.png',
  'bbq-picanha-plate':        '/menu/bbq-picanha-plate.png',
  'bbq-chicken-plate':        '/menu/bbq-chicken.avif',
  'bbq-chicken-bacon-plate':  '/menu/bbq-chicken-bacon-plate.avif',
  'bbq-sausage-plate':        '/menu/bbq-sausage.png',
  'prime-bbq-plate':          '/menu/bbq-picanha-plate.png',
  'cheese-bread-box':         '/menu/cheese-bread-box.png',
  'garlic-bread':             '/menu/garlic-bread.png',
  'potato-chips':             '/menu/potato-chips.avif',
  'caesar-salad':             '/menu/caesar-salad.avif',
  'guarana':                  '/menu/guarana.webp',
  'coke':                     '/menu/coke.webp',
};

// ── Confirmation screen ───────────────────────────────────────────────────────

function OrderConfirmation({ order, onReset }: { order: Order; onReset: () => void }) {
  const gold = '#c49a0a';

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      backgroundColor: '#0f0d0b', padding: 32, gap: 32,
    }}>
      {/* Check circle */}
      <div style={{ position: 'relative', width: 80, height: 80 }}>
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          backgroundColor: 'rgba(196,154,10,0.08)',
          border: `2px solid ${gold}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ color: gold, fontSize: 32 }}>✓</span>
        </div>
      </div>

      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: 12, letterSpacing: '0.25em', textTransform: 'uppercase', color: gold, fontWeight: 700, marginBottom: 8 }}>
          Order Confirmed
        </p>
        <p style={{ fontSize: 52, fontWeight: 900, color: '#f0e8d0', lineHeight: 1, fontFamily: 'var(--font-playfair, Georgia, serif)' }}>
          {formatOrderId(order.orderNumber)}
        </p>
        <p style={{ fontSize: 14, color: '#7a6a50', marginTop: 8 }}>
          🌐 Online Order — sent to kitchen
        </p>
      </div>

      <div style={{
        backgroundColor: '#171410', border: '1px solid #2a2420',
        borderRadius: 8, padding: '28px 32px', width: '100%', maxWidth: 420,
      }}>
        <p style={{ fontSize: 10, letterSpacing: '0.25em', textTransform: 'uppercase', color: '#6a5a40', marginBottom: 20, fontWeight: 700 }}>
          Order Summary
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {order.items.map((item) => (
            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#c8b888', fontSize: 14 }}>
                <span style={{ color: '#c49a0a', fontWeight: 800, marginRight: 8 }}>{item.quantity}×</span>
                {item.name}
              </span>
              <span style={{ color: '#f0e8d0', fontSize: 14, fontWeight: 600 }}>
                {formatPrice(item.price * item.quantity)}
              </span>
            </div>
          ))}
        </div>
        <div style={{ borderTop: '1px solid #2a2420', marginTop: 16, paddingTop: 16, display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#f0e8d0', fontWeight: 700 }}>Total</span>
          <span style={{ color: '#c49a0a', fontWeight: 900, fontSize: 20 }}>{formatPrice(order.total)}</span>
        </div>
      </div>

      <div style={{ textAlign: 'center', maxWidth: 360 }}>
        <p style={{ fontSize: 14, color: '#7a6a50', lineHeight: 1.7, marginBottom: 24 }}>
          Your order is heading to our kitchen now.
          Pick up at <strong style={{ color: '#c8b888' }}>360 Hampton Dr, Venice</strong>.
          Pay when you arrive.
        </p>
        <button
          onClick={onReset}
          style={{
            backgroundColor: '#c49a0a', color: '#0a0806',
            padding: '14px 36px', borderRadius: 4,
            fontWeight: 800, fontSize: 13, letterSpacing: '0.1em', textTransform: 'uppercase',
            border: 'none', cursor: 'pointer',
          }}
        >
          New Order
        </button>
      </div>
    </div>
  );
}

// ── Main order page ───────────────────────────────────────────────────────────

export default function OrderPage() {
  const { addOrder } = useOrderStore();
  const [activeCategory, setActiveCategory] = useState('featured');
  const [cart, setCart] = useState<CartLine[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [showCart, setShowCart] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);
  const [placing, setPlacing] = useState(false);

  const visibleProducts = activeCategory === 'featured'
    ? products.filter((p) => ['bbq-picanha-plate', 'bbq-picanha-skewer', 'picanha-sandwich', 'special-bbq-sandwich', 'cheese-bread-box', 'guarana'].includes(p.id))
    : products.filter((p) => p.category === activeCategory);

  const totalItems = cart.reduce((s, c) => s + c.quantity, 0);
  const subtotal = cart.reduce((s, c) => s + c.product.price * c.quantity, 0);
  const tax = calcTax(subtotal);
  const total = calcTotal(subtotal);
  const hasItems = cart.length > 0;

  function addToCart(product: Product) {
    if (!product.available) return;
    setCart((prev) => {
      const existing = prev.find((c) => c.product.id === product.id);
      if (existing) {
        return prev.map((c) => c.product.id === product.id ? { ...c, quantity: c.quantity + 1 } : c);
      }
      return [...prev, { lineId: crypto.randomUUID(), product, quantity: 1 }];
    });
  }

  function adjustQty(lineId: string, delta: number) {
    setCart((prev) =>
      prev.map((c) => c.lineId === lineId ? { ...c, quantity: c.quantity + delta } : c)
          .filter((c) => c.quantity > 0)
    );
  }

  const placeOrder = useCallback(() => {
    if (!hasItems || placing) return;
    setPlacing(true);
    const items: OrderItem[] = cart.map((c) => ({
      id: crypto.randomUUID(),
      productId: c.product.id,
      name: c.product.name,
      price: c.product.price,
      quantity: c.quantity,
    }));
    const order = addOrder(items, customerName.trim() || 'Online Guest', 'UNPAID', 'WEBSITE');
    setCart([]);
    setCustomerName('');
    setShowCart(false);
    setPlacing(false);
    setConfirmedOrder(order);
  }, [cart, customerName, hasItems, placing, addOrder]);

  const handleReset = useCallback(() => {
    setConfirmedOrder(null);
    setActiveCategory('featured');
  }, []);

  if (confirmedOrder) {
    return <OrderConfirmation order={confirmedOrder} onReset={handleReset} />;
  }

  return (
    <div style={{ backgroundColor: '#0f0d0b', minHeight: '100vh', color: '#f0e8d0' }}>

      {/* ── NAV ── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        backgroundColor: 'rgba(15,13,11,0.97)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid #2a2420',
      }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
          <Link href="/website" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 8, color: '#6a5a40', letterSpacing: '0.15em' }}>←</span>
            <div>
              <div style={{ fontSize: 15, fontWeight: 900, color: '#e07030', letterSpacing: '0.15em', textTransform: 'uppercase', lineHeight: 1 }}>Prime Flavor</div>
              <div style={{ fontSize: 8, color: '#6a5a40', letterSpacing: '0.2em', textTransform: 'uppercase', marginTop: 2 }}>Online Order</div>
            </div>
          </Link>

          {/* Cart button */}
          <button
            onClick={() => setShowCart(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              backgroundColor: hasItems ? '#c49a0a' : '#2a2420',
              color: hasItems ? '#0a0806' : '#6a5a40',
              padding: '10px 20px', borderRadius: 4, border: 'none', cursor: 'pointer',
              fontWeight: 800, fontSize: 13, transition: 'all 0.2s',
            }}
          >
            <span>🛒</span>
            {hasItems ? (
              <span>{totalItems} item{totalItems !== 1 ? 's' : ''} · {formatPrice(total)}</span>
            ) : (
              <span>Your Cart</span>
            )}
          </button>
        </div>
      </header>

      {/* ── PAGE HEADER ── */}
      <div style={{
        borderBottom: '1px solid #2a2420',
        backgroundColor: '#0c0a08',
        padding: '32px 20px',
        textAlign: 'center',
      }}>
        <h1 style={{
          fontSize: 'clamp(28px, 5vw, 44px)',
          fontFamily: 'var(--font-playfair, Georgia, serif)',
          fontWeight: 800, color: '#f0e8d0', lineHeight: 1.1, marginBottom: 8,
        }}>
          Order Online
        </h1>
        <p style={{ fontSize: 14, color: '#6a5a40' }}>
          📍 360 Hampton Dr, Venice, CA · Pickup ready
        </p>
      </div>

      {/* ── CATEGORY TABS ── */}
      <div style={{
        position: 'sticky', top: 64, zIndex: 40,
        backgroundColor: 'rgba(15,13,11,0.97)', backdropFilter: 'blur(8px)',
        borderBottom: '1px solid #2a2420',
        overflowX: 'auto',
        scrollbarWidth: 'none',
      }}>
        <div style={{ display: 'flex', gap: 0, minWidth: 'max-content', maxWidth: 1280, margin: '0 auto', padding: '0 16px' }}>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              style={{
                padding: '16px 20px',
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 12, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase',
                color: activeCategory === cat.id ? '#c49a0a' : '#6a5a40',
                borderBottom: `2px solid ${activeCategory === cat.id ? '#c49a0a' : 'transparent'}`,
                transition: 'all 0.15s', whiteSpace: 'nowrap',
              }}
              onMouseEnter={e => { if (activeCategory !== cat.id) (e.currentTarget as HTMLButtonElement).style.color = '#c8b888'; }}
              onMouseLeave={e => { if (activeCategory !== cat.id) (e.currentTarget as HTMLButtonElement).style.color = '#6a5a40'; }}
            >
              <span style={{ marginRight: 6 }}>{cat.icon}</span>
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* ── PRODUCT GRID ── */}
      <main style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 20px 120px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
          {visibleProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              qty={cart.find((c) => c.product.id === product.id)?.quantity ?? 0}
              onAdd={() => addToCart(product)}
            />
          ))}
        </div>
        {visibleProducts.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#4a3a28' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🍴</div>
            <p>No items in this category</p>
          </div>
        )}
      </main>

      {/* ── MOBILE BOTTOM BAR ── */}
      {hasItems && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
          padding: 16, backgroundColor: 'rgba(15,13,11,0.97)',
          backdropFilter: 'blur(12px)',
          borderTop: '1px solid #2a2420',
        }}>
          <button
            onClick={() => setShowCart(true)}
            className="md:hidden"
            style={{
              width: '100%', padding: '16px 24px',
              backgroundColor: '#c49a0a', color: '#0a0806',
              borderRadius: 4, border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              fontWeight: 800, fontSize: 14,
            }}
          >
            <span style={{ backgroundColor: 'rgba(0,0,0,0.12)', padding: '4px 12px', borderRadius: 20, fontSize: 12 }}>
              {totalItems} item{totalItems !== 1 ? 's' : ''}
            </span>
            <span>View Order</span>
            <span>{formatPrice(total)}</span>
          </button>
        </div>
      )}

      {/* ── CART DRAWER / OVERLAY ── */}
      {showCart && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 60, backgroundColor: 'rgba(0,0,0,0.7)' }}
            onClick={() => setShowCart(false)}
          />
          <div style={{
            position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 70,
            width: '100%', maxWidth: 440,
            backgroundColor: '#141210',
            borderLeft: '1px solid #2a2420',
            display: 'flex', flexDirection: 'column',
            boxShadow: '-20px 0 60px rgba(0,0,0,0.5)',
          }}>
            {/* Drawer header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '20px 24px', borderBottom: '1px solid #2a2420',
            }}>
              <span style={{ fontSize: 14, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#f0e8d0' }}>
                Your Order
                {hasItems && <span style={{ marginLeft: 8, backgroundColor: '#c49a0a', color: '#0a0806', fontSize: 11, fontWeight: 900, padding: '2px 8px', borderRadius: 20 }}>{totalItems}</span>}
              </span>
              <button onClick={() => setShowCart(false)} style={{ background: 'none', border: 'none', color: '#6a5a40', cursor: 'pointer', fontSize: 20, lineHeight: 1, padding: '4px 8px', borderRadius: 4 }}>
                ✕
              </button>
            </div>

            {/* Customer name */}
            <div style={{ padding: '16px 24px', borderBottom: '1px solid #1a1614' }}>
              <input
                type="text"
                placeholder="Your name for pickup (optional)"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                style={{
                  width: '100%', backgroundColor: '#0f0d0b', border: '1px solid #2a2420',
                  borderRadius: 4, padding: '12px 16px', color: '#f0e8d0', fontSize: 14,
                  outline: 'none', boxSizing: 'border-box',
                  transition: 'border-color 0.2s',
                }}
                onFocus={e => (e.currentTarget.style.borderColor = '#c49a0a')}
                onBlur={e => (e.currentTarget.style.borderColor = '#2a2420')}
              />
            </div>

            {/* Cart items */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
              {!hasItems ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12, color: '#4a3a28' }}>
                  <span style={{ fontSize: 48, opacity: 0.3 }}>🛒</span>
                  <p style={{ fontSize: 14 }}>Your cart is empty</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {cart.map((line) => (
                    <div key={line.lineId} style={{
                      backgroundColor: '#0f0d0b', border: '1px solid #2a2420',
                      borderRadius: 6, padding: '14px 16px',
                      display: 'flex', alignItems: 'center', gap: 14,
                    }}>
                      {/* Thumb */}
                      <div style={{ width: 52, height: 52, borderRadius: 4, overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
                        {IMG[line.product.id] && (
                          <Image src={IMG[line.product.id]} alt={line.product.name} fill style={{ objectFit: 'cover' }} />
                        )}
                      </div>
                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: '#f0e8d0', lineHeight: 1.3, marginBottom: 4 }}>{line.product.name}</p>
                        <p style={{ fontSize: 14, fontWeight: 800, color: '#c49a0a' }}>{formatPrice(line.product.price * line.quantity)}</p>
                      </div>
                      {/* Controls */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                        <button onClick={() => adjustQty(line.lineId, -1)} style={{ width: 28, height: 28, borderRadius: 4, border: '1px solid #3a3428', backgroundColor: '#1a1814', color: '#f0e8d0', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                        <span style={{ fontSize: 14, fontWeight: 800, color: '#f0e8d0', width: 20, textAlign: 'center' }}>{line.quantity}</span>
                        <button onClick={() => adjustQty(line.lineId, 1)} style={{ width: 28, height: 28, borderRadius: 4, border: '1px solid #3a3428', backgroundColor: '#1a1814', color: '#f0e8d0', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{ borderTop: '1px solid #2a2420', padding: '20px 24px' }}>
              {hasItems && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#6a5a40' }}>
                    <span>Subtotal</span><span>{formatPrice(subtotal)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#6a5a40' }}>
                    <span>Tax (10.25%)</span><span>{formatPrice(tax)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                    <span style={{ fontWeight: 800, color: '#f0e8d0', fontSize: 16 }}>Total</span>
                    <span style={{ fontWeight: 900, color: '#c49a0a', fontSize: 22 }}>{formatPrice(total)}</span>
                  </div>
                </div>
              )}

              <button
                onClick={placeOrder}
                disabled={!hasItems || placing}
                style={{
                  width: '100%', padding: '16px 24px',
                  backgroundColor: hasItems ? '#c49a0a' : '#2a2420',
                  color: hasItems ? '#0a0806' : '#4a3a28',
                  borderRadius: 4, border: 'none',
                  cursor: hasItems ? 'pointer' : 'not-allowed',
                  fontWeight: 900, fontSize: 14, letterSpacing: '0.08em', textTransform: 'uppercase',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={e => { if (hasItems) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#e8b520'; }}
                onMouseLeave={e => { if (hasItems) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#c49a0a'; }}
              >
                {placing ? 'Placing Order…' : hasItems ? `Place Order · ${formatPrice(total)}` : 'Add items to order'}
              </button>

              <p style={{ textAlign: 'center', fontSize: 11, color: '#4a3a28', marginTop: 12, letterSpacing: '0.04em' }}>
                Pay at pickup · 360 Hampton Dr, Venice CA
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── Product Card ──────────────────────────────────────────────────────────────

function ProductCard({ product, qty, onAdd }: { product: Product; qty: number; onAdd: () => void }) {
  const img = IMG[product.id];

  return (
    <div style={{
      backgroundColor: '#171410',
      border: `1px solid ${qty > 0 ? 'rgba(196,154,10,0.4)' : '#2a2420'}`,
      borderRadius: 6, overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
      transition: 'border-color 0.2s, transform 0.2s',
      opacity: product.available ? 1 : 0.5,
    }}
    onMouseEnter={e => { if (product.available) { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)'; } }}
    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'; }}
    >
      {/* Photo */}
      {img ? (
        <div style={{ position: 'relative', aspectRatio: '16/9', overflow: 'hidden' }}>
          <Image src={img} alt={product.name} fill style={{ objectFit: 'cover' }} />
          {qty > 0 && (
            <div style={{
              position: 'absolute', top: 10, right: 10,
              backgroundColor: '#c49a0a', color: '#0a0806',
              width: 24, height: 24, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 900,
            }}>
              {qty}
            </div>
          )}
          {product.popular && (
            <div style={{
              position: 'absolute', top: 10, left: 10,
              backgroundColor: 'rgba(224,112,48,0.9)',
              color: '#fff', padding: '3px 8px', borderRadius: 2,
              fontSize: 9, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase',
            }}>
              Popular
            </div>
          )}
        </div>
      ) : (
        <div style={{ aspectRatio: '16/9', backgroundColor: '#0f0d0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 32, opacity: 0.3 }}>🍽️</span>
        </div>
      )}

      {/* Info + action */}
      <div style={{ padding: '16px 18px 18px', display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#f0e8d0', lineHeight: 1.2, flex: 1 }}>
            {product.name}
          </h3>
          <span style={{ fontSize: 16, fontWeight: 900, color: '#e07030', flexShrink: 0 }}>
            {formatPrice(product.price)}
          </span>
        </div>

        {product.description && (
          <p style={{ fontSize: 12, color: '#6a5a40', lineHeight: 1.55 }}>{product.description}</p>
        )}

        <button
          onClick={onAdd}
          disabled={!product.available}
          style={{
            marginTop: 'auto',
            padding: '10px 16px',
            backgroundColor: qty > 0 ? 'rgba(196,154,10,0.12)' : 'rgba(196,154,10,0.08)',
            border: `1px solid ${qty > 0 ? 'rgba(196,154,10,0.5)' : 'rgba(196,154,10,0.2)'}`,
            borderRadius: 4, color: '#c49a0a',
            cursor: product.available ? 'pointer' : 'not-allowed',
            fontWeight: 700, fontSize: 12, letterSpacing: '0.06em', textTransform: 'uppercase',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => { if (product.available) { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(196,154,10,0.18)'; } }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = qty > 0 ? 'rgba(196,154,10,0.12)' : 'rgba(196,154,10,0.08)'; }}
        >
          {!product.available ? 'Unavailable' : qty > 0 ? `Add Another (+${qty} in cart)` : '+ Add to Order'}
        </button>
      </div>
    </div>
  );
}
