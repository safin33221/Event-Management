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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            {settings?.displayName || 'Studio Home'}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Everything happening in your studio at a glance • {timezone}
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Link
            href="/admin/calendar"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <CalendarIcon className="w-3.5 h-3.5 text-slate-500" />
            <span>View Schedule</span>
          </Link>
          <Link
            href="/admin/bookings"
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors"
          >
            <span>Manage Bookings</span>
            <ArrowRightIcon className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Simple 3-Step Guide Strip */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Link
          href="/admin/bookings?tab=inquiries"
          className="atelier-card p-4 flex items-center gap-3.5 hover:border-indigo-300 transition-colors group"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-xs font-bold text-indigo-600">
            1
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
              Inquiries ({newInquiriesCount} new)
            </p>
            <p className="text-xs text-slate-500 truncate">Log client requests &amp; dates</p>
          </div>
        </Link>

        <Link
          href="/admin/bookings?tab=quotes"
          className="atelier-card p-4 flex items-center gap-3.5 hover:border-indigo-300 transition-colors group"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-xs font-bold text-amber-600">
            2
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
              Quotes ({openQuotesCount} open)
            </p>
            <p className="text-xs text-slate-500 truncate">Send price &amp; confirm booking</p>
          </div>
        </Link>

        <Link
          href="/admin/bookings"
          className="atelier-card p-4 flex items-center gap-3.5 hover:border-indigo-300 transition-colors group"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-xs font-bold text-emerald-600">
            3
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
              Bookings ({confirmedCount} confirmed)
            </p>
            <p className="text-xs text-slate-500 truncate">Track payments &amp; deliverables</p>
          </div>
        </Link>
      </div>

      {/* KPI Strip */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="atelier-card p-5">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold text-slate-500">New Inquiries</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <SparklesIcon className="w-4 h-4" />
            </span>
          </div>
          <p className="text-3xl font-bold tracking-tight text-slate-900 mt-2.5 tabular-nums">
            {newInquiriesCount}
          </p>
          <p className="text-xs text-slate-500 mt-1">{inquiries.length} total inquiries</p>
        </div>

        <div className="atelier-card p-5">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold text-slate-500">Open Quotes</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <ReceiptIcon className="w-4 h-4" />
            </span>
          </div>
          <p className="text-3xl font-bold tracking-tight text-slate-900 mt-2.5 tabular-nums">
            {openQuotesCount}
          </p>
          <p className="text-xs text-slate-500 mt-1">{quotes.length} total quotes</p>
        </div>

        <div className="atelier-card p-5">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold text-slate-500">Confirmed Events</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <UsersIcon className="w-4 h-4" />
            </span>
          </div>
          <p className="text-3xl font-bold tracking-tight text-slate-900 mt-2.5 tabular-nums">
            {confirmedCount}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Total value:{' '}
            <span className="font-mono-code font-medium text-slate-700 tabular-nums">
              {formatPoisha(totalAgreedPoisha, currency)}
            </span>
          </p>
        </div>

        <div className="atelier-card p-5">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold text-slate-500">Upcoming Sessions</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
              <CalendarIcon className="w-4 h-4" />
            </span>
          </div>
          <p className="text-3xl font-bold tracking-tight text-slate-900 mt-2.5 tabular-nums">
            {upcomingSessions.length}
          </p>
          <p className="text-xs text-slate-500 mt-1">In the next 14 days</p>
        </div>
      </div>

      {/* Two-Column Operational Feed */}
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7 atelier-card p-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
            <h2 className="text-base font-bold tracking-tight text-slate-900">Recent Bookings</h2>
            <Link
              href="/admin/bookings"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
            >
              See all →
            </Link>
          </div>
          {bookings.length === 0 ? (
            <p className="text-sm text-slate-500 py-8 text-center">
              No bookings yet. Accept a quote in Bookings &amp; Payments to create one.
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {bookings.slice(0, 5).map((b) => (
                <div key={b.id} className="py-3.5 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono-code text-xs font-semibold text-slate-500">
                        {b.reference}
                      </span>
                      <StatusBadge status={b.status} />
                    </div>
                    <p className="text-sm font-semibold text-slate-900 truncate mt-1">
                      {b.eventTitle}
                    </p>
                    <p className="text-xs text-slate-500">
                      {b.clientName} • {formatLocalDate(b.eventDate)}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-mono-code text-sm font-semibold text-slate-900 tabular-nums">
                      {formatPoisha(b.agreedTotalPoisha, b.currency)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-5 atelier-card p-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
            <h2 className="text-base font-bold tracking-tight text-slate-900">Upcoming Schedule</h2>
            <Link
              href="/admin/calendar"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
            >
              Full schedule →
            </Link>
          </div>
          {upcomingSessions.length === 0 ? (
            <p className="text-sm text-slate-500 py-8 text-center">
              No sessions scheduled in the next 14 days.
            </p>
          ) : (
            <div className="space-y-3">
              {upcomingSessions.slice(0, 5).map((s) => (
                <div
                  key={s.id}
                  className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-1"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-mono-code font-semibold text-indigo-600">
                      {s.agencyLocalDate || formatLocalDate(s.startAt)}
                    </span>
                    <StatusBadge status={s.status} />
                  </div>
                  <p className="text-sm font-semibold text-slate-900">{s.title}</p>
                  <p className="text-xs text-slate-500">
                    {formatDateTimeInTz(s.startAt, timezone)} → {formatDateTimeInTz(s.endAt, timezone)}
                  </p>
                  {s.booking && (
                    <p className="text-[11px] text-slate-600">
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
