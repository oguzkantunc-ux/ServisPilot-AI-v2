import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ServisPilot AI v2',
  description: 'Gerçek yol geometrisi ile rota optimizasyonu',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}
