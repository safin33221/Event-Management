import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Rongilo Event Management — Bespoke Celebrations, Photography & Studio Craft',
  description:
    'Rongilo Event Management: curated wedding & corporate event design, transparent quotes, date-locked bookings, and signature digital albums.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-[#FDFBF7] text-[#181216] font-sans selection:bg-[#B91C47]/15 selection:text-[#181216]">
        {children}
      </body>
    </html>
  );
}
