'use client';

import React, { useState } from 'react';
import {
  EventType,
  PortfolioItem,
  PortfolioShowcaseEvent,
  PublicBranding,
  StudioPackage,
} from '@/types/event-management';
import { formatPoisha } from '@/lib/utils';
import {
  ArrowRightIcon,
  CalendarIcon,
  CheckCircleIcon,
  SparklesIcon,
} from '@/components/shared/Icons';
import { InquiryForm } from './InquiryForm';
import { PublicPortfolioShowcase } from './PublicPortfolioShowcase';

interface PublicAgencyHomeProps {
  branding: PublicBranding;
  eventTypes: EventType[];
  packages: StudioPackage[];
  portfolio: PortfolioItem[];
  portfolioEvents?: PortfolioShowcaseEvent[];
  isBackendConnected: boolean;
  initialPackageId?: string;
}

export function PublicAgencyHome({
  branding,
  eventTypes,
  packages,
  portfolio,
  portfolioEvents = [],
  isBackendConnected,
  initialPackageId = '',
}: PublicAgencyHomeProps) {
  const [selectedPackageId, setSelectedPackageId] = useState<string>(initialPackageId);
  const primary = branding.themeTokens.primaryColor || '#0F172A';
  const accent = branding.themeTokens.accentColor || '#4F46E5';

  const handleSelectPackage = (id: string) => {
    setSelectedPackageId(id);
    const el = document.getElementById('inquire');
    el?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="flex-1">
      {!isBackendConnected && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-center text-xs font-medium text-amber-900">
          Preview Mode: Start the NestJS API server and run the database seed to load the live
          studio catalog and submit inquiries.
        </div>
      )}

      {/* Modern Hero */}
      <section className="relative overflow-hidden border-b border-slate-200 bg-white">
        <div
          className="absolute inset-0 opacity-[0.07] pointer-events-none"
          style={{
            background: `radial-gradient(circle at 15% 20%, ${accent}, transparent 50%), radial-gradient(circle at 85% 75%, ${primary}, transparent 45%)`,
          }}
        />
        <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-xs font-medium text-slate-700">
                <SparklesIcon className="w-3.5 h-3.5" style={{ color: accent }} />
                <span>
                  {branding.displayName} • {branding.timezone}
                </span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-bold tracking-tight text-slate-900 leading-[1.1]">
                Plan your event simply and clearly.
              </h1>

              <p className="text-base sm:text-lg text-slate-600 max-w-xl leading-relaxed">
                See clear packages, get an exact price quote, check open dates, and track your
                event from start to finish.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <a
                  href="#inquire"
                  className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:opacity-90 active:scale-[0.98]"
                  style={{ backgroundColor: accent }}
                >
                  <span>Ask for a Date &amp; Price</span>
                  <ArrowRightIcon className="w-4 h-4" />
                </a>
                <a
                  href="#packages"
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300 transition-colors"
                >
                  See Packages
                </a>
                <a
                  href="#portfolio"
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300 transition-colors"
                >
                  Explore Gallery
                </a>
              </div>
            </div>

            {/* Workflow Summary Card */}
            <div className="lg:col-span-5">
              <div className="atelier-card p-6 sm:p-7 space-y-5 bg-white">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
                      How It Works
                    </p>
                    <p className="text-lg font-bold tracking-tight text-slate-900 mt-0.5">
                      3 Easy Steps to Book
                    </p>
                  </div>
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                    <CalendarIcon className="w-5 h-5" />
                  </span>
                </div>

                <ul className="space-y-4 text-sm text-slate-700">
                  {[
                    {
                      step: '01',
                      title: 'Ask for a Date & Price',
                      desc: 'Tell us your event date and get a clear, itemized price list.',
                    },
                    {
                      step: '02',
                      title: 'Pay Advance & Book',
                      desc: 'Confirm your booking so no one else can take your date.',
                    },
                    {
                      step: '03',
                      title: 'Get Your Photos & Files',
                      desc: 'Track every photo gallery, video, or item until it is delivered.',
                    },
                  ].map((item) => (
                    <li key={item.step} className="flex items-start gap-3.5">
                      <span
                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-xs font-mono-code font-bold text-white mt-0.5"
                        style={{ backgroundColor: accent }}
                      >
                        {item.step}
                      </span>
                      <div>
                        <p className="font-semibold text-slate-900">{item.title}</p>
                        <p className="text-sm text-slate-500 mt-0.5 leading-relaxed">{item.desc}</p>
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
      <section id="packages" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 scroll-mt-16">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
              Our Offerings
            </p>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-slate-900 mt-1">
              Event Packages
            </h2>
          </div>
          <p className="text-sm text-slate-500 max-w-md">
            Every package can be adjusted to fit your event before you book.
          </p>
        </div>

        {packages.length === 0 ? (
          <div className="atelier-card p-10 text-center text-sm text-slate-500">
            No packages listed yet. Send us a message below and we will make a custom price quote
            for your event.
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {packages.map((pkg) => {
              const isSelected = selectedPackageId === pkg.id;
              return (
                <div
                  key={pkg.id}
                  className={`atelier-card atelier-card-hover flex flex-col justify-between p-6 ${
                    isSelected ? 'ring-2 ring-indigo-600/25 border-indigo-500' : ''
                  }`}
                >
                  <div>
                    {pkg.eventType && (
                      <span className="inline-block mb-2 rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-indigo-700">
                        {pkg.eventType.name}
                      </span>
                    )}
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-lg font-bold tracking-tight text-slate-900">
                        {pkg.name}
                      </h3>
                      <span
                        className="rounded-lg px-2.5 py-1 text-xs font-mono-code font-semibold text-white shrink-0 tabular-nums"
                        style={{ backgroundColor: primary }}
                      >
                        {formatPoisha(pkg.basePricePoisha, branding.currency)}
                      </span>
                    </div>
                    {pkg.description && (
                      <p className="mt-2.5 text-sm text-slate-600 leading-relaxed">
                        {pkg.description}
                      </p>
                    )}

                    {pkg.items && pkg.items.length > 0 && (
                      <ul className="mt-5 space-y-2 border-t border-slate-100 pt-4 text-xs text-slate-600">
                        {pkg.items.map((item) => (
                          <li key={item.id} className="flex items-center justify-between gap-2">
                            <span>
                              {item.quantity}× {item.description}
                            </span>
                            <span className="font-mono-code text-slate-500 tabular-nums">
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
                    className={`mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-600 text-white shadow-sm'
                        : 'border-slate-200 bg-slate-50 text-slate-800 hover:bg-slate-900 hover:text-white hover:border-slate-900'
                    }`}
                  >
                    {isSelected ? (
                      <>
                        <CheckCircleIcon className="w-3.5 h-3.5" />
                        <span>Selected for Quote</span>
                      </>
                    ) : (
                      <>
                        <span>Select for Quote Inquiry</span>
                        <ArrowRightIcon className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Strict Viewport-Lazy Gallery & Showcase Section (Nothing loads until user scrolls here!) */}
      <PublicPortfolioShowcase
        branding={branding}
        portfolio={portfolio}
        portfolioEvents={portfolioEvents}
      />

      {/* Inquiry Section */}
      <section id="inquire" className="mx-auto max-w-4xl px-4 py-16 sm:px-6 scroll-mt-16">
        <InquiryForm
          branding={branding}
          eventTypes={eventTypes}
          packages={packages}
          selectedPackageId={selectedPackageId}
          onPackageChange={setSelectedPackageId}
        />
      </section>
    </div>
  );
}
