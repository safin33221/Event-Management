'use client';

import React, { useState } from 'react';
import { PortfolioItem, PublicBranding, StudioPackage } from '@/types/event-management';
import { formatPoisha } from '@/lib/utils';
import {
  ArrowRightIcon,
  CalendarIcon,
  CameraIcon,
  CheckCircleIcon,
  SparklesIcon,
} from '@/components/shared/Icons';
import { InquiryForm } from './InquiryForm';

interface PublicAgencyHomeProps {
  branding: PublicBranding;
  packages: StudioPackage[];
  portfolio: PortfolioItem[];
  isBackendConnected: boolean;
}

export function PublicAgencyHome({
  branding,
  packages,
  portfolio,
  isBackendConnected,
}: PublicAgencyHomeProps) {
  const [selectedPackageId, setSelectedPackageId] = useState<string>('');
  const primary = branding.themeTokens.primaryColor || '#1E293B';
  const accent = branding.themeTokens.accentColor || '#B45309';

  const handleSelectPackage = (id: string) => {
    setSelectedPackageId(id);
    const el = document.getElementById('inquire');
    el?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="flex-1">
      {!isBackendConnected && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-center text-xs text-amber-900">
          Preview Mode: Start the NestJS API server and run the database seed to load the live
          studio catalog and submit inquiries.
        </div>
      )}

      {/* Editorial Hero */}
      <section className="relative overflow-hidden border-b border-[#E6DFD5]">
        <div
          className="absolute inset-0 opacity-[0.06] pointer-events-none"
          style={{
            background: `radial-gradient(circle at 20% 20%, ${accent}, transparent 55%), radial-gradient(circle at 80% 70%, ${primary}, transparent 50%)`,
          }}
        />
        <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#D8CFC2] bg-white px-3.5 py-1.5 text-xs font-medium text-[#4A453F]">
                <SparklesIcon className="w-3.5 h-3.5" style={{ color: accent }} />
                <span>
                  {branding.displayName} • {branding.timezone}
                </span>
              </div>

              <h1 className="font-display text-4xl sm:text-6xl font-semibold tracking-tight text-[#141312] leading-[1.06]">
                Every milestone crafted with calm precision.
              </h1>

              <p className="text-base sm:text-lg text-[#575049] max-w-xl leading-relaxed">
                Explore curated packages, transparent itemized quotes, synchronized multi-day event
                schedules, and real-time deliverable tracking tailored to your celebration or
                gathering.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <a
                  href="#inquire"
                  className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
                  style={{ backgroundColor: accent }}
                >
                  <span>Request a Date & Quote</span>
                  <ArrowRightIcon className="w-4 h-4" />
                </a>
                <a
                  href="#packages"
                  className="inline-flex items-center gap-2 rounded-full border border-[#D8CFC2] bg-white px-6 py-3 text-sm font-semibold text-[#141312] hover:bg-[#F3EFE9] transition-colors"
                >
                  Browse Collections
                </a>
              </div>
            </div>

            {/* Architectural Event Summary Card */}
            <div className="lg:col-span-5">
              <div className="atelier-card p-6 sm:p-7 space-y-5 bg-white/95">
                <div className="flex items-center justify-between border-b border-[#E6DFD5] pb-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6B655D]">
                      Booking Workflow
                    </p>
                    <p className="font-display text-2xl font-semibold text-[#141312]">
                      Transparent From Inquiry to Delivery
                    </p>
                  </div>
                  <CalendarIcon className="w-6 h-6 text-[#6B655D]" />
                </div>

                <ul className="space-y-3.5 text-sm text-[#3F3A34]">
                  {[
                    {
                      title: '1. Date Inquiry & Curated Quote',
                      desc: 'Locked line-item pricing snapshots with versioned revisions.',
                    },
                    {
                      title: '2. Verified Advance & Crew Lock',
                      desc: 'Atomic slot reservations prevent double-booking across sessions.',
                    },
                    {
                      title: '3. Independent Deliverable Tracking',
                      desc: 'Each gallery, film, or report tracks its own deadline & review.',
                    },
                  ].map((step) => (
                    <li key={step.title} className="flex items-start gap-3">
                      <CheckCircleIcon
                        className="w-4 h-4 mt-0.5 shrink-0"
                        style={{ color: accent }}
                      />
                      <div>
                        <p className="font-semibold text-[#141312]">{step.title}</p>
                        <p className="text-xs text-[#6B655D] mt-0.5">{step.desc}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Packages & Collections */}
      <section id="packages" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6B655D]">
              Curated Offerings
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold text-[#141312] mt-1">
              Packages & Collections
            </h2>
          </div>
          <p className="text-sm text-[#6B655D] max-w-md">
            Every package can be customized in a formal quote version before acceptance.
          </p>
        </div>

        {packages.length === 0 ? (
          <div className="atelier-card p-10 text-center text-sm text-[#6B655D]">
            No published packages yet. Submit a custom inquiry below and our coordinator will tailor
            a quote for your event.
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {packages.map((pkg) => (
              <div
                key={pkg.id}
                className="atelier-card atelier-card-hover flex flex-col justify-between p-6"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-display text-2xl font-semibold text-[#141312]">
                      {pkg.name}
                    </h3>
                    <span
                      className="rounded-full px-3 py-1 text-xs font-mono-code font-semibold text-white shrink-0"
                      style={{ backgroundColor: primary }}
                    >
                      {formatPoisha(pkg.basePricePoisha, branding.currency)}
                    </span>
                  </div>
                  {pkg.description && (
                    <p className="mt-2.5 text-sm text-[#575049] leading-relaxed">
                      {pkg.description}
                    </p>
                  )}

                  {pkg.items && pkg.items.length > 0 && (
                    <ul className="mt-5 space-y-2 border-t border-[#E6DFD5] pt-4 text-xs text-[#4A453F]">
                      {pkg.items.map((item) => (
                        <li key={item.id} className="flex items-center justify-between gap-2">
                          <span>
                            {item.quantity}× {item.description}
                          </span>
                          <span className="font-mono-code text-[#6B655D]">
                            {formatPoisha(item.unitPricePoisha * item.quantity, branding.currency)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleSelectPackage(pkg.id)}
                  className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#D8CFC2] bg-[#FAF8F5] px-4 py-2.5 text-xs font-semibold text-[#141312] hover:bg-[#141312] hover:text-white transition-colors"
                >
                  <span>Select for Quote Inquiry</span>
                  <ArrowRightIcon className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Approved & Published Portfolio */}
      <section id="portfolio" className="border-y border-[#E6DFD5] bg-white/70">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6B655D]">
                Selected Works
              </p>
              <h2 className="font-display text-3xl sm:text-4xl font-semibold text-[#141312] mt-1">
                Approved Showcase
              </h2>
            </div>
            <CameraIcon className="w-6 h-6 text-[#6B655D]" />
          </div>

          {portfolio.length === 0 ? (
            <div className="atelier-card p-10 text-center text-sm text-[#6B655D]">
              Approved portfolio stories will appear here once published by {branding.displayName}.
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {portfolio.map((item) => (
                <article
                  key={item.id}
                  className="atelier-card atelier-card-hover overflow-hidden flex flex-col"
                >
                  <div className="aspect-[4/3] bg-[#EFE9DF] relative overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.mediaUrl}
                      alt={item.title}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="p-5">
                    <h3 className="font-display text-xl font-semibold text-[#141312]">
                      {item.title}
                    </h3>
                    {item.description && (
                      <p className="mt-1.5 text-xs text-[#6B655D] leading-relaxed">
                        {item.description}
                      </p>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Inquiry Section */}
      <section id="inquire" className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
        <InquiryForm
          branding={branding}
          packages={packages}
          selectedPackageId={selectedPackageId}
          onPackageChange={setSelectedPackageId}
        />
      </section>
    </div>
  );
}
