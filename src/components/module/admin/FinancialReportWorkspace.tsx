'use client';

import React, { useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import {
  BookingStatus,
  ExpenseCategory,
  FinancialReportData,
  PaymentMethod,
} from '@/types/event-management';
import {
  deleteExpense,
  getFinancialReport,
  recordExpense,
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
  PlusIcon,
  ReceiptIcon,
  SearchIcon,
} from '@/components/shared/Icons';
import { StatusBadge } from '@/components/shared/StatusBadge';

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

const EXPENSE_CATEGORY_META: Record<
  ExpenseCategory,
  { label: string; hint: string; badgeClass: string; barClass: string }
> = {
  CREW_PAYOUT: {
    label: 'Crew & Freelancer Payout',
    hint: 'Photographers, cinematographers, editors, assistants',
    badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    barClass: 'bg-indigo-600',
  },
  ALBUM_PRINTING: {
    label: 'Album & Lab Printing',
    hint: 'Story albums, photo frames, pen-drive boxes',
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
    barClass: 'bg-purple-600',
  },
  EQUIPMENT_RENTAL: {
    label: 'Camera & Gear Rental',
    hint: 'Lenses, drone, crane, gimbal, lighting kits',
    badgeClass: 'bg-sky-50 text-sky-700 border-sky-200',
    barClass: 'bg-sky-600',
  },
  TRANSPORT_FOOD: {
    label: 'Transport & Crew Food',
    hint: 'Venue travel, fuel, microbus, crew meals',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
    barClass: 'bg-amber-500',
  },
  VENUE_DECOR: {
    label: 'Stage, Venue & Vendor',
    hint: 'Sub-contracted stage, floral, sound, or lighting',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
    barClass: 'bg-rose-600',
  },
  STUDIO_OVERHEAD: {
    label: 'Studio Rent & Utilities',
    hint: 'Office rent, electricity, internet, cloud storage',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
    barClass: 'bg-slate-700',
  },
  MARKETING: {
    label: 'Marketing & Ads',
    hint: 'Facebook/Instagram boosting, bridal fair, promos',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    barClass: 'bg-emerald-600',
  },
  OTHER: {
    label: 'Other Expense',
    hint: 'Miscellaneous studio or event expense',
    badgeClass: 'bg-slate-100 text-slate-600 border-slate-200',
    barClass: 'bg-slate-500',
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
  const [activeTab, setActiveTab] = useState<
    'overview' | 'receivables' | 'expenses' | 'ledger'
  >('overview');

  // Server filter state
  const [fromDate, setFromDate] = useState(initialReport.filters.from || '');
  const [toDate, setToDate] = useState(initialReport.filters.to || '');
  const [methodFilter, setMethodFilter] = useState<string>(initialReport.filters.method || 'ALL');
  const [bookingStatusFilter, setBookingStatusFilter] = useState<string>(
    initialReport.filters.bookingStatus || 'ALL',
  );

  // Client sub-filters inside Receivables, Expenses & Ledger tabs
  const [searchQuery, setSearchQuery] = useState('');
  const [receivableSubFilter, setReceivableSubFilter] = useState<
    'ALL' | 'DUE' | 'PAID' | 'PENDING'
  >('ALL');
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState<'ALL' | ExpenseCategory>(
    'ALL',
  );
  const [ledgerSubFilter, setLedgerSubFilter] = useState<
    'ALL' | 'PENDING' | 'VERIFIED' | 'REFUND' | 'REJECTED'
  >('ALL');

  // Record Expense Modal State
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expCategory, setExpCategory] = useState<ExpenseCategory>('CREW_PAYOUT');
  const [expTitle, setExpTitle] = useState('');
  const [expVendor, setExpVendor] = useState('');
  const [expAmountTk, setExpAmountTk] = useState('');
  const [expMethod, setExpMethod] = useState<PaymentMethod>('BKASH');
  const [expRef, setExpRef] = useState('');
  const [expDate, setExpDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [expBookingId, setExpBookingId] = useState('');
  const [expNotes, setExpNotes] = useState('');

  const [rejectingEntryId, setRejectingEntryId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
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

  const handleRecordExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const amountPoisha = Math.round((Number(expAmountTk) || 0) * 100);
    if (!Number.isFinite(amountPoisha) || amountPoisha <= 0) {
      notify('err', 'Please enter a valid expense amount greater than Tk 0.');
      return;
    }

    startTransition(async () => {
      const res = await recordExpense({
        category: expCategory,
        title: expTitle.trim(),
        vendorOrPayee: expVendor.trim() || undefined,
        amountPoisha,
        method: expMethod,
        reference: expRef.trim() || undefined,
        incurredOn: expDate || undefined,
        bookingId: expBookingId || undefined,
        notes: expNotes.trim() || undefined,
      });

      if (!res.ok || !res.data) {
        notify('err', res.message || 'Failed to record expense.');
        return;
      }

      setExpTitle('');
      setExpVendor('');
      setExpAmountTk('');
      setExpRef('');
      setExpNotes('');
      setShowExpenseModal(false);
      notify(
        'ok',
        `Recorded expense "${res.data.title}" (${formatPoisha(res.data.amountPoisha, report.currency)}). Final net profit updated.`,
      );
      refreshReport();
    });
  };

  const handleDeleteExpense = (expenseId: string) => {
    startTransition(async () => {
      const res = await deleteExpense(expenseId);
      if (!res.ok) {
        notify('err', res.message || 'Failed to delete expense.');
        return;
      }
      notify('ok', 'Expense entry deleted and financial report recalculated.');
      refreshReport();
    });
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
      'Direct Expenses (Tk)',
      'Booking Net Profit (Tk)',
      'Remaining Customer Due (Tk)',
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
      ((r.directExpensesPoisha || 0) / 100).toFixed(2),
      ((r.bookingNetProfitPoisha || 0) / 100).toFixed(2),
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

  const handleExportExpensesCsv = () => {
    const headers = [
      'Date',
      'Category',
      'Expense Title',
      'Vendor / Payee',
      'Linked Booking Ref',
      'Method',
      'Reference / TrxID',
      'Amount (Tk)',
      'Notes',
    ];

    const rows = (report.expenses || []).map((exp) => [
      exp.incurredOn.slice(0, 10),
      EXPENSE_CATEGORY_META[exp.category]?.label || exp.category,
      exp.title,
      exp.vendorOrPayee || '',
      exp.booking?.reference || 'General Studio Overhead',
      exp.method,
      exp.reference || '',
      (exp.amountPoisha / 100).toFixed(2),
      exp.notes || '',
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map(escapeCsvCell).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `financial-expenses-${new Date().toISOString().slice(0, 10)}.csv`;
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

  const filteredExpenses = useMemo(() => {
    return (report.expenses || []).filter((exp) => {
      if (expenseCategoryFilter !== 'ALL' && exp.category !== expenseCategoryFilter) {
        return false;
      }
      if (
        q &&
        !exp.title.toLowerCase().includes(q) &&
        !(exp.vendorOrPayee || '').toLowerCase().includes(q) &&
        !(exp.booking?.reference || '').toLowerCase().includes(q) &&
        !(exp.reference || '').toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [report.expenses, expenseCategoryFilter, q]);

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
  const totalExpensesPoisha = summary.totalExpensesPoisha ?? 0;
  const netCashProfitPoisha =
    summary.netCashProfitPoisha ??
    summary.netCollectedRevenuePoisha - totalExpensesPoisha;
  const projectedNetProfitPoisha =
    summary.projectedNetProfitPoisha ??
    summary.effectiveContractedPoisha - totalExpensesPoisha;

  const inputClass =
    'w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-500 focus:bg-white transition-all';

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

      {/* Header & Action Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Financial Report, Expenses &amp; Net Profit
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Complete studio P&amp;L: customer collections, vendor/crew expenses, receivables, and
            clear final profit in {currency} ({timezone}).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setExpBookingId('');
              setShowExpenseModal(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-rose-700 transition-colors cursor-pointer"
          >
            <PlusIcon className="w-3.5 h-3.5" />
            <span>Record Expense</span>
          </button>
          <button
            type="button"
            onClick={handleExportReceivablesCsv}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <span>⬇ Receivables CSV</span>
          </button>
          <button
            type="button"
            onClick={handleExportExpensesCsv}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <span>⬇ Expenses CSV</span>
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

      {/* CLEAR FINAL FINANCIAL EQUATION BANNER (Revenue - Expenses = Net Profit) */}
      <div className="rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950 p-5 sm:p-6 text-white shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3 mb-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-300">
              Final Studio Financial Bottom Line (Clear Summary)
            </span>
            <p className="text-xs text-slate-300 mt-0.5">
              Vendor &amp; crew expenses are tracked separately from customer booking dues so your
              true net profit is always crystal clear.
            </p>
          </div>
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-mono-code text-indigo-200">
            Profit Margin: {(summary.profitMarginPercent ?? 0).toFixed(1)}%
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-xl bg-white/5 border border-white/10 p-4">
            <span className="text-xs font-medium text-emerald-300">
              1. Net Collected Revenue (+)
            </span>
            <p className="font-mono-code text-xl sm:text-2xl font-bold text-white mt-1 tabular-nums">
              {formatPoisha(summary.netCollectedRevenuePoisha, currency)}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Verified receipts minus completed refunds
            </p>
          </div>

          <div className="rounded-xl bg-white/5 border border-white/10 p-4">
            <span className="text-xs font-medium text-rose-300">
              2. Total Studio &amp; Event Expenses (−)
            </span>
            <p className="font-mono-code text-xl sm:text-2xl font-bold text-rose-300 mt-1 tabular-nums">
              {formatPoisha(totalExpensesPoisha, currency)}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Event Cost: {formatPoisha(summary.directBookingExpensesPoisha ?? 0, currency)} •
              Overhead: {formatPoisha(summary.generalOverheadExpensesPoisha ?? 0, currency)}
            </p>
          </div>

          <div
            className={cn(
              'rounded-xl border p-4',
              netCashProfitPoisha >= 0
                ? 'bg-emerald-500/15 border-emerald-400/40'
                : 'bg-rose-500/15 border-rose-400/40',
            )}
          >
            <span className="text-xs font-bold uppercase tracking-wider text-white">
              3. Final Net Cash Profit (=)
            </span>
            <p
              className={cn(
                'font-mono-code text-xl sm:text-2xl font-extrabold mt-1 tabular-nums',
                netCashProfitPoisha >= 0 ? 'text-emerald-300' : 'text-rose-300',
              )}
            >
              {formatPoisha(netCashProfitPoisha, currency)}
            </p>
            <p className="text-[11px] text-slate-300 mt-1">
              Actual cash surplus in hand after all expenses
            </p>
          </div>

          <div className="rounded-xl bg-white/5 border border-white/10 p-4">
            <span className="text-xs font-medium text-indigo-300">
              4. Projected Profit (After Dues)
            </span>
            <p className="font-mono-code text-xl sm:text-2xl font-bold text-indigo-200 mt-1 tabular-nums">
              {formatPoisha(projectedNetProfitPoisha, currency)}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Includes {formatPoisha(summary.totalOutstandingDuePoisha, currency)} remaining client
              dues
            </p>
          </div>
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

      {/* 4 Focused Report Section Tabs */}
      <div className="inline-flex flex-wrap rounded-xl border border-slate-200 bg-white p-1 gap-1 shadow-2xs">
        {[
          {
            id: 'overview' as const,
            label: '1. Profit, Channels & Expense Breakdown',
          },
          {
            id: 'receivables' as const,
            label: `2. Booking Receivables & Profit (${report.receivables.length})`,
          },
          {
            id: 'expenses' as const,
            label: `3. Expenses & Vendor Payouts (${report.expenses?.length ?? 0})`,
          },
          {
            id: 'ledger' as const,
            label: `4. Customer Receipt Ledger (${report.transactions.length})`,
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

      {/* TAB 1: CHANNEL, EXPENSE CATEGORY & MONTHLY PROFIT BREAKDOWN */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Payment Method Breakdown */}
          <div className="atelier-card p-6 space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900">
                Customer Collections by Payment Channel (bKash, Nagad, Bank, Cash)
              </h2>
              <p className="text-xs text-slate-500">
                Breakdown of verified customer receipts, pending unverified entries, and refunds.
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
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Expense Breakdown by Category */}
          <div className="atelier-card p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Where Expenses Are Happening (By Category)
                </h2>
                <p className="text-xs text-slate-500">
                  Track crew payouts, album printing, equipment rentals, transport, and studio
                  overheads.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setExpBookingId('');
                  setShowExpenseModal(true);
                }}
                className="rounded-xl bg-rose-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-rose-700 cursor-pointer"
              >
                + Record New Expense
              </button>
            </div>

            <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
              {(report.byExpenseCategory || []).map((cat) => {
                const meta = EXPENSE_CATEGORY_META[cat.category];
                return (
                  <div
                    key={cat.category}
                    className="rounded-2xl border border-slate-200 bg-white p-4 space-y-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={cn(
                          'rounded-lg border px-2.5 py-0.5 text-[11px] font-bold',
                          meta.badgeClass,
                        )}
                      >
                        {meta.label}
                      </span>
                      <span className="font-mono-code text-xs text-slate-400">
                        {cat.count} {cat.count === 1 ? 'item' : 'items'}
                      </span>
                    </div>

                    <p className="font-mono-code text-lg font-bold text-slate-900 tabular-nums">
                      {formatPoisha(cat.amountPoisha, currency)}
                    </p>

                    <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={cn('h-full', meta.barClass)}
                        style={{ width: `${Math.min(100, cat.sharePercent)}%` }}
                      />
                    </div>

                    <p className="text-[11px] text-slate-500 leading-snug">{meta.hint}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Monthly Trend & Event Type Breakdown */}
          <div className="grid gap-6 lg:grid-cols-12">
            {/* Monthly Revenue vs Expenses vs Net Cash Profit Table */}
            <div className="lg:col-span-7 atelier-card p-6 space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-base font-bold text-slate-900">
                  Monthly Revenue vs. Expenses &amp; Final Net Profit
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
                        <th className="py-2.5 px-2 text-right">Contracted</th>
                        <th className="py-2.5 px-2 text-right">Net Collected</th>
                        <th className="py-2.5 px-2 text-right">Expenses</th>
                        <th className="py-2.5 pl-2 text-right">Net Profit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {report.byMonth.map((m) => {
                        const monthExpenses = m.expensesPoisha ?? 0;
                        const monthProfit =
                          m.netCashProfitPoisha ?? m.netCollectedPoisha - monthExpenses;
                        return (
                          <tr key={m.month} className="hover:bg-slate-50">
                            <td className="py-3 pr-3 font-mono-code font-bold text-slate-900">
                              {m.month}{' '}
                              <span className="text-[11px] font-normal text-slate-400">
                                ({m.bookingsCount} bkg)
                              </span>
                            </td>
                            <td className="py-3 px-2 text-right font-mono-code text-slate-700 tabular-nums">
                              {formatPoisha(m.contractedPoisha, currency)}
                            </td>
                            <td className="py-3 px-2 text-right font-mono-code font-semibold text-emerald-700 tabular-nums">
                              {formatPoisha(m.netCollectedPoisha, currency)}
                            </td>
                            <td className="py-3 px-2 text-right font-mono-code font-semibold text-rose-700 tabular-nums">
                              {monthExpenses > 0
                                ? `-${formatPoisha(monthExpenses, currency)}`
                                : 'Tk 0'}
                            </td>
                            <td
                              className={cn(
                                'py-3 pl-2 text-right font-mono-code font-bold tabular-nums',
                                monthProfit >= 0 ? 'text-slate-900' : 'text-rose-700',
                              )}
                            >
                              {formatPoisha(monthProfit, currency)}
                            </td>
                          </tr>
                        );
                      })}
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
                            Client Due
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

      {/* TAB 2: ACCOUNTS RECEIVABLE & PER-BOOKING PROFITABILITY */}
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
                    <th className="py-2.5 px-2">Client &amp; Event</th>
                    <th className="py-2.5 px-2 text-right">Agreed Charge</th>
                    <th className="py-2.5 px-2 text-right">Verified Paid</th>
                    <th className="py-2.5 px-2 text-right">Event Expenses</th>
                    <th className="py-2.5 px-2 text-right">Event Profit</th>
                    <th className="py-2.5 px-2 text-right">Client Due</th>
                    <th className="py-2.5 pl-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredReceivables.map((r) => {
                    const directExp = r.directExpensesPoisha ?? 0;
                    const bkgProfit =
                      r.bookingNetProfitPoisha ?? r.verifiedReceiptsPoisha - directExp;
                    return (
                      <tr key={r.bookingId} className="hover:bg-slate-50/80">
                        <td className="py-3.5 pr-3 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/admin/bookings/${r.bookingId}`}
                              className="font-mono-code font-bold text-indigo-600 hover:underline"
                            >
                              {r.reference}
                            </Link>
                            <StatusBadge status={r.status} />
                          </div>
                          {r.eventDate && (
                            <span className="block text-[11px] font-mono-code text-slate-400 mt-0.5">
                              Event: {formatLocalDate(r.eventDate)}
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-2">
                          <p className="font-semibold text-slate-900">{r.eventTitle}</p>
                          <p className="text-slate-500">
                            {r.clientName} ({r.clientPhone})
                          </p>
                        </td>

                        <td className="py-3.5 px-2 text-right font-mono-code font-semibold text-slate-900 tabular-nums whitespace-nowrap">
                          {formatPoisha(r.effectiveAgreedChargePoisha, currency)}
                        </td>

                        <td className="py-3.5 px-2 text-right font-mono-code font-bold text-emerald-700 tabular-nums whitespace-nowrap">
                          {formatPoisha(r.verifiedReceiptsPoisha, currency)}
                        </td>

                        <td className="py-3.5 px-2 text-right font-mono-code text-rose-700 tabular-nums whitespace-nowrap">
                          {directExp > 0 ? `-${formatPoisha(directExp, currency)}` : 'Tk 0'}
                        </td>

                        <td
                          className={cn(
                            'py-3.5 px-2 text-right font-mono-code font-bold tabular-nums whitespace-nowrap',
                            bkgProfit >= 0 ? 'text-slate-900' : 'text-rose-700',
                          )}
                        >
                          {formatPoisha(bkgProfit, currency)}
                        </td>

                        <td className="py-3.5 px-2 text-right font-mono-code font-bold tabular-nums whitespace-nowrap">
                          {r.status === 'CANCELLED' ? (
                            <span className="text-slate-400">Cancelled</span>
                          ) : r.outstandingDuePoisha <= 0 ? (
                            <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800">
                              Paid ✓
                            </span>
                          ) : (
                            <span className="text-amber-800">
                              {formatPoisha(r.outstandingDuePoisha, currency)}
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 pl-2 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setExpBookingId(r.bookingId);
                                setShowExpenseModal(true);
                              }}
                              className="rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-[11px] font-semibold text-rose-700 hover:bg-rose-100 cursor-pointer"
                              title="Log an expense for this booking"
                            >
                              + Expense
                            </button>
                            <Link
                              href={`/admin/bookings/${r.bookingId}`}
                              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                            >
                              Ledger →
                            </Link>
                            <a
                              href={`/api/bookings/${encodeURIComponent(r.bookingId)}/invoice.pdf`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-2.5 py-1 text-xs font-semibold text-white hover:bg-slate-800"
                              title="Download PDF Invoice"
                            >
                              <span>PDF</span>
                            </a>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: STUDIO & EVENT EXPENSES LEDGER */}
      {activeTab === 'expenses' && (
        <div className="atelier-card p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setExpenseCategoryFilter('ALL')}
                className={cn(
                  'rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer',
                  expenseCategoryFilter === 'ALL'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
                )}
              >
                All Expenses ({report.expenses?.length ?? 0})
              </button>
              {(Object.keys(EXPENSE_CATEGORY_META) as ExpenseCategory[]).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setExpenseCategoryFilter(cat)}
                  className={cn(
                    'rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer',
                    expenseCategoryFilter === cat
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
                  )}
                >
                  {EXPENSE_CATEGORY_META[cat].label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <div className="relative w-full sm:w-56">
                <SearchIcon className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search expense, vendor..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-3 py-1.5 text-xs text-slate-900 outline-none focus:border-indigo-500 focus:bg-white"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  setExpBookingId('');
                  setShowExpenseModal(true);
                }}
                className="shrink-0 rounded-xl bg-rose-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-rose-700 cursor-pointer"
              >
                + Add Expense
              </button>
            </div>
          </div>

          {filteredExpenses.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <p className="text-sm font-semibold text-slate-800">No expenses recorded yet</p>
              <p className="text-xs text-slate-500">
                Click &ldquo;Record Expense&rdquo; to log crew payouts, album printing, gear
                rentals, or studio overheads.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredExpenses.map((exp) => {
                const catMeta = EXPENSE_CATEGORY_META[exp.category] || EXPENSE_CATEGORY_META.OTHER;
                const methodMeta = METHOD_LABELS[exp.method] || METHOD_LABELS.CASH;
                return (
                  <div
                    key={exp.id}
                    className="py-3.5 flex flex-wrap items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={cn(
                            'rounded-md border px-2 py-0.5 text-[11px] font-bold',
                            catMeta.badgeClass,
                          )}
                        >
                          {catMeta.label}
                        </span>
                        <span
                          className={cn(
                            'rounded-md border px-2 py-0.5 text-[11px] font-semibold',
                            methodMeta.badgeClass,
                          )}
                        >
                          {methodMeta.label}
                        </span>
                        <span className="font-mono-code text-slate-500">
                          {formatLocalDate(exp.incurredOn)}
                        </span>
                        {exp.booking ? (
                          <Link
                            href={`/admin/bookings/${exp.booking.id}`}
                            className="rounded-md bg-indigo-50 px-2 py-0.5 font-mono-code font-semibold text-indigo-700 hover:underline"
                          >
                            {exp.booking.reference} • {exp.booking.eventTitle}
                          </Link>
                        ) : (
                          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">
                            General Studio Overhead
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-bold text-slate-900">
                        {exp.title}
                        {exp.vendorOrPayee ? (
                          <span className="font-normal text-slate-500">
                            {' '}
                            • Paid to: <strong className="text-slate-700">{exp.vendorOrPayee}</strong>
                          </span>
                        ) : null}
                      </p>
                      {(exp.reference || exp.notes) && (
                        <p className="text-slate-500">
                          {exp.reference ? `Ref/TrxID: ${exp.reference}` : ''}
                          {exp.reference && exp.notes ? ' • ' : ''}
                          {exp.notes || ''}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-mono-code text-sm font-bold text-rose-700 tabular-nums">
                        -{formatPoisha(exp.amountPoisha, exp.currency)}
                      </span>
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => handleDeleteExpense(exp.id)}
                        className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: CUSTOMER TRANSACTION LEDGER & VERIFICATION QUEUE */}
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
                      <div className="space-y-0.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={cn(
                              'rounded-md border px-2 py-0.5 text-[11px] font-bold',
                              methodMeta.badgeClass,
                            )}
                          >
                            {methodMeta.label}
                          </span>
                          <span className="font-semibold text-slate-900">{t.type}</span>
                          {t.transactionRef && (
                            <span className="font-mono-code rounded bg-slate-100 px-2 py-0.5 text-slate-700">
                              TrxID: {t.transactionRef}
                            </span>
                          )}
                          <Link
                            href={`/admin/bookings/${t.booking.id}`}
                            className="font-mono-code font-semibold text-indigo-600 hover:underline"
                          >
                            {t.booking.reference}
                          </Link>
                          <span className="text-slate-600">• {t.booking.clientName}</span>
                        </div>
                        <p className="text-slate-500">
                          {t.booking.eventTitle} • Recorded{' '}
                          {formatDateTimeInTz(t.createdAt, timezone)}
                          {t.reason ? ` • Note: ${t.reason}` : ''}
                        </p>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <span
                          className={cn(
                            'font-mono-code text-sm font-bold tabular-nums',
                            t.type === 'REFUND' ? 'text-rose-700' : 'text-slate-900',
                          )}
                        >
                          {t.type === 'REFUND' ? '-' : ''}
                          {formatPoisha(t.amountPoisha, t.currency)}
                        </span>
                        <StatusBadge status={t.verificationState} />

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

      {/* RECORD EXPENSE MODAL */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/55 p-4 backdrop-blur-xs">
          <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Record Studio or Event Expense
                </h2>
                <p className="text-xs text-slate-500">
                  Deducted from studio revenue to calculate final net profit (never alters customer
                  booking due balance).
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowExpenseModal(false)}
                className="rounded-lg px-2 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRecordExpense} className="space-y-3.5">
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Expense Category *
                  </label>
                  <select
                    value={expCategory}
                    onChange={(e) => setExpCategory(e.target.value as ExpenseCategory)}
                    className={inputClass}
                  >
                    {(Object.keys(EXPENSE_CATEGORY_META) as ExpenseCategory[]).map((cat) => (
                      <option key={cat} value={cat}>
                        {EXPENSE_CATEGORY_META[cat].label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Amount ({currency}) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={expAmountTk}
                    onChange={(e) => setExpAmountTk(e.target.value)}
                    placeholder="e.g. 5000"
                    className={`${inputClass} font-mono-code`}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Expense Title / Purpose *
                  </label>
                  <input
                    required
                    value={expTitle}
                    onChange={(e) => setExpTitle(e.target.value)}
                    placeholder="e.g. Freelance Cinematographer Payout / 40-Page Album Print"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Vendor / Payee Name
                  </label>
                  <input
                    value={expVendor}
                    onChange={(e) => setExpVendor(e.target.value)}
                    placeholder="e.g. Tanvir Films / Dhaka Color Lab"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Expense Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={expDate}
                    onChange={(e) => setExpDate(e.target.value)}
                    className={`${inputClass} font-mono-code`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Payment Method
                  </label>
                  <select
                    value={expMethod}
                    onChange={(e) => setExpMethod(e.target.value as PaymentMethod)}
                    className={inputClass}
                  >
                    <option value="BKASH">bKash</option>
                    <option value="NAGAD">Nagad</option>
                    <option value="BANK">Bank Transfer</option>
                    <option value="CASH">Cash</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    TrxID / Voucher Ref
                  </label>
                  <input
                    value={expRef}
                    onChange={(e) => setExpRef(e.target.value)}
                    placeholder="Optional receipt or TrxID"
                    className={inputClass}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Link to Specific Event Booking (Optional)
                  </label>
                  <select
                    value={expBookingId}
                    onChange={(e) => setExpBookingId(e.target.value)}
                    className={inputClass}
                  >
                    <option value="">General Studio Overhead (Not tied to a single booking)</option>
                    {report.receivables.map((b) => (
                      <option key={b.bookingId} value={b.bookingId}>
                        {b.reference} — {b.eventTitle} ({b.clientName})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Notes (Optional)
                  </label>
                  <input
                    value={expNotes}
                    onChange={(e) => setExpNotes(e.target.value)}
                    placeholder="Additional details..."
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-xl bg-rose-600 px-5 py-2 text-xs font-semibold text-white hover:bg-rose-700 cursor-pointer"
                >
                  {isPending ? 'Saving...' : 'Save Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
