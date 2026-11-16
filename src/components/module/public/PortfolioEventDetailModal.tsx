'use client';

import React, { useEffect, useState } from 'react';
import { PortfolioMediaItem, PortfolioShowcaseEvent } from '@/types/event-management';
import {
  buildCloudinaryImageUrl,
  buildCloudinarySrcSet,
  buildCloudinaryVideoPosterUrl,
} from '@/lib/showcaseMedia';
import { formatLocalDate } from '@/lib/utils';

interface PortfolioEventDetailModalProps {
  event: PortfolioShowcaseEvent;
  onClose: () => void;
  isPreview?: boolean;
}

export function PortfolioEventDetailModal({
  event,
  onClose,
  isPreview = false,
}: PortfolioEventDetailModalProps) {
  const readyMedia = (event.media || []).filter((m) => m.status === 'READY');
  const photos = readyMedia.filter((m) => m.resourceType === 'IMAGE');
  const videos = readyMedia.filter((m) => m.resourceType === 'VIDEO');

  // High-res photo lightbox state (only fetched when a thumbnail is clicked!)
  const [selectedPhoto, setSelectedPhoto] = useState<PortfolioMediaItem | null>(null);
  // Video Play gate: NO <video> element or video file is downloaded until the user clicks Play
  const [playingVideoIds, setPlayingVideoIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedPhoto) {
          setSelectedPhoto(null);
        } else {
          onClose();
        }
      } else if (selectedPhoto && photos.length > 1) {
        const idx = photos.findIndex((p) => p.id === selectedPhoto.id);
        if (idx !== -1) {
          if (e.key === 'ArrowRight') {
            setSelectedPhoto(photos[(idx + 1) % photos.length]);
          } else if (e.key === 'ArrowLeft') {
            setSelectedPhoto(photos[(idx - 1 + photos.length) % photos.length]);
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPhoto, photos, onClose]);

  const coverUrl =
    event.coverMedia?.deliveryUrls?.coverUrl ||
    (event.coverMedia?.secureUrl
      ? buildCloudinaryImageUrl(event.coverMedia.secureUrl, { width: 1200, crop: 'limit' })
      : photos[0]?.secureUrl
        ? buildCloudinaryImageUrl(photos[0].secureUrl, { width: 1200, crop: 'limit' })
        : '');

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-3 sm:p-6 backdrop-blur-xs overflow-y-auto"
    >
      <div className="w-full max-w-5xl max-h-[92vh] flex flex-col rounded-2xl bg-white text-slate-900 border border-slate-200 shadow-2xl overflow-hidden">
        {/* Top Header */}
        <div className="shrink-0 flex items-center justify-between gap-4 px-5 py-4 border-b border-slate-100 bg-white">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              {isPreview && (
                <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                  Admin Preview ({event.status})
                </span>
              )}
              {event.eventType && (
                <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
                  {event.eventType.name}
                </span>
              )}
              {event.eventDate && (
                <span className="text-xs font-mono-code text-slate-500">
                  {formatLocalDate(event.eventDate)}
                </span>
              )}
              {event.location && (
                <span className="text-xs text-slate-500">• {event.location}</span>
              )}
            </div>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 mt-1 truncate">
              {event.title}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            ✕ Close
          </button>
        </div>

        {/* Scrollable Showcase Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-8">
          {/* Hero Cover Banner */}
          {coverUrl && (
            <div className="relative rounded-2xl overflow-hidden bg-slate-900 aspect-[16/9] max-h-[420px] w-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={coverUrl}
                srcSet={
                  event.coverMedia?.secureUrl
                    ? buildCloudinarySrcSet(event.coverMedia.secureUrl)
                    : undefined
                }
                sizes="(max-width: 1024px) 100vw, 960px"
                alt={event.coverMedia?.altText || event.title}
                loading="eager"
                fetchPriority="high"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-transparent to-transparent flex flex-col justify-end p-5 sm:p-6 text-white">
                <h3 className="text-xl sm:text-2xl font-bold">{event.title}</h3>
                {event.description && (
                  <p className="text-xs sm:text-sm text-white/85 mt-1 max-w-2xl leading-relaxed">
                    {event.description}
                  </p>
                )}
              </div>
            </div>
          )}

          {!coverUrl && event.description && (
            <p className="text-sm text-slate-600 leading-relaxed">{event.description}</p>
          )}

          {/* Video Highlights Section (Poster + Play Button First — No Preload Before Play!) */}
          {videos.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-base font-bold text-slate-900">
                  Video Highlights ({videos.length})
                </h3>
                <span className="text-xs text-slate-500">
                  Click Play to stream highlight film
                </span>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                {videos.map((video) => {
                  const isPlaying = Boolean(playingVideoIds[video.id]);
                  const posterUrl =
                    video.deliveryUrls?.posterUrl ||
                    buildCloudinaryVideoPosterUrl(video.secureUrl) ||
                    coverUrl;
                  const streamUrl = video.deliveryUrls?.fullUrl || video.secureUrl;

                  return (
                    <div
                      key={video.id}
                      className="rounded-2xl border border-slate-200 bg-slate-950 overflow-hidden flex flex-col"
                    >
                      <div className="aspect-video w-full relative bg-slate-900">
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
                            aria-label={`Play video: ${video.caption || event.title}`}
                            className="group relative w-full h-full flex items-center justify-center cursor-pointer overflow-hidden"
                          >
                            {posterUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={posterUrl}
                                alt={video.altText || video.caption || `${event.title} video poster`}
                                loading="lazy"
                                decoding="async"
                                className="w-full h-full object-cover opacity-90 transition-transform duration-300 group-hover:scale-105"
                              />
                            ) : (
                              <div className="w-full h-full bg-slate-900" />
                            )}
                            <span className="absolute inset-0 bg-slate-950/30 group-hover:bg-slate-950/20 transition-colors" />
                            <span className="relative z-10 flex items-center gap-2 rounded-full bg-white/95 px-4 py-2.5 text-xs font-bold text-slate-900 shadow-xl transition-transform duration-200 group-hover:scale-105">
                              <span>▶ Play Highlight</span>
                              {video.durationSeconds ? (
                                <span className="font-mono-code text-slate-500">
                                  ({Math.round(video.durationSeconds)}s)
                                </span>
                              ) : null}
                            </span>
                          </button>
                        )}
                      </div>
                      {video.caption && (
                        <div className="px-4 py-2.5 bg-white text-xs text-slate-700 font-medium">
                          {video.caption}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Photo Gallery Section (Lazy-loaded thumbnails; high-res loaded only on click!) */}
          {photos.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-base font-bold text-slate-900">
                  Event Photo Gallery ({photos.length})
                </h3>
                <span className="text-xs text-slate-500">
                  Click any photo thumbnail to open full-resolution view
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
                {photos.map((photo) => {
                  const thumbUrl =
                    photo.deliveryUrls?.thumbnailUrl ||
                    buildCloudinaryImageUrl(photo.secureUrl, {
                      width: 480,
                      height: 360,
                      crop: 'fill',
                    });

                  return (
                    <button
                      key={photo.id}
                      type="button"
                      onClick={() => setSelectedPhoto(photo)}
                      className="group text-left rounded-xl overflow-hidden border border-slate-200 bg-slate-50 flex flex-col cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                    >
                      <div className="aspect-[4/3] w-full overflow-hidden bg-slate-100">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={thumbUrl}
                          alt={photo.altText || photo.caption || event.title}
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      </div>
                      {photo.caption && (
                        <p className="px-2.5 py-1.5 text-[11px] text-slate-600 truncate w-full bg-white">
                          {photo.caption}
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* High-Resolution Lightbox Modal (Only mounts & fetches large image when a thumbnail is clicked!) */}
      {selectedPhoto && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            e.stopPropagation();
            if (e.target === e.currentTarget) setSelectedPhoto(null);
          }}
          className="fixed inset-0 z-60 flex flex-col items-center justify-center bg-slate-950/95 p-4"
        >
          <div className="w-full max-w-5xl flex items-center justify-between text-white pb-3">
            <div>
              <p className="text-sm font-semibold">
                {selectedPhoto.caption || event.title}
              </p>
              {selectedPhoto.altText && (
                <p className="text-xs text-slate-400">{selectedPhoto.altText}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => setSelectedPhoto(null)}
              className="rounded-xl border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-white/20 cursor-pointer"
            >
              ✕ Back to Gallery
            </button>
          </div>

          <div className="relative flex-1 flex items-center justify-center w-full max-w-5xl overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={
                selectedPhoto.deliveryUrls?.fullUrl ||
                buildCloudinaryImageUrl(selectedPhoto.secureUrl, { width: 1920, crop: 'limit' })
              }
              srcSet={buildCloudinarySrcSet(selectedPhoto.secureUrl, [800, 1200, 1600, 1920])}
              sizes="95vw"
              alt={selectedPhoto.altText || selectedPhoto.caption || event.title}
              className="max-h-[78vh] w-auto rounded-xl object-contain shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
}
