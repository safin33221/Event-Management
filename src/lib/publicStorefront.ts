import { getPublicBranding } from '@/service/agency/agency.service';
import { getPublicPackages, getPublicPortfolio } from '@/service/catalog/catalog.service';
import { StudioPackage, PortfolioItem, PublicBranding } from '@/types/event-management';

export const NEUTRAL_PREVIEW_BRANDING: PublicBranding = {
  displayName: 'Softilo Event Management',
  logoUrl: null,
  themeTokens: {
    primaryColor: '#0F172A',
    secondaryColor: '#475569',
    accentColor: '#4F46E5',
    backgroundColor: '#F8FAFC',
    textColor: '#0F172A',
    fontFamily: 'Inter, system-ui, sans-serif',
  },
  contactDetails: {},
  timezone: 'Asia/Dhaka',
  currency: 'BDT',
};

export async function loadPublicStorefront(): Promise<{
  branding: PublicBranding;
  packages: StudioPackage[];
  portfolio: PortfolioItem[];
  isBackendConnected: boolean;
}> {
  const [brandRes, pkgRes, portRes] = await Promise.all([
    getPublicBranding(),
    getPublicPackages(),
    getPublicPortfolio(),
  ]);

  if (!brandRes.ok || !brandRes.data) {
    return {
      branding: NEUTRAL_PREVIEW_BRANDING,
      packages: [],
      portfolio: [],
      isBackendConnected: false,
    };
  }

  return {
    branding: brandRes.data,
    packages: pkgRes.ok && pkgRes.data ? pkgRes.data.data : [],
    portfolio: portRes.ok && portRes.data ? portRes.data.data : [],
    isBackendConnected: true,
  };
}
