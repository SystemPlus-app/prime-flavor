import type { Metadata } from 'next';

export const metadata: Metadata = {
  manifest: '/manifest-kitchen.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Kitchen',
  },
};

export default function KitchenLayout({ children }: { children: React.ReactNode }) {
  return children;
}
