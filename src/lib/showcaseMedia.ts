export type ShowcaseMediaKind = 'photo' | 'video';

export interface ParsedShowcaseMedia {
  kind: ShowcaseMediaKind;
  coverUrl: string;
  /** For photo galleries: 1 or more image URLs */
  photos: string[];
  /** For video films: original video URL */
  videoUrl?: string;
  /** For YouTube / Vimeo embeds */
  embedUrl?: string;
  /** True when videoUrl is a direct video file (.mp4 / .webm) */
  isDirectVideo?: boolean;
}

const YOUTUBE_REGEX =
  /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
const VIMEO_REGEX = /vimeo\.com\/(?:video\/)?(\d+)/;
const DIRECT_VIDEO_REGEX = /\.(mp4|webm|mov|m4v)(\?.*)?$/i;

export function extractYouTubeId(url: string): string | null {
  const match = url.match(YOUTUBE_REGEX);
  return match?.[1] ?? null;
}

export function extractVimeoId(url: string): string | null {
  const match = url.match(VIMEO_REGEX);
  return match?.[1] ?? null;
}

export function isVideoUrl(url: string): boolean {
  return Boolean(extractYouTubeId(url) || extractVimeoId(url) || DIRECT_VIDEO_REGEX.test(url));
}

/**
 * Parses `PortfolioItem.mediaUrl` into either a photo gallery or a video film.
 * Supports:
 * - Single image URL: "https://.../photo.jpg"
 * - Multi-photo gallery (pipe or newline separated): "https://.../1.jpg|https://.../2.jpg"
 * - Video URL (YouTube, Vimeo, or MP4/WebM): "https://youtu.be/..."
 * - Video with custom cover: "cover=https://.../thumb.jpg|video=https://youtu.be/..."
 */
export function parseShowcaseMedia(rawMediaUrl: string): ParsedShowcaseMedia {
  const raw = (rawMediaUrl || '').trim();

  // Check explicit cover=...|video=... format
  if (raw.includes('video=')) {
    const parts = raw
      .split('|')
      .map((s) => s.trim())
      .filter(Boolean);
    const coverPart = parts.find((p) => p.startsWith('cover='))?.slice(6).trim() || '';
    const videoPart = parts.find((p) => p.startsWith('video='))?.slice(6).trim() || '';
    if (videoPart) {
      return buildVideoMedia(videoPart, coverPart || undefined);
    }
  }

  // Single video URL
  if (!raw.includes('|') && !raw.includes('\n') && isVideoUrl(raw)) {
    return buildVideoMedia(raw);
  }

  // Photo or multi-photo gallery
  const photos = raw
    .split(/[|\n]+/)
    .map((u) => u.trim())
    .filter(Boolean);

  return {
    kind: 'photo',
    coverUrl: photos[0] || '',
    photos,
  };
}

function buildVideoMedia(videoUrl: string, customCover?: string): ParsedShowcaseMedia {
  const ytId = extractYouTubeId(videoUrl);
  if (ytId) {
    return {
      kind: 'video',
      coverUrl: customCover || `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`,
      photos: [],
      videoUrl,
      embedUrl: `https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0`,
    };
  }

  const vimeoId = extractVimeoId(videoUrl);
  if (vimeoId) {
    return {
      kind: 'video',
      coverUrl: customCover || '',
      photos: [],
      videoUrl,
      embedUrl: `https://player.vimeo.com/video/${vimeoId}?autoplay=1`,
    };
  }

  return {
    kind: 'video',
    coverUrl: customCover || '',
    photos: [],
    videoUrl,
    isDirectVideo: true,
  };
}
