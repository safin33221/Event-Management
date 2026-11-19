'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  PortfolioItem,
  PortfolioMediaItem,
  PortfolioShowcaseEvent,
  PublicBranding,
} from '@/types/event-management';
import {
  getPublicGalleryMedia,
  getPublicPortfolioEvents,
} from '@/service/catalog/catalog.service';
import {
  buildCloudinaryImageUrl,
  buildCloudinarySrcSet,
  buildCloudinaryVideoPosterUrl,
  parseShowcaseMedia,
} from '@/lib/showcaseMedia';
import { parseAlbumDescriptionAndTheme } from '@/lib/albumTheme';
import { cn, formatLocalDate } from '@/lib/utils';
import { ArrowRightIcon, CalendarIcon, CameraIcon, SearchIcon } from '@/components/shared/Icons';
import { AdaptiveVideoPlayer } from './AdaptiveVideoPlayer';
import { LazyViewportImage } from './LazyViewportImage';
import { PortfolioEventDetailModal } from './PortfolioEventDetailModal';
import { ShowcaseLightboxModal } from './ShowcaseLightboxModal';

interface PublicPortfolioShowcaseProps {
  branding: PublicBranding;
  portfolio: PortfolioItem[];
  portfolioEvents?: PortfolioShowcaseEvent[];
  initialGalleryMedia?: PortfolioMediaItem[];
}

const INITIAL_PHOTO_BATCH = 12;

