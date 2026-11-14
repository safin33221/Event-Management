import React, { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getMe } from '@/service/auth';
import { getAgencySettings, listAgencyMembers } from '@/service/agency/agency.service';
import { listEventTypes, listPackages } from '@/service/catalog/catalog.service';
import { CatalogWorkspace } from '@/components/module/admin/CatalogWorkspace';
import { PageSkeleton } from '@/components/shared/PageSkeleton';

async function AdminCatalogContent() {
  const session = await getMe();
  if (!session) redirect('/login');
  if (session.role === 'STAFF') redirect('/staff');

  const [settingsRes, pkgRes, etRes, memRes] = await Promise.all([
    getAgencySettings(),
    listPackages(),
    listEventTypes(),
    listAgencyMembers(),
  ]);

  return (
    <CatalogWorkspace
      initialSettings={settingsRes.ok && settingsRes.data ? settingsRes.data : null}
      initialPackages={pkgRes.ok && pkgRes.data ? pkgRes.data.data : []}
      eventTypes={etRes.ok && etRes.data ? etRes.data : []}
      initialMembers={memRes.ok && memRes.data ? memRes.data : []}
    />
  );
}

export default function AdminCatalogPage() {
  return (
    <Suspense fallback={<PageSkeleton label="Loading catalog & branding..." />}>
      <AdminCatalogContent />
    </Suspense>
  );
}
