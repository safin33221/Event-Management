import React, { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getMe } from '@/service/auth';
import { getAgencySettings, listAgencyMembers } from '@/service/agency/agency.service';
import {
  listDeliverableLabels,
  listEventTypes,
  listPackages,
  listTaskTemplates,
} from '@/service/catalog/catalog.service';
import { CatalogWorkspace } from '@/components/module/admin/CatalogWorkspace';
import { PageSkeleton } from '@/components/shared/PageSkeleton';

async function AdminTeamContent() {
  const session = await getMe();
  if (!session) redirect('/login');
  if (session.role === 'STAFF') redirect('/staff');

  const [settingsRes, etRes, memRes, delLabelsRes, taskTplRes, pkgRes] = await Promise.all([
    getAgencySettings(),
    listEventTypes(),
    listAgencyMembers(),
    listDeliverableLabels(),
    listTaskTemplates(),
    listPackages(),
  ]);

  return (
    <CatalogWorkspace
      section="team"
      initialSettings={settingsRes.ok && settingsRes.data ? settingsRes.data : null}
      initialPackages={pkgRes.ok && pkgRes.data ? pkgRes.data.data : []}
      initialEventTypes={etRes.ok && etRes.data ? etRes.data : []}
      initialMembers={memRes.ok && memRes.data ? memRes.data : []}
      initialDeliverableLabels={delLabelsRes.ok && delLabelsRes.data ? delLabelsRes.data : []}
      initialTaskTemplates={taskTplRes.ok && taskTplRes.data ? taskTplRes.data : []}
    />
  );
}

export default function AdminTeamPage() {
  return (
    <Suspense fallback={<PageSkeleton label="Loading studio team & automation..." />}>
      <AdminTeamContent />
    </Suspense>
  );
}
