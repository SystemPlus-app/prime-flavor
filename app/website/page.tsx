'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

// ── Data ──────────────────────────────────────────────────────────────────────

const FEATURED = [
  {
    id: 'bbq-picanha-plate',
    name: 'BBQ Picanha Plate',
    desc: 'Prime picanha with rice, beans & chimichurri',
    price: '$23',
    image: '/menu/bbq-picanha-plate.png',
    tag: 'Most Popular',
  },
  {
    id: 'bbq-picanha-skewer',
    name: 'BBQ Picanha Skewer',
    desc: 'Premium picanha grilled over open flame',
    price: '$13',
    image: '/menu/bbq-picanha.png',
    tag: 'Signature',
  },
  {
    id: 'picanha-sandwich',
    name: 'Picanha Sandwich',
    desc: 'Sliced picanha in artisan bread with signature sauce',
    price: '$25',
    image: '/menu/picanha-sandwich.png',
    tag: 'Fan Favorite',
  },
  {
    id: 'cheese-bread-box',
    name: 'Cheese Bread Box',
    desc: '6 warm pão de queijo, fresh from the oven',
    price: '$8',
    image: '/menu/cheese-bread-box.png',
    tag: 'Brazilian Classic',
  },
  {
    id: 'garlic-bread',
    name: 'Garlic Bread',
    desc: 'Toasted with herb garlic butter',
    price: '$8',
    image: '/menu/garlic-bread.png',
    tag: 'Side',
  },
  {
    id: 'bbq-chicken-bacon',
    name: 'BBQ Chicken Bacon',
    desc: 'Juicy chicken wrapped in crispy bacon, flame-kissed',
    price: '$8',
    image: '/menu/bbq-chicken-bacon.png',
    tag: 'Skewer',
  },
];

const TESTIMONIALS = [
  {
    name: 'Maria S.',
    location: 'Venice Beach',
    rating: 5,
    text: 'The picanha is absolutely incredible. Best Brazilian BBQ I\'ve had outside of Brazil. The cheese bread alone is worth the trip!',
  },
  {
    name: 'James K.',
    location: 'Santa Monica',
    rating: 5,
    text: 'Perfect lunch spot near the beach. Fresh, flavorful, and the online ordering made pickup super easy. Will definitely be back every week.',
  },
  {
    name: 'Sarah L.',
    location: 'Culver City',
    rating: 5,
    text: 'We ordered catering for our office event and everyone was blown away. Authentic Brazilian BBQ that transported us straight to São Paulo.',
  },
];

const CATERING_PACKAGES = [
  {
    name: 'Silver Combo',
    price: '$65 per person',
    minimum: 'Minimum 30 people',
    summary: 'Buffet-style Brazilian BBQ with picanha, sausage, chicken, rice, vinaigrette, farofa, and salad.',
    details: ['Children under 10 eat free', 'Straightforward buffet setup'],
  },
  {
    name: 'Gold Combo',
    price: 'From $90 per person',
    minimum: 'Minimum 15 people',
    summary: 'Full churrasco spread with meats, sides, sauces, appetizers, grilled vegetables, feijoada, and table decoration.',
    details: ['3.5 hours of service', 'Children under 10 eat free'],
  },
  {
    name: 'Feijoada Station',
    price: '$35 per person',
    minimum: 'Minimum 30 people',
    summary: 'Rice, feijoada, fried plantains, collard greens, orange slices, farofa, garlic bread, and cheese bread.',
    details: ['Great add-on station', 'Classic Brazilian comfort food'],
  },
  {
    name: 'Charcuterie Box',
    price: '$230 - $300',
    minimum: 'Serves 8 to 15 people',
    summary: 'Small box serves 8 to 10 people for $230. Large box serves 15 people for $300.',
    details: ['Ideal for grazing tables', 'Works well with BBQ service'],
  },
];

const GOLD_COMBO_PRICING = [
  ['15 Guests', '$150 per person'],
  ['20 Guests', '$120 per person'],
  ['25 Guests', '$110 per person'],
  ['30+ Guests', '$90 per person'],
];

// ── Helpers ───────────────────────────────────────────────────────────────────

const S = {
  gold: '#c49a0a' as const,
  goldLight: '#e8b520' as const,
  siteBg: '#0f0d0b' as const,
  siteSurface: '#171410' as const,
  siteDeep: '#0a0806' as const,
  siteBorder: '#2a2420' as const,
  siteText: '#f0e8d0' as const,
  siteDim: '#9a8a70' as const,
  siteMuted: '#6a5a40' as const,
  orange: '#e07030' as const,
};

