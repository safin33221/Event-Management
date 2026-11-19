import { getPublicBranding } from '@/service/agency/agency.service';
import {
  getPublicEventTypes,
  getPublicPackages,
  getPublicPortfolio,
  getPublicPortfolioEvents,
} from '@/service/catalog/catalog.service';
import {
  EventType,
  PortfolioItem,
  PortfolioShowcaseEvent,
  PublicBranding,
  StudioPackage,
} from '@/types/event-management';

export const RONGILO_BRAND_NAME = 'Rongilo Event Management';

export const RONGILO_DEFAULT_THEME = {
  primaryColor: '#181216',
  secondaryColor: '#C98A2C',
  accentColor: '#B91C47',
  backgroundColor: '#FDFBF7',
  textColor: '#181216',
  fontFamily: 'Inter, system-ui, sans-serif',
};

const LEGACY_PLACEHOLDER_NAMES = new Set([
  '',
  'softilo event management',
  'softilo events',
  'softilo studio',
  'wedding photoart',
  'event studio',
]);

const LEGACY_DEFAULT_ACCENTS = new Set(['#4F46E5', '#0F766E']);

export const NEUTRAL_PREVIEW_BRANDING: PublicBranding = {
  displayName: RONGILO_BRAND_NAME,
  logoUrl: null,
  themeTokens: { ...RONGILO_DEFAULT_THEME },
  contactDetails: {},
  timezone: 'Asia/Dhaka',
  currency: 'BDT',
};

/**
 * Normalizes default/legacy studio branding into the signature Rongilo Event Management
 * Atelier aesthetic while preserving real contact details, logos, currencies, and explicit custom themes.
 */
export function resolvePublicBranding(raw?: PublicBranding | null): PublicBranding {
  if (!raw) {
    return NEUTRAL_PREVIEW_BRANDING;
  }

  const trimmedName = (raw.displayName || '').trim();
  const displayName = LEGACY_PLACEHOLDER_NAMES.has(trimmedName.toLowerCase())
    ? RONGILO_BRAND_NAME
    : trimmedName;

  const rawAccent = (raw.themeTokens?.accentColor || '').trim().toUpperCase();
  const usesLegacyDefaultTheme = !rawAccent || LEGACY_DEFAULT_ACCENTS.has(rawAccent);

  return {
    ...raw,
    displayName,
    themeTokens: usesLegacyDefaultTheme
      ? { ...RONGILO_DEFAULT_THEME }
      : {
          primaryColor: raw.themeTokens?.primaryColor || RONGILO_DEFAULT_THEME.primaryColor,
          secondaryColor: raw.themeTokens?.secondaryColor || RONGILO_DEFAULT_THEME.secondaryColor,
          accentColor: raw.themeTokens?.accentColor || RONGILO_DEFAULT_THEME.accentColor,
          backgroundColor:
            raw.themeTokens?.backgroundColor || RONGILO_DEFAULT_THEME.backgroundColor,
          textColor: raw.themeTokens?.textColor || RONGILO_DEFAULT_THEME.textColor,
          fontFamily: raw.themeTokens?.fontFamily || RONGILO_DEFAULT_THEME.fontFamily,
        },
  };
}

export async function loadPublicStorefront(): Promise<{
  branding: PublicBranding;
  eventTypes: EventType[];
  packages: StudioPackage[];
  portfolio: PortfolioItem[];
  portfolioEvents: PortfolioShowcaseEvent[];
  isBackendConnected: boolean;
}> {
  const [brandRes, etRes, pkgRes, portRes, portEventsRes] = await Promise.all([
    getPublicBranding(),
    getPublicEventTypes(),
    getPublicPackages(),
    getPublicPortfolio(),
    getPublicPortfolioEvents(),
  ]);

  if (!brandRes.ok || !brandRes.data) {
    return {
      branding: NEUTRAL_PREVIEW_BRANDING,
      eventTypes: [],
      packages: [],
      portfolio: [],
      portfolioEvents: [],
      isBackendConnected: false,
    };
  }

  return {
    branding: resolvePublicBranding(brandRes.data),
    eventTypes: etRes.ok && etRes.data ? etRes.data : [],
    packages: pkgRes.ok && pkgRes.data ? pkgRes.data.data : [],
    portfolio: portRes.ok && portRes.data ? portRes.data.data : [],
    portfolioEvents: portEventsRes.ok && portEventsRes.data ? portEventsRes.data.data : [],
    isBackendConnected: true,
  };
}
