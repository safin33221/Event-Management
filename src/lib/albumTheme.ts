export type AlbumThemePresetId =
  | 'ivory-classic'
  | 'obsidian-gold'
  | 'blush-silk'
  | 'emerald-estate'
  | 'slate-atelier'
  | 'velvet-plum'
  | 'custom';

export type AlbumFontStyle = 'serif' | 'sans';

export interface AlbumThemeConfig {
  preset: AlbumThemePresetId;
  bg: string;
  surface: string;
  text: string;
  accent: string;
  isDark: boolean;
  fontStyle: AlbumFontStyle;
}

export interface AlbumThemePreset extends AlbumThemeConfig {
  id: Exclude<AlbumThemePresetId, 'custom'>;
  name: string;
  tagline: string;
}

export const DEFAULT_ALBUM_THEME: AlbumThemeConfig = {
  preset: 'ivory-classic',
  bg: '#FAF8F5',
  surface: '#FFFFFF',
  text: '#1C1917',
  accent: '#B45309',
  isDark: false,
  fontStyle: 'serif',
};

export const ALBUM_THEME_PRESETS: AlbumThemePreset[] = [
  {
    id: 'ivory-classic',
    preset: 'ivory-classic',
    name: 'Warm Museum Ivory',
    tagline: 'Bright alabaster & warm gold accent',
    bg: '#FAF8F5',
    surface: '#FFFFFF',
    text: '#1C1917',
    accent: '#B45309',
    isDark: false,
    fontStyle: 'serif',
  },
  {
    id: 'obsidian-gold',
    preset: 'obsidian-gold',
    name: 'Midnight Noir',
    tagline: 'Deep obsidian theater & champagne',
    bg: '#0B0C10',
    surface: '#14151C',
    text: '#F5F5F4',
    accent: '#D97706',
    isDark: true,
    fontStyle: 'serif',
  },
  {
    id: 'blush-silk',
    preset: 'blush-silk',
    name: 'Romantic Rose Silk',
    tagline: 'Soft rosewood warmth for weddings',
    bg: '#FDF7F6',
    surface: '#FFFFFF',
    text: '#2B181E',
    accent: '#BE185D',
    isDark: false,
    fontStyle: 'serif',
  },
  {
    id: 'emerald-estate',
    preset: 'emerald-estate',
    name: 'Botanical Emerald',
    tagline: 'Garden sage canvas & deep emerald',
    bg: '#F4F7F5',
    surface: '#FFFFFF',
    text: '#0F241B',
    accent: '#047857',
    isDark: false,
    fontStyle: 'serif',
  },
  {
    id: 'slate-atelier',
    preset: 'slate-atelier',
    name: 'Modern Editorial',
    tagline: 'Crisp studio white & cobalt ink',
    bg: '#F8FAFC',
    surface: '#FFFFFF',
    text: '#0F172A',
    accent: '#4F46E5',
    isDark: false,
    fontStyle: 'sans',
  },
  {
    id: 'velvet-plum',
    preset: 'velvet-plum',
    name: 'Evening Velvet Plum',
    tagline: 'Moody twilight purple & rose glow',
    bg: '#130D17',
    surface: '#1D1524',
    text: '#FAF5FF',
    accent: '#C026D3',
    isDark: true,
    fontStyle: 'serif',
  },
];

const THEME_TAG_REGEX = /\n?\[album-theme:(\{[^\]]*\})\]/g;

function normalizeHex(val: unknown, fallback: string): string {
  if (typeof val === 'string' && /^#[0-9a-fA-F]{6}$/.test(val.trim())) {
    return val.trim().toUpperCase();
  }
  return fallback;
}

export function parseAlbumDescriptionAndTheme(rawDescription?: string | null): {
  cleanDescription: string;
  theme: AlbumThemeConfig;
} {
  const raw = rawDescription || '';
  let lastJson: string | null = null;
  const cleanDescription = raw
    .replace(THEME_TAG_REGEX, (_, jsonStr: string) => {
      lastJson = jsonStr;
      return '';
    })
    .trim();

  if (!lastJson) {
    return { cleanDescription, theme: { ...DEFAULT_ALBUM_THEME } };
  }

  try {
    const parsed = JSON.parse(lastJson) as Record<string, unknown>;
    const presetCandidate = typeof parsed.p === 'string' ? parsed.p : 'ivory-classic';
    const matchedPreset = ALBUM_THEME_PRESETS.find((pr) => pr.id === presetCandidate);
    const base = matchedPreset ?? DEFAULT_ALBUM_THEME;

    return {
      cleanDescription,
      theme: {
        preset: matchedPreset
          ? matchedPreset.id
          : presetCandidate === 'custom'
            ? 'custom'
            : DEFAULT_ALBUM_THEME.preset,
        bg: normalizeHex(parsed.bg, base.bg),
        surface: normalizeHex(parsed.s, base.surface),
        text: normalizeHex(parsed.t, base.text),
        accent: normalizeHex(parsed.a, base.accent),
        isDark: typeof parsed.d === 'number' ? parsed.d === 1 : Boolean(parsed.d ?? base.isDark),
        fontStyle: parsed.f === 'sans' ? 'sans' : 'serif',
      },
    };
  } catch {
    return { cleanDescription, theme: { ...DEFAULT_ALBUM_THEME } };
  }
}

export function serializeAlbumDescriptionWithTheme(
  cleanDescription: string,
  theme: AlbumThemeConfig,
): string {
  const cleaned = cleanDescription.replace(THEME_TAG_REGEX, '').trim();
  const compactPayload = JSON.stringify({
    p: theme.preset,
    bg: normalizeHex(theme.bg, DEFAULT_ALBUM_THEME.bg),
    s: normalizeHex(theme.surface, DEFAULT_ALBUM_THEME.surface),
    t: normalizeHex(theme.text, DEFAULT_ALBUM_THEME.text),
    a: normalizeHex(theme.accent, DEFAULT_ALBUM_THEME.accent),
    d: theme.isDark ? 1 : 0,
    f: theme.fontStyle === 'sans' ? 'sans' : 'serif',
  });
  return cleaned ? `${cleaned}\n[album-theme:${compactPayload}]` : `[album-theme:${compactPayload}]`;
}

export function shortenTitleToSlug(title: string): string {
  const stopWords = new Set([
    'and',
    'the',
    'of',
    'for',
    'with',
    'at',
    'in',
    'on',
    'by',
    'event',
    'reception',
    'ceremony',
  ]);
  const words = title
    .toLowerCase()
    .replace(/['’]s\b/g, 's')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter((w) => w && !stopWords.has(w));

  let base = '';
  for (const word of words) {
    const candidate = base ? `${base}-${word}` : word;
    if (candidate.length <= 24) {
      base = candidate;
    } else {
      break;
    }
    if (base.split('-').length >= 3) break;
  }
  return base || words[0]?.slice(0, 24) || '';
}
