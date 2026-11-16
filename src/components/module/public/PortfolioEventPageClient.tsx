'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { PortfolioMediaItem, PortfolioShowcaseEvent, PublicBranding } from '@/types/event-management';
import {
  buildCloudinaryImageUrl,
  buildCloudinarySrcSet,
  buildCloudinaryVideoPosterUrl,
} from '@/lib/showcaseMedia';
import { formatLocalDate } from '@/lib/utils';

interface PortfolioEventPageClientProps {
  event: PortfolioShowcaseEvent;
  branding: PublicBranding;
}

export function PortfolioEventPageClient({
  event,
  branding,
}: PortfolioEventPageClientProps) {
  const readyMedia = (event.media || []).filter((m) => m.status === 'READY');
  const photos = readyMedia.filter((m) => m.resourceType === 'IMAGE');
  const videos = readyMedia.filter((m) => m.resourceType === 'VIDEO');

  // High-res photo lightbox state (loaded only when thumbnail is clicked)
  const [selectedPhoto, setSelectedPhoto] = useState<PortfolioMediaItem | null>(null);
  // Video Play gate: NO <video> element or video file is downloaded before Play is clicked
  const [playingVideoIds, setPlayingVideoIds] = useState<Record<string, boolean>>({});

  const coverUrl =
    event.coverMedia?.deliveryUrls?.coverUrl ||
    (event.coverMedia?.secureUrl
      ? buildCloudinaryImageUrl(event.coverMedia.secureUrl, { width: 1400, crop: 'limit' })
      : photos[0]?.secureUrl
        ? buildCloudinaryImageUrl(photos[0].secureUrl, { width: 1400, crop: 'limit' })
        : '');

  return (
    <main className="flex-1 mx-auto max-w-6xl w-full px-4 py-10 sm:px-6 space-y-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/#portfolio"
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
        >
          ← Back to {branding.displayName} Portfolio
        </Link>

        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
          {event.eventType && (
            <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 font-semibold text-indigo-700">
              {event.eventType.name}
            </span>
          )}
          {event.eventDate && (
            <span className="font-mono-code">{formatLocalDate(event.eventDate)}</span>
          )}
          {event.location && <span>• {event.location}</span>}
        </div>
      </div>

      {/* First-screen Cover Hero (eagerly loaded with responsive srcSet) */}
      <section className="space-y-4">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
          {event.title}
        </h1>
        {event.description && (
          <p className="text-base text-slate-600 max-w-3xl leading-relaxed">
            {event.description}
          </p>
        )}

        {coverUrl && (
          <div className="rounded-2xl overflow-hidden bg-slate-900 aspect-[16/9] max-h-[520px] w-full shadow-md">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={coverUrl}
              srcSet={
                event.coverMedia?.secureUrl
                  ? buildCloudinarySrcSet(event.coverMedia.secureUrl, [640, 960, 1280, 1600])
                  : undefined
              }
              sizes="(max-width: 1200px) 100vw, 1152px"
              alt={event.coverMedia?.altText || event.title}
              loading="eager"
              fetchPriority="high"
              className="w-full h-full object-cover"
            />
          </div>
        )}
      </section>

      {/* Video Highlights (Lightweight Poster + Play Button First) */}
      {videos.length > 0 && (
        <section className="space-y-4">
          <div className="border-b border-slate-200 pb-2">
            <h2 className="text-xl font-bold text-slate-900">
              Video Highlights ({videos.length})
            </h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
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
                  className="rounded-2xl border border-slate-200 bg-slate-950 overflow-hidden flex flex-col shadow-xs"
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
                            alt={video.altText || video.caption || `${event.title} poster`}
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-cover opacity-90 transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className="w-full h-full bg-slate-900" />
                        )}
                        <span className="absolute inset-0 bg-slate-950/30 group-hover:bg-slate-950/15 transition-colors" />
                        <span className="relative z-10 flex items-center gap-2 rounded-full bg-white/95 px-5 py-2.5 text-xs font-bold text-slate-900 shadow-xl transition-transform duration-200 group-hover:scale-105">
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
                    <div className="px-4 py-3 bg-white text-xs text-slate-700 font-medium">
                      {video.caption}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Lazy-Loaded Photo Gallery */}
      {photos.length > 0 && (
        <section className="space-y-4">
          <div className="border-b border-slate-200 pb-2">
            <h2 className="text-xl font-bold text-slate-900">
              Photo Gallery ({photos.length})
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
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
                  className="group text-left rounded-xl overflow-hidden border border-slate-200 bg-white flex flex-col cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
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
                    <p className="px-3 py-2 text-xs text-slate-600 truncate w-full">
                      {photo.caption}
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* High-Res Lightbox Modal (Only loaded when thumbnail is clicked) */}
      {selectedPhoto && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedPhoto(null);
          }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/95 p-4"
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
              ✕ Close
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
              className="max-h-[80vh] w-auto rounded-xl object-contain"
            />
          </div>
        </div>
      )}
    </main>
  );
}
