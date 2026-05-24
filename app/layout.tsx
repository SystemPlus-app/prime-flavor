import type { Metadata } from 'next';
import { Playfair_Display } from 'next/font/google';
import './globals.css';
import { OrderStoreProvider } from '@/store/orderStore';

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800', '900'],
  style: ['normal', 'italic'],
});

export const metadata: Metadata = {
  title: 'Prime Flavor Brazilian BBQ',
  description: 'Authentic fire-grilled Brazilian BBQ in Venice Beach, CA. Online ordering, catering, and dine-in.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={playfair.variable}>
      <body>
        <OrderStoreProvider>{children}</OrderStoreProvider>
      </body>
    </html>
  );
}
