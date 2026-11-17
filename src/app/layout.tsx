import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Softilo Event Management — Curated Event & Studio Operations',
  description:
    'White-label event management storefront, quotes, bookings, schedules, verified ledgers, and deliverables.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 font-sans selection:bg-indigo-500/15 selection:text-indigo-950">
        {children}
      </body>
    </html>
  );
}
