'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  EventType,
  PortfolioItem,
  PortfolioShowcaseEvent,
  PublicBranding,
  StudioPackage,
} from '@/types/event-management';
import {
  ArrowRightIcon,
  CalendarIcon,
  CameraIcon,
  PaletteIcon,
  SparklesIcon,
} from '@/components/shared/Icons';
import { InquiryForm } from './InquiryForm';

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
  const showcaseCount = portfolioEvents.length + portfolio.length;

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
                <Link
                  href="/packages"
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300 transition-colors"
                >
                  See Packages
                </Link>
                <Link
                  href="/showcase"
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300 transition-colors"
                >
                  View Showcase
                </Link>
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

      {/* Explore Dedicated Routes Strip: Packages & Public Showcase */}
      <section className="mx-auto max-w-6xl px-4 pt-14 pb-4 sm:px-6">
        <div className="grid gap-6 md:grid-cols-2">
          <Link
            href="/packages"
            className="atelier-card atelier-card-hover p-6 flex items-center justify-between gap-4 group"
          >
            <div className="flex items-start gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <PaletteIcon className="w-5 h-5" />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
                  {packages.length} {packages.length === 1 ? 'Package' : 'Packages'}
                </p>
                <h2 className="text-lg font-bold tracking-tight text-slate-900 mt-0.5 group-hover:text-indigo-600 transition-colors">
                  Browse Event Packages
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  Compare transparent pricing and select a package for your quote.
                </p>
              </div>
            </div>
            <ArrowRightIcon className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 shrink-0 transition-colors" />
          </Link>

          <Link
            href="/showcase"
            className="atelier-card atelier-card-hover p-6 flex items-center justify-between gap-4 group"
          >
            <div className="flex items-start gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <CameraIcon className="w-5 h-5" />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
                  {showcaseCount} {showcaseCount === 1 ? 'Story' : 'Stories'}
                </p>
                <h2 className="text-lg font-bold tracking-tight text-slate-900 mt-0.5 group-hover:text-emerald-700 transition-colors">
                  Photo Galleries &amp; Video Films
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  Explore approved event photography albums and highlight films.
                </p>
              </div>
            </div>
            <ArrowRightIcon className="w-5 h-5 text-slate-400 group-hover:text-emerald-700 shrink-0 transition-colors" />
          </Link>
        </div>
      </section>

      {/* Inquiry Section */}
      <section id="inquire" className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
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
