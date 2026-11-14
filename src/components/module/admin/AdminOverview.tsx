import React from 'react';
import Link from 'next/link';
import {
  Booking,
  EventSession,
  Inquiry,
  Quote,
  StudioSettings,
} from '@/types/event-management';
import { formatDateTimeInTz, formatLocalDate, formatPoisha } from '@/lib/utils';
import { StatusBadge } from '@/components/shared/StatusBadge';
import {
  ArrowRightIcon,
  CalendarIcon,
  ReceiptIcon,
  SparklesIcon,
  UsersIcon,
} from '@/components/shared/Icons';

interface AdminOverviewProps {
  settings: StudioSettings | null;
  inquiries: Inquiry[];
  quotes: Quote[];
  bookings: Booking[];
  upcomingSessions: EventSession[];
}

export function AdminOverview({
  settings,
  inquiries,
  quotes,
  bookings,
  upcomingSessions,
}: AdminOverviewProps) {
  const currency = settings?.currency || 'BDT';
  const timezone = settings?.timezone || 'Asia/Dhaka';

  const newInquiriesCount = inquiries.filter((i) => i.status === 'NEW').length;
  const openQuotesCount = quotes.filter(
    (q) => q.status === 'DRAFT' || q.status === 'SENT',
  ).length;
  const confirmedCount = bookings.filter((b) => b.status === 'CONFIRMED').length;
  const totalAgreedPoisha = bookings
    .filter((b) => b.status !== 'CANCELLED')
    .reduce((acc, b) => acc + b.agreedTotalPoisha, 0);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6B655D]">
            Executive Overview • {timezone}
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold text-[#141312] mt-1">
            {settings?.displayName || 'Studio Command'}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/bookings"
            className="inline-flex items-center gap-2 rounded-xl bg-[#141312] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#2A2725] transition-colors"
          >
            <span>Open Bookings & Ledger</span>
            <ArrowRightIcon className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="atelier-card p-5">
          <div className="flex items-center justify-between text-[#6B655D]">
            <span className="text-xs font-semibold uppercase tracking-wider">New Inquiries</span>
            <SparklesIcon className="w-4 h-4" />
          </div>
          <p className="font-display text-4xl font-semibold mt-3">{newInquiriesCount}</p>
          <p className="text-xs text-[#6B655D] mt-1">{inquiries.length} total inquiries</p>
        </div>

        <div className="atelier-card p-5">
          <div className="flex items-center justify-between text-[#6B655D]">
            <span className="text-xs font-semibold uppercase tracking-wider">Open Quotes</span>
            <ReceiptIcon className="w-4 h-4" />
          </div>
          <p className="font-display text-4xl font-semibold mt-3">{openQuotesCount}</p>
          <p className="text-xs text-[#6B655D] mt-1">{quotes.length} total quotes</p>
        </div>

        <div className="atelier-card p-5">
          <div className="flex items-center justify-between text-[#6B655D]">
            <span className="text-xs font-semibold uppercase tracking-wider">Confirmed Events</span>
            <UsersIcon className="w-4 h-4" />
          </div>
          <p className="font-display text-4xl font-semibold mt-3">{confirmedCount}</p>
          <p className="text-xs text-[#6B655D] mt-1">
            Agreed value: <span className="font-mono-code">{formatPoisha(totalAgreedPoisha, currency)}</span>
          </p>
        </div>

        <div className="atelier-card p-5">
          <div className="flex items-center justify-between text-[#6B655D]">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Upcoming Sessions
            </span>
            <CalendarIcon className="w-4 h-4" />
          </div>
          <p className="font-display text-4xl font-semibold mt-3">{upcomingSessions.length}</p>
          <p className="text-xs text-[#6B655D] mt-1">Next 14 days ({timezone})</p>
        </div>
      </div>

      {/* Two-Column Operational Feed */}
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7 atelier-card p-6">
          <div className="flex items-center justify-between border-b border-[#E6DFD5] pb-4 mb-4">
            <h2 className="font-display text-2xl font-semibold">Recent Bookings</h2>
            <Link href="/admin/bookings" className="text-xs font-semibold underline underline-offset-4">
              Manage all
            </Link>
          </div>
          {bookings.length === 0 ? (
            <p className="text-sm text-[#6B655D] py-6 text-center">
              No bookings yet. Accept a quote in Bookings & Ledger to create one.
            </p>
          ) : (
            <div className="divide-y divide-[#E6DFD5]">
              {bookings.slice(0, 6).map((b) => (
                <div key={b.id} className="py-3.5 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono-code text-xs font-semibold text-[#6B655D]">
                        {b.reference}
                      </span>
                      <StatusBadge status={b.status} />
                    </div>
                    <p className="text-sm font-semibold text-[#141312] truncate mt-1">
                      {b.eventTitle}
                    </p>
                    <p className="text-xs text-[#6B655D]">
                      {b.clientName} • Event Date: {formatLocalDate(b.eventDate)}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-mono-code text-sm font-semibold">
                      {formatPoisha(b.agreedTotalPoisha, b.currency)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-5 atelier-card p-6">
          <div className="flex items-center justify-between border-b border-[#E6DFD5] pb-4 mb-4">
            <h2 className="font-display text-2xl font-semibold">Calendar Queue</h2>
            <Link href="/admin/calendar" className="text-xs font-semibold underline underline-offset-4">
              Full calendar
            </Link>
          </div>
          {upcomingSessions.length === 0 ? (
            <p className="text-sm text-[#6B655D] py-6 text-center">
              No sessions scheduled in the next 14 days.
            </p>
          ) : (
            <div className="space-y-3">
              {upcomingSessions.slice(0, 6).map((s) => (
                <div
                  key={s.id}
                  className="rounded-xl border border-[#E6DFD5] bg-[#FAF8F5] p-3.5 space-y-1"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-mono-code font-semibold text-[#B45309]">
                      {s.agencyLocalDate || formatLocalDate(s.startAt)}
                    </span>
                    <StatusBadge status={s.status} />
                  </div>
                  <p className="text-sm font-semibold text-[#141312]">{s.title}</p>
                  <p className="text-xs text-[#6B655D]">
                    {formatDateTimeInTz(s.startAt, timezone)} → {formatDateTimeInTz(s.endAt, timezone)}
                  </p>
                  {s.booking && (
                    <p className="text-[11px] text-[#4A453F]">
                      {s.booking.reference} — {s.booking.eventTitle}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
