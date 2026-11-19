'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
import { BookingQuickDrawer } from './BookingQuickDrawer';

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
  const router = useRouter();
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
  const [drawerState, setDrawerState] = useState<{
    bookingId: string;
    focus: 'payments' | 'confirm' | 'schedule' | 'deliverables' | 'overview';
  } | null>(null);

  const totalAlerts =
    (alerts?.counts.pendingPayments ?? 0) +
    (alerts?.counts.readyToConfirm ?? 0) +
    (alerts?.counts.unscheduledConfirmed ?? 0) +
    (alerts?.counts.urgentDeliverables ?? 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="admin-page-title">
            {settings?.displayName || 'Studio Overview'}
          </h1>
          <p className="admin-meta mt-1 tabular-nums">
            Needs-attention queue, recent bookings, and next 14 days of shoots ({timezone})
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/admin/calendar"
            className="inline-flex items-center gap-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3.5 py-2 text-[13px] font-medium text-[var(--admin-text)] hover:bg-[var(--admin-surface-subtle)] transition-colors"
          >
            <CalendarIcon className="w-4 h-4 text-[var(--admin-accent)]" />
            <span>Shoot Calendar</span>
          </Link>
          <Link
            href="/admin/bookings"
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--admin-accent)] px-3.5 py-2 text-[13px] font-semibold text-[#FCFDFD] hover:opacity-95 transition-opacity"
          >
            <span>All Bookings</span>
            <ArrowRightIcon className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* 4 Focused KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link
          href="/admin/inquiries"
          className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-4 sm:p-5 hover:border-[var(--admin-accent)]/50 transition-colors group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium text-[var(--admin-muted)]">
              Inquiries
            </span>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--admin-accent-soft)] text-[var(--admin-accent)]">
              <SparklesIcon className="w-4 h-4" />
            </span>
          </div>
          <p className="text-[22px] font-semibold tracking-tight text-[var(--admin-text)] mt-2.5 tabular-nums">
            {newInquiriesCount}
            <span className="text-[12.5px] font-normal text-[var(--admin-muted)] ml-1.5">
              new
            </span>
          </p>
          <p className="text-[12.5px] text-[var(--admin-muted)] mt-1.5 flex items-center gap-1 group-hover:text-[var(--admin-accent)] transition-colors tabular-nums">
            <span>{inquiries.length} total • Open queue</span>
            <ArrowRightIcon className="w-3 h-3" />
          </p>
        </Link>

        <Link
          href="/admin/quotes"
          className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-4 sm:p-5 hover:border-[var(--admin-accent)]/50 transition-colors group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium text-[var(--admin-muted)]">
              Price Quotes
            </span>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--admin-violet-soft)] text-[var(--admin-violet)]">
              <ReceiptIcon className="w-4 h-4" />
            </span>
          </div>
          <p className="text-[22px] font-semibold tracking-tight text-[var(--admin-text)] mt-2.5 tabular-nums">
            {openQuotesCount}
            <span className="text-[12.5px] font-normal text-[var(--admin-muted)] ml-1.5">
              active
            </span>
          </p>
          <p className="text-[12.5px] text-[var(--admin-muted)] mt-1.5 flex items-center gap-1 group-hover:text-[var(--admin-violet)] transition-colors tabular-nums">
            <span>{quotes.length} total • Manage quotes</span>
            <ArrowRightIcon className="w-3 h-3" />
          </p>
        </Link>

        <Link
          href="/admin/bookings"
          className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-4 sm:p-5 hover:border-[var(--admin-accent)]/50 transition-colors group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium text-[var(--admin-muted)]">
              Bookings
            </span>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
              <UsersIcon className="w-4 h-4" />
            </span>
          </div>
          <p className="text-[22px] font-semibold tracking-tight text-[var(--admin-text)] mt-2.5 tabular-nums">
            {confirmedCount}
            <span className="text-[12.5px] font-normal text-[var(--admin-muted)] ml-1.5">
              confirmed{pendingConfirmCount > 0 ? ` • ${pendingConfirmCount} pending` : ''}
            </span>
          </p>
          <p className="font-mono-code text-[12.5px] text-[var(--admin-muted)] mt-1.5 tabular-nums truncate">
            {formatPoisha(totalAgreedPoisha, currency)} active pipeline
          </p>
        </Link>

        <Link
          href="/admin/calendar"
          className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-4 sm:p-5 hover:border-[var(--admin-accent)]/50 transition-colors group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium text-[var(--admin-muted)]">
              Upcoming Shoots
            </span>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--admin-accent-soft)] text-[var(--admin-accent)]">
              <CalendarIcon className="w-4 h-4" />
            </span>
          </div>
          <p className="text-[22px] font-semibold tracking-tight text-[var(--admin-text)] mt-2.5 tabular-nums">
            {upcomingSessions.length}
            <span className="text-[12.5px] font-normal text-[var(--admin-muted)] ml-1.5">
              next 14d
            </span>
          </p>
          <p className="text-[12.5px] text-[var(--admin-muted)] mt-1.5 flex items-center gap-1 group-hover:text-[var(--admin-accent)] transition-colors">
            <span>View schedule</span>
            <ArrowRightIcon className="w-3 h-3" />
          </p>
        </Link>
      </div>

      {/* Needs Your Attention — Interactive Quick-Drawer Queue */}
      {alerts && (
        <section className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-4 sm:p-5 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-[var(--admin-border)] pb-3.5">
            <div className="flex items-center gap-2.5">
              <CheckCircleIcon className="w-4 h-4 text-[var(--admin-accent)] shrink-0" />
              <div>
                <h2 className="admin-section-title tabular-nums">
                  Needs Attention ({totalAlerts})
                </h2>
                <p className="admin-meta">
                  Click any item to verify receipts, confirm booking, or inspect in a slide-over drawer.
                </p>
              </div>
            </div>

            <div className="inline-flex flex-wrap rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface-subtle)] p-1 gap-1">
              {[
                {
                  id: 'payments' as const,
                  label: 'Verify Payments',
                  count: alerts.counts.pendingPayments,
                  dot: 'bg-amber-500',
                },
                {
                  id: 'confirm' as const,
                  label: 'Ready to Confirm',
                  count: alerts.counts.readyToConfirm,
                  dot: 'bg-emerald-500',
                },
                {
                  id: 'unscheduled' as const,
                  label: 'Needs Shoot Slot',
                  count: alerts.counts.unscheduledConfirmed,
                  dot: 'bg-[#2563EB]',
                },
                {
                  id: 'deliverables' as const,
                  label: 'Urgent Files',
                  count: alerts.counts.urgentDeliverables,
                  dot: 'bg-rose-400',
                },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setAlertTab(t.id)}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer tabular-nums',
                    alertTab === t.id
                      ? 'bg-[var(--admin-surface)] text-[var(--admin-text)] border border-[var(--admin-border)]'
                      : 'text-[var(--admin-muted)] hover:text-[var(--admin-text)]',
                  )}
                >
                  <span className={cn('h-[6px] w-[6px] rounded-full', t.dot)} />
                  <span>{t.label}</span>
                  <span className="font-mono-code text-[11px] opacity-75">({t.count})</span>
                </button>
              ))}
            </div>
          </div>

          {totalAlerts === 0 ? (
            <div className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface-subtle)] px-4 py-3 text-[12.5px] text-[var(--admin-muted)] flex items-center gap-2">
              <span className="h-[7px] w-[7px] rounded-full bg-emerald-500 shrink-0" />
              <span>
                All caught up — no pending payment approvals, unconfirmed bookings, or overdue files.
              </span>
            </div>
          ) : (
            <div>
              {alertTab === 'payments' && (
                <div>
                  {alerts.pendingPayments.length === 0 ? (
                    <p className="admin-meta py-4 text-center">
                      No payments waiting for verification.
                    </p>
                  ) : (
                    <div className="grid gap-2.5 sm:grid-cols-2">
                      {alerts.pendingPayments.slice(0, 6).map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() =>
                            setDrawerState({ bookingId: p.bookingId, focus: 'payments' })
                          }
                          className="w-full text-left flex items-center justify-between gap-3 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface-subtle)] px-3.5 py-3 hover:border-[var(--admin-accent)]/50 hover:bg-[var(--admin-surface-hover)] transition-colors cursor-pointer"
                        >
                          <div className="min-w-0 space-y-0.5">
                            <p className="admin-row-title line-clamp-1">
                              <span className="font-mono-code text-xs text-[var(--admin-muted)] mr-1.5 tabular-nums">
                                {p.booking.reference}
                              </span>
                              {p.booking.clientName}
                            </p>
                            <p className="admin-meta flex items-center gap-1.5 line-clamp-1 tabular-nums">
                              <span className="h-[6px] w-[6px] rounded-full bg-amber-500 shrink-0" />
                              <span>
                                {p.method}
                                {p.transactionRef ? ` (${p.transactionRef})` : ''} • Pending verify
                              </span>
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="font-mono-code text-[13.5px] font-semibold text-[var(--admin-text)] tabular-nums">
                              {formatPoisha(p.amountPoisha, p.currency)}
                            </p>
                            <span className="text-[12px] font-medium text-[var(--admin-accent)]">
                              Review →
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {alertTab === 'confirm' && (
                <div>
                  {alerts.readyToConfirmBookings.length === 0 ? (
                    <p className="admin-meta py-4 text-center">
                      No bookings ready for confirmation.
                    </p>
                  ) : (
                    <div className="grid gap-2.5 sm:grid-cols-2">
                      {alerts.readyToConfirmBookings.slice(0, 6).map((b) => (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => setDrawerState({ bookingId: b.id, focus: 'confirm' })}
                          className="w-full text-left flex items-center justify-between gap-3 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface-subtle)] px-3.5 py-3 hover:border-[var(--admin-accent)]/50 hover:bg-[var(--admin-surface-hover)] transition-colors cursor-pointer"
                        >
                          <div className="min-w-0 space-y-0.5">
                            <p className="admin-row-title line-clamp-1">
                              <span className="font-mono-code text-xs text-[var(--admin-muted)] mr-1.5 tabular-nums">
                                {b.reference}
                              </span>
                              {b.eventTitle}
                            </p>
                            <p className="admin-meta flex items-center gap-1.5 line-clamp-1 tabular-nums">
                              <span className="h-[6px] w-[6px] rounded-full bg-emerald-500 shrink-0" />
                              <span>
                                {b.clientName} • {formatLocalDate(b.eventDate)}
                              </span>
                            </p>
                          </div>
                          <span className="text-[12px] font-semibold text-[var(--admin-accent)] shrink-0">
                            Confirm →
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {alertTab === 'unscheduled' && (
                <div>
                  {alerts.unscheduledConfirmedBookings.length === 0 ? (
                    <p className="admin-meta py-4 text-center">
                      Every confirmed booking has at least one scheduled shoot slot.
                    </p>
                  ) : (
                    <div className="grid gap-2.5 sm:grid-cols-2">
                      {alerts.unscheduledConfirmedBookings.slice(0, 6).map((b) => (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => setDrawerState({ bookingId: b.id, focus: 'schedule' })}
                          className="w-full text-left flex items-center justify-between gap-3 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface-subtle)] px-3.5 py-3 hover:border-[var(--admin-accent)]/50 hover:bg-[var(--admin-surface-hover)] transition-colors cursor-pointer"
                        >
                          <div className="min-w-0 space-y-0.5">
                            <p className="admin-row-title line-clamp-1">
                              <span className="font-mono-code text-xs text-[var(--admin-muted)] mr-1.5 tabular-nums">
                                {b.reference}
                              </span>
                              {b.eventTitle}
                            </p>
                            <p className="admin-meta flex items-center gap-1.5 line-clamp-1 tabular-nums">
                              <span className="h-[6px] w-[6px] rounded-full bg-[#2563EB] shrink-0" />
                              <span>
                                {b.clientName} • {formatLocalDate(b.eventDate)}
                              </span>
                            </p>
                          </div>
                          <span className="text-[12px] font-medium text-[var(--admin-accent)] shrink-0">
                            Open →
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {alertTab === 'deliverables' && (
                <div>
                  {alerts.urgentDeliverables.length === 0 ? (
                    <p className="admin-meta py-4 text-center">
                      No urgent or overdue deliverables right now.
                    </p>
                  ) : (
                    <div className="grid gap-2.5 sm:grid-cols-2">
                      {alerts.urgentDeliverables.slice(0, 6).map((d) => (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() =>
                            setDrawerState({ bookingId: d.bookingId, focus: 'deliverables' })
                          }
                          className="w-full text-left flex items-center justify-between gap-3 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface-subtle)] px-3.5 py-3 hover:border-[var(--admin-accent)]/50 hover:bg-[var(--admin-surface-hover)] transition-colors cursor-pointer"
                        >
                          <div className="min-w-0 space-y-0.5">
                            <p className="admin-row-title line-clamp-1">{d.label}</p>
                            <p className="admin-meta line-clamp-1 tabular-nums">
                              {d.booking.reference} • {d.booking.eventTitle}
                            </p>
                          </div>
                          <span className="inline-flex items-center gap-1.5 text-[12px] font-mono-code text-[var(--admin-muted)] shrink-0 tabular-nums">
                            <span
                              className={cn(
                                'h-[6px] w-[6px] rounded-full',
                                d.isOverdue ? 'bg-rose-400' : 'bg-amber-500',
                              )}
                            />
                            {d.isOverdue ? 'Overdue' : formatLocalDate(d.dueAt)}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {/* Two-Column Core Activity Grid: Recent Bookings + Upcoming Shoots */}
      <div className="grid gap-5 lg:grid-cols-12">
        <section className="lg:col-span-7 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-4 sm:p-5">
          <div className="flex items-center justify-between border-b border-[var(--admin-border)] pb-3 mb-2">
            <div>
              <h2 className="admin-section-title">Recent Bookings</h2>
              <p className="admin-meta">
                Click any booking to open its quick-action drawer
              </p>
            </div>
            <Link
              href="/admin/bookings"
              className="text-xs font-medium text-[var(--admin-accent)] hover:underline tabular-nums"
            >
              View all ({bookings.length}) →
            </Link>
          </div>

          {bookings.length === 0 ? (
            <p className="admin-meta py-8 text-center">
              No bookings yet. Accept a quote in Price Quotes to create one.
            </p>
          ) : (
            <div className="divide-y divide-[var(--admin-border)]">
              {bookings.slice(0, 6).map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setDrawerState({ bookingId: b.id, focus: 'overview' })}
                  className="w-full text-left py-3 px-2.5 -mx-2.5 rounded-lg hover:bg-[var(--admin-surface-subtle)] transition-colors flex items-center justify-between gap-4 group cursor-pointer"
                >
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono-code text-xs text-[var(--admin-muted)] tabular-nums">
                        {b.reference}
                      </span>
                      <StatusBadge status={b.status} />
                    </div>
                    <p className="admin-row-title group-hover:text-[var(--admin-accent)] transition-colors line-clamp-1">
                      {b.eventTitle}
                    </p>
                    <p className="admin-meta line-clamp-1 tabular-nums">
                      {b.clientName} • {formatLocalDate(b.eventDate)}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-mono-code text-[14px] font-medium text-[var(--admin-text)] tabular-nums">
                      {formatPoisha(b.agreedTotalPoisha, b.currency)}
                    </p>
                    <span className="text-[12px] font-medium text-[var(--admin-accent)] opacity-85 group-hover:opacity-100">
                      Inspect →
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="lg:col-span-5 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-4 sm:p-5">
          <div className="flex items-center justify-between border-b border-[var(--admin-border)] pb-3 mb-3">
            <div>
              <h2 className="admin-section-title">Upcoming Shoots</h2>
              <p className="admin-meta">Next 14 days in {timezone}</p>
            </div>
            <Link
              href="/admin/calendar"
              className="text-xs font-medium text-[var(--admin-accent)] hover:underline"
            >
              Open calendar →
            </Link>
          </div>

          {upcomingSessions.length === 0 ? (
            <p className="admin-meta py-8 text-center">
              No sessions scheduled in the next 14 days.
            </p>
          ) : (
            <div className="space-y-2.5">
              {upcomingSessions.slice(0, 5).map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    if (s.bookingId) {
                      setDrawerState({ bookingId: s.bookingId, focus: 'schedule' });
                    } else {
                      router.push('/admin/calendar');
                    }
                  }}
                  className="w-full text-left block rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface-subtle)] hover:border-[var(--admin-accent)]/50 hover:bg-[var(--admin-surface-hover)] p-3 space-y-1 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-mono-code font-medium text-[var(--admin-accent)] tabular-nums">
                      {s.agencyLocalDate || formatLocalDate(s.startAt)}
                    </span>
                    <StatusBadge status={s.status} />
                  </div>
                  <p className="admin-row-title line-clamp-1">{s.title}</p>
                  <p className="admin-meta tabular-nums line-clamp-1">
                    {formatDateTimeInTz(s.startAt, timezone)} →{' '}
                    {formatDateTimeInTz(s.endAt, timezone)}
                  </p>
                  {s.booking && (
                    <p className="admin-meta line-clamp-1 tabular-nums">
                      {s.booking.reference} — {s.booking.eventTitle}
                    </p>
                  )}
                </button>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Reusable Right-Hand Slide-Over Quick Detail & Action Drawer */}
      <BookingQuickDrawer
        bookingId={drawerState?.bookingId ?? null}
        focusSection={drawerState?.focus ?? 'overview'}
        timezone={timezone}
        onClose={() => setDrawerState(null)}
        onMutated={() => router.refresh()}
      />
    </div>
  );
}
