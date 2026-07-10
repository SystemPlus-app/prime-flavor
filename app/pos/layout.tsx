import type { Metadata } from 'next';

export const metadata: Metadata = {
  manifest: '/manifest-pos.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'POS',
  },
};

export default function PosLayout({ children }: { children: React.ReactNode }) {
  return children;
}
