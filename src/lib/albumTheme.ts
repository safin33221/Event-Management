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

export interface GeneratedAlbumThemeResult {
  name: string;
  theme: AlbumThemeConfig;
}

const CURATED_AUTO_THEMES: Array<{ name: string; theme: AlbumThemeConfig }> = [
  ...ALBUM_THEME_PRESETS.map((p) => ({
    name: p.name,
    theme: {
      preset: p.id,
      bg: p.bg,
      surface: p.surface,
      text: p.text,
      accent: p.accent,
      isDark: p.isDark,
      fontStyle: p.fontStyle,
    },
  })),
  {
    name: 'Champagne Espresso Noir',
    theme: {
      preset: 'custom',
      bg: '#14110F',
      surface: '#1E1916',
      text: '#F7F1EB',
      accent: '#C28246',
      isDark: true,
      fontStyle: 'serif',
    },
  },
  {
    name: 'Royal Sapphire & Pearl',
    theme: {
      preset: 'custom',
      bg: '#F4F7FB',
      surface: '#FFFFFF',
      text: '#0F1B33',
      accent: '#1D4ED8',
      isDark: false,
      fontStyle: 'serif',
    },
  },
  {
    name: 'Sunlit Travertine & Terracotta',
    theme: {
      preset: 'custom',
      bg: '#FBF6F0',
      surface: '#FFFFFF',
      text: '#291D18',
      accent: '#B44B31',
      isDark: false,
      fontStyle: 'serif',
    },
  },
  {
    name: 'Antique Parchment & Burgundy',
    theme: {
      preset: 'custom',
      bg: '#F8F4ED',
      surface: '#FFFDF9',
      text: '#261419',
      accent: '#881337',
      isDark: false,
      fontStyle: 'serif',
    },
  },
  {
    name: 'Deep Forest Nocturne',
    theme: {
      preset: 'custom',
      bg: '#0C1410',
      surface: '#13201A',
      text: '#ECFDF5',
      accent: '#10B981',
      isDark: true,
      fontStyle: 'serif',
    },
  },
  {
    name: 'Dusky Lavender & Graphite',
    theme: {
      preset: 'custom',
      bg: '#F7F5FA',
      surface: '#FFFFFF',
      text: '#1F1A2C',
      accent: '#7C3AED',
      isDark: false,
      fontStyle: 'sans',
    },
  },
  {
    name: 'Midnight Aegean & Teal',
    theme: {
      preset: 'custom',
      bg: '#0B1319',
      surface: '#121E27',
      text: '#F0F9FF',
      accent: '#0EA5E9',
      isDark: true,
      fontStyle: 'sans',
    },
  },
  {
    name: 'Olive Linen & Bronze',
    theme: {
      preset: 'custom',
      bg: '#F6F6F0',
      surface: '#FFFFFF',
      text: '#23261A',
      accent: '#78622C',
      isDark: false,
      fontStyle: 'serif',
    },
  },
  {
    name: 'Glacier Mist & Slate',
    theme: {
      preset: 'custom',
      bg: '#F1F5F9',
      surface: '#FFFFFF',
      text: '#0F172A',
      accent: '#334155',
      isDark: false,
      fontStyle: 'sans',
    },
  },
  {
    name: 'Crimson Velvet Cinema',
    theme: {
      preset: 'custom',
      bg: '#140B0E',
      surface: '#211217',
      text: '#FFF1F2',
      accent: '#E11D48',
      isDark: true,
      fontStyle: 'serif',
    },
  },
];

function hslToHex(h: number, s: number, l: number): string {
  const hue = ((h % 360) + 360) % 360;
  const sat = Math.max(0, Math.min(100, s)) / 100;
  const light = Math.max(0, Math.min(100, l)) / 100;
  const k = (n: number) => (n + hue / 30) % 12;
  const a = sat * Math.min(light, 1 - light);
  const f = (n: number) =>
    light - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const toByte = (x: number) =>
    Math.round(255 * x)
      .toString(16)
      .padStart(2, '0')
      .toUpperCase();
  return `#${toByte(f(0))}${toByte(f(8))}${toByte(f(4))}`;
}

/**
 * Generates a balanced, readable, high-contrast color + typography theme combination.
 * Alternates cleanly across curated studio palettes and harmonious HSL pairings.
 */
export function generateMatchingAlbumTheme(
  currentTheme?: AlbumThemeConfig,
  preferDynamic = false,
): GeneratedAlbumThemeResult {
  const sameAsCurrent = (t: AlbumThemeConfig) =>
    Boolean(
      currentTheme &&
        t.bg.toUpperCase() === currentTheme.bg.toUpperCase() &&
        t.accent.toUpperCase() === currentTheme.accent.toUpperCase(),
    );

  if (!preferDynamic) {
    const candidates = CURATED_AUTO_THEMES.filter((item) => !sameAsCurrent(item.theme));
    const pool = candidates.length > 0 ? candidates : CURATED_AUTO_THEMES;
    const picked = pool[Math.floor(Math.random() * pool.length)];
    return {
      name: picked.name,
      theme: { ...picked.theme },
    };
  }

  // Harmonious algorithmic fallback for infinite fresh combinations
  const hue = Math.floor(Math.random() * 360);
  const isDark = Math.random() < 0.35;
  const fontStyle: AlbumFontStyle = Math.random() < 0.72 ? 'serif' : 'sans';

  const bg = isDark ? hslToHex(hue, 22, 6) : hslToHex(hue, 32, 97);
  const surface = isDark ? hslToHex(hue, 20, 10) : '#FFFFFF';
  const text = isDark ? hslToHex(hue, 20, 96) : hslToHex(hue, 30, 11);
  const accent = isDark ? hslToHex(hue, 72, 48) : hslToHex(hue, 68, 38);

  return {
    name: isDark ? 'Custom Evening Palette' : 'Custom Daylight Palette',
    theme: {
      preset: 'custom',
      bg,
      surface,
      text,
      accent,
      isDark,
      fontStyle,
    },
  };
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
