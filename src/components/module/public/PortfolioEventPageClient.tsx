'use client';

import React, { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import Image from 'next/image';
import {
  PortfolioMediaItem,
  PortfolioShowcaseEvent,
  PublicBranding,
} from '@/types/event-management';
import { buildCloudinaryVideoPosterUrl } from '@/lib/showcaseMedia';
import { cn } from '@/lib/utils';
import { isNextOptimizableUrl, LazyAlbumImage } from './LazyAlbumImage';

interface PortfolioEventPageClientProps {
  event: PortfolioShowcaseEvent;
  branding: PublicBranding;
}

type MediaFilter = 'all' | 'photos' | 'videos' | 'favorites';

const INITIAL_PHOTO_BATCH = 9;
const PHOTO_BATCH_STEP = 9;
const SHIMMER_BLUR_DATA_URL =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjE2IiBoZWlnaHQ9IjEwIiBmaWxsPSIjZTdlMmRhIi8+PC9zdmc+';

function formatFilmDuration(seconds?: number | null): string | null {
  if (!seconds || !Number.isFinite(seconds) || seconds <= 0) return null;
  const total = Math.round(seconds);
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

export function PortfolioEventPageClient({
  event,
  branding,
}: PortfolioEventPageClientProps) {
  const readyMedia = useMemo(
    () => (event.media || []).filter((m) => m.status === 'READY'),
    [event.media],
  );
  const photos = useMemo(
    () => readyMedia.filter((m) => m.resourceType === 'IMAGE'),
    [readyMedia],
  );
  const videos = useMemo(
    () => readyMedia.filter((m) => m.resourceType === 'VIDEO'),
    [readyMedia],
  );

  // Daylight Museum Ivory (default) vs Cinema Dark mode
  const [darkGallery, setDarkGallery] = useState(false);
  const [mediaFilter, setMediaFilter] = useState<MediaFilter>('all');
  const [visiblePhotoLimit, setVisiblePhotoLimit] = useState(INITIAL_PHOTO_BATCH);

  // Lightbox Gallery Slider state (opened when clicking any grid photo)
  const [selectedPhoto, setSelectedPhoto] = useState<PortfolioMediaItem | null>(null);
  const [isSlideshowPlaying, setIsSlideshowPlaying] = useState(false);

  // Video Play gate: NO video file is downloaded until the viewer clicks Play
  const [playingVideoIds, setPlayingVideoIds] = useState<Record<string, boolean>>({});
  const [copiedAlbumUrl, setCopiedAlbumUrl] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const loadMoreSentinelRef = useRef<HTMLDivElement | null>(null);

  // SSR-safe localStorage Favorites shortlist per album
  const favStorageKey = `album_favorites_${event.id}`;
  const favRaw = useSyncExternalStore(
    (onStoreChange) => {
      if (typeof window === 'undefined') return () => {};
      const handler = () => onStoreChange();
      window.addEventListener('storage', handler);
      window.addEventListener('album-favorites-change', handler);
      return () => {
        window.removeEventListener('storage', handler);
        window.removeEventListener('album-favorites-change', handler);
      };
    },
    () => {
      try {
        return window.localStorage.getItem(favStorageKey) || '[]';
      } catch {
        return '[]';
      }
    },
    () => '[]',
  );

  const favoriteIds = useMemo<string[]>(() => {
    try {
      const parsed = JSON.parse(favRaw);
      return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string') : [];
    } catch {
      return [];
    }
  }, [favRaw]);

  const toggleFavorite = (photoId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      const next = favoriteIds.includes(photoId)
        ? favoriteIds.filter((id) => id !== photoId)
        : [...favoriteIds, photoId];
      window.localStorage.setItem(favStorageKey, JSON.stringify(next));
      window.dispatchEvent(new Event('album-favorites-change'));
    } catch {
      // ignore storage quota errors
    }
  };

  const displayedPhotos = useMemo(() => {
    if (mediaFilter === 'favorites') {
      return photos.filter((p) => favoriteIds.includes(p.id));
    }
    return photos;
  }, [photos, favoriteIds, mediaFilter]);

  const visiblePhotos = useMemo(
    () => displayedPhotos.slice(0, visiblePhotoLimit),
    [displayedPhotos, visiblePhotoLimit],
  );
  const hasMorePhotos = visiblePhotoLimit < displayedPhotos.length;

  // Automatic infinite scroll batching for photo grid
  useEffect(() => {
    const sentinel = loadMoreSentinelRef.current;
    if (!sentinel || !hasMorePhotos || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisiblePhotoLimit((prev) =>
              Math.min(prev + PHOTO_BATCH_STEP, displayedPhotos.length),
            );
            break;
          }
        }
      },
      { rootMargin: '220px 0px', threshold: 0.01 },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMorePhotos, displayedPhotos.length, mediaFilter]);

  const selectedPhotoIndex = selectedPhoto
    ? displayedPhotos.findIndex((p) => p.id === selectedPhoto.id)
    : -1;

  // Windowed bottom filmstrip (only ±6 neighbors around active photo so large albums stay fast)
  const filmstripWindow = useMemo(() => {
    if (displayedPhotos.length <= 1) return [];
    const idx = selectedPhotoIndex >= 0 ? selectedPhotoIndex : 0;
    const start = Math.max(0, idx - 6);
    const end = Math.min(displayedPhotos.length, idx + 7);
    return displayedPhotos.slice(start, end);
  }, [displayedPhotos, selectedPhotoIndex]);

  const goPrevLightbox = () => {
    if (displayedPhotos.length <= 1 || selectedPhotoIndex === -1) return;
    setSelectedPhoto(
      displayedPhotos[(selectedPhotoIndex - 1 + displayedPhotos.length) % displayedPhotos.length],
    );
  };

  const goNextLightbox = () => {
    if (displayedPhotos.length <= 1 || selectedPhotoIndex === -1) return;
    setSelectedPhoto(displayedPhotos[(selectedPhotoIndex + 1) % displayedPhotos.length]);
  };

  // Optional autoplay inside the Lightbox Gallery Slider only
  useEffect(() => {
    if (!isSlideshowPlaying || !selectedPhoto || displayedPhotos.length <= 1) return undefined;
    const id = window.setInterval(() => {
      setSelectedPhoto((curr) => {
        if (!curr) return displayedPhotos[0];
        const idx = displayedPhotos.findIndex((p) => p.id === curr.id);
        return displayedPhotos[(idx + 1) % displayedPhotos.length];
      });
    }, 3800);
    return () => window.clearInterval(id);
  }, [isSlideshowPlaying, selectedPhoto, displayedPhotos]);

  // Keyboard navigation in Lightbox Gallery Slider
  useEffect(() => {
    if (!selectedPhoto) return undefined;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedPhoto(null);
        setIsSlideshowPlaying(false);
      } else if (e.key === 'ArrowRight' && displayedPhotos.length > 1 && selectedPhotoIndex !== -1) {
        setSelectedPhoto(displayedPhotos[(selectedPhotoIndex + 1) % displayedPhotos.length]);
      } else if (e.key === 'ArrowLeft' && displayedPhotos.length > 1 && selectedPhotoIndex !== -1) {
        setSelectedPhoto(
          displayedPhotos[
            (selectedPhotoIndex - 1 + displayedPhotos.length) % displayedPhotos.length
          ],
        );
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPhoto, selectedPhotoIndex, displayedPhotos]);

  const handleCopyAlbumLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopiedAlbumUrl(true);
      setTimeout(() => setCopiedAlbumUrl(false), 2000);
    } catch {
      // clipboard unavailable
    }
  };

  const featuredFilm = videos[0] ?? null;
  const secondaryFilms = videos.slice(1);

  const coverMasterUrl = event.coverMedia?.secureUrl || photos[0]?.secureUrl || '';
  const coverAltText = event.coverMedia?.altText || event.title;

  const albumHeadingStyle = {
    fontFamily: 'var(--font-album-serif), Georgia, serif',
  };

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleWatchFeaturedFilm = () => {
    if (!featuredFilm) return;
    setMediaFilter('all');
    setPlayingVideoIds((prev) => ({ ...prev, [featuredFilm.id]: true }));
    scrollToSection('cinematic-film-showcase');
  };

  const showVideos =
    (mediaFilter === 'all' || mediaFilter === 'videos') && videos.length > 0;
  const showPhotos =
    (mediaFilter === 'all' || mediaFilter === 'photos' || mediaFilter === 'favorites') &&
    photos.length > 0;

  return (
    <div
      className={cn(
        'min-h-screen flex flex-col transition-colors duration-300',
        darkGallery ? 'bg-[#0b0c10] text-stone-100' : 'bg-[#FAF8F5] text-stone-900',
      )}
    >
      {/* Clean Single-Row Album Top Bar */}
      <header
        className={cn(
          'sticky top-0 z-30 border-b backdrop-blur-md transition-colors',
          darkGallery
            ? 'border-white/10 bg-[#0b0c10]/85'
            : 'border-stone-200/80 bg-[#FAF8F5]/90',
        )}
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <span
              className={cn(
                'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold tracking-widest',
                darkGallery
                  ? 'border-amber-200/30 bg-amber-100/10 text-amber-200'
                  : 'border-stone-300 bg-white text-stone-800 shadow-2xs',
              )}
            >
              {(branding.displayName || 'DA').slice(0, 2).toUpperCase()}
            </span>
            <div className="min-w-0">
              <p
                className={cn(
                  'text-[10px] uppercase tracking-[0.24em]',
                  darkGallery ? 'text-stone-400' : 'text-stone-500',
                )}
              >
                Digital Album
              </p>
              <p className="text-xs sm:text-sm font-semibold truncate">{event.title}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setDarkGallery((v) => !v)}
              title={darkGallery ? 'Switch to Daylight Ivory' : 'Switch to Cinema Dark'}
              className={cn(
                'rounded-full border px-3 py-1.5 text-[11px] font-medium transition-colors cursor-pointer',
                darkGallery
                  ? 'border-white/15 bg-white/5 text-stone-200 hover:bg-white/10'
                  : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-100',
              )}
            >
              {darkGallery ? '☀ Daylight' : '☾ Cinema'}
            </button>

            <button
              type="button"
              onClick={() => void handleCopyAlbumLink()}
              className={cn(
                'rounded-full px-4 py-1.5 text-[11px] font-semibold transition-colors cursor-pointer',
                darkGallery
                  ? 'bg-stone-100 text-stone-950 hover:bg-white'
                  : 'bg-stone-900 text-stone-50 hover:bg-stone-800',
              )}
            >
              {copiedAlbumUrl ? 'Link Copied ✓' : 'Share Album'}
            </button>
          </div>
        </div>
      </header>

      {/* Editorial Album Cover Hero (Single preloaded LCP cover image) */}
      <section
        className={cn(
          'border-b transition-colors',
          darkGallery ? 'border-white/10 bg-[#101117]' : 'border-stone-200/70 bg-white/60',
        )}
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 sm:py-12">
          <div className="grid gap-8 lg:grid-cols-12 items-center">
            {coverMasterUrl && (
              <div className="lg:col-span-7">
                <div
                  className={cn(
                    'rounded-2xl p-2.5 sm:p-3.5 transition-all',
                    darkGallery
                      ? 'bg-[#171820] border border-white/10 shadow-2xl'
                      : 'bg-white border border-stone-200/90 shadow-[0_24px_60px_-20px_rgba(24,24,27,0.18)]',
                  )}
                >
                  <LazyAlbumImage
                    src={coverMasterUrl}
                    alt={coverAltText}
                    isHero
                    quality={92}
                    aspectRatio="16 / 10"
                    darkSurface={darkGallery}
                    sizes="(max-width: 1024px) 100vw, 680px"
                    containerClassName="rounded-xl"
                    className="object-cover"
                  />
                </div>
              </div>
            )}

            <div
              className={cn(
                'space-y-5',
                coverMasterUrl
                  ? 'lg:col-span-5 text-center lg:text-left'
                  : 'lg:col-span-12 text-center max-w-2xl mx-auto py-6',
              )}
            >
              <div className="space-y-2.5">
                <p
                  className={cn(
                    'text-[11px] uppercase tracking-[0.32em] font-medium',
                    darkGallery ? 'text-amber-200/90' : 'text-stone-500',
                  )}
                >
                  Digital Photo &amp; Film Album
                </p>
                <h1
                  style={albumHeadingStyle}
                  className="text-4xl sm:text-5xl font-semibold tracking-tight leading-[1.06]"
                >
                  {event.title}
                </h1>
              </div>

              <div
                className={cn(
                  'h-px w-16',
                  coverMasterUrl ? 'mx-auto lg:mx-0' : 'mx-auto',
                  darkGallery ? 'bg-white/20' : 'bg-stone-300',
                )}
              />

              <div
                className={cn(
                  'flex flex-wrap items-center gap-2.5 text-xs tracking-wide',
                  coverMasterUrl ? 'justify-center lg:justify-start' : 'justify-center',
                  darkGallery ? 'text-stone-300' : 'text-stone-600',
                )}
              >
                {videos.length > 0 && (
                  <span
                    className={cn(
                      'rounded-full border px-3 py-1 font-medium',
                      darkGallery
                        ? 'border-amber-300/30 bg-amber-200/10 text-amber-100'
                        : 'border-stone-300 bg-white text-stone-800',
                    )}
                  >
                    {videos.length} Cinematic {videos.length === 1 ? 'Film' : 'Films'}
                  </span>
                )}
                {photos.length > 0 && (
                  <span
                    className={cn(
                      'rounded-full border px-3 py-1 font-medium',
                      darkGallery
                        ? 'border-white/15 bg-white/5'
                        : 'border-stone-200 bg-white',
                    )}
                  >
                    {photos.length} Photographs
                  </span>
                )}
              </div>

              <div
                className={cn(
                  'flex flex-wrap items-center gap-3 pt-1',
                  coverMasterUrl ? 'justify-center lg:justify-start' : 'justify-center',
                )}
              >
                {featuredFilm && (
                  <button
                    type="button"
                    onClick={handleWatchFeaturedFilm}
                    className={cn(
                      'rounded-full px-6 py-2.5 text-xs font-semibold tracking-wide transition-all cursor-pointer shadow-sm',
                      darkGallery
                        ? 'bg-stone-100 text-stone-950 hover:bg-white'
                        : 'bg-stone-900 text-white hover:bg-stone-800',
                    )}
                  >
                    ▶ Watch Cinematic Film
                  </button>
                )}
                {photos.length > 0 && (
                  <button
                    type="button"
                    onClick={() => scrollToSection('photo-grid-gallery')}
                    className={cn(
                      'rounded-full border px-6 py-2.5 text-xs font-semibold tracking-wide transition-all cursor-pointer',
                      featuredFilm
                        ? darkGallery
                          ? 'border-white/20 bg-white/5 text-stone-100 hover:bg-white/10'
                          : 'border-stone-300 bg-white text-stone-800 hover:bg-stone-50'
                        : darkGallery
                          ? 'bg-stone-100 border-stone-100 text-stone-950 hover:bg-white'
                          : 'bg-stone-900 border-stone-900 text-white hover:bg-stone-800',
                    )}
                  >
                    Browse Photo Grid ↓
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="flex-1 mx-auto w-full max-w-6xl px-4 sm:px-6 py-10 sm:py-12 space-y-14">
        {/* Clean Media Filter Strip */}
        {(photos.length > 0 || videos.length > 0) && (
          <div
            className={cn(
              'flex flex-wrap items-center justify-between gap-3 border-b pb-4',
              darkGallery ? 'border-white/10' : 'border-stone-200/80',
            )}
          >
            <div
              className={cn(
                'inline-flex flex-wrap rounded-full border p-1 gap-1',
                darkGallery
                  ? 'border-white/10 bg-white/[0.04]'
                  : 'border-stone-200 bg-white shadow-2xs',
              )}
            >
              {[
                { id: 'all' as const, label: `All (${readyMedia.length})`, show: true },
                {
                  id: 'videos' as const,
                  label: `Cinematic Film (${videos.length})`,
                  show: videos.length > 0,
                },
                {
                  id: 'photos' as const,
                  label: `Photo Gallery (${photos.length})`,
                  show: photos.length > 0,
                },
                {
                  id: 'favorites' as const,
                  label: `♥ Favorites (${favoriteIds.length})`,
                  show: favoriteIds.length > 0,
                },
              ]
                .filter((item) => item.show)
                .map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setMediaFilter(item.id);
                      setVisiblePhotoLimit(INITIAL_PHOTO_BATCH);
                    }}
                    className={cn(
                      'rounded-full px-4 py-1.5 text-xs font-medium transition-colors cursor-pointer',
                      mediaFilter === item.id
                        ? darkGallery
                          ? 'bg-stone-100 text-stone-950'
                          : 'bg-stone-900 text-white'
                        : darkGallery
                          ? 'text-stone-300 hover:text-white'
                          : 'text-stone-600 hover:text-stone-900',
                    )}
                  >
                    {item.label}
                  </button>
                ))}
            </div>

            {photos.length > 0 && (
              <p className={cn('text-xs', darkGallery ? 'text-stone-400' : 'text-stone-500')}>
                Click any photo to open full-screen gallery slider
              </p>
            )}
          </div>
        )}

        {/* Section 1: Highlighted Full-Width Cinematic Video Showcase (Poster & Stream Strict On-Demand) */}
        {showVideos && featuredFilm && (
          <section id="cinematic-film-showcase" className="space-y-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p
                  className={cn(
                    'text-[10px] uppercase tracking-[0.28em] font-semibold',
                    darkGallery ? 'text-amber-200/90' : 'text-stone-500',
                  )}
                >
                  Featured Cinema Showcase
                </p>
                <h2
                  style={albumHeadingStyle}
                  className="text-3xl sm:text-4xl font-semibold tracking-tight mt-0.5"
                >
                  {featuredFilm.caption || 'Cinematic Highlight Film'}
                </h2>
              </div>

              <a
                href={featuredFilm.deliveryUrls?.fullUrl || featuredFilm.secureUrl}
                target="_blank"
                rel="noopener noreferrer"
                download
                className={cn(
                  'rounded-full border px-4 py-1.5 text-xs font-semibold transition-colors',
                  darkGallery
                    ? 'border-white/15 bg-white/5 text-stone-200 hover:bg-white/10'
                    : 'border-stone-300 bg-white text-stone-800 hover:bg-stone-100',
                )}
              >
                Download Film ↓
              </a>
            </div>

            {(() => {
              const isPlaying = Boolean(playingVideoIds[featuredFilm.id]);
              const posterUrl =
                buildCloudinaryVideoPosterUrl(featuredFilm.secureUrl, 1920) ||
                featuredFilm.deliveryUrls?.posterUrl ||
                coverMasterUrl;
              const streamUrl = featuredFilm.deliveryUrls?.fullUrl || featuredFilm.secureUrl;
              const formattedDuration = formatFilmDuration(featuredFilm.durationSeconds);

              return (
                <div
                  className={cn(
                    'rounded-2xl p-2 sm:p-3 transition-all',
                    darkGallery
                      ? 'bg-[#14151c] border border-white/15 shadow-[0_30px_90px_-20px_rgba(0,0,0,0.9)]'
                      : 'bg-stone-950 border border-stone-800 shadow-[0_30px_80px_-20px_rgba(24,24,27,0.35)]',
                  )}
                >
                  <div className="aspect-video w-full relative overflow-hidden rounded-xl bg-black">
                    {isPlaying ? (
                      <video
                        src={streamUrl}
                        poster={posterUrl || undefined}
                        controls
                        autoPlay
                        playsInline
                        preload="metadata"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          setPlayingVideoIds((prev) => ({ ...prev, [featuredFilm.id]: true }))
                        }
                        aria-label={`Play cinematic film: ${featuredFilm.caption || event.title}`}
                        className="group relative w-full h-full flex items-center justify-center cursor-pointer overflow-hidden"
                      >
                        {posterUrl ? (
                          <LazyAlbumImage
                            src={posterUrl}
                            alt={
                              featuredFilm.altText ||
                              featuredFilm.caption ||
                              `${event.title} cinematic poster`
                            }
                            quality={92}
                            darkSurface
                            aspectRatio="16 / 9"
                            sizes="(max-width: 1200px) 100vw, 1152px"
                            className="object-cover opacity-90 group-hover:scale-[1.03]"
                          />
                        ) : (
                          <div className="w-full h-full bg-stone-900" />
                        )}

                        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-black/30 transition-opacity group-hover:opacity-90" />

                        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3">
                          <span className="flex h-20 w-20 items-center justify-center rounded-full border border-white/50 bg-white/15 backdrop-blur-md text-white shadow-2xl transition-all duration-300 group-hover:scale-110 group-hover:bg-white group-hover:text-stone-950">
                            <span className="ml-1 text-2xl">▶</span>
                          </span>
                          <span className="rounded-full bg-black/60 backdrop-blur-md border border-white/20 px-4 py-1.5 text-xs font-semibold tracking-wider uppercase text-white">
                            Play Full Cinematic Film
                            {formattedDuration ? ` • ${formattedDuration}` : ''}
                          </span>
                        </div>
                      </button>
                    )}
                  </div>
                </div>
              );
            })()}

            {secondaryFilms.length > 0 && (
              <div className="grid gap-6 sm:grid-cols-2 pt-2">
                {secondaryFilms.map((video, idx) => {
                  const isPlaying = Boolean(playingVideoIds[video.id]);
                  const posterUrl =
                    buildCloudinaryVideoPosterUrl(video.secureUrl, 1280) ||
                    video.deliveryUrls?.posterUrl ||
                    coverMasterUrl;
                  const streamUrl = video.deliveryUrls?.fullUrl || video.secureUrl;
                  const formattedDuration = formatFilmDuration(video.durationSeconds);

                  return (
                    <div
                      key={video.id}
                      className={cn(
                        'rounded-2xl border overflow-hidden flex flex-col',
                        darkGallery
                          ? 'border-white/12 bg-[#14151b]'
                          : 'border-stone-200 bg-white shadow-sm',
                      )}
                    >
                      <div className="aspect-video w-full relative bg-black">
                        {isPlaying ? (
                          <video
                            src={streamUrl}
                            poster={posterUrl || undefined}
                            controls
                            autoPlay
                            playsInline
                            preload="metadata"
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <button
                            type="button"
                            onClick={() =>
                              setPlayingVideoIds((prev) => ({ ...prev, [video.id]: true }))
                            }
                            className="group relative w-full h-full flex items-center justify-center cursor-pointer overflow-hidden"
                          >
                            {posterUrl ? (
                              <LazyAlbumImage
                                src={posterUrl}
                                alt={video.altText || video.caption || `${event.title} reel`}
                                quality={90}
                                darkSurface
                                aspectRatio="16 / 9"
                                sizes="(max-width: 640px) 100vw, 560px"
                                className="object-cover opacity-90 group-hover:scale-105"
                              />
                            ) : (
                              <div className="w-full h-full bg-stone-900" />
                            )}
                            <span className="absolute inset-0 bg-black/25 group-hover:bg-black/15" />
                            <span className="absolute inset-0 z-10 flex items-center justify-center">
                              <span className="flex h-14 w-14 items-center justify-center rounded-full border border-white/40 bg-black/55 backdrop-blur-md text-white transition-transform group-hover:scale-110">
                                <span className="ml-0.5 text-base">▶</span>
                              </span>
                            </span>
                            {formattedDuration && (
                              <span className="absolute bottom-3 right-3 z-10 rounded-full bg-black/70 px-2.5 py-0.5 font-mono-code text-[11px] text-white">
                                {formattedDuration}
                              </span>
                            )}
                          </button>
                        )}
                      </div>
                      <div
                        className={cn(
                          'px-4 py-3 flex items-center justify-between gap-3 text-xs border-t',
                          darkGallery
                            ? 'border-white/10 text-stone-300'
                            : 'border-stone-100 text-stone-700',
                        )}
                      >
                        <span className="truncate font-medium">
                          {video.caption || `Motion Film ${String(idx + 2).padStart(2, '0')}`}
                        </span>
                        <a
                          href={streamUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          download
                          className="shrink-0 text-[11px] font-semibold hover:underline"
                        >
                          Download ↓
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* Section 2: Strict Viewport-Gated & Progressive-Batched Photo Grid */}
        {showPhotos && (
          <section id="photo-grid-gallery" className="space-y-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p
                  className={cn(
                    'text-[10px] uppercase tracking-[0.28em] font-medium',
                    darkGallery ? 'text-amber-200/80' : 'text-stone-500',
                  )}
                >
                  Photographic Collection
                </p>
                <h2
                  style={albumHeadingStyle}
                  className="text-3xl font-semibold tracking-tight mt-0.5"
                >
                  {mediaFilter === 'favorites' ? 'Favorite Photographs' : 'Photo Grid'}
                </h2>
              </div>
              {displayedPhotos.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedPhoto(displayedPhotos[0])}
                  className={cn(
                    'rounded-full border px-4 py-1.5 text-xs font-semibold transition-colors cursor-pointer',
                    darkGallery
                      ? 'border-white/15 bg-white/5 text-stone-200 hover:bg-white/10'
                      : 'border-stone-300 bg-white text-stone-800 hover:bg-stone-100',
                  )}
                >
                  Open Slide Viewer ⤢
                </button>
              )}
            </div>

            {displayedPhotos.length === 0 ? (
              <div
                className={cn(
                  'rounded-2xl border p-10 text-center space-y-2',
                  darkGallery
                    ? 'border-white/10 bg-[#14151b]'
                    : 'border-stone-200 bg-white',
                )}
              >
                <p style={albumHeadingStyle} className="text-2xl font-medium">
                  No Favorite Photographs Selected Yet
                </p>
                <p
                  className={cn(
                    'text-xs',
                    darkGallery ? 'text-stone-400' : 'text-stone-500',
                  )}
                >
                  Tap the heart icon on any photograph in the grid to add it here.
                </p>
              </div>
            ) : (
              <>
                <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
                  {visiblePhotos.map((photo, idx) => {
                    const isFav = favoriteIds.includes(photo.id);
                    const intrinsicWidth = photo.width && photo.width > 0 ? photo.width : 1600;
                    const intrinsicHeight = photo.height && photo.height > 0 ? photo.height : 1200;

                    return (
                      <div
                        key={photo.id}
                        onClick={() => setSelectedPhoto(photo)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setSelectedPhoto(photo);
                          }
                        }}
                        className={cn(
                          'break-inside-avoid group relative rounded-xl overflow-hidden border cursor-zoom-in transition-all',
                          darkGallery
                            ? 'border-white/10 bg-[#14151b] hover:border-white/25'
                            : 'border-stone-200/80 bg-white shadow-xs hover:shadow-md',
                        )}
                      >
                        <LazyAlbumImage
                          src={photo.secureUrl}
                          alt={photo.altText || photo.caption || event.title}
                          aspectRatio={`${intrinsicWidth} / ${intrinsicHeight}`}
                          quality={92}
                          darkSurface={darkGallery}
                          rootMargin="120px 0px"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 384px"
                          className="object-cover group-hover:scale-[1.03]"
                        />

                        {/* Hover Controls */}
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/25 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-between p-3">
                          <div className="flex justify-end pointer-events-auto">
                            <button
                              type="button"
                              onClick={(e) => toggleFavorite(photo.id, e)}
                              aria-label={isFav ? 'Remove favorite' : 'Favorite photo'}
                              className={cn(
                                'h-8 w-8 rounded-full backdrop-blur-md flex items-center justify-center text-xs transition-colors cursor-pointer',
                                isFav
                                  ? 'bg-rose-500 text-white'
                                  : 'bg-black/45 text-white hover:bg-black/70',
                              )}
                            >
                              {isFav ? '♥' : '♡'}
                            </button>
                          </div>
                          <div className="flex items-center justify-between gap-2 text-white text-[11px] pointer-events-auto">
                            <span className="truncate font-medium">
                              {photo.caption || `Photo ${String(idx + 1).padStart(2, '0')}`}
                            </span>
                            <a
                              href={photo.secureUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              download
                              onClick={(e) => e.stopPropagation()}
                              className="shrink-0 rounded-full bg-white/20 backdrop-blur-md px-2.5 py-1 text-[10px] font-semibold hover:bg-white/30"
                            >
                              Save ↓
                            </a>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Infinite Scroll Batch Sentinel + Manual Fallback */}
                {hasMorePhotos && (
                  <div ref={loadMoreSentinelRef} className="pt-4 flex flex-col items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setVisiblePhotoLimit((prev) =>
                          Math.min(prev + PHOTO_BATCH_STEP, displayedPhotos.length),
                        )
                      }
                      className={cn(
                        'rounded-full border px-5 py-2 text-xs font-semibold transition-colors cursor-pointer',
                        darkGallery
                          ? 'border-white/15 bg-white/5 text-stone-200 hover:bg-white/10'
                          : 'border-stone-300 bg-white text-stone-800 hover:bg-stone-100',
                      )}
                    >
                      Load More Photos ({displayedPhotos.length - visiblePhotoLimit} remaining)
                    </button>
                  </div>
                )}
              </>
            )}
          </section>
        )}

        {photos.length === 0 && videos.length === 0 && (
          <div
            className={cn(
              'rounded-2xl border p-12 text-center space-y-2',
              darkGallery ? 'border-white/10 bg-[#14151b]' : 'border-stone-200 bg-white',
            )}
          >
            <p style={albumHeadingStyle} className="text-2xl font-medium">
              Album Media Being Curated
            </p>
            <p className={cn('text-xs', darkGallery ? 'text-stone-400' : 'text-stone-500')}>
              Cinematic films and photographs will appear here shortly.
            </p>
          </div>
        )}
      </main>

      {/* Full-Screen Gallery Slider Lightbox (Lossless Quality=100, Windowed Filmstrip) */}
      {selectedPhoto && (
        <div
          role="dialog"
          aria-modal="true"
          onTouchStart={(e) => {
            touchStartX.current = e.touches[0]?.clientX ?? null;
          }}
          onTouchEnd={(e) => {
            if (touchStartX.current === null) return;
            const endX = e.changedTouches[0]?.clientX ?? touchStartX.current;
            const diff = touchStartX.current - endX;
            touchStartX.current = null;
            if (Math.abs(diff) > 45) {
              if (diff > 0) goNextLightbox();
              else goPrevLightbox();
            }
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSelectedPhoto(null);
              setIsSlideshowPlaying(false);
            }
          }}
          className="fixed inset-0 z-50 flex flex-col justify-between bg-black/95 p-4 backdrop-blur-sm select-none"
        >
          {/* Lightbox Header */}
          <div className="mx-auto w-full max-w-6xl flex items-center justify-between text-stone-100 gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">
                {selectedPhoto.caption || event.title}
                {displayedPhotos.length > 1 && selectedPhotoIndex !== -1
                  ? `  •  ${selectedPhotoIndex + 1} / ${displayedPhotos.length}`
                  : ''}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={(e) => toggleFavorite(selectedPhoto.id, e)}
                className={cn(
                  'rounded-full border px-3.5 py-1.5 text-xs font-medium cursor-pointer',
                  favoriteIds.includes(selectedPhoto.id)
                    ? 'border-rose-400/50 bg-rose-500/20 text-rose-200'
                    : 'border-white/20 bg-white/10 text-white hover:bg-white/20',
                )}
              >
                {favoriteIds.includes(selectedPhoto.id) ? '♥ Saved' : '♡ Favorite'}
              </button>
              {displayedPhotos.length > 1 && (
                <button
                  type="button"
                  onClick={() => setIsSlideshowPlaying((v) => !v)}
                  className={cn(
                    'rounded-full border px-3.5 py-1.5 text-xs font-medium cursor-pointer',
                    isSlideshowPlaying
                      ? 'border-amber-300/60 bg-amber-200/15 text-amber-100'
                      : 'border-white/20 bg-white/10 text-white hover:bg-white/20',
                  )}
                >
                  {isSlideshowPlaying ? '❚❚ Pause' : '▶ Slideshow'}
                </button>
              )}
              <a
                href={selectedPhoto.secureUrl}
                target="_blank"
                rel="noopener noreferrer"
                download
                className="rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-white/20"
              >
                Download Original
              </a>
              <button
                type="button"
                onClick={() => {
                  setSelectedPhoto(null);
                  setIsSlideshowPlaying(false);
                }}
                className="rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-white/20 cursor-pointer"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Center Slide Image + Edge Slide Arrows */}
          <div className="relative flex-1 flex items-center justify-center w-full max-w-6xl mx-auto my-3 overflow-hidden">
            {displayedPhotos.length > 1 && selectedPhotoIndex !== -1 && (
              <button
                type="button"
                aria-label="Previous photo"
                onClick={goPrevLightbox}
                className="absolute left-2 sm:left-4 z-10 h-11 w-11 rounded-full border border-white/20 bg-black/60 text-white hover:bg-white hover:text-black transition-colors cursor-pointer"
              >
                ←
              </button>
            )}

            <div className="relative w-full h-[74vh]">
              <Image
                key={selectedPhoto.id}
                src={selectedPhoto.secureUrl}
                alt={selectedPhoto.altText || selectedPhoto.caption || event.title}
                fill
                quality={100}
                placeholder="blur"
                blurDataURL={SHIMMER_BLUR_DATA_URL}
                unoptimized={!isNextOptimizableUrl(selectedPhoto.secureUrl)}
                sizes="95vw"
                className="object-contain"
              />
            </div>

            {displayedPhotos.length > 1 && selectedPhotoIndex !== -1 && (
              <button
                type="button"
                aria-label="Next photo"
                onClick={goNextLightbox}
                className="absolute right-2 sm:right-4 z-10 h-11 w-11 rounded-full border border-white/20 bg-black/60 text-white hover:bg-white hover:text-black transition-colors cursor-pointer"
              >
                →
              </button>
            )}
          </div>

          {/* Windowed Bottom Slide Filmstrip (renders nearby thumbnails only) */}
          {filmstripWindow.length > 1 && (
            <div className="mx-auto max-w-5xl w-full flex items-center justify-center gap-1.5 overflow-x-auto pb-1">
              {filmstripWindow.map((p) => {
                const active = p.id === selectedPhoto.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedPhoto(p)}
                    className={cn(
                      'relative h-11 w-14 shrink-0 rounded-md overflow-hidden border-2 transition-all cursor-pointer',
                      active
                        ? 'border-white scale-105 opacity-100'
                        : 'border-transparent opacity-45 hover:opacity-85',
                    )}
                  >
                    <Image
                      src={p.secureUrl}
                      alt=""
                      fill
                      quality={75}
                      unoptimized={!isNextOptimizableUrl(p.secureUrl)}
                      sizes="64px"
                      className="object-cover"
                    />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Minimal Archival Colophon */}
      <footer
        className={cn(
          'border-t py-8 px-4 text-center space-y-1.5 text-xs',
          darkGallery
            ? 'border-white/10 text-stone-500'
            : 'border-stone-200/80 text-stone-500',
        )}
      >
        <p
          style={albumHeadingStyle}
          className={cn('text-lg font-medium', darkGallery ? 'text-stone-200' : 'text-stone-800')}
        >
          {event.title}
        </p>
        <p className="text-[11px] uppercase tracking-[0.2em]">
          Digital Album •{' '}
          <span className={darkGallery ? 'text-stone-300' : 'text-stone-700'}>
            {branding.displayName}
          </span>
        </p>
      </footer>
    </div>
  );
}
