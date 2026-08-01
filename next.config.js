import 'leaflet/dist/leaflet.css';
import './globals.css';
import type { ReactNode } from 'react';
export const metadata = { title: 'ServisPilot AI v2', description: 'Gerçek yol ve canlı trafik tabanlı servis rota optimizasyonu' };
export default function RootLayout({ children }: { children: ReactNode }) { return <html lang="tr"><body>{children}</body></html>; }
