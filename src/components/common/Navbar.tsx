import React from 'react';
import Link from 'next/link';
import { PublicBranding } from '@/types/event-management';
import { resolvePublicBranding } from '@/lib/publicStorefront';

interface NavbarProps {
  branding?: PublicBranding | null;
}

export function Navbar({ branding }: NavbarProps) {
  const resolved = resolvePublicBranding(branding);
  const displayName = resolved.displayName;
  const accent = resolved.themeTokens.accentColor || '#B91C47';
  const secondary = resolved.themeTokens.secondaryColor || '#C98A2C';

  const isRongiloBrand = displayName.toLowerCase().includes('rongilo');

  return (
    <header className="sticky top-0 z-40 border-b border-[#EAE2D6]/90 bg-[#FDFBF7]/90 backdrop-blur-xl">
      <div className="mx-auto flex h-[68px] max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-3 group shrink-0">
          {resolved.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={resolved.logoUrl}
              alt={displayName}
              className="h-10 w-10 rounded-xl object-cover border border-[#E5DCCD] shadow-xs"
            />
          ) : (
            <span
              className="relative flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-sm transition-transform duration-200 group-hover:scale-105 overflow-hidden"
              style={{
                background: `linear-gradient(135deg, ${accent} 0%, ${secondary} 100%)`,
              }}
            >
              <span className="font-editorial text-xl font-bold tracking-tight">
                {(displayName || 'R').slice(0, 1).toUpperCase()}
              </span>
            </span>
          )}
          <div className="leading-none">
            {isRongiloBrand ? (
              <>
                <span className="font-editorial text-xl sm:text-[1.35rem] font-semibold tracking-tight text-[#181216] block">
                  Rongilo
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#7D6860] block mt-1">
                  Event Management
                </span>
              </>
            ) : (
              <>
                <span className="font-editorial text-lg sm:text-xl font-semibold tracking-tight text-[#181216] block">
                  {displayName}
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#7D6860] block mt-1">
                  Event Studio
                </span>
              </>
            )}
          </div>
        </Link>

        <nav
          aria-label="Primary navigation"
          className="hidden md:flex items-center gap-1 rounded-full border border-[#E7DED1] bg-[#F6F1E7]/90 p-1 text-xs font-semibold text-[#4A3F45]"
        >
          <Link
            href="/#featured-portfolios"
            className="rounded-full px-3.5 py-1.5 hover:bg-white hover:text-[#181216] hover:shadow-2xs transition-all"
          >
            Signature Work
          </Link>
          <Link
            href="/portfolio"
            className="rounded-full px-3.5 py-1.5 hover:bg-white hover:text-[#181216] hover:shadow-2xs transition-all"
          >
            Client Portfolios
          </Link>
          <Link
            href="/#packages"
            className="rounded-full px-3.5 py-1.5 hover:bg-white hover:text-[#181216] hover:shadow-2xs transition-all"
          >
            Packages
          </Link>
          <Link
            href="/#portfolio"
            className="rounded-full px-3.5 py-1.5 hover:bg-white hover:text-[#181216] hover:shadow-2xs transition-all"
          >
            Gallery
          </Link>
        </nav>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/#inquire"
            className="inline-flex items-center rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-sm transition-all hover:opacity-95 active:scale-[0.98]"
            style={{ backgroundColor: accent }}
          >
            Book Now
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center rounded-xl border border-[#DFD5C7] bg-white px-3.5 py-2 text-xs sm:text-sm font-semibold text-[#3B3036] hover:bg-[#F7F3EB] hover:text-[#181216] transition-colors"
          >
            Team Portal
          </Link>
        </div>
      </div>

      {/* Clean mobile quick navigation strip */}
      <nav
        aria-label="Mobile quick navigation"
        className="flex md:hidden items-center justify-center gap-4 border-t border-[#EFE8DC] bg-[#FAF6EE]/90 px-4 py-2 text-[11px] font-semibold text-[#4A3F45]"
      >
        <Link href="/portfolio" className="hover:text-[#181216] transition-colors">
          Portfolios
        </Link>
        <span className="text-[#D4C8B8]">•</span>
        <Link href="/#packages" className="hover:text-[#181216] transition-colors">
          Packages
        </Link>
        <span className="text-[#D4C8B8]">•</span>
        <Link href="/#portfolio" className="hover:text-[#181216] transition-colors">
          Gallery
        </Link>
        <span className="text-[#D4C8B8]">•</span>
        <Link href="/#inquire" className="text-[#B91C47] transition-colors">
          Get Quote
        </Link>
      </nav>
    </header>
  );
}
