import React, { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getMe } from '@/service/auth';
import { getAgencySettings, listAgencyMembers } from '@/service/agency/agency.service';
import { listInquiries } from '@/service/inquiries/inquiries.service';
import { listQuotes } from '@/service/quotes/quotes.service';
import { listBookings } from '@/service/bookings/bookings.service';
import { listEventTypes, listPackages } from '@/service/catalog/catalog.service';
import { listResources } from '@/service/schedule/schedule.service';
import { BookingsWorkspace } from '@/components/module/admin/BookingsWorkspace';
import { PageSkeleton } from '@/components/shared/PageSkeleton';

interface AdminBookingsPageProps {
  searchParams?: Promise<{ tab?: string; bookingId?: string }>;
}

async function AdminBookingsContent({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string; bookingId?: string }>;
}) {
  const session = await getMe();
  if (!session) redirect('/login');
  if (session.role === 'STAFF') redirect('/staff');

  const resolvedParams = searchParams ? await searchParams : {};

  const [settingsRes, inqRes, quotesRes, bookingsRes, pkgRes, etRes, resourcesRes, membersRes] =
    await Promise.all([
      getAgencySettings(),
      listInquiries(),
      listQuotes(),
      listBookings(),
      listPackages(),
      listEventTypes(),
      listResources(),
      listAgencyMembers(),
    ]);

  const initialTab =
    resolvedParams.tab === 'inquiries' ||
    resolvedParams.tab === 'quotes' ||
    resolvedParams.tab === 'bookings'
      ? resolvedParams.tab
      : 'bookings';

  return (
    <BookingsWorkspace
      initialInquiries={inqRes.ok && inqRes.data ? inqRes.data.data : []}
      initialQuotes={quotesRes.ok && quotesRes.data ? quotesRes.data.data : []}
      initialBookings={bookingsRes.ok && bookingsRes.data ? bookingsRes.data.data : []}
      packages={pkgRes.ok && pkgRes.data ? pkgRes.data.data : []}
      eventTypes={etRes.ok && etRes.data ? etRes.data : []}
      initialResources={resourcesRes.ok && resourcesRes.data ? resourcesRes.data : []}
      members={membersRes.ok && membersRes.data ? membersRes.data.filter((m) => m.isActive) : []}
      currency={settingsRes.ok && settingsRes.data ? settingsRes.data.currency : 'BDT'}
      timezone={settingsRes.ok && settingsRes.data ? settingsRes.data.timezone : 'Asia/Dhaka'}
      initialTab={initialTab}
      initialSelectedBookingId={resolvedParams.bookingId}
    />
  );
}

export default function AdminBookingsPage({ searchParams }: AdminBookingsPageProps) {
  return (
    <Suspense fallback={<PageSkeleton label="Loading bookings and ledger..." />}>
      <AdminBookingsContent searchParams={searchParams} />
    </Suspense>
  );
}
