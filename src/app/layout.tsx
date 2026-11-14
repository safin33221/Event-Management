import type { Metadata } from 'next';
import { Cormorant_Garamond, JetBrains_Mono, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';

const displayFont = Cormorant_Garamond({
  variable: '--font-display',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

const sansFont = Plus_Jakarta_Sans({
  variable: '--font-sans',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

const monoFont = JetBrains_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
  weight: ['400', '500', '600'],
});

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
    <html
      lang="en"
      className={`${displayFont.variable} ${sansFont.variable} ${monoFont.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#FAF8F5] text-[#141312] font-sans selection:bg-[#C69C6D]/25 selection:text-[#141312]">
        {children}
      </body>
    </html>
  );
}
