import React, { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getMe } from '@/service/auth';
import { listMyAssignments } from '@/service/operations/operations.service';
import { StaffWorkspace } from '@/components/module/staff/StaffWorkspace';
import { PageSkeleton } from '@/components/shared/PageSkeleton';

async function StaffContent() {
  const session = await getMe();
  if (!session) redirect('/login');

  const res = await listMyAssignments();
  return <StaffWorkspace initialAssignments={res.ok && res.data ? res.data : []} />;
}

export default function StaffPage() {
  return (
    <Suspense fallback={<PageSkeleton label="Loading assigned work..." />}>
      <StaffContent />
    </Suspense>
  );
}
