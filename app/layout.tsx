import type { Metadata } from 'next';
import './globals.css';
import { OrderStoreProvider } from '@/store/orderStore';

export const metadata: Metadata = {
  title: 'Prime Flavor Brazilian BBQ',
  description: 'Point of Sale & Kitchen Display System',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full overflow-hidden">
        <OrderStoreProvider>{children}</OrderStoreProvider>
      </body>
    </html>
  );
}
