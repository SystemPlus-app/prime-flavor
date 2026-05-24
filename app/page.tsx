import Link from 'next/link';

export default function Home() {
  const links = [
    {
      href: '/website',
      label: 'Public Website',
      desc: 'Marketing site + online ordering for customers',
      icon: '🌐',
      color: '#c49a0a',
      badge: 'Public',
    },
    {
      href: '/kiosk',
      label: 'Customer Kiosk',
      desc: 'Self-service ordering for in-person guests',
      icon: '🧾',
      color: '#e07030',
      badge: 'Public',
    },
    {
      href: '/kitchen',
      label: 'Kitchen Display',
      desc: 'Staff — view and manage active orders',
      icon: '🔥',
      color: '#d4a530',
      badge: 'Staff',
    },
    {
      href: '/admin',
      label: 'Admin Panel',
      desc: 'Staff — reports, history & menu',
      icon: '📊',
      color: '#3da855',
      badge: 'Staff',
    },
  ];

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-base gap-8 p-8 overflow-auto">
      <div className="text-center">
        <h1 className="text-orange font-extrabold text-4xl tracking-wide uppercase">Prime Flavor</h1>
        <p className="text-cream-dim text-sm tracking-widest uppercase mt-1">
          Brazilian BBQ · System Hub
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-4 max-w-4xl">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="flex flex-col items-center gap-3 w-48 p-6 rounded-2xl bg-card border border-border hover:border-orange transition-all hover:shadow-[0_0_0_1px_#e07030] group"
          >
            <span className="text-5xl">{l.icon}</span>
            <div className="text-center">
              <p className="text-cream font-bold text-sm group-hover:text-orange transition-colors">
                {l.label}
              </p>
              <p className="text-muted text-xs mt-1 leading-relaxed">{l.desc}</p>
            </div>
            <div className="flex flex-col items-center gap-1.5 mt-1">
              <span
                className="px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide text-white"
                style={{ backgroundColor: l.color }}
              >
                Open →
              </span>
              <span className="text-muted text-[10px]">
                {l.badge === 'Staff' ? '🔒 PIN required' : '✓ Customer-safe'}
              </span>
            </div>
          </Link>
        ))}
      </div>

      <p className="text-muted text-xs mt-2 text-center max-w-md leading-relaxed">
        Online orders (site) and kiosk orders both go to the Kitchen Display in real time.
      </p>
    </div>
  );
}
