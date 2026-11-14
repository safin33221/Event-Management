import React from 'react';
import Link from 'next/link';
import { PublicBranding } from '@/types/event-management';
import { SparklesIcon } from '@/components/shared/Icons';

interface NavbarProps {
  branding?: PublicBranding | null;
}

export function Navbar({ branding }: NavbarProps) {
  const displayName = branding?.displayName || 'Softilo Events';
  const accent = branding?.themeTokens?.accentColor || '#B45309';

  return (
    <header className="sticky top-0 z-40 border-b border-[#E6DFD5]/80 bg-[#FAF8F5]/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-3 group">
          {branding?.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={branding.logoUrl}
              alt={displayName}
              className="h-9 w-9 rounded-lg object-cover border border-[#E6DFD5]"
            />
          ) : (
            <span
              className="flex h-9 w-9 items-center justify-center rounded-lg text-white shadow-sm transition-transform group-hover:scale-105"
              style={{ backgroundColor: accent }}
            >
              <SparklesIcon className="w-4 h-4" />
            </span>
          )}
          <div className="leading-tight">
            <span className="font-display text-xl font-semibold tracking-tight text-[#141312] block">
              {displayName}
            </span>
            <span className="text-[10px] uppercase tracking-[0.18em] text-[#6B655D] block">
              Curated Event Atelier
            </span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-[#4A453F]">
          <a href="#packages" className="hover:text-[#141312] transition-colors">
            Collections
          </a>
          <a href="#portfolio" className="hover:text-[#141312] transition-colors">
            Showcase
          </a>
          <a href="#inquire" className="hover:text-[#141312] transition-colors">
            Request Date
          </a>
        </nav>

        <div className="flex items-center gap-3">
          <a
            href="#inquire"
            className="hidden sm:inline-flex items-center rounded-full px-4 py-2 text-xs font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
            style={{ backgroundColor: accent }}
          >
            Inquire Now
          </a>
          <Link
            href="/login"
            className="inline-flex items-center rounded-full border border-[#D8CFC2] bg-white px-4 py-2 text-xs font-semibold text-[#141312] hover:bg-[#F3EFE9] transition-colors"
          >
            Studio Portal
          </Link>
        </div>
      </div>
    </header>
  );
}
