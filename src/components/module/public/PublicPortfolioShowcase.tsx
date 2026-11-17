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
import { LazyViewportImage } from './LazyViewportImage';
import { PortfolioEventDetailModal } from './PortfolioEventDetailModal';
import { ShowcaseLightboxModal } from './ShowcaseLightboxModal';

interface PublicPortfolioShowcaseProps {
  branding: PublicBranding;
  portfolio: PortfolioItem[];
  portfolioEvents?: PortfolioShowcaseEvent[];
  initialGalleryMedia?: PortfolioMediaItem[];
}

const INITIAL_BATCH_SIZE = 9;

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
  const [visibleCount, setVisibleCount] = useState(INITIAL_BATCH_SIZE);

  // Interactive modals & video play gates
  const [selectedGalleryPhoto, setSelectedGalleryPhoto] = useState<PortfolioMediaItem | null>(
    null,
  );
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

  // Deduplicate gallery media so items already belonging to a PUBLISHED showcase event aren't shown twice unless filtering photos/videos
  const filteredGalleryMedia = useMemo(() => {
    if (mediaFilter === 'stories') return [];
    return galleryMedia.filter((m) => {
      if (mediaFilter === 'photo' && m.resourceType !== 'IMAGE') return false;
      if (mediaFilter === 'video' && m.resourceType !== 'VIDEO') return false;
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

  const galleryPhotosOnly = useMemo(
    () => filteredGalleryMedia.filter((m) => m.resourceType === 'IMAGE'),
    [filteredGalleryMedia],
  );

  const selectedPhotoIndex = selectedGalleryPhoto
    ? galleryPhotosOnly.findIndex((p) => p.id === selectedGalleryPhoto.id)
    : -1;

  const goPrevGalleryPhoto = () => {
    if (galleryPhotosOnly.length <= 1 || selectedPhotoIndex === -1) return;
    setSelectedGalleryPhoto(
      galleryPhotosOnly[(selectedPhotoIndex - 1 + galleryPhotosOnly.length) % galleryPhotosOnly.length],
    );
  };

  const goNextGalleryPhoto = () => {
    if (galleryPhotosOnly.length <= 1 || selectedPhotoIndex === -1) return;
    setSelectedGalleryPhoto(
      galleryPhotosOnly[(selectedPhotoIndex + 1) % galleryPhotosOnly.length],
    );
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
  }, [selectedGalleryPhoto, selectedPhotoIndex, galleryPhotosOnly.length]);

  const filteredEvents = useMemo(() => {
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

  const photoTotalCount =
    galleryMedia.filter((m) => m.resourceType === 'IMAGE').length +
    portfolio.filter((i) => parseShowcaseMedia(i.mediaUrl).kind === 'photo').length;
  const videoTotalCount =
    galleryMedia.filter((m) => m.resourceType === 'VIDEO').length +
    portfolio.filter((i) => parseShowcaseMedia(i.mediaUrl).kind === 'video').length;

  const totalMatching =
    filteredGalleryMedia.length + filteredEvents.length + filteredLegacyItems.length;

  const visibleGalleryMedia = filteredGalleryMedia.slice(0, visibleCount);
  const remainingAfterGallery = Math.max(0, visibleCount - visibleGalleryMedia.length);
  const visibleEvents = filteredEvents.slice(0, remainingAfterGallery);
  const remainingAfterEvents = Math.max(0, remainingAfterGallery - visibleEvents.length);
  const visibleLegacyItems = filteredLegacyItems.slice(0, remainingAfterEvents);
  const hasMore = totalMatching > visibleCount;

  const accent = branding.themeTokens.accentColor || '#4F46E5';

  return (
    <section
      id="portfolio"
      ref={sectionRef}
      className="border-y border-slate-200 bg-white scroll-mt-16"
    >
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 space-y-8">
        {/* Section Header & Filter Controls */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-indigo-700">
              <CameraIcon className="w-3.5 h-3.5" />
              <span>Visual Showcase &amp; Gallery</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-slate-900 mt-2">
              Captured Moments &amp; Highlight Films
            </h2>
            <p className="text-sm text-slate-500 mt-1.5 max-w-xl">
              Browse high-resolution event photography and wedding/corporate films by{' '}
              <span className="font-semibold text-slate-700">{branding.displayName}</span>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="inline-flex flex-wrap rounded-xl border border-slate-200 bg-slate-50 p-1 gap-1">
              {[
                { id: 'all' as const, label: 'All Gallery' },
                {
                  id: 'photo' as const,
                  label: photoTotalCount > 0 ? `Photos (${photoTotalCount})` : 'Photos',
                },
                {
                  id: 'video' as const,
                  label: videoTotalCount > 0 ? `Videos (${videoTotalCount})` : 'Videos',
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
                    setVisibleCount(INITIAL_BATCH_SIZE);
                  }}
                  className={cn(
                    'rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer',
                    mediaFilter === tab.id
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900',
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-52">
              <SearchIcon className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setVisibleCount(INITIAL_BATCH_SIZE);
                }}
                placeholder="Search gallery..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-500 focus:bg-white"
              />
            </div>
          </div>
        </div>

        {/* Strict Viewport Gate: Nothing loads until the user scrolls to #portfolio! */}
        {!hasEnteredSection || isLoadingMedia ? (
          <div
            aria-label="Gallery loading on scroll"
            className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
          >
            {[0, 1, 2, 3, 4, 5].map((placeholderIdx) => (
              <div
                key={placeholderIdx}
                className="rounded-2xl overflow-hidden border border-slate-200/80 bg-white flex flex-col"
              >
                <div className="aspect-[4/3] w-full animate-pulse bg-gradient-to-br from-slate-200 via-slate-100 to-slate-200" />
                <div className="p-4 space-y-2">
                  <div className="h-4 w-2/3 rounded bg-slate-200 animate-pulse" />
                  <div className="h-3 w-1/3 rounded bg-slate-100 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : totalMatching === 0 ? (
          <div className="atelier-card p-12 text-center text-sm text-slate-500 bg-slate-50">
            {galleryMedia.length === 0 && showcaseEvents.length === 0 && portfolio.length === 0
              ? `Photos and highlight films uploaded in Admin → Gallery will appear here automatically.`
              : 'No gallery items match your selected filter or search.'}
          </div>
        ) : (
          <div className="space-y-8">
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {/* 1. Direct Studio Gallery Media (Photos & Highlight Videos from /admin/gallery) */}
              {visibleGalleryMedia.map((media) => {
                const isVideo = media.resourceType === 'VIDEO';
                const isPlaying = Boolean(playingVideoIds[media.id]);
                const thumbUrl = isVideo
                  ? media.deliveryUrls?.posterUrl ||
                    buildCloudinaryVideoPosterUrl(media.secureUrl, 800)
                  : media.deliveryUrls?.thumbnailUrl ||
                    buildCloudinaryImageUrl(media.secureUrl, {
                      width: 640,
                      height: 480,
                      crop: 'fill',
                    });
                const streamUrl = media.deliveryUrls?.fullUrl || media.secureUrl;

                if (isVideo) {
                  return (
                    <div
                      key={media.id}
                      className="group atelier-card atelier-card-hover overflow-hidden flex flex-col bg-slate-950 border-slate-200"
                    >
                      <div className="aspect-[4/3] w-full relative bg-slate-900 overflow-hidden">
                        {isPlaying ? (
                          <video
                            src={streamUrl}
                            poster={thumbUrl || undefined}
                            controls
                            autoPlay
                            playsInline
                            preload="metadata"
                            className="w-full h-full object-contain bg-black"
                          />
                        ) : (
                          <button
                            type="button"
                            onClick={() =>
                              setPlayingVideoIds((prev) => ({ ...prev, [media.id]: true }))
                            }
                            aria-label={`Play highlight video: ${media.caption || branding.displayName}`}
                            className="w-full h-full relative flex items-center justify-center cursor-pointer overflow-hidden"
                          >
                            {thumbUrl ? (
                              <LazyViewportImage
                                src={thumbUrl}
                                alt={media.altText || media.caption || 'Highlight video poster'}
                                containerClassName="h-full w-full bg-slate-900"
                                className="h-full w-full object-cover opacity-90 transition-transform duration-500 group-hover:scale-105"
                              />
                            ) : (
                              <div className="h-full w-full bg-slate-900" />
                            )}
                            <span className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-950/20 to-transparent" />
                            <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-slate-950/80 backdrop-blur-xs px-3 py-1 text-[11px] font-semibold text-white">
                              🎬 Highlight Video
                              {media.durationSeconds
                                ? ` • ${Math.round(media.durationSeconds)}s`
                                : ''}
                            </span>
                            <span className="relative z-10 flex items-center gap-2 rounded-full bg-white/95 px-4 py-2.5 text-xs font-bold text-slate-900 shadow-xl transition-transform duration-200 group-hover:scale-110">
                              <span>▶ Play Film</span>
                            </span>
                          </button>
                        )}
                      </div>

                      <div className="px-4 py-3 bg-white flex items-center justify-between gap-2">
                        <p className="text-xs sm:text-sm font-semibold text-slate-900 truncate">
                          {media.caption || media.altText || 'Event Highlight Film'}
                        </p>
                        <span className="text-[11px] font-mono-code text-slate-400 uppercase shrink-0">
                          {media.format}
                        </span>
                      </div>
                    </div>
                  );
                }

                return (
                  <button
                    key={media.id}
                    type="button"
                    onClick={() => setSelectedGalleryPhoto(media)}
                    className="group text-left atelier-card atelier-card-hover overflow-hidden flex flex-col cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 bg-white"
                  >
                    <div className="aspect-[4/3] w-full relative overflow-hidden bg-slate-100">
                      <LazyViewportImage
                        src={thumbUrl}
                        srcSet={buildCloudinarySrcSet(media.secureUrl, [480, 800, 1200])}
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 380px"
                        alt={media.altText || media.caption || branding.displayName}
                        containerClassName="h-full w-full"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-between p-4">
                        <span className="text-xs font-semibold text-white">
                          Click for Full-Screen View
                        </span>
                        <span className="rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-bold text-slate-900">
                          ⤢ Expand
                        </span>
                      </div>
                    </div>

                    {media.caption && (
                      <div className="px-4 py-3 bg-white flex items-center justify-between gap-2">
                        <p className="text-xs sm:text-sm font-semibold text-slate-800 truncate">
                          {media.caption}
                        </p>
                      </div>
                    )}
                  </button>
                );
              })}

              {/* 2. Published Showcase Event Stories */}
              {visibleEvents.map((ev) => {
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
                      <div className="aspect-[4/3] w-full bg-slate-100 relative overflow-hidden">
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
                          <div className="h-full w-full flex items-center justify-center bg-slate-900 text-slate-400 text-xs font-medium">
                            Showcase Event
                          </div>
                        )}

                        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 pointer-events-none">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-950/75 backdrop-blur-xs px-3 py-1 text-[11px] font-semibold text-white">
                            {photoCount > 0 ? `${photoCount} Photos` : 'Story'}
                            {videoCount > 0 ? ` • ${videoCount} Film` : ''}
                          </span>
                          {ev.eventType && (
                            <span className="rounded-full bg-white/90 backdrop-blur-xs px-2.5 py-0.5 text-[11px] font-bold text-slate-900">
                              {ev.eventType.name}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="p-5 flex-1">
                        {ev.eventDate && (
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1 font-mono-code">
                            <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
                            <span>{formatLocalDate(ev.eventDate)}</span>
                          </div>
                        )}
                        <h3 className="text-lg font-bold tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors">
                          {ev.title}
                        </h3>
                        {parseAlbumDescriptionAndTheme(ev.description).cleanDescription && (
                          <p className="mt-1 text-xs sm:text-sm text-slate-600 line-clamp-2">
                            {parseAlbumDescriptionAndTheme(ev.description).cleanDescription}
                          </p>
                        )}
                      </div>
                    </button>

                    <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => setActiveShowcaseEvent(ev)}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-900 hover:text-indigo-600 cursor-pointer"
                      >
                        <span>Explore Story</span>
                        <ArrowRightIcon className="w-3.5 h-3.5" />
                      </button>
                      <Link
                        href={`/album/${ev.slug}`}
                        className="text-xs font-semibold text-slate-500 hover:text-slate-900"
                      >
                        Full Page ↗
                      </Link>
                    </div>
                  </div>
                );
              })}

              {/* 3. Legacy Portfolio Items */}
              {visibleLegacyItems.map((item) => {
                const parsed = parseShowcaseMedia(item.mediaUrl);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveShowcaseItem(item)}
                    className="group text-left atelier-card atelier-card-hover overflow-hidden flex flex-col cursor-pointer bg-white"
                  >
                    <div className="aspect-[4/3] w-full bg-slate-100 relative overflow-hidden">
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
                        <div className="h-full w-full flex items-center justify-center bg-slate-900 text-slate-400 text-xs font-medium">
                          Video Film
                        </div>
                      )}
                      <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-slate-950/75 backdrop-blur-xs px-3 py-1 text-xs font-medium text-white pointer-events-none">
                        {parsed.kind === 'video' ? '▶ Video Film' : 'Photo Gallery'}
                      </span>
                    </div>
                    <div className="p-5 flex-1">
                      <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600">
                        {item.title}
                      </h3>
                      {item.description && (
                        <p className="mt-1 text-xs text-slate-600 line-clamp-2">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {hasMore && (
              <div className="flex justify-center pt-2">
                <button
                  type="button"
                  onClick={() => setVisibleCount((prev) => prev + INITIAL_BATCH_SIZE)}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3 text-xs sm:text-sm font-semibold text-slate-800 shadow-2xs hover:bg-slate-50 transition-all cursor-pointer"
                  style={{ borderColor: accent }}
                >
                  <span>Load More Gallery Items ({totalMatching - visibleCount} remaining)</span>
                </button>
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
          className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-slate-950/95 p-4 backdrop-blur-xs"
        >
          <div className="w-full max-w-5xl flex items-center justify-between text-white pb-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-xs font-mono-code">
                  {selectedPhotoIndex + 1} / {galleryPhotosOnly.length}
                </span>
                <p className="text-sm font-semibold">
                  {selectedGalleryPhoto.caption || branding.displayName}
                </p>
              </div>
              {selectedGalleryPhoto.altText && (
                <p className="text-xs text-slate-400 mt-0.5">{selectedGalleryPhoto.altText}</p>
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

            {galleryPhotosOnly.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    goPrevGalleryPhoto();
                  }}
                  aria-label="Previous photo"
                  className="absolute left-2 sm:left-4 rounded-full bg-slate-900/80 border border-white/20 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-800 transition-colors cursor-pointer"
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
                  className="absolute right-2 sm:right-4 rounded-full bg-slate-900/80 border border-white/20 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  →
                </button>
              </>
            )}
          </div>

          {/* Bottom Thumbnail Filmstrip */}
          {galleryPhotosOnly.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto max-w-4xl py-2">
              {galleryPhotosOnly.map((p, idx) => {
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
                        ? 'border-indigo-400 opacity-100 scale-105'
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
