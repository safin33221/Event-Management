import React, { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getMe } from '@/service/auth';
import {
  listAdminPortfolioEvents,
  listEventTypes,
} from '@/service/catalog/catalog.service';
import { PortfolioEventManager } from '@/components/module/admin/PortfolioEventManager';
import { PageSkeleton } from '@/components/shared/PageSkeleton';

async function AdminPortfolioContent() {
  const session = await getMe();
  if (!session) redirect('/login');
  if (session.role === 'STAFF' || session.role === 'ACCOUNTANT') redirect('/admin');

  const [eventsRes, etRes] = await Promise.all([
    listAdminPortfolioEvents(),
    listEventTypes(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
          Portfolio Showcase Events
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Create standalone event showcases, upload photos and highlight videos directly to
          Cloudinary, choose cover images, preview, and publish.
        </p>
      </div>

      <PortfolioEventManager
        initialEvents={eventsRes.ok && eventsRes.data ? eventsRes.data.data : []}
        eventTypes={etRes.ok && etRes.data ? etRes.data : []}
      />
    </div>
  );
}

export default function AdminPortfolioPage() {
  return (
    <Suspense fallback={<PageSkeleton label="Loading portfolio showcase manager..." />}>
      <AdminPortfolioContent />
    </Suspense>
  );
}
