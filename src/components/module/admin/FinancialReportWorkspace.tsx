'use client';

import React, { useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import {
  BookingStatus,
  FinancialReportData,
  PaymentMethod,
} from '@/types/event-management';
import {
  getFinancialReport,
  rejectPayment,
  verifyPayment,
} from '@/service/payments/payments.service';
import {
  cn,
  formatDateTimeInTz,
  formatLocalDate,
  formatPoisha,
} from '@/lib/utils';
import {
  ReceiptIcon,
  SearchIcon,
} from '@/components/shared/Icons';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { BookingQuickDrawer } from '@/components/module/admin/BookingQuickDrawer';

interface FinancialReportWorkspaceProps {
  initialReport: FinancialReportData;
}

const METHOD_LABELS: Record<PaymentMethod, { label: string; badgeClass: string; barClass: string }> = {
  BKASH: {
    label: 'bKash',
    badgeClass: 'bg-pink-50 text-pink-700 border-pink-200',
    barClass: 'bg-pink-600',
  },
  NAGAD: {
    label: 'Nagad',
    badgeClass: 'bg-orange-50 text-orange-700 border-orange-200',
    barClass: 'bg-orange-500',
  },
  BANK: {
    label: 'Bank Transfer',
    badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    barClass: 'bg-indigo-600',
  },
  CASH: {
    label: 'Cash',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    barClass: 'bg-emerald-600',
  },
  OTHER: {
    label: 'Other',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
    barClass: 'bg-slate-600',
  },
};

function escapeCsvCell(value: string | number | null | undefined): string {
  const str = String(value ?? '');
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function FinancialReportWorkspace({ initialReport }: FinancialReportWorkspaceProps) {
  const [report, setReport] = useState<FinancialReportData>(initialReport);
  const [activeTab, setActiveTab] = useState<'overview' | 'receivables' | 'ledger'>('overview');

  // Server filter state
  const [fromDate, setFromDate] = useState(initialReport.filters.from || '');
  const [toDate, setToDate] = useState(initialReport.filters.to || '');
  const [methodFilter, setMethodFilter] = useState<string>(initialReport.filters.method || 'ALL');
  const [bookingStatusFilter, setBookingStatusFilter] = useState<string>(
    initialReport.filters.bookingStatus || 'ALL',
  );

  // Client sub-filters inside Receivables & Ledger tabs
  const [searchQuery, setSearchQuery] = useState('');
  const [receivableSubFilter, setReceivableSubFilter] = useState<
    'ALL' | 'DUE' | 'PAID' | 'PENDING'
  >('ALL');
  const [ledgerSubFilter, setLedgerSubFilter] = useState<
    'ALL' | 'PENDING' | 'VERIFIED' | 'REFUND' | 'REJECTED'
  >('ALL');

  const [rejectingEntryId, setRejectingEntryId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [drawerState, setDrawerState] = useState<{
    bookingId: string;
    focusSection: 'payments' | 'overview';
  } | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const notify = (type: 'ok' | 'err', text: string) => setFeedback({ type, text });

  const refreshReport = (overrides?: {
    from?: string;
    to?: string;
    method?: string;
    bookingStatus?: string;
  }) => {
    const nextFrom = overrides?.from !== undefined ? overrides.from : fromDate;
    const nextTo = overrides?.to !== undefined ? overrides.to : toDate;
    const nextMethod = overrides?.method !== undefined ? overrides.method : methodFilter;
    const nextBookingStatus =
      overrides?.bookingStatus !== undefined ? overrides.bookingStatus : bookingStatusFilter;

    startTransition(async () => {
      const res = await getFinancialReport({
        from: nextFrom || undefined,
        to: nextTo || undefined,
        method: nextMethod !== 'ALL' ? (nextMethod as PaymentMethod) : undefined,
        bookingStatus:
          nextBookingStatus !== 'ALL' ? (nextBookingStatus as BookingStatus) : undefined,
      });
      if (!res.ok || !res.data) {
        notify('err', res.message || 'Failed to load financial report.');
        return;
      }
      setReport(res.data);
    });
  };

  const applyDatePreset = (preset: 'ALL' | 'THIS_MONTH' | 'LAST_30' | 'THIS_YEAR') => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${mm}-${dd}`;

    let nextFrom = '';
    let nextTo = '';
    if (preset === 'THIS_MONTH') {
      nextFrom = `${yyyy}-${mm}-01`;
      nextTo = todayStr;
    } else if (preset === 'LAST_30') {
      const past = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const py = past.getFullYear();
      const pm = String(past.getMonth() + 1).padStart(2, '0');
      const pd = String(past.getDate()).padStart(2, '0');
      nextFrom = `${py}-${pm}-${pd}`;
      nextTo = todayStr;
    } else if (preset === 'THIS_YEAR') {
      nextFrom = `${yyyy}-01-01`;
      nextTo = `${yyyy}-12-31`;
    }

    setFromDate(nextFrom);
    setToDate(nextTo);
    refreshReport({ from: nextFrom, to: nextTo });
  };

  const handleVerifyEntry = (paymentId: string) => {
    startTransition(async () => {
      const res = await verifyPayment(paymentId);
      if (!res.ok) {
        notify('err', res.message || 'Failed to verify payment receipt.');
        return;
      }
      notify('ok', 'Payment verified and added to collected revenue.');
      refreshReport();
    });
  };

  const handleRejectEntry = (e: React.FormEvent, paymentId: string) => {
    e.preventDefault();
    if (!rejectReason.trim()) return;
    startTransition(async () => {
      const res = await rejectPayment(paymentId, rejectReason.trim());
      if (!res.ok) {
        notify('err', res.message || 'Failed to reject payment receipt.');
        return;
      }
      setRejectingEntryId(null);
      setRejectReason('');
      notify('ok', 'Payment entry marked as REJECTED.');
      refreshReport();
    });
  };

  const handleExportReceivablesCsv = () => {
    const headers = [
      'Booking Ref',
      'Status',
      'Event Title',
      'Category',
      'Client Name',
      'Client Phone',
      'Event Date',
      'Agreed Price (Tk)',
      'Credit Notes (Tk)',
      'Effective Charge (Tk)',
      'Verified Paid (Tk)',
      'Pending Approval (Tk)',
      'Refunds (Tk)',
      'Remaining Due (Tk)',
    ];

    const rows = report.receivables.map((r) => [
      r.reference,
      r.status,
      r.eventTitle,
      r.eventTypeName || '',
      r.clientName,
      r.clientPhone,
      r.eventDate ? r.eventDate.slice(0, 10) : '',
      (r.agreedTotalPoisha / 100).toFixed(2),
      (r.creditNotesPoisha / 100).toFixed(2),
      (r.effectiveAgreedChargePoisha / 100).toFixed(2),
      (r.verifiedReceiptsPoisha / 100).toFixed(2),
      (r.pendingReceiptsPoisha / 100).toFixed(2),
      (r.completedRefundsPoisha / 100).toFixed(2),
      (r.outstandingDuePoisha / 100).toFixed(2),
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map(escapeCsvCell).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `financial-receivables-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportLedgerCsv = () => {
    const headers = [
      'Date',
      'Booking Ref',
      'Client Name',
      'Event Title',
      'Type',
      'Method',
      'Amount (Tk)',
      'Verification Status',
      'Transaction Ref (TrxID)',
      'Reason / Notes',
    ];

    const rows = report.transactions.map((t) => [
      t.createdAt.slice(0, 19).replace('T', ' '),
      t.booking.reference,
      t.booking.clientName,
      t.booking.eventTitle,
      t.type,
      t.method,
      (t.amountPoisha / 100).toFixed(2),
      t.verificationState,
      t.transactionRef || '',
      t.reason || '',
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map(escapeCsvCell).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `financial-ledger-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const q = searchQuery.trim().toLowerCase();

  const filteredReceivables = useMemo(() => {
    return report.receivables.filter((r) => {
      if (receivableSubFilter === 'DUE' && r.outstandingDuePoisha <= 0) return false;
      if (
        receivableSubFilter === 'PAID' &&
        (r.outstandingDuePoisha > 0 || r.status === 'CANCELLED')
      ) {
        return false;
      }
      if (receivableSubFilter === 'PENDING' && r.pendingReceiptsPoisha <= 0) return false;
      if (
        q &&
        !r.reference.toLowerCase().includes(q) &&
        !r.clientName.toLowerCase().includes(q) &&
        !r.eventTitle.toLowerCase().includes(q) &&
        !r.clientPhone.toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [report.receivables, receivableSubFilter, q]);

  const filteredTransactions = useMemo(() => {
    return report.transactions.filter((t) => {
      if (ledgerSubFilter === 'PENDING' && t.verificationState !== 'PENDING') return false;
      if (
        ledgerSubFilter === 'VERIFIED' &&
        (t.type !== 'RECEIPT' || t.verificationState !== 'VERIFIED')
      ) {
        return false;
      }
      if (ledgerSubFilter === 'REFUND' && t.type !== 'REFUND') return false;
      if (ledgerSubFilter === 'REJECTED' && t.verificationState !== 'REJECTED') return false;
      if (
        q &&
        !t.booking.reference.toLowerCase().includes(q) &&
        !t.booking.clientName.toLowerCase().includes(q) &&
        !t.booking.eventTitle.toLowerCase().includes(q) &&
        !(t.transactionRef || '').toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [report.transactions, ledgerSubFilter, q]);

  const { summary, currency, timezone } = report;

  return (
    <div className="space-y-6">
      {feedback && (
        <div
          className={cn(
            'rounded-xl border px-4 py-3 text-xs sm:text-sm font-medium flex items-center justify-between gap-3',
            feedback.type === 'ok'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
              : 'border-rose-200 bg-rose-50 text-rose-900',
          )}
        >
          <span>{feedback.text}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-xs underline shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Header & Export Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="admin-page-title">
            Financial Reports &amp; Accounting
          </h1>
          <p className="admin-meta mt-1 tabular-nums">
            Real-time revenue, bKash/Nagad/Bank collections, accounts receivable, and ledger audit
            in {currency} ({timezone}).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleExportReceivablesCsv}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <span>⬇ Export Receivables CSV</span>
          </button>
          <button
            type="button"
            onClick={handleExportLedgerCsv}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <span>⬇ Export Ledger CSV</span>
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <ReceiptIcon className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Date Range & Channel Filter Card */}
      <div className="atelier-card p-4 flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-[11px] font-semibold uppercase text-slate-500 mb-1">
              From Date
            </label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-mono-code text-slate-900"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold uppercase text-slate-500 mb-1">
              To Date
            </label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-mono-code text-slate-900"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold uppercase text-slate-500 mb-1">
              Payment Method
            </label>
            <select
              value={methodFilter}
              onChange={(e) => {
                setMethodFilter(e.target.value);
                refreshReport({ method: e.target.value });
              }}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-800"
            >
              <option value="ALL">All Methods</option>
              <option value="BKASH">bKash</option>
              <option value="NAGAD">Nagad</option>
              <option value="BANK">Bank Transfer</option>
              <option value="CASH">Cash</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-semibold uppercase text-slate-500 mb-1">
              Booking Status
            </label>
            <select
              value={bookingStatusFilter}
              onChange={(e) => {
                setBookingStatusFilter(e.target.value);
                refreshReport({ bookingStatus: e.target.value });
              }}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-800"
            >
              <option value="ALL">All Bookings</option>
              <option value="PENDING_CONFIRMATION">Pending Confirmation</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          <button
            type="button"
            disabled={isPending}
            onClick={() => refreshReport()}
            className="rounded-xl bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors cursor-pointer"
          >
            {isPending ? 'Updating...' : 'Apply Filter'}
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'ALL' as const, label: 'All Time' },
            { id: 'THIS_MONTH' as const, label: 'This Month' },
            { id: 'LAST_30' as const, label: 'Last 30 Days' },
            { id: 'THIS_YEAR' as const, label: 'This Year' },
          ].map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => applyDatePreset(preset.id)}
              className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 cursor-pointer"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* 6 Executive KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="atelier-card p-5 space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="admin-meta font-medium">Effective Contracted Value</span>
            <span className="admin-meta tabular-nums font-medium">
              {summary.activeBookingsCount} Active
            </span>
          </div>
          <p className="text-2xl font-semibold tracking-tight text-slate-900 tabular-nums">
            {formatPoisha(summary.effectiveContractedPoisha, currency)}
          </p>
          <p className="admin-meta tabular-nums line-clamp-1">
            Gross Agreed: {formatPoisha(summary.totalContractedPoisha, currency)} • Credit Notes:{' '}
            {formatPoisha(summary.totalCreditNotesPoisha, currency)}
          </p>
        </div>

        <div className="atelier-card p-5 space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-2 admin-meta font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500" aria-hidden="true" />
              Net Collected Revenue
            </span>
            <span className="admin-meta tabular-nums font-medium">
              {summary.collectionRatePercent.toFixed(1)}% Collected
            </span>
          </div>
          <p className="text-2xl font-semibold tracking-tight text-slate-900 tabular-nums">
            {formatPoisha(summary.netCollectedRevenuePoisha, currency)}
          </p>
          <p className="admin-meta tabular-nums line-clamp-1">
            Verified: {formatPoisha(summary.verifiedReceiptsPoisha, currency)} • Refunds:{' '}
            {formatPoisha(summary.completedRefundsPoisha, currency)}
          </p>
        </div>

        <div className="atelier-card p-5 space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-2 admin-meta font-medium">
              <span className="w-2 h-2 rounded-full bg-[#2563EB]" aria-hidden="true" />
              Outstanding Receivables (Due)
            </span>
            <span className="admin-meta tabular-nums font-medium">
              {summary.bookingsWithDueCount} Due
            </span>
          </div>
          <p className="text-2xl font-semibold tracking-tight text-slate-900 tabular-nums">
            {formatPoisha(summary.totalOutstandingDuePoisha, currency)}
          </p>
          <p className="admin-meta tabular-nums line-clamp-1">
            Paid in Full: {summary.fullyPaidBookingsCount} • Completed:{' '}
            {summary.completedBookingsCount}
          </p>
        </div>

        <div className="atelier-card p-5 space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-2 admin-meta font-medium">
              <span className="w-2 h-2 rounded-full bg-amber-500" aria-hidden="true" />
              Pending Verification
            </span>
            <span className="admin-meta tabular-nums font-medium">
              {summary.pendingReceiptsCount} Pending
            </span>
          </div>
          <p className="text-2xl font-semibold tracking-tight text-slate-900 tabular-nums">
            {formatPoisha(summary.pendingVerificationPoisha, currency)}
          </p>
          <p className="admin-meta line-clamp-1">
            Unverified bKash, Nagad, or Bank receipts awaiting approval
          </p>
        </div>

        <div className="atelier-card p-5 space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="admin-meta font-medium">Refunds &amp; Credit Notes</span>
            <span className="admin-meta font-medium">Adjustments</span>
          </div>
          <p className="text-2xl font-semibold tracking-tight text-slate-900 tabular-nums">
            {formatPoisha(
              summary.completedRefundsPoisha + summary.totalCreditNotesPoisha,
              currency,
            )}
          </p>
          <p className="admin-meta tabular-nums line-clamp-1">
            Refunds: {formatPoisha(summary.completedRefundsPoisha, currency)} • Credit Notes:{' '}
            {formatPoisha(summary.totalCreditNotesPoisha, currency)}
          </p>
        </div>

        <div className="atelier-card p-5 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="admin-meta font-medium">Collection Progress</span>
            <span className="text-sm font-semibold text-slate-900 tabular-nums">
              {summary.collectionRatePercent.toFixed(1)}%
            </span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full bg-[#2563EB] transition-all duration-300"
              style={{ width: `${Math.min(100, summary.collectionRatePercent)}%` }}
            />
          </div>
          <p className="admin-meta tabular-nums">
            {summary.fullyPaidBookingsCount} of {summary.activeBookingsCount} active bookings settled
          </p>
        </div>
      </div>

      {/* 3 Focused Report Section Tabs */}
      <div className="inline-flex flex-wrap rounded-xl border border-slate-200 bg-white p-1 gap-1 shadow-2xs">
        {[
          {
            id: 'overview' as const,
            label: '1. Channel & Monthly Breakdown',
          },
          {
            id: 'receivables' as const,
            label: `2. Booking Receivables (${report.receivables.length})`,
          },
          {
            id: 'ledger' as const,
            label: `3. Transaction Ledger (${report.transactions.length})`,
          },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'rounded-lg px-4 py-2 text-xs font-semibold transition-all cursor-pointer',
              activeTab === tab.id
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: CHANNEL, MONTHLY & EVENT CATEGORY BREAKDOWN */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Payment Method Breakdown */}
          <div className="atelier-card p-6 space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900">
                Collections by Payment Channel (bKash, Nagad, Bank, Cash)
              </h2>
              <p className="text-xs text-slate-500">
                Breakdown of verified receipts, pending unverified entries, and refunds by payment
                method.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {report.byMethod
                .filter((m) => m.method !== 'OTHER' || m.transactionCount > 0)
                .map((m) => {
                  const meta = METHOD_LABELS[m.method];
                  return (
                    <div
                      key={m.method}
                      className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={cn(
                            'rounded-lg border px-2.5 py-0.5 text-xs font-bold',
                            meta.badgeClass,
                          )}
                        >
                          {meta.label}
                        </span>
                        <span className="font-mono-code text-xs font-semibold text-slate-500">
                          {m.sharePercent.toFixed(1)}% share
                        </span>
                      </div>

                      <div>
                        <p className="text-[11px] font-semibold uppercase text-slate-400">
                          Net Verified
                        </p>
                        <p className="font-mono-code text-lg font-bold text-slate-900 tabular-nums mt-0.5">
                          {formatPoisha(m.netCollectedPoisha, currency)}
                        </p>
                      </div>

                      <div className="h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
                        <div
                          className={cn('h-full', meta.barClass)}
                          style={{ width: `${Math.min(100, m.sharePercent)}%` }}
                        />
                      </div>

                      <div className="space-y-1 pt-1 border-t border-slate-200/70 text-xs text-slate-600">
                        <div className="flex justify-between">
                          <span>Verified Receipts:</span>
                          <span className="font-mono-code font-semibold">
                            {formatPoisha(m.verifiedReceiptsPoisha, currency)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Pending Approval:</span>
                          <span className="font-mono-code font-semibold text-amber-700">
                            {formatPoisha(m.pendingReceiptsPoisha, currency)}
                          </span>
                        </div>
                        {m.refundsPoisha > 0 && (
                          <div className="flex justify-between">
                            <span>Refunds:</span>
                            <span className="font-mono-code font-semibold text-rose-700">
                              -{formatPoisha(m.refundsPoisha, currency)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Monthly Trend & Event Type Breakdown */}
          <div className="grid gap-6 lg:grid-cols-12">
            {/* Monthly Revenue & Collection Table */}
            <div className="lg:col-span-7 atelier-card p-6 space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-base font-bold text-slate-900">
                  Monthly Contracted vs. Collected Revenue
                </h2>
                <p className="text-xs text-slate-500">
                  Grouped by agency local month ({timezone}).
                </p>
              </div>

              {report.byMonth.length === 0 ? (
                <p className="text-xs text-slate-500 py-8 text-center">
                  No monthly financial records for this period.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 uppercase text-[11px]">
                        <th className="py-2.5 pr-3">Month</th>
                        <th className="py-2.5 px-3">Bookings</th>
                        <th className="py-2.5 px-3 text-right">Contracted</th>
                        <th className="py-2.5 px-3 text-right">Verified Collected</th>
                        <th className="py-2.5 pl-3 text-right">Refunds</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {report.byMonth.map((m) => (
                        <tr key={m.month} className="hover:bg-slate-50">
                          <td className="py-3 pr-3 font-mono-code font-bold text-slate-900">
                            {m.month}
                          </td>
                          <td className="py-3 px-3 font-mono-code text-slate-600">
                            {m.bookingsCount}
                          </td>
                          <td className="py-3 px-3 text-right font-mono-code font-semibold text-slate-900 tabular-nums">
                            {formatPoisha(m.contractedPoisha, currency)}
                          </td>
                          <td className="py-3 px-3 text-right font-mono-code font-bold text-emerald-700 tabular-nums">
                            {formatPoisha(m.collectedPoisha, currency)}
                          </td>
                          <td className="py-3 pl-3 text-right font-mono-code text-rose-600 tabular-nums">
                            {m.refundedPoisha > 0
                              ? `-${formatPoisha(m.refundedPoisha, currency)}`
                              : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Event Category Revenue Breakdown */}
            <div className="lg:col-span-5 atelier-card p-6 space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-base font-bold text-slate-900">
                  Revenue by Event Category
                </h2>
                <p className="text-xs text-slate-500">
                  Contracted value, verified collection, and remaining dues per event type.
                </p>
              </div>

              {report.byEventType.length === 0 ? (
                <p className="text-xs text-slate-500 py-8 text-center">
                  No active bookings found for category breakdown.
                </p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {report.byEventType.map((et) => (
                    <div key={et.eventTypeId} className="py-3.5 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm text-slate-900">
                          {et.eventTypeName}
                        </span>
                        <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700">
                          {et.bookingsCount} {et.bookingsCount === 1 ? 'Booking' : 'Bookings'}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs pt-1">
                        <div>
                          <span className="block text-[10px] uppercase text-slate-400">
                            Contracted
                          </span>
                          <span className="font-mono-code font-semibold text-slate-900 tabular-nums">
                            {formatPoisha(et.agreedTotalPoisha, currency)}
                          </span>
                        </div>
                        <div>
                          <span className="block text-[10px] uppercase text-emerald-700">
                            Collected
                          </span>
                          <span className="font-mono-code font-bold text-emerald-700 tabular-nums">
                            {formatPoisha(et.collectedPoisha, currency)}
                          </span>
                        </div>
                        <div>
                          <span className="block text-[10px] uppercase text-amber-700">
                            Remaining Due
                          </span>
                          <span className="font-mono-code font-bold text-amber-800 tabular-nums">
                            {formatPoisha(et.outstandingDuePoisha, currency)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ACCOUNTS RECEIVABLE (BOOKING-WISE STATEMENT) */}
      {activeTab === 'receivables' && (
        <div className="atelier-card p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: 'ALL' as const, label: `All Bookings (${report.receivables.length})` },
                {
                  id: 'DUE' as const,
                  label: `Has Balance Due (${summary.bookingsWithDueCount})`,
                },
                {
                  id: 'PAID' as const,
                  label: `Paid in Full (${summary.fullyPaidBookingsCount})`,
                },
                {
                  id: 'PENDING' as const,
                  label: 'Has Pending Receipt',
                },
              ].map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setReceivableSubFilter(st.id)}
                  className={cn(
                    'rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer',
                    receivableSubFilter === st.id
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
                  )}
                >
                  {st.label}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <SearchIcon className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search booking ref, client, or phone..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-3 py-1.5 text-xs text-slate-900 outline-none focus:border-indigo-500 focus:bg-white"
              />
            </div>
          </div>

          {filteredReceivables.length === 0 ? (
            <p className="text-xs text-slate-500 py-10 text-center">
              No bookings match this receivable filter.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 uppercase text-[11px]">
                    <th className="py-2.5 pr-3">Booking</th>
                    <th className="py-2.5 px-3">Client &amp; Event</th>
                    <th className="py-2.5 px-3 text-right">Effective Price</th>
                    <th className="py-2.5 px-3 text-right">Verified Paid</th>
                    <th className="py-2.5 px-3 text-right">Pending</th>
                    <th className="py-2.5 px-3 text-right">Remaining Due</th>
                    <th className="py-2.5 pl-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredReceivables.map((r) => (
                    <tr
                      key={r.bookingId}
                      onClick={() =>
                        setDrawerState({ bookingId: r.bookingId, focusSection: 'payments' })
                      }
                      className="hover:bg-slate-50/70 transition-colors cursor-pointer"
                    >
                      <td className="py-3.5 pr-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="font-mono-code font-semibold text-[#2563EB] tabular-nums">
                            {r.reference}
                          </span>
                          <StatusBadge status={r.status} />
                        </div>
                        {r.eventDate && (
                          <span className="block admin-meta tabular-nums mt-0.5">
                            Event: {formatLocalDate(r.eventDate)}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-3 max-w-[260px]">
                        <p className="admin-row-title line-clamp-1">{r.eventTitle}</p>
                        <p className="admin-meta line-clamp-1 tabular-nums">
                          {r.clientName} ({r.clientPhone})
                        </p>
                      </td>

                      <td className="py-3.5 px-3 text-right font-semibold text-slate-900 tabular-nums whitespace-nowrap">
                        {formatPoisha(r.effectiveAgreedChargePoisha, currency)}
                        {r.creditNotesPoisha > 0 && (
                          <span className="block text-[11px] font-normal text-slate-400">
                            (-{formatPoisha(r.creditNotesPoisha, currency)} credit)
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-3 text-right font-semibold text-emerald-700 tabular-nums whitespace-nowrap">
                        {formatPoisha(r.verifiedReceiptsPoisha, currency)}
                        {r.completedRefundsPoisha > 0 && (
                          <span className="block text-[11px] font-normal text-rose-600">
                            (Refunded: {formatPoisha(r.completedRefundsPoisha, currency)})
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-3 text-right text-amber-700 tabular-nums whitespace-nowrap">
                        {r.pendingReceiptsPoisha > 0
                          ? formatPoisha(r.pendingReceiptsPoisha, currency)
                          : '—'}
                      </td>

                      <td className="py-3.5 px-3 text-right font-semibold tabular-nums whitespace-nowrap">
                        {r.status === 'CANCELLED' ? (
                          <span className="admin-meta">Cancelled</span>
                        ) : r.outstandingDuePoisha <= 0 ? (
                          <span className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-slate-600">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
                            Paid in Full
                          </span>
                        ) : (
                          <span className="text-rose-700">
                            {formatPoisha(r.outstandingDuePoisha, currency)}
                          </span>
                        )}
                      </td>

                      <td
                        className="py-3.5 pl-3 text-right whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              setDrawerState({ bookingId: r.bookingId, focusSection: 'payments' })
                            }
                            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 cursor-pointer"
                          >
                            Quick Ledger
                          </button>
                          <Link
                            href={`/admin/bookings/${r.bookingId}`}
                            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
                          >
                            Full Page →
                          </Link>
                          <a
                            href={`/api/bookings/${encodeURIComponent(r.bookingId)}/invoice.pdf`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-2.5 py-1 text-xs font-semibold text-white hover:bg-slate-800"
                            title="Download PDF Invoice"
                          >
                            <ReceiptIcon className="w-3 h-3" />
                            <span>PDF</span>
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: TRANSACTION LEDGER & VERIFICATION QUEUE */}
      {activeTab === 'ledger' && (
        <div className="atelier-card p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: 'ALL' as const, label: `All Entries (${report.transactions.length})` },
                {
                  id: 'PENDING' as const,
                  label: `Pending Verification (${summary.pendingReceiptsCount})`,
                },
                { id: 'VERIFIED' as const, label: 'Verified Receipts' },
                { id: 'REFUND' as const, label: 'Refunds' },
                { id: 'REJECTED' as const, label: 'Rejected' },
              ].map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setLedgerSubFilter(st.id)}
                  className={cn(
                    'rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer',
                    ledgerSubFilter === st.id
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
                  )}
                >
                  {st.label}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <SearchIcon className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search TrxID, booking ref, client..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-3 py-1.5 text-xs text-slate-900 outline-none focus:border-indigo-500 focus:bg-white"
              />
            </div>
          </div>

          {filteredTransactions.length === 0 ? (
            <p className="text-xs text-slate-500 py-10 text-center">
              No payment ledger entries match this filter.
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredTransactions.map((t) => {
                const methodMeta = METHOD_LABELS[t.method];
                return (
                  <div key={t.id} className="py-3.5 space-y-2 text-xs">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="space-y-0.5 min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={cn(
                              'rounded-md border px-2 py-0.5 text-[11px] font-semibold',
                              methodMeta.badgeClass,
                            )}
                          >
                            {methodMeta.label}
                          </span>
                          <span className="font-medium text-slate-900">{t.type}</span>
                          {t.transactionRef && (
                            <span className="font-mono-code rounded bg-slate-100 px-2 py-0.5 text-slate-700 tabular-nums">
                              TrxID: {t.transactionRef}
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() =>
                              setDrawerState({
                                bookingId: t.booking.id,
                                focusSection: 'payments',
                              })
                            }
                            className="font-mono-code font-semibold text-[#2563EB] hover:underline tabular-nums cursor-pointer"
                          >
                            {t.booking.reference}
                          </button>
                          <span className="text-slate-600">• {t.booking.clientName}</span>
                        </div>
                        <p className="admin-meta line-clamp-1 tabular-nums">
                          {t.booking.eventTitle} • Recorded{' '}
                          {formatDateTimeInTz(t.createdAt, timezone)}
                          {t.reason ? ` • Note: ${t.reason}` : ''}
                        </p>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0">
                        <span
                          className={cn(
                            'text-sm font-semibold tabular-nums',
                            t.type === 'REFUND' ? 'text-rose-700' : 'text-slate-900',
                          )}
                        >
                          {t.type === 'REFUND' ? '-' : ''}
                          {formatPoisha(t.amountPoisha, t.currency)}
                        </span>
                        <StatusBadge status={t.verificationState} />
                        <button
                          type="button"
                          onClick={() =>
                            setDrawerState({
                              bookingId: t.booking.id,
                              focusSection: 'payments',
                            })
                          }
                          className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 cursor-pointer"
                        >
                          Inspect
                        </button>

                        {t.verificationState === 'PENDING' &&
                          t.booking.status !== 'CANCELLED' && (
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                disabled={isPending}
                                onClick={() => handleVerifyEntry(t.id)}
                                className="rounded-lg bg-emerald-600 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-700 cursor-pointer"
                              >
                                Verify ✓
                              </button>
                              <button
                                type="button"
                                disabled={isPending}
                                onClick={() =>
                                  setRejectingEntryId(rejectingEntryId === t.id ? null : t.id)
                                }
                                className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100 cursor-pointer"
                              >
                                Reject
                              </button>
                            </div>
                          )}
                      </div>
                    </div>

                    {rejectingEntryId === t.id && (
                      <form
                        onSubmit={(e) => handleRejectEntry(e, t.id)}
                        className="rounded-xl border border-rose-200 bg-rose-50/70 p-2.5 flex flex-wrap items-center gap-2"
                      >
                        <input
                          required
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          placeholder="Reason for rejecting this receipt (e.g. invalid TrxID)"
                          className="flex-1 min-w-[200px] rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-xs"
                        />
                        <button
                          type="submit"
                          disabled={isPending}
                          className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700"
                        >
                          Confirm Reject
                        </button>
                      </form>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <BookingQuickDrawer
        bookingId={drawerState?.bookingId ?? null}
        focusSection={drawerState?.focusSection ?? 'overview'}
        timezone={timezone}
        onClose={() => setDrawerState(null)}
        onMutated={() => refreshReport()}
      />
    </div>
  );
}
