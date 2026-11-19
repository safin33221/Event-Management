'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  EventType,
  PortfolioItem,
  PortfolioShowcaseEvent,
  PublicBranding,
  StudioPackage,
} from '@/types/event-management';
import { parseAlbumDescriptionAndTheme } from '@/lib/albumTheme';
import { isNextOptimizableUrl } from './LazyAlbumImage';
import { formatPoisha } from '@/lib/utils';
import {
  ArrowRightIcon,
  CalendarIcon,
  CameraIcon,
  CheckCircleIcon,
  SparklesIcon,
} from '@/components/shared/Icons';
import { InquiryForm } from './InquiryForm';
import { PublicPortfolioShowcase } from './PublicPortfolioShowcase';
import { cn } from '@/lib/utils';

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
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('ALL');

  const primary = branding.themeTokens.primaryColor || '#181216';
  const secondary = branding.themeTokens.secondaryColor || '#C98A2C';
  const accent = branding.themeTokens.accentColor || '#B91C47';

  const allClientPortfolios = useMemo(() => {
    return [...portfolioEvents]
      .filter((ev) => ev.slug !== 'studio-media-gallery')
      .sort((a, b) => {
        const scoreA =
          (a.coverMedia ? 1000 : 0) +
          (a.counts?.videos ?? 0) * 15 +
          (a.counts?.photos ?? 0) * 2;
        const scoreB =
          (b.coverMedia ? 1000 : 0) +
          (b.counts?.videos ?? 0) * 15 +
          (b.counts?.photos ?? 0) * 2;
        if (scoreB !== scoreA) return scoreB - scoreA;
        return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
      });
  }, [portfolioEvents]);

  const bestThreePortfolios = useMemo(
    () => allClientPortfolios.slice(0, 3),
    [allClientPortfolios],
  );

  const packageCategories = useMemo(() => {
    const ids = new Set(packages.map((p) => p.eventTypeId).filter(Boolean));
    return eventTypes.filter((et) => ids.has(et.id));
  }, [packages, eventTypes]);

  const filteredPackages = useMemo(() => {
    if (selectedCategoryId === 'ALL') return packages;
    return packages.filter((p) => p.eventTypeId === selectedCategoryId);
  }, [packages, selectedCategoryId]);

  const handleSelectPackage = (id: string) => {
    setSelectedPackageId(id);
    const el = document.getElementById('inquire');
    el?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="flex-1 bg-[#FDFBF7] text-[#181216]">
      {!isBackendConnected && (
        <div className="bg-[#FEF7EC] border-b border-[#F3DEC0] px-4 py-2 text-center text-xs font-medium text-[#7C4D12]">
          Preview Mode: Start the NestJS API server and run the database seed to load the live
          Rongilo studio catalog and submit inquiries.
        </div>
      )}

      {/* Editorial Asymmetric Hero */}
      <section className="relative overflow-hidden border-b border-[#EAE2D6] bg-[#FDFBF7]">
        <div
          className="absolute inset-0 opacity-[0.11] pointer-events-none"
          style={{
            background: `radial-gradient(circle at 12% 18%, ${accent} 0%, transparent 45%), radial-gradient(circle at 88% 72%, ${secondary} 0%, transparent 45%)`,
          }}
        />
        <div className="relative mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-22">
          <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#E5D8C6] bg-white/90 px-4 py-1.5 text-xs font-semibold text-[#4A3F45] shadow-2xs">
                <SparklesIcon className="w-3.5 h-3.5" style={{ color: accent }} />
                <span>{branding.displayName}</span>
                <span className="text-[#D4C5B2]">•</span>
                <span className="text-[#8E5B17]">Signature Celebrations</span>
              </div>

              <h1 className="font-editorial text-4xl sm:text-5xl lg:text-[3.85rem] font-semibold text-[#181216] leading-[1.06]">
                Celebrating every milestone with{' '}
                <span className="italic" style={{ color: accent }}>
                  color, craft &amp; clarity.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-[#54474E] max-w-xl leading-relaxed">
                From grand weddings and cultural holuds to executive corporate galas—explore
                transparent packages, receive itemized quotes, lock your event date, and relive
                every frame in a bespoke digital album.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <a
                  href="#inquire"
                  className="inline-flex items-center gap-2 rounded-xl px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition-all hover:opacity-95 active:scale-[0.98]"
                  style={{ backgroundColor: accent }}
                >
                  <span>Reserve Your Date</span>
                  <ArrowRightIcon className="w-4 h-4" />
                </a>
                <a
                  href="#packages"
                  className="inline-flex items-center gap-2 rounded-xl border border-[#DFD5C7] bg-white px-5 py-3.5 text-sm font-semibold text-[#2E242B] hover:bg-[#F7F3EB] hover:border-[#CBBDA9] transition-colors"
                >
                  Explore Packages
                </a>
                {bestThreePortfolios.length > 0 && (
                  <a
                    href="#featured-portfolios"
                    className="inline-flex items-center gap-2 rounded-xl border border-transparent px-4 py-3.5 text-sm font-semibold text-[#6B5A62] hover:text-[#181216] transition-colors"
                  >
                    Client Albums →
                  </a>
                )}
              </div>

              {/* Architectural Assurance Strip */}
              <div className="grid grid-cols-3 gap-4 pt-5 border-t border-[#EAE2D6]/90 max-w-lg">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-[#181216]">
                    Itemized
                  </p>
                  <p className="text-xs text-[#6B5A62] mt-0.5">Clear {branding.currency} quotes</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-[#181216]">
                    Date-Locked
                  </p>
                  <p className="text-xs text-[#6B5A62] mt-0.5">Zero crew clashes</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-[#181216]">
                    Digital Album
                  </p>
                  <p className="text-xs text-[#6B5A62] mt-0.5">Custom themed delivery</p>
                </div>
              </div>
            </div>

            {/* Journey Atelier Card */}
            <div className="lg:col-span-5">
              <div className="atelier-card p-6 sm:p-7 space-y-5 bg-white shadow-[0_24px_60px_-24px_rgba(24,18,22,0.14)]">
                <div className="flex items-center justify-between border-b border-[#EFE8DC] pb-4">
                  <div>
                    <p
                      className="text-[11px] font-bold uppercase tracking-[0.18em]"
                      style={{ color: accent }}
                    >
                      The Rongilo Experience
                    </p>
                    <p className="font-editorial text-2xl font-semibold text-[#181216] mt-0.5">
                      3 Effortless Steps to Book
                    </p>
                  </div>
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F7F3EB] text-[#8E5B17] border border-[#EAE2D6]">
                    <CalendarIcon className="w-5 h-5" />
                  </span>
                </div>

                <ul className="space-y-4 text-sm text-[#3B3036]">
                  {[
                    {
                      step: '01',
                      title: 'Request Date & Custom Quote',
                      desc: 'Share your celebration details and receive an itemized PDF quote tailored to your budget.',
                    },
                    {
                      step: '02',
                      title: 'Confirm Advance & Lock Crew',
                      desc: 'Verify your booking deposit to exclusively reserve our photography & cinema team.',
                    },
                    {
                      step: '03',
                      title: 'Relive Through Digital Albums',
                      desc: 'Track deliverables on schedule and share your custom-themed gallery & film worldwide.',
                    },
                  ].map((item) => (
                    <li key={item.step} className="flex items-start gap-3.5">
                      <span
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-mono-code font-bold text-white mt-0.5 shadow-2xs"
                        style={{ backgroundColor: accent }}
                      >
                        {item.step}
                      </span>
                      <div>
                        <p className="font-semibold text-[#181216]">{item.title}</p>
                        <p className="text-xs sm:text-sm text-[#6B5A62] mt-0.5 leading-relaxed">
                          {item.desc}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>

                <div className="pt-3 border-t border-[#EFE8DC] flex items-center justify-between text-xs text-[#6B5A62]">
                  <span>Studio hours in {branding.timezone}</span>
                  <a
                    href="#inquire"
                    className="font-semibold hover:underline underline-offset-4"
                    style={{ color: accent }}
                  >
                    Ask Availability →
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Celebrations We Curate Ribbon */}
      {eventTypes.length > 0 && (
        <section className="border-b border-[#EAE2D6] bg-[#F7F3EB]/75">
          <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6 flex flex-wrap items-center justify-between gap-3">
            <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#7D6860]">
              Celebrations We Curate:
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {eventTypes.map((et) => (
                <a
                  key={et.id}
                  href="#packages"
                  onClick={() => {
                    if (packageCategories.some((c) => c.id === et.id)) {
                      setSelectedCategoryId(et.id);
                    }
                  }}
                  className="rounded-full border border-[#E2D8C8] bg-white px-3.5 py-1 text-xs font-medium text-[#3B3036] hover:border-[#B91C47]/40 hover:text-[#B91C47] transition-colors"
                >
                  {et.name}
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Highlighted Best 3 Client Portfolios Section (Obsidian Cinema Stage) */}
      {bestThreePortfolios.length > 0 && (
        <section
          id="featured-portfolios"
          className="border-b border-[#2D232A] bg-[#141013] text-[#FAF6F0] scroll-mt-16"
        >
          <div className="mx-auto max-w-6xl px-4 py-16 sm:py-20 sm:px-6 space-y-10">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5">
              <div className="space-y-2.5">
                <div className="inline-flex items-center gap-2 rounded-full border border-[#C98A2C]/35 bg-[#C98A2C]/15 px-3.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#E9BE78]">
                  <CameraIcon className="w-3.5 h-3.5" />
                  <span>Featured Client Portfolios</span>
                </div>
                <h2 className="font-editorial text-3xl sm:text-4xl lg:text-[2.75rem] font-semibold text-white leading-tight">
                  Signature Digital Albums &amp; Cinema
                </h2>
                <p className="text-sm text-[#BFB2A7] max-w-xl leading-relaxed">
                  Handpicked client celebrations delivered as custom-themed Digital Albums with
                  high-resolution editorial photography and highlight films.
                </p>
              </div>

              <Link
                href="/portfolio"
                className="inline-flex items-center gap-2 rounded-xl bg-[#FAF6F0] px-5 py-2.5 text-xs sm:text-sm font-semibold text-[#181216] hover:bg-white transition-colors shrink-0 shadow-sm"
              >
                <span>See All Portfolios ({allClientPortfolios.length})</span>
                <ArrowRightIcon className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {bestThreePortfolios.map((ev, index) => {
                const coverItem =
                  ev.coverMedia ||
                  (ev.media || []).find((m) => m.resourceType === 'IMAGE' && m.status === 'READY') ||
                  null;
                const coverSrc = coverItem?.secureUrl || '';
                const photoCount = ev.counts?.photos ?? 0;
                const videoCount = ev.counts?.videos ?? 0;
                const { theme } = parseAlbumDescriptionAndTheme(ev.description);

                return (
                  <Link
                    key={ev.id}
                    href={`/album/${ev.slug}`}
                    className="group rounded-2xl border border-white/12 bg-[#1D171B] overflow-hidden flex flex-col justify-between transition-all duration-300 hover:border-[#C98A2C]/55 hover:-translate-y-1 hover:shadow-2xl"
                  >
                    <div>
                      <div className="relative aspect-[4/3] w-full bg-[#241C21] overflow-hidden">
                        {coverSrc ? (
                          <Image
                            src={coverSrc}
                            alt={coverItem?.altText || ev.title}
                            fill
                            quality={90}
                            unoptimized={!isNextOptimizableUrl(coverSrc)}
                            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 384px"
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-xs text-[#9C8E83]">
                            Digital Album
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#141013]/85 via-transparent to-transparent" />

                        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-black/65 backdrop-blur-xs px-3 py-1 text-[11px] font-semibold text-white">
                            {photoCount} Photos{videoCount > 0 ? ` • ${videoCount} Film` : ''}
                          </span>
                          <span className="rounded-full bg-[#E6B86A] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#181216]">
                            #{index + 1} Featured
                          </span>
                        </div>
                      </div>

                      <div className="p-5 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          {ev.eventType ? (
                            <span className="inline-block rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#E9BE78]">
                              {ev.eventType.name}
                            </span>
                          ) : (
                            <span />
                          )}
                          <span
                            style={{ backgroundColor: theme.accent }}
                            title="Custom album accent color"
                            className="h-3 w-3 rounded-full border border-white/60 shrink-0"
                          />
                        </div>
                        <h3 className="font-editorial text-2xl font-semibold text-white group-hover:text-[#E9BE78] transition-colors line-clamp-2 leading-snug">
                          {ev.title}
                        </h3>
                      </div>
                    </div>

                    <div className="px-5 py-3.5 border-t border-white/10 bg-white/[0.02] flex items-center justify-between text-xs font-semibold text-[#D8CEC3] group-hover:text-[#E9BE78]">
                      <span>Open Digital Album</span>
                      <ArrowRightIcon className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Curated Packages & Collections */}
      <section
        id="packages"
        className="border-b border-[#EAE2D6] bg-[#F7F3EB]/60 scroll-mt-16"
      >
        <div className="mx-auto max-w-6xl px-4 py-16 sm:py-20 sm:px-6 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <p
                className="text-[11px] font-bold uppercase tracking-[0.2em]"
                style={{ color: accent }}
              >
                Tailored Collections
              </p>
              <h2 className="font-editorial text-3xl sm:text-4xl lg:text-[2.75rem] font-semibold text-[#181216] mt-1">
                Curated Event Packages
              </h2>
            </div>
            <p className="text-sm text-[#54474E] max-w-md">
              Transparent starting collections—every line item can be customized in your final quote.
            </p>
          </div>

          {packageCategories.length > 1 && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedCategoryId('ALL')}
                className={cn(
                  'rounded-full px-4 py-1.5 text-xs font-semibold transition-colors cursor-pointer',
                  selectedCategoryId === 'ALL'
                    ? 'bg-[#181216] text-white'
                    : 'bg-white border border-[#E2D8C8] text-[#4A3F45] hover:border-[#B91C47]/40',
                )}
              >
                All Collections ({packages.length})
              </button>
              {packageCategories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategoryId(cat.id)}
                  className={cn(
                    'rounded-full px-4 py-1.5 text-xs font-semibold transition-colors cursor-pointer',
                    selectedCategoryId === cat.id
                      ? 'bg-[#181216] text-white'
                      : 'bg-white border border-[#E2D8C8] text-[#4A3F45] hover:border-[#B91C47]/40',
                  )}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          )}

          {filteredPackages.length === 0 ? (
            <div className="atelier-card p-10 text-center text-sm text-[#6B5A62] bg-white">
              No packages listed yet. Send us a message below and we will craft a custom quote for
              your celebration.
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredPackages.map((pkg) => {
                const isSelected = selectedPackageId === pkg.id;
                return (
                  <div
                    key={pkg.id}
                    className={cn(
                      'atelier-card atelier-card-hover flex flex-col justify-between p-6 bg-white',
                      isSelected ? 'ring-2 ring-[#B91C47]/30 border-[#B91C47]' : '',
                    )}
                  >
                    <div>
                      {pkg.eventType && (
                        <span className="inline-block mb-2.5 rounded-full bg-[#FEF7EC] border border-[#F3DEC0] px-3 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-[#8E5B17]">
                          {pkg.eventType.name}
                        </span>
                      )}
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="font-editorial text-2xl font-semibold text-[#181216] leading-snug">
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
                        <p className="mt-2.5 text-sm text-[#54474E] leading-relaxed">
                          {pkg.description}
                        </p>
                      )}

                      {pkg.items && pkg.items.length > 0 && (
                        <ul className="mt-5 space-y-2 border-t border-[#EFE8DC] pt-4 text-xs text-[#4A3F45]">
                          {pkg.items.map((item) => (
                            <li key={item.id} className="flex items-center justify-between gap-2">
                              <span>
                                {item.quantity}× {item.description}
                              </span>
                              <span className="font-mono-code text-[#7D6860] tabular-nums">
                                {formatPoisha(
                                  item.unitPricePoisha * item.quantity,
                                  branding.currency,
                                )}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSelectPackage(pkg.id)}
                      className={cn(
                        'mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all cursor-pointer',
                        isSelected
                          ? 'text-white shadow-sm'
                          : 'border-[#E2D8C8] bg-[#FAF6EE] text-[#181216] hover:bg-[#181216] hover:text-white hover:border-[#181216]',
                      )}
                      style={
                        isSelected
                          ? { backgroundColor: accent, borderColor: accent }
                          : undefined
                      }
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
        </div>
      </section>

      {/* Strict Viewport-Lazy Visual Showcase & Gallery */}
      <PublicPortfolioShowcase
        branding={branding}
        portfolio={portfolio}
        portfolioEvents={portfolioEvents}
      />

      {/* Concierge Inquiry Section */}
      <section id="inquire" className="bg-[#F7F3EB]/65 scroll-mt-16">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:py-20 sm:px-6 space-y-6">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <p
              className="text-[11px] font-bold uppercase tracking-[0.2em]"
              style={{ color: accent }}
            >
              Date Availability &amp; Custom Proposal
            </p>
            <h2 className="font-editorial text-3xl sm:text-4xl font-semibold text-[#181216]">
              Begin Your Celebration with {branding.displayName}
            </h2>
            <p className="text-sm text-[#54474E]">
              Tell us your event date and preferred collection. Our coordinator replies with a
              clear, itemized quote.
            </p>
          </div>
          <InquiryForm
            branding={branding}
            eventTypes={eventTypes}
            packages={packages}
            selectedPackageId={selectedPackageId}
            onPackageChange={setSelectedPackageId}
          />
        </div>
      </section>
    </div>
  );
}
