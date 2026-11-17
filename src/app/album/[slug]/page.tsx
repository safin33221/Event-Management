import React, { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { PageSkeleton } from '@/components/shared/PageSkeleton';
import { getPublicBranding } from '@/service/agency/agency.service';
import { getPublicPortfolioEventBySlug } from '@/service/catalog/catalog.service';
import { NEUTRAL_PREVIEW_BRANDING } from '@/lib/publicStorefront';
import { PortfolioEventPageClient } from '@/components/module/public/PortfolioEventPageClient';

interface AlbumSlugPageProps {
  params: Promise<{ slug: string }>;
}

async function DigitalAlbumContent({ params }: AlbumSlugPageProps) {
  const { slug } = await params;

  const [brandRes, eventRes] = await Promise.all([
    getPublicBranding(),
    getPublicPortfolioEventBySlug(slug),
  ]);

  if (!eventRes.ok || !eventRes.data) {
    notFound();
  }

  const branding = brandRes.ok && brandRes.data ? brandRes.data : NEUTRAL_PREVIEW_BRANDING;

  return <PortfolioEventPageClient event={eventRes.data} branding={branding} />;
}

export default function AlbumSlugPage({ params }: AlbumSlugPageProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center p-6">
          <PageSkeleton label="Opening digital album..." />
        </div>
      }
    >
      <DigitalAlbumContent params={params} />
    </Suspense>
  );
}