function formatFilmDuration(seconds?: number | null): string | null {
  if (!seconds || !Number.isFinite(seconds) || seconds <= 0) return null;
  const total = Math.round(seconds);
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

function resolveNaturalAspectRatio(width?: number | null, height?: number | null): string {
  if (!width || !height || width <= 0 || height <= 0) {
    return '4 / 3';
  }
  const ratio = width / height;
  const clamped = Math.min(Math.max(ratio, 0.62), 1.75);
  return clamped.toFixed(4);
}

export function PublicPortfolioShowcase({
  branding,
  portfolio,
  portfolioEvents: initialEvents = [],
  initialGalleryMedia = [],
}: PublicPortfolioShowcaseProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  // Strict section-level gate: DO NOT fetch or mount any gallery media until user scrolls to #portfolio
  const [hasEnteredSection, setHasEnteredSection] = useState(false);
  const [isLoadingMedia, setIsLoadingMedia] = useState(false);

  const [galleryMedia, setGalleryMedia] = useState<PortfolioMediaItem[]>(initialGalleryMedia);
  const [showcaseEvents, setShowcaseEvents] = useState<PortfolioShowcaseEvent[]>(initialEvents);

  const [mediaFilter, setMediaFilter] = useState<'all' | 'photo' | 'video' | 'stories'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [visiblePhotoCount, setVisiblePhotoCount] = useState(INITIAL_PHOTO_BATCH);

  // Interactive modals & cinema theater state
  const [selectedGalleryPhoto, setSelectedGalleryPhoto] = useState<PortfolioMediaItem | null>(
    null,
  );
  const [selectedFilmId, setSelectedFilmId] = useState<string | null>(null);
  const [playingVideoIds, setPlayingVideoIds] = useState<Record<string, boolean>>({});
  const [activeShowcaseEvent, setActiveShowcaseEvent] = useState<PortfolioShowcaseEvent | null>(
    null,
  );
  const [activeShowcaseItem, setActiveShowcaseItem] = useState<PortfolioItem | null>(null);

  // 1. Observe when the user scrolls near #portfolio
  useEffect(() => {
    const el = sectionRef.current;
    if (!el || hasEnteredSection || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setHasEnteredSection(true);
            observer.disconnect();
            break;
          }
        }
      },
      {
        rootMargin: '20px 0px',
        threshold: 0.05,
      },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [hasEnteredSection]);

  // 2. Fetch gallery media on demand ONLY after the user scrolls into #portfolio
  useEffect(() => {
    if (!hasEnteredSection) return;
    let cancelled = false;

    async function loadGalleryOnScroll() {
      setIsLoadingMedia(true);
      try {
        const [galRes, evRes] = await Promise.all([
          getPublicGalleryMedia(),
          showcaseEvents.length === 0 ? getPublicPortfolioEvents() : Promise.resolve(null),
        ]);
        if (cancelled) return;
        if (galRes.ok && galRes.data) {
          setGalleryMedia(galRes.data.data);
        }
        if (evRes && evRes.ok && evRes.data) {
          setShowcaseEvents(evRes.data.data);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingMedia(false);
        }
      }
    }

    void loadGalleryOnScroll();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasEnteredSection]);

  const q = searchQuery.trim().toLowerCase();

  // Separate Videos and Photos cleanly so neither cramps the other's aspect ratio or UX
  const filteredVideos = useMemo(() => {
    if (mediaFilter !== 'all' && mediaFilter !== 'video') return [];
    return galleryMedia.filter((m) => {
      if (m.resourceType !== 'VIDEO') return false;
      if (
        q &&
        !(m.caption || '').toLowerCase().includes(q) &&
        !(m.altText || '').toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [galleryMedia, mediaFilter, q]);

  const filteredPhotos = useMemo(() => {
    if (mediaFilter !== 'all' && mediaFilter !== 'photo') return [];
    return galleryMedia.filter((m) => {
      if (m.resourceType !== 'IMAGE') return false;
      if (
        q &&
        !(m.caption || '').toLowerCase().includes(q) &&
        !(m.altText || '').toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [galleryMedia, mediaFilter, q]);

  const filteredEvents = useMemo(() => {
    if (mediaFilter !== 'stories' && !q) {
      // Event Stories have their own dedicated section ("Signature Digital Albums");
      // show them here in full detail inside the Event Stories tab or when searching.
      return [];
    }
    return showcaseEvents.filter((ev) => {
      if (mediaFilter === 'video' && (ev.counts?.videos ?? 0) === 0) return false;
      if (mediaFilter === 'photo' && (ev.counts?.photos ?? 0) === 0) return false;
      if (
        q &&
        !ev.title.toLowerCase().includes(q) &&
        !(ev.description || '').toLowerCase().includes(q) &&
        !(ev.location || '').toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [showcaseEvents, mediaFilter, q]);

  const filteredLegacyItems = useMemo(() => {
    if (mediaFilter === 'stories') return [];
    return portfolio.filter((item) => {
      const parsed = parseShowcaseMedia(item.mediaUrl);
      if (mediaFilter === 'photo' && parsed.kind !== 'photo') return false;
      if (mediaFilter === 'video' && parsed.kind !== 'video') return false;
      if (
        q &&
        !item.title.toLowerCase().includes(q) &&
        !(item.description || '').toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [portfolio, mediaFilter, q]);

  const activeFilm =
    filteredVideos.find((v) => v.id === selectedFilmId) ?? filteredVideos[0] ?? null;

  const selectedPhotoIndex = selectedGalleryPhoto
    ? filteredPhotos.findIndex((p) => p.id === selectedGalleryPhoto.id)
    : -1;

  const goPrevGalleryPhoto = () => {
    if (filteredPhotos.length <= 1 || selectedPhotoIndex === -1) return;
    setSelectedGalleryPhoto(
      filteredPhotos[(selectedPhotoIndex - 1 + filteredPhotos.length) % filteredPhotos.length],
    );
  };

  const goNextGalleryPhoto = () => {
    if (filteredPhotos.length <= 1 || selectedPhotoIndex === -1) return;
    setSelectedGalleryPhoto(filteredPhotos[(selectedPhotoIndex + 1) % filteredPhotos.length]);
  };

  useEffect(() => {
    if (!selectedGalleryPhoto) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedGalleryPhoto(null);
      } else if (e.key === 'ArrowRight') {
        goNextGalleryPhoto();
      } else if (e.key === 'ArrowLeft') {
        goPrevGalleryPhoto();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedGalleryPhoto, selectedPhotoIndex, filteredPhotos.length]);

  const photoTotalCount =
    galleryMedia.filter((m) => m.resourceType === 'IMAGE').length +
    portfolio.filter((i) => parseShowcaseMedia(i.mediaUrl).kind === 'photo').length;
  const videoTotalCount =
    galleryMedia.filter((m) => m.resourceType === 'VIDEO').length +
    portfolio.filter((i) => parseShowcaseMedia(i.mediaUrl).kind === 'video').length;

  const visiblePhotos = filteredPhotos.slice(0, visiblePhotoCount);
  const hasMorePhotos = visiblePhotoCount < filteredPhotos.length;

  const totalMatching =
    filteredVideos.length +
    filteredPhotos.length +
    filteredEvents.length +
    filteredLegacyItems.length;

  const accent = branding.themeTokens.accentColor || '#B91C47';

  return (
    <section
      id="portfolio"
      ref={sectionRef}
      className="border-y border-[#EAE2D6] bg-white scroll-mt-16"
    >
      <div className="mx-auto max-w-6xl px-4 py-16 sm:py-20 sm:px-6 space-y-10">
        {/* Section Header & Medium Switcher */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#F3DEC0] bg-[#FEF7EC] px-3.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8E5B17]">
              <CameraIcon className="w-3.5 h-3.5" />
              <span>Visual Exhibition &amp; Cinema</span>
            </div>
            <h2 className="font-editorial text-3xl sm:text-4xl lg:text-[2.75rem] font-semibold text-[#181216] mt-2">
              Captured Moments &amp; Highlight Films
            </h2>
            <p className="text-sm text-[#54474E] mt-1.5 max-w-xl">
              Cinema reels play on their dedicated widescreen theater stage, while photographs
              preserve their original uncropped portrait &amp; editorial proportions.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="inline-flex flex-wrap rounded-xl border border-[#E5DCCD] bg-[#FAF6EE] p-1 gap-1">
              {[
                { id: 'all' as const, label: 'All Showcase' },
                {
                  id: 'photo' as const,
                  label: photoTotalCount > 0 ? `Photography (${photoTotalCount})` : 'Photography',
                },
                {
                  id: 'video' as const,
                  label: videoTotalCount > 0 ? `Cinema Films (${videoTotalCount})` : 'Cinema Films',
                },
                ...(showcaseEvents.length > 0
                  ? [
                      {
                        id: 'stories' as const,
                        label: `Event Stories (${showcaseEvents.length})`,
                      },
                    ]
                  : []),
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setMediaFilter(tab.id);
                    setVisiblePhotoCount(INITIAL_PHOTO_BATCH);
                  }}
                  className={cn(
                    'rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer',
                    mediaFilter === tab.id
                      ? 'bg-[#181216] text-white shadow-2xs'
                      : 'text-[#54474E] hover:text-[#181216]',
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-52">
              <SearchIcon className="w-3.5 h-3.5 text-[#8A756B] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setVisiblePhotoCount(INITIAL_PHOTO_BATCH);
                }}
                placeholder="Search moments or films..."
                className="w-full rounded-xl border border-[#DFD5C7] bg-[#FDFBF7] pl-8 pr-3 py-1.5 text-xs text-[#181216] placeholder:text-[#9A8A80] outline-none focus:border-[#B91C47] focus:bg-white"
              />
            </div>
          </div>
        </div>

        {/* Strict Viewport Gate: Nothing loads until the user scrolls to #portfolio! */}
        {!hasEnteredSection || isLoadingMedia ? (
          <div
            aria-label="Gallery loading on scroll"
            className="space-y-6"
          >
            <div className="rounded-3xl bg-[#141013] p-6 grid lg:grid-cols-12 gap-5">
              <div className="lg:col-span-8 aspect-video rounded-2xl animate-pulse bg-[#241D22]" />
              <div className="lg:col-span-4 space-y-3">
                <div className="h-20 rounded-xl animate-pulse bg-[#241D22]" />
                <div className="h-20 rounded-xl animate-pulse bg-[#241D22]" />
              </div>
            </div>
            <div className="columns-1 sm:columns-2 lg:columns-3 gap-5">
              {['3/4', '4/3', '4/5', '3/2', '3/4', '4/3'].map((ratio, idx) => (
                <div
                  key={idx}
                  style={{ aspectRatio: ratio }}
                  className="mb-5 break-inside-avoid rounded-2xl animate-pulse bg-[#EFE8DC]"
                />
              ))}
            </div>
          </div>
        ) : totalMatching === 0 ? (
          <div className="atelier-card p-12 text-center text-sm text-[#6B5A62] bg-[#FAF6EE]">
            {galleryMedia.length === 0 && showcaseEvents.length === 0 && portfolio.length === 0
              ? 'Photos and highlight films uploaded in Admin → Gallery will appear here automatically.'
              : 'No gallery items match your selected filter or search.'}
          </div>
        ) : (
          <div className="space-y-12">
            {/* SUB-STAGE A: DEDICATED CINEMA THEATER (Separated from Photos!) */}
            {activeFilm && (
              <div className="rounded-3xl border border-[#2D232A] bg-[#141013] p-5 sm:p-7 text-[#FAF6F0] space-y-5 shadow-[0_28px_64px_-24px_rgba(20,16,19,0.55)]">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-2.5 w-2.5 rounded-full bg-[#B91C47]" />
                    <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#E9BE78]">
                      Signature Highlight Films ({filteredVideos.length})
                    </span>
                  </div>
                  <p className="text-xs text-[#A89A8E]">
                    Dedicated widescreen theater — click any reel to stream on demand
                  </p>
                </div>

                <div
                  className={cn(
                    'grid gap-6 items-start',
                    filteredVideos.length > 1 ? 'lg:grid-cols-12' : 'grid-cols-1',
                  )}
                >
                  {/* Lead Theater Stage */}
                  <div className={filteredVideos.length > 1 ? 'lg:col-span-8 space-y-3' : 'space-y-3'}>
                    <div className="rounded-2xl overflow-hidden border border-white/10 bg-black">
                      <AdaptiveVideoPlayer
                        key={activeFilm.id}
                        src={activeFilm.deliveryUrls?.fullUrl || activeFilm.secureUrl}
                        posterUrl={
                          activeFilm.deliveryUrls?.posterUrl ||
                          buildCloudinaryVideoPosterUrl(activeFilm.secureUrl, 1280)
                        }
                        title={activeFilm.caption || activeFilm.altText || branding.displayName}
                        durationSeconds={activeFilm.durationSeconds}
                        width={activeFilm.width}
                        height={activeFilm.height}
                        variant="featured"
                        isPlaying={Boolean(playingVideoIds[activeFilm.id])}
                        onPlay={() =>
                          setPlayingVideoIds((prev) => ({ ...prev, [activeFilm.id]: true }))
                        }
                        playLabel="Play Highlight Film"
                      />
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2 px-1">
                      <div>
                        <h3 className="font-editorial text-2xl font-semibold text-white">
                          {activeFilm.caption || activeFilm.altText || 'Event Highlight Film'}
                        </h3>
                        {activeFilm.altText && activeFilm.caption && (
                          <p className="text-xs text-[#A89A8E] mt-0.5">{activeFilm.altText}</p>
                        )}
                      </div>
                      <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-mono-code text-[#E9BE78] uppercase">
                        {activeFilm.format}
                        {formatFilmDuration(activeFilm.durationSeconds)
                          ? ` • ${formatFilmDuration(activeFilm.durationSeconds)}`
                          : ''}
                      </span>
                    </div>
                  </div>

                  {/* Interactive Reel Switcher Playlist when 2+ films */}
                  {filteredVideos.length > 1 && (
                    <div className="lg:col-span-4 space-y-2.5">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#A89A8E] px-1">
                        Film Reels ({filteredVideos.length})
                      </p>
                      <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
                        {filteredVideos.map((reel, idx) => {
                          const isCurrent = reel.id === activeFilm.id;
                          const poster =
                            reel.deliveryUrls?.posterUrl ||
                            buildCloudinaryVideoPosterUrl(reel.secureUrl, 480);
                          const duration = formatFilmDuration(reel.durationSeconds);

                          return (
                            <button
                              key={reel.id}
                              type="button"
                              onClick={() => {
                                setSelectedFilmId(reel.id);
                                setPlayingVideoIds((prev) => ({ ...prev, [reel.id]: true }));
                              }}
                              className={cn(
                                'w-full text-left rounded-2xl border p-2.5 flex items-center gap-3 transition-all cursor-pointer',
                                isCurrent
                                  ? 'border-[#E9BE78]/70 bg-white/10 shadow-sm'
                                  : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.07] hover:border-white/25',
                              )}
                            >
                              <div className="relative h-16 w-24 shrink-0 rounded-xl overflow-hidden bg-black">
                                {poster && (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={poster}
                                    alt={reel.caption || `Reel ${idx + 1}`}
                                    loading="lazy"
                                    decoding="async"
                                    className="h-full w-full object-cover opacity-90"
                                  />
                                )}
                                <span className="absolute inset-0 flex items-center justify-center bg-black/30 text-white text-xs">
                                  ▶
                                </span>
                              </div>
                              <div className="min-w-0 flex-1 space-y-1">
                                <div className="flex items-center justify-between gap-2">
                                  <span
                                    className={cn(
                                      'text-[10px] font-bold uppercase tracking-wider',
                                      isCurrent ? 'text-[#E9BE78]' : 'text-[#A89A8E]',
                                    )}
                                  >
                                    {isCurrent ? 'Now Selected' : `Reel 0${idx + 1}`}
                                  </span>
                                  {duration && (
                                    <span className="text-[10px] font-mono-code text-[#A89A8E]">
                                      {duration}
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs font-semibold text-white line-clamp-2 leading-snug">
                                  {reel.caption || reel.altText || `Highlight Film ${idx + 1}`}
                                </p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* SUB-STAGE B: EDITORIAL TRUE-ASPECT PHOTOGRAPHY MASONRY */}
            {visiblePhotos.length > 0 && (
              <div className="space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#EFE8DC] pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="inline-flex h-2 w-2 rounded-full bg-[#C98A2C]" />
                    <h3 className="font-editorial text-2xl font-semibold text-[#181216]">
                      Photography Wall
                    </h3>
                    <span className="rounded-full bg-[#F7F3EB] border border-[#E5DCCD] px-2.5 py-0.5 text-[11px] font-mono-code text-[#6B5A62]">
                      {filteredPhotos.length} frames
                    </span>
                  </div>
                  <p className="text-xs text-[#7D6860]">
                    Original portrait &amp; landscape framing — click any frame for full resolution
                  </p>
                </div>

                <div className="columns-1 sm:columns-2 lg:columns-3 gap-5">
                  {visiblePhotos.map((media) => {
                    const thumbUrl =
                      buildCloudinaryImageUrl(media.secureUrl, {
                        width: 960,
                        crop: 'limit',
                      }) ||
                      media.deliveryUrls?.thumbnailUrl ||
                      media.secureUrl;
                    const aspectRatio = resolveNaturalAspectRatio(media.width, media.height);

                    return (
                      <button
                        key={media.id}
                        type="button"
                        onClick={() => setSelectedGalleryPhoto(media)}
                        className="group relative mb-5 break-inside-avoid block w-full text-left rounded-2xl overflow-hidden border border-[#E6DDD0] bg-[#EFE8DC] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B91C47] shadow-2xs hover:shadow-[0_18px_40px_-18px_rgba(24,18,22,0.28)] transition-all duration-300"
                      >
                        <LazyViewportImage
                          src={thumbUrl}
                          srcSet={buildCloudinarySrcSet(media.secureUrl, [480, 800, 1200])}
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 380px"
                          alt={media.altText || media.caption || branding.displayName}
                          containerStyle={{ aspectRatio }}
                          containerClassName="w-full"
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                        />

                        {/* Clean Floating Exhibition Scrim Overlay */}
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#141013]/85 via-[#141013]/30 to-transparent p-4 pt-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-xs sm:text-sm font-semibold text-white truncate">
                              {media.caption || media.altText || 'Full-Resolution Frame'}
                            </p>
                          </div>
                          <span className="shrink-0 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-bold text-[#181216]">
                            ⤢ View
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {hasMorePhotos && (
                  <div className="flex justify-center pt-2">
                    <button
                      type="button"
                      onClick={() => setVisiblePhotoCount((prev) => prev + INITIAL_PHOTO_BATCH)}
                      className="inline-flex items-center gap-2 rounded-xl border bg-[#FAF6EE] px-6 py-3 text-xs sm:text-sm font-semibold text-[#181216] shadow-2xs hover:bg-white transition-all cursor-pointer"
                      style={{ borderColor: accent }}
                    >
                      <span>
                        Load More Photography ({filteredPhotos.length - visiblePhotos.length}{' '}
                        remaining)
                      </span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* SUB-STAGE C: EVENT STORIES GRID (When Event Stories tab or search matches) */}
            {filteredEvents.length > 0 && (
              <div className="space-y-5">
                <div className="flex items-center justify-between border-b border-[#EFE8DC] pb-3">
                  <h3 className="font-editorial text-2xl font-semibold text-[#181216]">
                    Event Stories ({filteredEvents.length})
                  </h3>
                  <Link
                    href="/portfolio"
                    className="text-xs font-semibold hover:underline"
                    style={{ color: accent }}
                  >
                    Open Full Portfolio Directory →
                  </Link>
                </div>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredEvents.map((ev) => {
                    const rawCoverUrl = ev.coverMedia?.secureUrl || '';
                    const coverUrl =
                      ev.coverMedia?.deliveryUrls?.coverUrl ||
                      buildCloudinaryImageUrl(rawCoverUrl, { width: 800, crop: 'limit' });
                    const photoCount = ev.counts?.photos ?? 0;
                    const videoCount = ev.counts?.videos ?? 0;

                    return (
                      <div
                        key={ev.id}
                        className="group atelier-card atelier-card-hover overflow-hidden flex flex-col justify-between bg-white"
                      >
                        <button
                          type="button"
                          onClick={() => setActiveShowcaseEvent(ev)}
                          className="text-left flex-1 flex flex-col cursor-pointer focus-visible:outline-none"
                        >
                          <div className="aspect-[4/3] w-full bg-[#EFE8DC] relative overflow-hidden">
                            {coverUrl ? (
                              <LazyViewportImage
                                src={coverUrl}
                                srcSet={rawCoverUrl ? buildCloudinarySrcSet(rawCoverUrl) : undefined}
                                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 380px"
                                alt={ev.coverMedia?.altText || ev.title}
                                containerClassName="h-full w-full"
                                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                              />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center bg-[#181216] text-[#BFB2A7] text-xs font-medium">
                                Showcase Event
                              </div>
                            )}

                            <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 pointer-events-none">
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#141013]/80 backdrop-blur-xs px-3 py-1 text-[11px] font-semibold text-white">
                                {photoCount > 0 ? `${photoCount} Photos` : 'Story'}
                                {videoCount > 0 ? ` • ${videoCount} Film` : ''}
                              </span>
                              {ev.eventType && (
                                <span className="rounded-full bg-white/95 backdrop-blur-xs px-2.5 py-0.5 text-[11px] font-bold text-[#181216]">
                                  {ev.eventType.name}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="p-5 flex-1">
                            {ev.eventDate && (
                              <div className="flex items-center gap-1.5 text-xs text-[#7D6860] mb-1 font-mono-code">
                                <CalendarIcon className="w-3.5 h-3.5 text-[#C98A2C]" />
                                <span>{formatLocalDate(ev.eventDate)}</span>
                              </div>
                            )}
                            <h3 className="font-editorial text-xl font-semibold text-[#181216] group-hover:text-[#B91C47] transition-colors">
                              {ev.title}
                            </h3>
                            {parseAlbumDescriptionAndTheme(ev.description).cleanDescription && (
                              <p className="mt-1 text-xs sm:text-sm text-[#54474E] line-clamp-2">
                                {parseAlbumDescriptionAndTheme(ev.description).cleanDescription}
                              </p>
                            )}
                          </div>
                        </button>

                        <div className="px-5 py-3 border-t border-[#EFE8DC] bg-[#FAF6EE]/60 flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => setActiveShowcaseEvent(ev)}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#181216] hover:text-[#B91C47] cursor-pointer"
                          >
                            <span>Explore Story</span>
                            <ArrowRightIcon className="w-3.5 h-3.5" />
                          </button>
                          <Link
                            href={`/album/${ev.slug}`}
                            className="text-xs font-semibold text-[#6B5A62] hover:text-[#181216]"
                          >
                            Full Page ↗
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Legacy Portfolio Fallback Items if any exist */}
            {filteredLegacyItems.length > 0 && (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {filteredLegacyItems.map((item) => {
                  const parsed = parseShowcaseMedia(item.mediaUrl);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActiveShowcaseItem(item)}
                      className="group text-left atelier-card atelier-card-hover overflow-hidden flex flex-col cursor-pointer bg-white"
                    >
                      <div className="aspect-[4/3] w-full bg-[#EFE8DC] relative overflow-hidden">
                        {parsed.coverUrl ? (
                          <LazyViewportImage
                            src={buildCloudinaryImageUrl(parsed.coverUrl, {
                              width: 800,
                              crop: 'limit',
                            })}
                            srcSet={buildCloudinarySrcSet(parsed.coverUrl)}
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 380px"
                            alt={item.title}
                            containerClassName="h-full w-full"
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center bg-[#181216] text-[#BFB2A7] text-xs font-medium">
                            Video Film
                          </div>
                        )}
                        <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-[#141013]/80 backdrop-blur-xs px-3 py-1 text-xs font-medium text-white pointer-events-none">
                          {parsed.kind === 'video' ? '▶ Video Film' : 'Photo Gallery'}
                        </span>
                      </div>
                      <div className="p-5 flex-1">
                        <h3 className="font-editorial text-xl font-semibold text-[#181216] group-hover:text-[#B91C47]">
                          {item.title}
                        </h3>
                        {item.description && (
                          <p className="mt-1 text-xs text-[#54474E] line-clamp-2">
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
        )}
      </div>

      {/* Full-Screen Cinema Lightbox for Direct Studio Gallery Photos */}
      {selectedGalleryPhoto && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedGalleryPhoto(null);
          }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-[#141013]/95 p-4 backdrop-blur-xs"
        >
          <div className="w-full max-w-5xl flex items-center justify-between text-white pb-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-xs font-mono-code">
                  {selectedPhotoIndex + 1} / {filteredPhotos.length}
                </span>
                <p className="text-sm font-semibold">
                  {selectedGalleryPhoto.caption || branding.displayName}
                </p>
              </div>
              {selectedGalleryPhoto.altText && (
                <p className="text-xs text-[#BFB2A7] mt-0.5">{selectedGalleryPhoto.altText}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => setSelectedGalleryPhoto(null)}
              className="rounded-xl border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-white/20 cursor-pointer"
            >
              ✕ Close
            </button>
          </div>

          <div className="relative flex-1 flex items-center justify-center w-full max-w-5xl overflow-hidden py-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={
                selectedGalleryPhoto.deliveryUrls?.fullUrl ||
                buildCloudinaryImageUrl(selectedGalleryPhoto.secureUrl, {
                  width: 1920,
                  crop: 'limit',
                })
              }
              srcSet={buildCloudinarySrcSet(
                selectedGalleryPhoto.secureUrl,
                [800, 1200, 1600, 1920],
              )}
              sizes="95vw"
              alt={
                selectedGalleryPhoto.altText ||
                selectedGalleryPhoto.caption ||
                branding.displayName
              }
              className="max-h-[74vh] w-auto rounded-xl object-contain shadow-2xl"
            />

            {filteredPhotos.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    goPrevGalleryPhoto();
                  }}
                  aria-label="Previous photo"
                  className="absolute left-2 sm:left-4 rounded-full bg-[#181216]/85 border border-white/20 px-4 py-2.5 text-sm font-bold text-white hover:bg-[#B91C47] transition-colors cursor-pointer"
                >
                  ←
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    goNextGalleryPhoto();
                  }}
                  aria-label="Next photo"
                  className="absolute right-2 sm:right-4 rounded-full bg-[#181216]/85 border border-white/20 px-4 py-2.5 text-sm font-bold text-white hover:bg-[#B91C47] transition-colors cursor-pointer"
                >
                  →
                </button>
              </>
            )}
          </div>

          {/* Bottom Thumbnail Filmstrip */}
          {filteredPhotos.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto max-w-4xl py-2">
              {filteredPhotos.map((p, idx) => {
                const stripThumb =
                  p.deliveryUrls?.thumbnailUrl ||
                  buildCloudinaryImageUrl(p.secureUrl, {
                    width: 200,
                    height: 140,
                    crop: 'fill',
                  });
                const isActive = p.id === selectedGalleryPhoto.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedGalleryPhoto(p);
                    }}
                    className={cn(
                      'h-12 w-16 shrink-0 rounded-lg overflow-hidden border-2 transition-all cursor-pointer',
                      isActive
                        ? 'border-[#E9BE78] opacity-100 scale-105'
                        : 'border-transparent opacity-50 hover:opacity-85',
                    )}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={stripThumb}
                      alt={p.altText || `Photo ${idx + 1}`}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover"
                    />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

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
    </section>
  );
}
