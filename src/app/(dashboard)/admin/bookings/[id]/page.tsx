import React, { Suspense } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getMe } from '@/service/auth';
import { getAgencySettings, listAgencyMembers } from '@/service/agency/agency.service';
import { getBooking } from '@/service/bookings/bookings.service';
import { getBookingLedger } from '@/service/payments/payments.service';
import { listResources } from '@/service/schedule/schedule.service';
import { BookingsWorkspace } from '@/components/module/admin/BookingsWorkspace';
import { PageSkeleton } from '@/components/shared/PageSkeleton';

interface AdminBookingDetailPageProps {
  params: Promise<{ id: string }>;
}

async function AdminBookingDetailContent({ params }: AdminBookingDetailPageProps) {
  const session = await getMe();
  if (!session) redirect('/login');
  if (session.role === 'STAFF') redirect('/staff');

  const { id } = await params;

  const [bookingRes, ledgerRes, settingsRes, resourcesRes, membersRes] = await Promise.all([
    getBooking(id),
    getBookingLedger(id),
    getAgencySettings(),
    listResources(),
    listAgencyMembers(),
  ]);

  if (!bookingRes.ok || !bookingRes.data) {
    return (
      <div className="space-y-4">
        <Link
          href="/admin/bookings"
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <span>← Back to All Bookings</span>
        </Link>
        <div className="atelier-card p-10 text-center space-y-2">
          <h1 className="text-lg font-bold text-slate-900">Booking not found</h1>
          <p className="text-sm text-slate-500">
            This booking may have been removed or you may not have access to view it.
          </p>
        </div>
      </div>
    );
  }

  return (
    <BookingsWorkspace
      initialInquiries={[]}
      initialQuotes={[]}
      initialBookings={[bookingRes.data]}
      packages={[]}
      eventTypes={[]}
      initialResources={resourcesRes.ok && resourcesRes.data ? resourcesRes.data : []}
      members={membersRes.ok && membersRes.data ? membersRes.data.filter((m) => m.isActive) : []}
      currency={settingsRes.ok && settingsRes.data ? settingsRes.data.currency : 'BDT'}
      timezone={settingsRes.ok && settingsRes.data ? settingsRes.data.timezone : 'Asia/Dhaka'}
      initialTab="bookings"
      initialSelectedBookingId={bookingRes.data.id}
      initialSelectedBooking={bookingRes.data}
      initialLedger={ledgerRes.ok && ledgerRes.data ? ledgerRes.data : null}
      isDetailPage
    />
  );
}

export default function AdminBookingDetailPage({ params }: AdminBookingDetailPageProps) {
  return (
    <Suspense fallback={<PageSkeleton label="Loading booking details..." />}>
      <AdminBookingDetailContent params={params} />
    </Suspense>
  );
}
