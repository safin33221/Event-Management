'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  AutomationAlerts,
  Booking,
  EventSession,
  Inquiry,
  Quote,
  StudioSettings,
} from '@/types/event-management';
import { cn, formatDateTimeInTz, formatLocalDate, formatPoisha } from '@/lib/utils';
import { StatusBadge } from '@/components/shared/StatusBadge';
import {
  ArrowRightIcon,
  CalendarIcon,
  CheckCircleIcon,
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

type AlertTab = 'payments' | 'confirm' | 'unscheduled' | 'deliverables';

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
  const pendingConfirmCount = bookings.filter(
    (b) => b.status === 'PENDING_CONFIRMATION',
  ).length;
  const totalAgreedPoisha = bookings
    .filter((b) => b.status !== 'CANCELLED')
    .reduce((acc, b) => acc + b.agreedTotalPoisha, 0);

  const defaultAlertTab: AlertTab =
    (alerts?.counts.pendingPayments ?? 0) > 0
      ? 'payments'
      : (alerts?.counts.readyToConfirm ?? 0) > 0
        ? 'confirm'
        : (alerts?.counts.unscheduledConfirmed ?? 0) > 0
          ? 'unscheduled'
          : 'deliverables';

  const [alertTab, setAlertTab] = useState<AlertTab>(defaultAlertTab);

  const totalAlerts =
    (alerts?.counts.pendingPayments ?? 0) +
    (alerts?.counts.readyToConfirm ?? 0) +
    (alerts?.counts.unscheduledConfirmed ?? 0) +
    (alerts?.counts.urgentDeliverables ?? 0);

  return (
    <div className="space-y-6">
      {/* Clean Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {settings?.displayName || 'Studio Dashboard'}
          </h1>
          <p className="text-xs text-muted-foreground font-medium mt-1">
            Daily overview of your inquiries, quotes, bookings, and upcoming shoots ({timezone})
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/admin/calendar"
            className="inline-flex items-center gap-2 rounded-xl border border-border/60 bg-card px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 transition-all duration-200"
          >
            <CalendarIcon className="w-4 h-4 text-primary" />
            <span>Shoot Calendar</span>
          </Link>
          <Link
            href="/admin/bookings"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white shadow-xs hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-1 transition-all duration-200"
          >
            <span>All Bookings</span>
            <ArrowRightIcon className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* 4 Primary KPI Cards (Each navigates to its dedicated workspace) */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link
          href="/admin/inquiries"
          className="rounded-2xl border border-border/60 bg-gradient-to-b from-card to-slate-50/40 p-5 hover:border-primary/40 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 transition-all duration-200 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">
              1. Inquiries
            </span>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50/80 text-indigo-600 ring-1 ring-inset ring-indigo-600/15 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-200">
              <SparklesIcon className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-bold tracking-tight text-slate-900 mt-3 tabular-nums">
            {newInquiriesCount}
            <span className="text-xs font-medium text-muted-foreground ml-1.5">new</span>
          </p>
          <p className="text-xs font-medium text-muted-foreground mt-2 flex items-center gap-1 group-hover:text-primary transition-colors">
            <span>{inquiries.length} total requests • Open Inquiries</span>
            <ArrowRightIcon className="w-3 h-3" />
          </p>
        </Link>

        <Link
          href="/admin/quotes"
          className="rounded-2xl border border-border/60 bg-gradient-to-b from-card to-slate-50/40 p-5 hover:border-primary/40 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 transition-all duration-200 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">
              2. Price Quotes
            </span>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50/80 text-amber-600 ring-1 ring-inset ring-amber-600/15 group-hover:bg-amber-500 group-hover:text-white transition-colors duration-200">
              <ReceiptIcon className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-bold tracking-tight text-slate-900 mt-3 tabular-nums">
            {openQuotesCount}
            <span className="text-xs font-medium text-muted-foreground ml-1.5">open</span>
          </p>
          <p className="text-xs font-medium text-muted-foreground mt-2 flex items-center gap-1 group-hover:text-amber-700 transition-colors">
            <span>{quotes.length} total proposals • Manage Quotes</span>
            <ArrowRightIcon className="w-3 h-3" />
          </p>
        </Link>

        <Link
          href="/admin/bookings"
          className="rounded-2xl border border-border/60 bg-gradient-to-b from-card to-slate-50/40 p-5 hover:border-primary/40 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 transition-all duration-200 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">
              3. Bookings
            </span>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50/80 text-emerald-600 ring-1 ring-inset ring-emerald-600/15 group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-200">
              <UsersIcon className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-bold tracking-tight text-slate-900 mt-3 tabular-nums">
            {confirmedCount}
            <span className="text-xs font-medium text-muted-foreground ml-1.5">
              confirmed {pendingConfirmCount > 0 ? `(+${pendingConfirmCount} pending)` : ''}
            </span>
          </p>
          <p className="text-xs font-mono-code font-medium text-emerald-700 mt-2 tabular-nums">
            Pipeline: {formatPoisha(totalAgreedPoisha, currency)} →
          </p>
        </Link>

        <Link
          href="/admin/calendar"
          className="rounded-2xl border border-border/60 bg-gradient-to-b from-card to-slate-50/40 p-5 hover:border-primary/40 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 transition-all duration-200 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">
              4. Upcoming Shoots
            </span>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50/80 text-sky-600 ring-1 ring-inset ring-sky-600/15 group-hover:bg-sky-600 group-hover:text-white transition-colors duration-200">
              <CalendarIcon className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-bold tracking-tight text-slate-900 mt-3 tabular-nums">
            {upcomingSessions.length}
            <span className="text-xs font-medium text-muted-foreground ml-1.5">next 14d</span>
          </p>
          <p className="text-xs font-medium text-muted-foreground mt-2 flex items-center gap-1 group-hover:text-sky-700 transition-colors">
            <span>View Calendar &amp; Crew</span>
            <ArrowRightIcon className="w-3 h-3" />
          </p>
        </Link>
      </div>

      {/* Focused Tabbed Action Center */}
      {alerts && (
        <div className="rounded-2xl border border-border/60 bg-card p-5 sm:p-6 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-border/60 pb-4">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50/80 text-primary ring-1 ring-inset ring-indigo-600/15">
                <CheckCircleIcon className="w-4 h-4" />
              </span>
              <div>
                <h2 className="text-lg font-semibold tracking-tight text-slate-900">
                  Needs Your Attention ({totalAlerts})
                </h2>
                <p className="text-xs text-muted-foreground font-medium">
                  Click any category below to act on pending payments, confirmations, or shoots.
                </p>
              </div>
            </div>

            <div className="inline-flex flex-wrap rounded-xl border border-border/60 bg-slate-50/80 p-1 gap-1">
              {[
                {
                  id: 'payments' as const,
                  label: 'Verify Payments',
                  count: alerts.counts.pendingPayments,
                  badgeClass: 'bg-amber-100 text-amber-800',
                },
                {
                  id: 'confirm' as const,
                  label: 'Ready to Confirm',
                  count: alerts.counts.readyToConfirm,
                  badgeClass: 'bg-emerald-100 text-emerald-800',
                },
                {
                  id: 'unscheduled' as const,
                  label: 'Needs Shoot Slot',
                  count: alerts.counts.unscheduledConfirmed,
                  badgeClass: 'bg-sky-100 text-sky-800',
                },
                {
                  id: 'deliverables' as const,
                  label: 'Urgent Files',
                  count: alerts.counts.urgentDeliverables,
                  badgeClass: 'bg-rose-100 text-rose-800',
                },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setAlertTab(t.id)}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all',
                    alertTab === t.id
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900',
                  )}
                >
                  <span>{t.label}</span>
                  <span
                    className={cn(
                      'rounded-full px-1.5 py-0.5 text-[10px] font-mono-code font-bold',
                      t.count > 0 ? t.badgeClass : 'bg-slate-200 text-slate-600',
                    )}
                  >
                    {t.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {totalAlerts === 0 ? (
            <div className="rounded-xl bg-emerald-50/70 border border-emerald-200 px-4 py-3 text-xs font-medium text-emerald-800">
              All caught up! No pending payment approvals, unscheduled confirmed bookings, or overdue deliverables.
            </div>
          ) : (
            <div>
              {alertTab === 'payments' && (
                <div className="space-y-2">
                  {alerts.pendingPayments.length === 0 ? (
                    <p className="text-xs text-slate-500 py-4 text-center">
                      No payments waiting for verification right now.
                    </p>
                  ) : (
                    <div className="grid gap-2.5 sm:grid-cols-2">
                      {alerts.pendingPayments.slice(0, 6).map((p) => (
                        <Link
                          key={p.id}
                          href={`/admin/bookings/${p.bookingId}?section=payments`}
                          className="flex items-center justify-between gap-3 rounded-xl border border-amber-200/80 bg-amber-50/40 px-4 py-3 hover:border-amber-400 hover:bg-amber-50 transition-colors"
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 truncate">
                              {p.booking.reference} • {p.booking.clientName}
                            </p>
                            <p className="text-[11px] text-slate-500 font-mono-code mt-0.5">
                              {p.method} {p.transactionRef ? `(${p.transactionRef})` : ''}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="font-mono-code text-xs font-bold text-amber-900 tabular-nums">
                              {formatPoisha(p.amountPoisha, p.currency)}
                            </p>
                            <span className="text-[11px] font-semibold text-amber-700">
                              Verify →
                            </span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {alertTab === 'confirm' && (
                <div className="space-y-2">
                  {alerts.readyToConfirmBookings.length === 0 ? (
                    <p className="text-xs text-slate-500 py-4 text-center">
                      No bookings waiting for confirmation right now.
                    </p>
                  ) : (
                    <div className="grid gap-2.5 sm:grid-cols-2">
                      {alerts.readyToConfirmBookings.slice(0, 6).map((b) => (
                        <Link
                          key={b.id}
                          href={`/admin/bookings/${b.id}`}
                          className="flex items-center justify-between gap-3 rounded-xl border border-emerald-200/80 bg-emerald-50/40 px-4 py-3 hover:border-emerald-400 hover:bg-emerald-50 transition-colors"
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 truncate">
                              {b.reference} • {b.eventTitle}
                            </p>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              {b.clientName} • {formatLocalDate(b.eventDate)}
                            </p>
                          </div>
                          <span className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shrink-0">
                            Confirm →
                          </span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {alertTab === 'unscheduled' && (
                <div className="space-y-2">
                  {alerts.unscheduledConfirmedBookings.length === 0 ? (
                    <p className="text-xs text-slate-500 py-4 text-center">
                      Every confirmed booking has at least one scheduled shoot session.
                    </p>
                  ) : (
                    <div className="grid gap-2.5 sm:grid-cols-2">
                      {alerts.unscheduledConfirmedBookings.slice(0, 6).map((b) => (
                        <Link
                          key={b.id}
                          href={`/admin/bookings/${b.id}?section=schedule`}
                          className="flex items-center justify-between gap-3 rounded-xl border border-sky-200/80 bg-sky-50/40 px-4 py-3 hover:border-sky-400 hover:bg-sky-50 transition-colors"
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 truncate">
                              {b.reference} • {b.eventTitle}
                            </p>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              {b.clientName} • {formatLocalDate(b.eventDate)}
                            </p>
                          </div>
                          <span className="text-xs font-semibold text-sky-700 shrink-0">
                            Add Shoot Slot →
                          </span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {alertTab === 'deliverables' && (
                <div className="space-y-2">
                  {alerts.urgentDeliverables.length === 0 ? (
                    <p className="text-xs text-slate-500 py-4 text-center">
                      No urgent or overdue deliverables right now.
                    </p>
                  ) : (
                    <div className="grid gap-2.5 sm:grid-cols-2">
                      {alerts.urgentDeliverables.slice(0, 6).map((d) => (
                        <Link
                          key={d.id}
                          href={`/admin/bookings/${d.bookingId}?section=deliverables`}
                          className="flex items-center justify-between gap-3 rounded-xl border border-rose-200/80 bg-rose-50/40 px-4 py-3 hover:border-rose-400 hover:bg-rose-50 transition-colors"
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 truncate">
                              {d.label} — {d.booking.reference}
                            </p>
                            <p className="text-[11px] text-slate-500 truncate mt-0.5">
                              {d.booking.eventTitle}
                            </p>
                          </div>
                          <span
                            className={cn(
                              'font-mono-code text-xs font-bold shrink-0',
                              d.isOverdue ? 'text-rose-700' : 'text-amber-700',
                            )}
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
        </div>
      )}

      {/* Two-Column Clean Activity Grid */}
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7 atelier-card p-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-3">
            <div>
              <h2 className="text-base font-bold tracking-tight text-slate-900">Recent Bookings</h2>
              <p className="text-xs text-slate-500">Click a booking to open its workspace</p>
            </div>
            <Link
              href="/admin/bookings"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
            >
              View all ({bookings.length}) →
            </Link>
          </div>
          {bookings.length === 0 ? (
            <p className="text-sm text-slate-500 py-8 text-center">
              No bookings yet. Accept a quote in Price Quotes to create one.
            </p>
          ) : (
            <div className="divide-y divide-border/50">
              {bookings.slice(0, 5).map((b) => (
                <Link
                  key={b.id}
                  href={`/admin/bookings/${b.id}`}
                  className="py-3.5 px-3 -mx-3 rounded-xl hover:bg-slate-50/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 transition-all duration-200 flex items-center justify-between gap-4 group"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono-code text-xs font-medium text-muted-foreground">
                        {b.reference}
                      </span>
                      <StatusBadge status={b.status} />
                    </div>
                    <p className="text-sm font-medium text-slate-900 group-hover:text-primary transition-colors truncate mt-1">
                      {b.eventTitle}
                    </p>
                    <p className="text-xs text-muted-foreground font-medium">
                      {b.clientName} • {formatLocalDate(b.eventDate)}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-mono-code text-sm font-semibold text-slate-900 tabular-nums">
                      {formatPoisha(b.agreedTotalPoisha, b.currency)}
                    </p>
                    <span className="text-xs font-medium text-primary">Open →</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-5 rounded-2xl border border-border/60 bg-card p-6">
          <div className="flex items-center justify-between border-b border-border/60 pb-4 mb-4">
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-slate-900">
                Upcoming Schedule
              </h2>
              <p className="text-xs text-muted-foreground font-medium">Next 14 days in {timezone}</p>
            </div>
            <Link
              href="/admin/calendar"
              className="text-xs font-medium text-primary hover:text-indigo-700"
            >
              Open calendar →
            </Link>
          </div>
          {upcomingSessions.length === 0 ? (
            <p className="text-xs text-muted-foreground font-medium py-8 text-center">
              No sessions scheduled in the next 14 days.
            </p>
          ) : (
            <div className="space-y-3">
              {upcomingSessions.slice(0, 5).map((s) => (
                <Link
                  key={s.id}
                  href={s.bookingId ? `/admin/bookings/${s.bookingId}?section=schedule` : '/admin/calendar'}
                  className="block rounded-xl border border-border/60 bg-slate-50/50 hover:border-primary/40 hover:bg-card hover:shadow-xs p-3.5 space-y-1 transition-all duration-200"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-mono-code font-medium text-primary">
                      {s.agencyLocalDate || formatLocalDate(s.startAt)}
                    </span>
                    <StatusBadge status={s.status} />
                  </div>
                  <p className="text-sm font-medium text-slate-900 truncate">{s.title}</p>
                  <p className="text-xs text-muted-foreground font-medium">
                    {formatDateTimeInTz(s.startAt, timezone)} → {formatDateTimeInTz(s.endAt, timezone)}
                  </p>
                  {s.booking && (
                    <p className="text-xs text-muted-foreground font-medium truncate">
                      {s.booking.reference} — {s.booking.eventTitle}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
