import React from 'react';
import Link from 'next/link';
import { PublicBranding } from '@/types/event-management';
import { SparklesIcon } from '@/components/shared/Icons';

interface NavbarProps {
  branding?: PublicBranding | null;
}

export function Navbar({ branding }: NavbarProps) {
  const displayName = branding?.displayName || 'Softilo Events';
  const accent = branding?.themeTokens?.accentColor || '#4F46E5';

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-3 group">
          {branding?.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={branding.logoUrl}
              alt={displayName}
              className="h-9 w-9 rounded-xl object-cover border border-slate-200"
            />
          ) : (
            <span
              className="flex h-9 w-9 items-center justify-center rounded-xl text-white shadow-sm transition-transform group-hover:scale-105"
              style={{ backgroundColor: accent }}
            >
              <SparklesIcon className="w-4 h-4" />
            </span>
          )}
          <div className="leading-tight">
            <span className="text-base font-bold tracking-tight text-slate-900 block">
              {displayName}
            </span>
            <span className="text-[11px] font-medium text-slate-500 block">
              Event &amp; Studio Operations
            </span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-1 rounded-full bg-slate-100/80 p-1 text-sm font-medium text-slate-600">
          <a
            href="#packages"
            className="rounded-full px-4 py-1.5 hover:bg-white hover:text-slate-900 hover:shadow-xs transition-all"
          >
            Packages
          </a>
          <a
            href="#portfolio"
            className="rounded-full px-4 py-1.5 hover:bg-white hover:text-slate-900 hover:shadow-xs transition-all"
          >
            Showcase
          </a>
          <a
            href="#inquire"
            className="rounded-full px-4 py-1.5 hover:bg-white hover:text-slate-900 hover:shadow-xs transition-all"
          >
            Request Quote
          </a>
        </nav>

        <div className="flex items-center gap-2.5">
          <a
            href="#inquire"
            className="inline-flex items-center rounded-xl px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:opacity-90 active:scale-[0.98]"
            style={{ backgroundColor: accent }}
          >
            Inquire Now
          </a>
          <Link
            href="/login"
            className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300 transition-colors"
          >
            Studio Portal
          </Link>
        </div>
      </div>
    </header>
  );
}
