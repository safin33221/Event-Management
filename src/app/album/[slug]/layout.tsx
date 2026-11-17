import React from 'react';
import { Cormorant_Garamond } from 'next/font/google';

const editorialSerif = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-album-serif',
});

export default function DigitalAlbumLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className={`${editorialSerif.variable} min-h-screen bg-[#FAF8F5] text-stone-900 antialiased selection:bg-stone-900 selection:text-stone-50`}
    >
      {children}
    </div>
  );
}
