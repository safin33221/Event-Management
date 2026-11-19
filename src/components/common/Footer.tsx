import React from 'react';
import Link from 'next/link';
import { PublicBranding } from '@/types/event-management';
import { resolvePublicBranding } from '@/lib/publicStorefront';

export function Footer({ branding }: { branding?: PublicBranding | null }) {
  const resolved = resolvePublicBranding(branding);
  const displayName = resolved.displayName;
  const contact = resolved.contactDetails;
  const accent = resolved.themeTokens.accentColor || '#B91C47';
  const secondary = resolved.themeTokens.secondaryColor || '#C98A2C';

  return (
    <footer className="mt-auto bg-[#141013] text-[#F5EFE6] border-t border-[#2E242B]">
      <div
        className="h-[2px] w-full opacity-80"
        style={{
          background: `linear-gradient(90deg, transparent 0%, ${accent} 35%, ${secondary} 65%, transparent 100%)`,
        }}
      />
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 md:grid-cols-12">
          <div className="md:col-span-5 space-y-3">
            <div className="flex items-center gap-3">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-xl text-white shadow-sm"
                style={{
                  background: `linear-gradient(135deg, ${accent} 0%, ${secondary} 100%)`,
                }}
              >
                <span className="font-editorial text-lg font-bold">
                  {(displayName || 'R').slice(0, 1).toUpperCase()}
                </span>
              </span>
              <div>
                <p className="font-editorial text-2xl font-semibold tracking-tight text-white">
                  {displayName}
                </p>
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#C98A2C]">
                  Celebrations • Cinema • Precision
                </p>
              </div>
            </div>
            <p className="text-sm text-[#BFB2A7] max-w-sm leading-relaxed">
              Curated wedding celebrations, corporate galas, and bespoke digital memory albums—built
              on transparent quotes, conflict-free crew scheduling, and reliable delivery.
            </p>
          </div>

          <div className="md:col-span-2 text-sm space-y-2.5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#C98A2C]">
              Explore
            </p>
            <ul className="space-y-2 text-[#D8CEC3]">
              <li>
                <Link href="/portfolio" className="hover:text-white transition-colors">
                  Client Portfolios
                </Link>
              </li>
              <li>
                <Link href="/#packages" className="hover:text-white transition-colors">
                  Event Packages
                </Link>
              </li>
              <li>
                <Link href="/#portfolio" className="hover:text-white transition-colors">
                  Photo &amp; Film Gallery
                </Link>
              </li>
              <li>
                <Link href="/#inquire" className="hover:text-white transition-colors">
                  Request a Quote
                </Link>
              </li>
            </ul>
          </div>

          <div className="md:col-span-3 text-sm space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#C98A2C]">
              Studio Concierge
            </p>
            <div className="space-y-1.5 text-[#D8CEC3]">
              {contact?.phone ? (
                <p>
                  <a
                    href={`tel:${contact.phone.replace(/\s+/g, '')}`}
                    className="hover:text-white transition-colors"
                  >
                    {contact.phone}
                  </a>
                </p>
              ) : (
                <p>Open for consultations daily</p>
              )}
              {contact?.email && (
                <p>
                  <a href={`mailto:${contact.email}`} className="hover:text-white transition-colors">
                    {contact.email}
                  </a>
                </p>
              )}
              {contact?.address && (
                <p className="text-xs text-[#A89A8E] leading-relaxed">{contact.address}</p>
              )}
            </div>
          </div>

          <div className="md:col-span-2 text-sm md:text-right space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#C98A2C]">
              Workspace
            </p>
            <p className="text-xs text-[#A89A8E] font-mono-code">
              {resolved.timezone || 'Asia/Dhaka'} • {resolved.currency || 'BDT'}
            </p>
            <div className="pt-2">
              <Link
                href="/login"
                className="inline-flex items-center rounded-lg border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-white/15 transition-colors"
              >
                Team Sign In →
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-white/10 pt-6 text-xs text-[#9C8E83]">
          <span>
            © {new Date().getFullYear()} {displayName}. All rights reserved.
          </span>
          <span className="tracking-wide">
            Crafted with celebratory warmth &amp; operational precision
          </span>
        </div>
      </div>
    </footer>
  );
}