const displayFont = 'var(--font-playfair, Georgia, "Times New Roman", serif)';

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <div style={{ flex: 1, height: 1, backgroundColor: S.siteBorder }} />
      <span style={{
        fontSize: 10, letterSpacing: '0.35em', textTransform: 'uppercase' as const,
        color: S.gold, fontWeight: 700, whiteSpace: 'nowrap' as const,
      }}>
        {children}
      </span>
      <div style={{ flex: 1, height: 1, backgroundColor: S.siteBorder }} />
    </div>
  );
}

function SectionLabelLeft({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
      <div style={{ width: 40, height: 1, backgroundColor: S.gold }} />
      <span style={{
        fontSize: 10, letterSpacing: '0.35em', textTransform: 'uppercase' as const,
        color: S.gold, fontWeight: 700,
      }}>
        {children}
      </span>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function WebsitePage() {
  const [navScrolled, setNavScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 80);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Lock/unlock body scroll when mobile menu opens
  useEffect(() => {
    if (mobileMenuOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);

  return (
    <div style={{ backgroundColor: S.siteBg, color: S.siteText, minHeight: '100vh' }}>

      {/* ── NAVIGATION ──────────────────────────────────────────────────── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        transition: 'background 0.4s, border-color 0.4s, backdrop-filter 0.4s',
        backgroundColor: navScrolled ? 'rgba(15,13,11,0.96)' : 'transparent',
        backdropFilter: navScrolled ? 'blur(16px)' : 'none',
        borderBottom: `1px solid ${navScrolled ? 'rgba(196,154,10,0.15)' : 'transparent'}`,
      }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 72 }}>
          {/* Logo */}
          <Link href="/website" style={{ textDecoration: 'none' }}>
            <div>
              <div style={{ fontSize: 17, fontWeight: 900, color: S.orange, letterSpacing: '0.18em', textTransform: 'uppercase', lineHeight: 1 }}>
                Prime Flavor
              </div>
              <div style={{ fontSize: 8, color: S.siteMuted, letterSpacing: '0.3em', textTransform: 'uppercase', marginTop: 3 }}>
                Brazilian BBQ · Venice
              </div>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 40 }}>
            <div className="hidden md:flex" style={{ gap: 28, fontSize: 12, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              {[['Story', '#story'], ['Menu', '#menu'], ['Catering', '#catering'], ['Gallery', '#gallery'], ['Location', '#location']].map(([label, href]) => (
                <a
                  key={label}
                  href={href}
                  style={{ color: '#c8b898', textDecoration: 'none', transition: 'color 0.2s' }}
                  onMouseEnter={e => (e.currentTarget.style.color = S.gold)}
                  onMouseLeave={e => (e.currentTarget.style.color = '#c8b898')}
                >
                  {label}
                </a>
              ))}
            </div>

            <Link
              href="/order"
              className="hidden md:inline-flex"
              style={{
                backgroundColor: S.gold, color: '#0f0d0b',
                padding: '10px 24px', borderRadius: 3,
                fontWeight: 800, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase',
                textDecoration: 'none', transition: 'background 0.2s',
              }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = S.goldLight)}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = S.gold)}
            >
              Order Online
            </Link>

            {/* Mobile hamburger */}
            <button
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{
                background: 'none', border: '1px solid rgba(196,154,10,0.3)',
                borderRadius: 4, padding: '8px 12px', cursor: 'pointer', color: S.gold,
                fontSize: 13, fontWeight: 700, letterSpacing: '0.05em',
              }}
            >
              {mobileMenuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 90,
          backgroundColor: 'rgba(10,8,6,0.97)',
          backdropFilter: 'blur(12px)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 32,
        }}>
          {[['Story', '#story'], ['Menu', '#menu'], ['Catering', '#catering'], ['Gallery', '#gallery'], ['Location', '#location']].map(([label, href]) => (
            <a
              key={label}
              href={href}
              onClick={() => setMobileMenuOpen(false)}
              style={{
                color: S.siteText, textDecoration: 'none',
                fontSize: 32, fontFamily: displayFont, fontWeight: 700,
                letterSpacing: '0.02em', transition: 'color 0.2s',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = S.gold)}
              onMouseLeave={e => (e.currentTarget.style.color = S.siteText)}
            >
              {label}
            </a>
          ))}
          <Link
            href="/order"
            onClick={() => setMobileMenuOpen(false)}
            style={{
              backgroundColor: S.gold, color: '#0f0d0b',
              padding: '16px 48px', borderRadius: 4,
              fontWeight: 800, fontSize: 14, letterSpacing: '0.1em', textTransform: 'uppercase',
              textDecoration: 'none', marginTop: 16,
            }}
          >
            Order Online
          </Link>
        </div>
      )}

      {/* ── HERO ────────────────────────────────────────────────────────── */}
      <section
        id="home"
        style={{ position: 'relative', height: '100vh', minHeight: 600, display: 'flex', alignItems: 'center', overflow: 'hidden' }}
      >
        {/* BG image */}
        <div style={{ position: 'absolute', inset: 0 }}>
          <Image
            src="/site/site-picanha-grill.png"
            alt="Prime Flavor BBQ — picanha steaks on the grill"
            fill
            style={{ objectFit: 'cover', objectPosition: 'center 35%' }}
            priority
          />
          {/* Main gradient overlay */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(110deg, rgba(15,13,11,0.97) 0%, rgba(15,13,11,0.82) 45%, rgba(15,13,11,0.25) 100%)',
          }} />
          {/* Bottom fade */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: 240,
            background: 'linear-gradient(to top, #0f0d0b, transparent)',
          }} />
        </div>

        {/* Content */}
        <div style={{ position: 'relative', zIndex: 10, maxWidth: 1280, margin: '0 auto', padding: '0 24px 0', width: '100%', paddingTop: 80 }}>
          <div style={{ maxWidth: 660 }}>
            {/* Location badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
              <div style={{ width: 36, height: 1, backgroundColor: S.gold }} />
              <span style={{ fontSize: 10, letterSpacing: '0.4em', textTransform: 'uppercase', color: S.gold, fontWeight: 700 }}>
                Venice Beach · California
              </span>
            </div>

            {/* Headline */}
            <h1 style={{
              fontSize: 'clamp(54px, 9vw, 104px)',
              fontFamily: displayFont,
              fontWeight: 900,
              lineHeight: 0.88,
              color: S.siteText,
              marginBottom: 28,
              letterSpacing: '-0.01em',
            }}>
              Authentic<br />
              <em style={{ fontStyle: 'italic', color: S.gold }}>Brazilian</em><br />
              BBQ
            </h1>

            {/* Subheadline */}
            <p style={{ fontSize: 18, lineHeight: 1.75, color: '#b8a880', maxWidth: 500, marginBottom: 44 }}>
              Premium Brazilian BBQ experience with online ordering,
              catering, and authentic fire-grilled flavor.
            </p>

            {/* CTAs */}
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <Link
                href="/order"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  backgroundColor: S.gold, color: '#0f0d0b',
                  padding: '17px 40px', borderRadius: 3,
                  fontWeight: 800, fontSize: 13, letterSpacing: '0.12em', textTransform: 'uppercase',
                  textDecoration: 'none', transition: 'background 0.2s',
                }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = S.goldLight)}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = S.gold)}
              >
                Order Online
              </Link>
              <a
                href="#menu"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  border: '1px solid rgba(240,232,208,0.25)',
                  color: S.siteText,
                  padding: '17px 40px', borderRadius: 3,
                  fontWeight: 700, fontSize: 13, letterSpacing: '0.12em', textTransform: 'uppercase',
                  textDecoration: 'none', transition: 'border-color 0.2s, color 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(196,154,10,0.6)'; e.currentTarget.style.color = S.gold; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(240,232,208,0.25)'; e.currentTarget.style.color = S.siteText; }}
              >
                View Menu
              </a>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div style={{
          position: 'absolute', bottom: 40, left: '50%', transform: 'translateX(-50%)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
          opacity: 0.5,
        }}>
          <div style={{ width: 1, height: 50, background: `linear-gradient(to bottom, transparent, ${S.gold})` }} />
          <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: S.gold }} />
        </div>
      </section>

      {/* ── STATS BAR ───────────────────────────────────────────────────── */}
      <section style={{ backgroundColor: '#0c0a08', borderTop: `1px solid ${S.siteBorder}`, borderBottom: `1px solid ${S.siteBorder}` }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)' }}>
            {[
              { icon: '🔥', value: '100%', label: 'Fire-Grilled Meats' },
              { icon: '📍', value: 'Venice', label: 'Beach, California' },
              { icon: '⏰', value: 'Open', label: 'Daily — 11am to 9pm' },
            ].map((stat, i) => (
              <div key={i} style={{
                padding: '36px 24px',
                borderRight: i < 2 ? `1px solid ${S.siteBorder}` : 'none',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, textAlign: 'center',
              }}>
                <span style={{ fontSize: 28, lineHeight: 1, marginBottom: 4 }}>{stat.icon}</span>
                <span style={{ fontSize: 30, fontWeight: 900, color: S.gold, fontFamily: displayFont, lineHeight: 1 }}>{stat.value}</span>
                <span style={{ fontSize: 11, color: S.siteMuted, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BRAND STORY ─────────────────────────────────────────────────── */}
      <section id="story" style={{ padding: '100px 0' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
          <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 72, alignItems: 'center' }}>

            {/* Photo */}
            <div style={{ position: 'relative', borderRadius: 6, overflow: 'hidden', aspectRatio: '4/5' }}>
              <Image
                src="/site/site-chef-grill.png"
                alt="Chef working the Prime Flavor grill"
                fill
                style={{ objectFit: 'cover' }}
              />
              <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(to top, rgba(15,13,11,0.85) 0%, rgba(15,13,11,0.1) 55%)',
              }} />
              <div style={{
                position: 'absolute', bottom: 24, left: 24,
                backgroundColor: 'rgba(196,154,10,0.92)', color: '#0f0d0b',
                padding: '8px 18px', borderRadius: 3,
                fontSize: 10, fontWeight: 900, letterSpacing: '0.15em', textTransform: 'uppercase',
              }}>
                Fire-Grilled Daily
              </div>
            </div>

            {/* Text */}
            <div>
              <SectionLabelLeft>Our Story</SectionLabelLeft>

              <h2 style={{
                fontSize: 'clamp(38px, 4.5vw, 58px)',
                fontFamily: displayFont,
                fontWeight: 800, lineHeight: 1.02, color: S.siteText, marginBottom: 24,
              }}>
                Born in Brazil,<br />
                <em style={{ color: S.gold, fontStyle: 'italic' }}>Raised in Venice</em>
              </h2>

              <p style={{ fontSize: 17, lineHeight: 1.82, color: S.siteDim, marginBottom: 20 }}>
                Prime Flavor was born from a deep love for authentic Brazilian churrasco —
                the kind you find at family gatherings in São Paulo, where the fire never
                goes out and the meat speaks for itself.
              </p>

              <p style={{ fontSize: 17, lineHeight: 1.82, color: S.siteDim, marginBottom: 36 }}>
                We brought that tradition to Venice Beach, California. Fire-grilled picanha,
                house-made pão de queijo, and bold Brazilian flavors that warm the soul.
                Every plate is made with pride, every skewer kissed by flame.
              </p>

              <div style={{ display: 'flex', gap: 40, flexWrap: 'wrap' }}>
                {[
                  { number: '5+', label: 'Years in Venice' },
                  { number: '100%', label: 'Fire-Grilled' },
                  { number: '★ 4.9', label: 'Guest Rating' },
                ].map((stat) => (
                  <div key={stat.number}>
                    <div style={{ fontSize: 30, fontWeight: 900, color: S.orange, fontFamily: displayFont, lineHeight: 1 }}>{stat.number}</div>
                    <div style={{ fontSize: 10, color: S.siteMuted, textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 4 }}>{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURED MENU ───────────────────────────────────────────────── */}
      <section id="menu" style={{ padding: '100px 0', backgroundColor: S.siteDeep }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>

          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <SectionLabel>Fire &amp; Flavor</SectionLabel>
            <h2 style={{
              fontSize: 'clamp(38px, 5vw, 58px)',
              fontFamily: displayFont,
              fontWeight: 800, color: S.siteText, lineHeight: 1.05, marginTop: 16,
            }}>
              Featured Menu
            </h2>
            <p style={{ fontSize: 17, color: S.siteMuted, marginTop: 12 }}>
              Grilled fresh, served bold. Taste the best of Brazilian BBQ.
            </p>
          </div>

          {/* Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
            {FEATURED.map((item) => (
              <MenuCard key={item.id} item={item} />
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: 52 }}>
            <Link
              href="/order"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                border: `1px solid rgba(196,154,10,0.4)`,
                color: S.gold, padding: '14px 36px', borderRadius: 3,
                fontWeight: 700, fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase',
                textDecoration: 'none', transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(196,154,10,0.08)'; e.currentTarget.style.borderColor = S.gold; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.borderColor = 'rgba(196,154,10,0.4)'; }}
            >
              Full Menu &amp; Online Order →
            </Link>
          </div>
        </div>
      </section>

      {/* ── ORDER CTA ───────────────────────────────────────────────────── */}
      <section style={{ position: 'relative', padding: '120px 0', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0 }}>
          <Image
            src="/site/site-picanha-sliced.png"
            alt="Sliced picanha"
            fill
            style={{ objectFit: 'cover', objectPosition: 'center 50%' }}
          />
          <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(10,8,6,0.84)' }} />
          <div style={{
            position: 'absolute', inset: 0,
            background: 'radial-gradient(ellipse at center, rgba(196,154,10,0.04) 0%, transparent 70%)',
          }} />
        </div>

        <div style={{ position: 'relative', zIndex: 10, maxWidth: 720, margin: '0 auto', padding: '0 24px', textAlign: 'center' }}>
          <SectionLabel>Online Ordering</SectionLabel>
          <h2 style={{
            fontSize: 'clamp(42px, 7vw, 76px)',
            fontFamily: displayFont,
            fontWeight: 800, color: S.siteText, lineHeight: 1.0, marginTop: 20, marginBottom: 20,
          }}>
            Skip the line.<br />
            <em style={{ color: S.gold, fontStyle: 'italic' }}>Order Online.</em>
          </h2>
          <p style={{ fontSize: 18, color: '#b0a070', lineHeight: 1.7, marginBottom: 44 }}>
            Order ahead and your food goes directly to our kitchen.
            Ready for pickup at 360 Hampton Dr, Venice.
          </p>
          <Link
            href="/order"
            style={{
              display: 'inline-flex', alignItems: 'center',
              backgroundColor: S.gold, color: '#0a0806',
              padding: '20px 56px', borderRadius: 3,
              fontWeight: 900, fontSize: 14, letterSpacing: '0.12em', textTransform: 'uppercase',
              textDecoration: 'none', transition: 'background 0.2s',
              boxShadow: `0 0 60px rgba(196,154,10,0.25)`,
            }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = S.goldLight)}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = S.gold)}
          >
            Start Your Order →
          </Link>
          <div style={{ marginTop: 24, fontSize: 12, color: S.siteMuted, letterSpacing: '0.05em' }}>
            Kitchen receives your order instantly · Pay at pickup
          </div>
        </div>
      </section>

      {/* ── CATERING ────────────────────────────────────────────────────── */}
      <section id="catering" style={{ padding: '100px 0' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
          <div className="grid grid-cols-1 lg:grid-cols-2" style={{ gap: 72, alignItems: 'start' }}>

            {/* Text */}
            <div>
              <SectionLabelLeft>Catering &amp; Events</SectionLabelLeft>
              <h2 style={{
                fontSize: 'clamp(34px, 4vw, 52px)',
                fontFamily: displayFont,
                fontWeight: 800, color: S.siteText, lineHeight: 1.06, marginBottom: 24,
              }}>
                Bring the Fire to<br />
                <em style={{ color: S.gold, fontStyle: 'italic' }}>Your Event</em>
              </h2>
              <p style={{ fontSize: 17, lineHeight: 1.82, color: S.siteDim, marginBottom: 32 }}>
                From intimate dinner parties to large corporate events, Prime Flavor brings
                authentic Brazilian BBQ to your occasion. Our catering team handles
                everything — setup, service, and spectacular food.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: 14, marginBottom: 32 }}>
                {CATERING_PACKAGES.map((pkg) => (
                  <div key={pkg.name} style={{
                    backgroundColor: S.siteSurface,
                    border: `1px solid ${S.siteBorder}`,
                    borderRadius: 6,
                    padding: '22px 22px 20px',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', marginBottom: 12 }}>
                      <h3 style={{
                        fontSize: 18,
                        lineHeight: 1.15,
                        color: S.siteText,
                        fontWeight: 800,
                        fontFamily: displayFont,
                      }}>
                        {pkg.name}
                      </h3>
                      <span style={{
                        color: S.orange,
                        fontSize: 13,
                        lineHeight: 1.35,
                        fontWeight: 900,
                        textAlign: 'right',
                        flexShrink: 0,
                      }}>
                        {pkg.price}
                      </span>
                    </div>
                    <div style={{
                      color: S.gold,
                      fontSize: 10,
                      letterSpacing: '0.14em',
                      textTransform: 'uppercase',
                      fontWeight: 800,
                      marginBottom: 12,
                    }}>
                      {pkg.minimum}
                    </div>
                    <p style={{ color: '#9f9072', fontSize: 13, lineHeight: 1.65, marginBottom: 14 }}>
                      {pkg.summary}
                    </p>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {pkg.details.map((detail) => (
                        <li key={detail} style={{ display: 'flex', gap: 9, color: '#b8a880', fontSize: 12, lineHeight: 1.45 }}>
                          <span style={{ color: S.gold, flexShrink: 0 }}>+</span>
                          {detail}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              <div style={{
                border: `1px solid rgba(196,154,10,0.28)`,
                backgroundColor: 'rgba(196,154,10,0.06)',
                borderRadius: 6,
                padding: '22px 24px',
                marginBottom: 34,
              }}>
                <div style={{ fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: S.gold, fontWeight: 800, marginBottom: 16 }}>
                  Gold Combo Pricing
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: '10px 28px', marginBottom: 18 }}>
                  {GOLD_COMBO_PRICING.map(([guests, price]) => (
                    <div key={guests} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, borderBottom: `1px solid ${S.siteBorder}`, paddingBottom: 9 }}>
                      <span style={{ color: S.siteText, fontSize: 14, fontWeight: 800 }}>{guests}</span>
                      <span style={{ color: '#c8b890', fontSize: 14 }}>{price}</span>
                    </div>
                  ))}
                </div>
                <p style={{ color: S.siteDim, fontSize: 13, lineHeight: 1.65 }}>
                  A 50% deposit is due when ordering, with the remaining 50% due on the event day.
                  Please schedule catering at least 7 days in advance. Questions and replacements can be discussed.
                </p>
              </div>

              <a
                href="mailto:primeflavorbrasil@gmail.com?subject=Catering%20Inquiry%20—%20Prime%20Flavor"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  backgroundColor: S.gold, color: '#0a0806',
                  padding: '14px 32px', borderRadius: 3,
                  fontWeight: 800, fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase',
                  textDecoration: 'none', transition: 'background 0.2s',
                }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = S.goldLight)}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = S.gold)}
              >
                Request Catering →
              </a>
            </div>

            {/* Photo */}
            <div style={{ position: 'relative', borderRadius: 6, overflow: 'hidden', aspectRatio: '4/5', minHeight: 520 }}>
              <Image
                src="/site/site-catering.png"
                alt="Prime Flavor catering spread"
                fill
                style={{ objectFit: 'cover' }}
              />
              <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(to top, rgba(15,13,11,0.7) 0%, transparent 55%)',
              }} />
              <div style={{
                position: 'absolute', bottom: 24, right: 24,
                backgroundColor: 'rgba(15,13,11,0.88)',
                border: `1px solid ${S.siteBorder}`,
                padding: '12px 20px', borderRadius: 4,
              }}>
                <div style={{ fontSize: 9, color: S.gold, letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: 4 }}>Available for</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: S.siteText }}>Groups &amp; Events</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ────────────────────────────────────────────────── */}
      <section style={{ padding: '100px 0', backgroundColor: S.siteDeep }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <SectionLabel>Guests Love Us</SectionLabel>
            <h2 style={{
              fontSize: 'clamp(34px, 4vw, 50px)',
              fontFamily: displayFont,
              fontWeight: 800, color: S.siteText, marginTop: 16,
            }}>
              What They&apos;re Saying
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3" style={{ gap: 24 }}>
            {TESTIMONIALS.map((t) => (
              <div key={t.name} style={{
                backgroundColor: '#171410',
                border: `1px solid ${S.siteBorder}`,
                borderRadius: 6, padding: '36px 32px',
                display: 'flex', flexDirection: 'column', gap: 20,
              }}>
                <div style={{ display: 'flex', gap: 3 }}>
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <span key={i} style={{ color: S.gold, fontSize: 15 }}>★</span>
                  ))}
                </div>
                <p style={{ fontSize: 16, lineHeight: 1.75, color: '#a09078', fontStyle: 'italic', flex: 1 }}>
                  &ldquo;{t.text}&rdquo;
                </p>
                <div>
                  <div style={{ fontWeight: 700, color: S.siteText, fontSize: 15 }}>{t.name}</div>
                  <div style={{ fontSize: 11, color: S.siteMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 3 }}>{t.location}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── GALLERY ─────────────────────────────────────────────────────── */}
      <section id="gallery" style={{ padding: '100px 0' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <SectionLabel>Gallery</SectionLabel>
            <h2 style={{
              fontSize: 'clamp(34px, 4vw, 50px)',
              fontFamily: displayFont,
              fontWeight: 800, color: S.siteText, marginTop: 16,
            }}>
              Fire &amp; Flame
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            <GalleryImg src="/site/site-picanha-grill.png"     alt="Picanha steaks on the grill" />
            <GalleryImg src="/site/site-picanha-sliced.png"    alt="Sliced picanha on cutting board" />
            <GalleryImg src="/site/site-bbq-mix-1.png"         alt="BBQ mix — chicken, sausage, queijo" />
            <GalleryImg src="/site/site-bbq-mix-2.png"         alt="Assorted BBQ skewers" />
            <GalleryImg src="/site/site-pao-de-queijo.png"     alt="Fresh pão de queijo from the oven" />
            <GalleryImg src="/site/site-sausage-queijo.png"    alt="Linguiça sausage and queijo coalho" />
            <GalleryImg src="/site/site-picanha-sandwich.png"  alt="Picanha sandwich" />
            <GalleryImg src="/site/site-plate-served.png"      alt="Brazilian plate being served" />
            <GalleryImg src="/site/site-takeout-box.png"       alt="Prime Flavor takeout box" />
            <GalleryImg src="/site/site-garlic-bread.png"      alt="Garlic bread" />
            <GalleryImg src="/site/site-catering.png"          alt="Catering spread" />
            <GalleryImg src="/site/site-chef-grill.png"        alt="Chef working the Prime Flavor grill" />
          </div>
        </div>
      </section>

      {/* ── LOCATION ────────────────────────────────────────────────────── */}
      <section id="location" style={{ padding: '100px 0', backgroundColor: S.siteDeep }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <SectionLabel>Find Us</SectionLabel>
            <h2 style={{
              fontSize: 'clamp(34px, 4vw, 50px)',
              fontFamily: displayFont,
              fontWeight: 800, color: S.siteText, marginTop: 16,
            }}>
              Visit Us in Venice
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 32 }}>
            {/* Map */}
            <div style={{
              borderRadius: 6, overflow: 'hidden',
              border: `1px solid ${S.siteBorder}`,
              minHeight: 400, position: 'relative',
            }}>
              <iframe
                src="https://maps.google.com/maps?q=360+Hampton+Dr+Venice+CA+90291&output=embed"
                width="100%"
                height="100%"
                style={{
                  border: 0, position: 'absolute', inset: 0,
                  filter: 'invert(90%) hue-rotate(180deg) brightness(0.65) saturate(0.5)',
                }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Prime Flavor — 360 Hampton Dr Venice CA"
              />
            </div>

            {/* Info cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Address */}
              <div style={{ backgroundColor: S.siteSurface, border: `1px solid ${S.siteBorder}`, borderRadius: 6, padding: '28px 32px' }}>
                <div style={{ fontSize: 10, letterSpacing: '0.25em', textTransform: 'uppercase', color: S.gold, fontWeight: 700, marginBottom: 14 }}>Address</div>
                <p style={{ fontSize: 24, fontWeight: 700, color: S.siteText, lineHeight: 1.3, fontFamily: displayFont, marginBottom: 6 }}>
                  360 Hampton Drive
                </p>
                <p style={{ fontSize: 17, color: S.siteDim }}>Venice, CA 90291</p>
                <a
                  href="https://maps.google.com/?q=360+Hampton+Dr+Venice+CA+90291"
                  target="_blank" rel="noopener noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 16, color: S.gold, fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textDecoration: 'none', textTransform: 'uppercase' }}
                >
                  Get Directions →
                </a>
              </div>

              {/* Hours */}
              <div style={{ backgroundColor: S.siteSurface, border: `1px solid ${S.siteBorder}`, borderRadius: 6, padding: '28px 32px' }}>
                <div style={{ fontSize: 10, letterSpacing: '0.25em', textTransform: 'uppercase', color: S.gold, fontWeight: 700, marginBottom: 14 }}>Hours</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  {[
                    ['Monday – Friday', '11:00 AM – 9:00 PM'],
                    ['Saturday', '10:00 AM – 10:00 PM'],
                    ['Sunday', '10:00 AM – 8:00 PM'],
                  ].map(([day, hours]) => (
                    <div key={day} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: `1px solid ${S.siteBorder}` }}>
                      <span style={{ fontSize: 14, color: S.siteDim }}>{day}</span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: S.siteText }}>{hours}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Contact */}
              <div style={{ backgroundColor: S.siteSurface, border: `1px solid ${S.siteBorder}`, borderRadius: 6, padding: '28px 32px' }}>
                <div style={{ fontSize: 10, letterSpacing: '0.25em', textTransform: 'uppercase', color: S.gold, fontWeight: 700, marginBottom: 14 }}>Contact</div>
                <a href="mailto:primeflavorbrasil@gmail.com" style={{ color: '#c8b890', fontSize: 15, textDecoration: 'none' }}>
                  primeflavorbrasil@gmail.com
                </a>
                <p style={{ color: S.siteMuted, fontSize: 13, marginTop: 8, lineHeight: 1.6 }}>
                  For catering inquiries, email us directly.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────────── */}
      <footer style={{ backgroundColor: '#080604', borderTop: `1px solid ${S.siteBorder}`, padding: '72px 0 32px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
          <div className="grid grid-cols-2 md:grid-cols-4" style={{ gap: 48, marginBottom: 56 }}>
            {/* Brand */}
            <div style={{ gridColumn: 'span 1' }}>
              <div style={{ fontSize: 18, fontWeight: 900, color: S.orange, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 4 }}>
                Prime Flavor
              </div>
              <div style={{ fontSize: 8, color: '#4a3a28', letterSpacing: '0.3em', textTransform: 'uppercase', marginBottom: 16 }}>
                Brazilian BBQ · Venice Beach
              </div>
              <p style={{ fontSize: 13, lineHeight: 1.7, color: '#4a3a28', marginBottom: 24 }}>
                Authentic fire-grilled Brazilian BBQ in the heart of Venice Beach, CA.
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                {[['IG', 'Instagram'], ['TT', 'TikTok'], ['FB', 'Facebook']].map(([abbr, name]) => (
                  <a key={name} href="#" aria-label={name} style={{
                    width: 34, height: 34,
                    border: `1px solid ${S.siteBorder}`, borderRadius: 3,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#4a3a28', fontSize: 10, fontWeight: 800, letterSpacing: '0.05em',
                    textDecoration: 'none', transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = S.gold; e.currentTarget.style.color = S.gold; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = S.siteBorder; e.currentTarget.style.color = '#4a3a28'; }}
                  >
                    {abbr}
                  </a>
                ))}
              </div>
            </div>

            {/* Menu */}
            <div>
              <h4 style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#8a7a60', fontWeight: 700, marginBottom: 18 }}>Menu</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {['Skewers', 'Sandwiches', 'Plates', 'Sides & Salads', 'Drinks'].map((item) => (
                  <a key={item} href="/order" style={{ color: '#4a3a28', fontSize: 13, textDecoration: 'none', transition: 'color 0.2s' }}
                    onMouseEnter={e => (e.currentTarget.style.color = S.gold)}
                    onMouseLeave={e => (e.currentTarget.style.color = '#4a3a28')}
                  >{item}</a>
                ))}
              </div>
            </div>

            {/* Info */}
            <div>
              <h4 style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#8a7a60', fontWeight: 700, marginBottom: 18 }}>Info</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[['Our Story', '#story'], ['Catering', '#catering'], ['Gallery', '#gallery'], ['Location', '#location'], ['Order Online', '/order']].map(([label, href]) => (
                  <a key={label} href={href} style={{ color: '#4a3a28', fontSize: 13, textDecoration: 'none', transition: 'color 0.2s' }}
                    onMouseEnter={e => (e.currentTarget.style.color = S.gold)}
                    onMouseLeave={e => (e.currentTarget.style.color = '#4a3a28')}
                  >{label}</a>
                ))}
              </div>
            </div>

            {/* Hours */}
            <div>
              <h4 style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#8a7a60', fontWeight: 700, marginBottom: 18 }}>Hours</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[
                  ['Mon – Fri', '11am – 9pm'],
                  ['Saturday', '10am – 10pm'],
                  ['Sunday', '10am – 8pm'],
                ].map(([day, hrs]) => (
                  <div key={day}>
                    <div style={{ fontSize: 11, color: '#4a3a28' }}>{day}</div>
                    <div style={{ fontSize: 13, color: '#7a6a50', fontWeight: 600, marginBottom: 8 }}>{hrs}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom */}
          <div style={{ borderTop: `1px solid ${S.siteBorder}`, paddingTop: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <span style={{ fontSize: 12, color: '#3a2a18' }}>
              © 2025 Prime Flavor Brazilian BBQ · Venice Beach, CA
            </span>
            <div style={{ display: 'flex', gap: 24, fontSize: 12 }}>
              <Link href="/order" style={{ color: '#3a2a18', textDecoration: 'none', transition: 'color 0.2s' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = S.gold)}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#3a2a18')}
              >Order Online</Link>
              <Link href="/kiosk" style={{ color: '#3a2a18', textDecoration: 'none', transition: 'color 0.2s' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = S.gold)}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#3a2a18')}
              >In-Store Kiosk</Link>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}

// ── Extracted sub-components ──────────────────────────────────────────────────

function MenuCard({ item }: { item: typeof FEATURED[0] }) {
  const S_local = {
    gold: '#c49a0a',
    siteSurface: '#171410',
    siteBorder: '#2a2420',
    siteText: '#f0e8d0',
    siteMuted: '#6a5a40',
    orange: '#e07030',
  };

  return (
    <div
      style={{
        backgroundColor: S_local.siteSurface,
        border: `1px solid ${S_local.siteBorder}`,
        borderRadius: 6, overflow: 'hidden',
        transition: 'transform 0.25s, border-color 0.25s, box-shadow 0.25s',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-6px)';
        (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(196,154,10,0.35)';
        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 20px 50px rgba(0,0,0,0.5)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
        (e.currentTarget as HTMLDivElement).style.borderColor = S_local.siteBorder;
        (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
      }}
    >
      <div style={{ position: 'relative', aspectRatio: '4/3', overflow: 'hidden' }}>
        <Image src={item.image} alt={item.name} fill style={{ objectFit: 'cover' }} />
        <div style={{
          position: 'absolute', top: 14, left: 14,
          backgroundColor: 'rgba(10,8,6,0.88)',
          border: '1px solid rgba(196,154,10,0.35)',
          color: S_local.gold, padding: '4px 10px', borderRadius: 2,
          fontSize: 9, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase',
        }}>
          {item.tag}
        </div>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to top, rgba(23,20,16,0.5) 0%, transparent 50%)',
        }} />
      </div>
      <div style={{ padding: '20px 24px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
          <h3 style={{
            fontSize: 18, fontWeight: 700, color: S_local.siteText, lineHeight: 1.2,
            fontFamily: 'var(--font-playfair, Georgia, serif)',
          }}>
            {item.name}
          </h3>
          <span style={{ fontSize: 20, fontWeight: 900, color: S_local.orange, flexShrink: 0 }}>{item.price}</span>
        </div>
        <p style={{ fontSize: 13, color: S_local.siteMuted, lineHeight: 1.6 }}>{item.desc}</p>
      </div>
    </div>
  );
}

function GalleryImg({ src, alt }: { src: string; alt: string }) {
  return (
    <div
      className="group"
      style={{ position: 'relative', borderRadius: 4, overflow: 'hidden', aspectRatio: '1/1' }}
    >
      <Image
        src={src} alt={alt} fill
        className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
      />
    </div>
  );
}
