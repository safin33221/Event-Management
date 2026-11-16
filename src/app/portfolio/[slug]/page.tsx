import React, { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { Navbar } from '@/components/common/Navbar';
import { Footer } from '@/components/common/Footer';
import { PageSkeleton } from '@/components/shared/PageSkeleton';
import { getPublicBranding } from '@/service/agency/agency.service';
import { getPublicPortfolioEventBySlug } from '@/service/catalog/catalog.service';
import { NEUTRAL_PREVIEW_BRANDING } from '@/lib/publicStorefront';
import { PortfolioEventPageClient } from '@/components/module/public/PortfolioEventPageClient';

interface PortfolioSlugPageProps {
  params: Promise<{ slug: string }>;
}

async function PortfolioEventDetailContent({ slug }: { slug: string }) {
  const [brandRes, eventRes] = await Promise.all([
    getPublicBranding(),
    getPublicPortfolioEventBySlug(slug),
  ]);

  if (!eventRes.ok || !eventRes.data) {
    notFound();
  }

  const branding = brandRes.ok && brandRes.data ? brandRes.data : NEUTRAL_PREVIEW_BRANDING;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar branding={branding} />
      <PortfolioEventPageClient event={eventRes.data} branding={branding} />
      <Footer branding={branding} />
    </div>
  );
}

export default async function PortfolioSlugPage({ params }: PortfolioSlugPageProps) {
  const { slug } = await params;
  return (
    <Suspense fallback={<PageSkeleton label="Loading showcase event..." />}>
      <PortfolioEventDetailContent slug={slug} />
    </Suspense>
  );
}
