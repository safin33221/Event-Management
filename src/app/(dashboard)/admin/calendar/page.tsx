import React, { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getMe } from '@/service/auth';
import { getAgencySettings } from '@/service/agency/agency.service';
import { listBookings } from '@/service/bookings/bookings.service';
import { getCalendar, listResources } from '@/service/schedule/schedule.service';
import { CalendarWorkspace } from '@/components/module/admin/CalendarWorkspace';
import { PageSkeleton } from '@/components/shared/PageSkeleton';

function addDaysIso(days: number): string {
  const d = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  return d.toISOString().slice(0, 10);
}

async function AdminCalendarContent() {
  const session = await getMe();
  if (!session) redirect('/login');
  if (session.role === 'STAFF') redirect('/staff');

  const from = addDaysIso(-7);
  const to = addDaysIso(30);

  const [settingsRes, calRes, resRes, bookingsRes] = await Promise.all([
    getAgencySettings(),
    getCalendar(from, to),
    listResources(),
    listBookings(),
  ]);

  return (
    <CalendarWorkspace
      timezone={settingsRes.ok && settingsRes.data ? settingsRes.data.timezone : 'Asia/Dhaka'}
      initialFrom={from}
      initialTo={to}
      initialSessions={calRes.ok && calRes.data ? calRes.data.sessions : []}
      initialResources={resRes.ok && resRes.data ? resRes.data : []}
      bookings={bookingsRes.ok && bookingsRes.data ? bookingsRes.data.data : []}
    />
  );
}

export default function AdminCalendarPage() {
  return (
    <Suspense fallback={<PageSkeleton label="Loading studio calendar..." />}>
      <AdminCalendarContent />
    </Suspense>
  );
}
