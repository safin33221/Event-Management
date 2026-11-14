import React, { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getMe } from '@/service/auth';
import { DashboardShell } from '@/components/common/DashboardShell';
import { PageSkeleton } from '@/components/shared/PageSkeleton';

async function GuardedDashboard({ children }: { children: React.ReactNode }) {
  const session = await getMe();
  if (!session) {
    redirect('/login');
  }

  return <DashboardShell session={session}>{children}</DashboardShell>;
}

export default function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <Suspense fallback={<PageSkeleton label="Verifying session..." />}>
      <GuardedDashboard>{children}</GuardedDashboard>
    </Suspense>
  );
}
