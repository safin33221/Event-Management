'use client';

import React, { useState } from 'react';
import {
  EventType,
  PortfolioItem,
  PortfolioShowcaseEvent,
  PublicBranding,
  StudioPackage,
} from '@/types/event-management';
import { formatLocalDate, formatPoisha } from '@/lib/utils';
import {
  ArrowRightIcon,
  CalendarIcon,
  CameraIcon,
  CheckCircleIcon,
  SparklesIcon,
} from '@/components/shared/Icons';
import {
  buildCloudinaryImageUrl,
  buildCloudinarySrcSet,
  parseShowcaseMedia,
} from '@/lib/showcaseMedia';
import { InquiryForm } from './InquiryForm';
import { PortfolioEventDetailModal } from './PortfolioEventDetailModal';
import { ShowcaseLightboxModal } from './ShowcaseLightboxModal';

interface PublicAgencyHomeProps {
  branding: PublicBranding;
  eventTypes: EventType[];
  packages: StudioPackage[];
  portfolio: PortfolioItem[];
  portfolioEvents?: PortfolioShowcaseEvent[];
  isBackendConnected: boolean;
}

export function PublicAgencyHome({
  branding,
  eventTypes,
  packages,
  portfolio,
  portfolioEvents = [],
  isBackendConnected,
}: PublicAgencyHomeProps) {
  const [selectedPackageId, setSelectedPackageId] = useState<string>('');
  const [showcaseFilter, setShowcaseFilter] = useState<'all' | 'photo' | 'video'>('all');
  const [activeShowcaseItem, setActiveShowcaseItem] = useState<PortfolioItem | null>(null);
  const [activeShowcaseEvent, setActiveShowcaseEvent] = useState<PortfolioShowcaseEvent | null>(
    null,
  );
  const primary = branding.themeTokens.primaryColor || '#0F172A';
  const accent = branding.themeTokens.accentColor || '#4F46E5';

  const filteredPortfolioEvents = portfolioEvents.filter((ev) => {
    if (showcaseFilter === 'all') return true;
    if (showcaseFilter === 'video') return (ev.counts?.videos ?? 0) > 0;
    return (ev.counts?.photos ?? 0) > 0;
  });

  const filteredPortfolio = portfolio.filter((item) => {
    if (showcaseFilter === 'all') return true;
    return parseShowcaseMedia(item.mediaUrl).kind === showcaseFilter;
  });

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
      <section id="packages" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
              Our Offerings
            </p>
            <h2 className="text-2xl sm:text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 mt-1">
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
                    className={`mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all ${
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

      {/* Approved & Published Portfolio (Photo Galleries & Video Films) */}
      <section id="portfolio" className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
                Our Work
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mt-1">
                Photo Galleries &amp; Video Films
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1 gap-1">
                {[
                  { id: 'all' as const, label: 'All' },
                  { id: 'photo' as const, label: 'Photo Galleries' },
                  { id: 'video' as const, label: 'Video Films' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setShowcaseFilter(tab.id)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                      showcaseFilter === tab.id
                        ? 'bg-slate-900 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              <span className="hidden sm:flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                <CameraIcon className="w-5 h-5" />
              </span>
            </div>
          </div>

          {filteredPortfolioEvents.length === 0 && filteredPortfolio.length === 0 ? (
            <div className="atelier-card p-10 text-center text-sm text-slate-500 bg-slate-50">
              {portfolioEvents.length === 0 && portfolio.length === 0
                ? `Approved photo galleries and video films will appear here once published by ${branding.displayName}.`
                : 'No items match this filter yet.'}
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {/* Published Portfolio Showcase Events (Cover + Title + Event Date + Gallery/Video Counts) */}
              {filteredPortfolioEvents.map((ev, idx) => {
                const rawCoverUrl = ev.coverMedia?.secureUrl || '';
                const coverUrl =
                  ev.coverMedia?.deliveryUrls?.coverUrl ||
                  buildCloudinaryImageUrl(rawCoverUrl, { width: 800, crop: 'limit' });
                const isFirstRow = idx < 3;

                return (
                  <button
                    key={ev.id}
                    type="button"
                    onClick={() => setActiveShowcaseEvent(ev)}
                    className="group text-left atelier-card atelier-card-hover overflow-hidden flex flex-col cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40"
                  >
                    <div className="aspect-[4/3] w-full bg-slate-100 relative overflow-hidden">
                      {coverUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={coverUrl}
                          srcSet={rawCoverUrl ? buildCloudinarySrcSet(rawCoverUrl) : undefined}
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 380px"
                          alt={ev.coverMedia?.altText || ev.title}
                          loading={isFirstRow ? 'eager' : 'lazy'}
                          fetchPriority={isFirstRow ? 'high' : 'auto'}
                          decoding="async"
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center bg-slate-900 text-slate-400 text-xs font-medium">
                          Showcase Event
                        </div>
                      )}

                      <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-slate-950/75 backdrop-blur-xs px-3 py-1 text-xs font-medium text-white">
                        {ev.counts?.photos ? `${ev.counts.photos} Photos` : 'Showcase'}
                        {ev.counts?.videos ? ` • ${ev.counts.videos} Video` : ''}
                      </span>
                    </div>

                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-1">
                          {ev.eventDate && (
                            <span className="font-mono-code">
                              {formatLocalDate(ev.eventDate)}
                            </span>
                          )}
                          {ev.eventType && (
                            <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700">
                              {ev.eventType.name}
                            </span>
                          )}
                        </div>
                        <h3 className="text-lg font-semibold tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors">
                          {ev.title}
                        </h3>
                        {ev.description && (
                          <p className="mt-1.5 text-sm text-slate-600 leading-relaxed line-clamp-2">
                            {ev.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}

              {/* Legacy Portfolio Items */}
              {filteredPortfolio.map((item, idx) => {
                const parsed = parseShowcaseMedia(item.mediaUrl);
                const isFirstRow = filteredPortfolioEvents.length + idx < 3;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveShowcaseItem(item)}
                    className="group text-left atelier-card atelier-card-hover overflow-hidden flex flex-col cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40"
                  >
                    <div className="aspect-[4/3] w-full bg-slate-100 relative overflow-hidden">
                      {parsed.coverUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={buildCloudinaryImageUrl(parsed.coverUrl, {
                            width: 800,
                            crop: 'limit',
                          })}
                          srcSet={buildCloudinarySrcSet(parsed.coverUrl)}
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 380px"
                          alt={item.title}
                          loading={isFirstRow ? 'eager' : 'lazy'}
                          fetchPriority={isFirstRow ? 'high' : 'auto'}
                          decoding="async"
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center bg-slate-900 text-slate-400 text-xs font-medium">
                          Video Film
                        </div>
                      )}

                      {/* Media type badge */}
                      <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-slate-950/75 backdrop-blur-xs px-3 py-1 text-xs font-medium text-white">
                        {parsed.kind === 'video'
                          ? '▶ Video Film'
                          : parsed.photos.length > 1
                            ? `Gallery • ${parsed.photos.length} Photos`
                            : 'Photo'}
                      </span>

                      {parsed.kind === 'video' && (
                        <span className="absolute inset-0 flex items-center justify-center">
                          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-slate-900 shadow-lg transition-transform duration-200 group-hover:scale-110">
                            ▶
                          </span>
                        </span>
                      )}
                    </div>
                    <div className="p-5 flex-1">
                      <h3 className="text-lg font-semibold tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors">
                        {item.title}
                      </h3>
                      {item.description && (
                        <p className="mt-1.5 text-sm text-slate-600 leading-relaxed line-clamp-2">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {activeShowcaseEvent && (
        <PortfolioEventDetailModal
          event={activeShowcaseEvent}
          onClose={() => setActiveShowcaseEvent(null)}
        />
      )}

      {activeShowcaseItem && (
        <ShowcaseLightboxModal
          item={activeShowcaseItem}
          onClose={() => setActiveShowcaseItem(null)}
        />
      )}

      {/* Inquiry Section */}
      <section id="inquire" className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
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
