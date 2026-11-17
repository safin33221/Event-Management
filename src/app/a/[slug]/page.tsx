import React, { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { PageSkeleton } from '@/components/shared/PageSkeleton';

async function RedirectToAlbum({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return redirect(`/album/${encodeURIComponent(slug)}`);
}

export default function ShortAlbumRedirectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center p-6">
          <PageSkeleton label="Opening digital album..." />
        </div>
      }
    >
      <RedirectToAlbum params={params} />
    </Suspense>
  );
}
