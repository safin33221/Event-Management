import React, { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getMe } from '@/service/auth';
import { getAgencySettings } from '@/service/agency/agency.service';
import { listInquiries } from '@/service/inquiries/inquiries.service';
import { listQuotes } from '@/service/quotes/quotes.service';
import { listBookings } from '@/service/bookings/bookings.service';
import { listPackages } from '@/service/catalog/catalog.service';
import { listResources } from '@/service/schedule/schedule.service';
import { BookingsWorkspace } from '@/components/module/admin/BookingsWorkspace';
import { PageSkeleton } from '@/components/shared/PageSkeleton';

async function AdminBookingsContent() {
  const session = await getMe();
  if (!session) redirect('/login');
  if (session.role === 'STAFF') redirect('/staff');

  const [settingsRes, inqRes, quotesRes, bookingsRes, pkgRes, resourcesRes] = await Promise.all([
    getAgencySettings(),
    listInquiries(),
    listQuotes(),
    listBookings(),
    listPackages(),
    listResources(),
  ]);

  return (
    <BookingsWorkspace
      initialInquiries={inqRes.ok && inqRes.data ? inqRes.data.data : []}
      initialQuotes={quotesRes.ok && quotesRes.data ? quotesRes.data.data : []}
      initialBookings={bookingsRes.ok && bookingsRes.data ? bookingsRes.data.data : []}
      packages={pkgRes.ok && pkgRes.data ? pkgRes.data.data : []}
      initialResources={resourcesRes.ok && resourcesRes.data ? resourcesRes.data : []}
      currency={settingsRes.ok && settingsRes.data ? settingsRes.data.currency : 'BDT'}
      timezone={settingsRes.ok && settingsRes.data ? settingsRes.data.timezone : 'Asia/Dhaka'}
    />
  );
}

export default function AdminBookingsPage() {
  return (
    <Suspense fallback={<PageSkeleton label="Loading bookings and ledger..." />}>
      <AdminBookingsContent />
    </Suspense>
  );
}
