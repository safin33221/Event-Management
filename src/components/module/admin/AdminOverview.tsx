import React from 'react';
import Link from 'next/link';
import {
  AutomationAlerts,
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
  alerts?: AutomationAlerts | null;
}

export function AdminOverview({
  settings,
  inquiries,
  quotes,
  bookings,
  upcomingSessions,
  alerts,
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
          <h1 className="text-2xl sm:text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
            {settings?.displayName || 'Studio Home'}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Everything happening in your studio at a glance • {timezone}
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Link
            href="/admin/calendar"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <CalendarIcon className="w-3.5 h-3.5 text-slate-500" />
            <span>View Schedule</span>
          </Link>
          <Link
            href="/admin/bookings"
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors"
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
              Requests ({newInquiriesCount} new)
            </p>
            <p className="text-xs text-slate-500 truncate">Write down client event requests</p>
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
              Price Quotes ({openQuotesCount} open)
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
            <p className="text-xs text-slate-500 truncate">Track payments &amp; files</p>
          </div>
        </Link>
      </div>

      {/* KPI Strip */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="atelier-card p-5">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold text-slate-500">New Requests</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <SparklesIcon className="w-4 h-4" />
            </span>
          </div>
          <p className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 mt-2.5 tabular-nums">
            {newInquiriesCount}
          </p>
          <p className="text-sm text-slate-500 mt-1">{inquiries.length} total requests</p>
        </div>

        <div className="atelier-card p-5">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold text-slate-500">Open Quotes</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <ReceiptIcon className="w-4 h-4" />
            </span>
          </div>
          <p className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 mt-2.5 tabular-nums">
            {openQuotesCount}
          </p>
          <p className="text-sm text-slate-500 mt-1">{quotes.length} total quotes</p>
        </div>

        <div className="atelier-card p-5">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold text-slate-500">Confirmed Bookings</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <UsersIcon className="w-4 h-4" />
            </span>
          </div>
          <p className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 mt-2.5 tabular-nums">
            {confirmedCount}
          </p>
          <p className="text-sm text-slate-500 mt-1">
            Total value:{' '}
            <span className="font-mono-code font-medium text-slate-700 tabular-nums">
              {formatPoisha(totalAgreedPoisha, currency)}
            </span>
          </p>
        </div>

        <div className="atelier-card p-5">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold text-slate-500">Upcoming Events</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
              <CalendarIcon className="w-4 h-4" />
            </span>
          </div>
          <p className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 mt-2.5 tabular-nums">
            {upcomingSessions.length}
          </p>
          <p className="text-sm text-slate-500 mt-1">In the next 14 days</p>
        </div>
      </div>

      {/* Studio Automation & Action Queue */}
      {alerts && (
        <div className="atelier-card p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-lg font-bold tracking-tight text-slate-900">
                Action Queue &amp; Workflow Alerts
              </h2>
              <p className="text-xs text-slate-500">
                Live checks for bKash/Nagad/Bank verifications, ready confirmations, missing crew, and deadlines.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs font-mono-code">
              <span className="rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-amber-800">
                {alerts.counts.pendingPayments} pending verify
              </span>
              <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-emerald-800">
                {alerts.counts.readyToConfirm} ready confirm
              </span>
              <span className="rounded-full bg-sky-50 border border-sky-200 px-2.5 py-0.5 text-sky-800">
                {alerts.counts.unscheduledConfirmed} need shoot
              </span>
              <span className="rounded-full bg-rose-50 border border-rose-200 px-2.5 py-0.5 text-rose-800">
                {alerts.counts.urgentDeliverables} due/overdue files
              </span>
            </div>
          </div>

          {alerts.counts.pendingPayments === 0 &&
          alerts.counts.readyToConfirm === 0 &&
          alerts.counts.unscheduledConfirmed === 0 &&
          alerts.counts.urgentDeliverables === 0 ? (
            <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
              All caught up — no pending payment approvals, unscheduled confirmed bookings, or overdue deliverables.
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {alerts.pendingPayments.length > 0 && (
                <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-amber-800">
                    Payments Awaiting Verification ({alerts.pendingPayments.length})
                  </p>
                  {alerts.pendingPayments.slice(0, 4).map((p) => (
                    <Link
                      key={p.id}
                      href={`/admin/bookings?tab=bookings&bookingId=${p.bookingId}`}
                      className="flex items-center justify-between gap-2 rounded-lg bg-white px-3 py-2 border border-amber-100 hover:border-amber-300 transition-colors text-xs"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 truncate">
                          {p.booking.reference} • {p.booking.clientName}
                        </p>
                        <p className="text-slate-500 font-mono-code">
                          {p.method} {p.transactionRef ? `(${p.transactionRef})` : ''}
                        </p>
                      </div>
                      <span className="font-mono-code font-bold text-amber-800 shrink-0 tabular-nums">
                        {formatPoisha(p.amountPoisha, p.currency)}
                      </span>
                    </Link>
                  ))}
                </div>
              )}

              {alerts.readyToConfirmBookings.length > 0 && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                    Advance Met — Ready to Confirm ({alerts.readyToConfirmBookings.length})
                  </p>
                  {alerts.readyToConfirmBookings.slice(0, 4).map((b) => (
                    <Link
                      key={b.id}
                      href={`/admin/bookings?tab=bookings&bookingId=${b.id}`}
                      className="flex items-center justify-between gap-2 rounded-lg bg-white px-3 py-2 border border-emerald-100 hover:border-emerald-300 transition-colors text-xs"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 truncate">
                          {b.reference} • {b.eventTitle}
                        </p>
                        <p className="text-slate-500">
                          {b.clientName} • {formatLocalDate(b.eventDate)}
                        </p>
                      </div>
                      <span className="rounded-md bg-emerald-600 px-2 py-1 text-sm font-semibold text-white shrink-0">
                        Confirm →
                      </span>
                    </Link>
                  ))}
                </div>
              )}

              {alerts.unscheduledConfirmedBookings.length > 0 && (
                <div className="rounded-xl border border-sky-200 bg-sky-50/50 p-4 space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-sky-800">
                    Confirmed Missing Shoot Slot ({alerts.unscheduledConfirmedBookings.length})
                  </p>
                  {alerts.unscheduledConfirmedBookings.slice(0, 4).map((b) => (
                    <Link
                      key={b.id}
                      href={`/admin/bookings?tab=bookings&bookingId=${b.id}`}
                      className="flex items-center justify-between gap-2 rounded-lg bg-white px-3 py-2 border border-sky-100 hover:border-sky-300 transition-colors text-xs"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 truncate">
                          {b.reference} • {b.eventTitle}
                        </p>
                        <p className="text-slate-500">
                          {b.clientName} • {formatLocalDate(b.eventDate)}
                        </p>
                      </div>
                      <span className="text-xs font-semibold text-sky-700 shrink-0">
                        Add Slot →
                      </span>
                    </Link>
                  ))}
                </div>
              )}

              {alerts.urgentDeliverables.length > 0 && (
                <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-4 space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-rose-800">
                    Due Soon &amp; Overdue Deliverables ({alerts.urgentDeliverables.length})
                  </p>
                  {alerts.urgentDeliverables.slice(0, 4).map((d) => (
                    <Link
                      key={d.id}
                      href={`/admin/bookings?tab=bookings&bookingId=${d.bookingId}`}
                      className="flex items-center justify-between gap-2 rounded-lg bg-white px-3 py-2 border border-rose-100 hover:border-rose-300 transition-colors text-xs"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 truncate">
                          {d.label} — {d.booking.reference}
                        </p>
                        <p className="text-slate-500 truncate">{d.booking.eventTitle}</p>
                      </div>
                      <span
                        className={`font-mono-code text-xs font-semibold shrink-0 ${
                          d.isOverdue ? 'text-rose-700' : 'text-amber-700'
                        }`}
                      >
                        {d.isOverdue ? 'OVERDUE' : formatLocalDate(d.dueAt)}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Two-Column Operational Feed */}
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7 atelier-card p-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
            <h2 className="text-lg font-bold tracking-tight text-slate-900">Recent Bookings</h2>
            <Link
              href="/admin/bookings"
              className="text-sm font-semibold text-indigo-600 hover:text-indigo-700"
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
            <h2 className="text-lg font-bold tracking-tight text-slate-900">Upcoming Schedule</h2>
            <Link
              href="/admin/calendar"
              className="text-sm font-semibold text-indigo-600 hover:text-indigo-700"
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
                    <p className="text-xs text-slate-600">
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
