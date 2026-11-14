'use client';

import React, { useState, useTransition } from 'react';
import {
  AcceptanceChannel,
  Booking,
  BookingLedgerSummary,
  Deliverable,
  Inquiry,
  PaymentEntry,
  PaymentMethod,
  Quote,
  StudioPackage,
} from '@/types/event-management';
import { createPhoneInquiry } from '@/service/inquiries/inquiries.service';
import { acceptQuote, createQuote } from '@/service/quotes/quotes.service';
import {
  completeBooking,
  confirmBooking,
  getBooking,
} from '@/service/bookings/bookings.service';
import {
  getBookingLedger,
  recordPayment,
  verifyPayment,
} from '@/service/payments/payments.service';
import {
  createDeliverable,
  deliverDeliverable,
} from '@/service/operations/operations.service';
import { cn, formatLocalDate, formatPoisha } from '@/lib/utils';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { PlusIcon } from '@/components/shared/Icons';

interface BookingsWorkspaceProps {
  initialInquiries: Inquiry[];
  initialQuotes: Quote[];
  initialBookings: Booking[];
  packages: StudioPackage[];
  currency: string;
}

export function BookingsWorkspace({
  initialInquiries,
  initialQuotes,
  initialBookings,
  packages,
  currency,
}: BookingsWorkspaceProps) {
  const [tab, setTab] = useState<'inquiries' | 'quotes' | 'bookings'>('bookings');
  const [searchQuery, setSearchQuery] = useState('');
  const [showInquiryForm, setShowInquiryForm] = useState(false);
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [inquiries, setInquiries] = useState<Inquiry[]>(initialInquiries);
  const [quotes, setQuotes] = useState<Quote[]>(initialQuotes);
  const [bookings, setBookings] = useState<Booking[]>(initialBookings);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [ledger, setLedger] = useState<{
    summary: BookingLedgerSummary;
    entries: PaymentEntry[];
  } | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  // Phone Inquiry Modal / Inline Form state
  const [inqTitle, setInqTitle] = useState('');
  const [inqDate, setInqDate] = useState('');
  const [inqClient, setInqClient] = useState('');
  const [inqPhone, setInqPhone] = useState('');

  // Quick Quote Builder state
  const [quoteInquiryId, setQuoteInquiryId] = useState('');
  const [quoteEventTitle, setQuoteEventTitle] = useState('');
  const [quoteClientName, setQuoteClientName] = useState('');
  const [quoteClientPhone, setQuoteClientPhone] = useState('');
  const [quoteDate, setQuoteDate] = useState('');
  const [quoteItemDesc, setQuoteItemDesc] = useState('');
  const [quoteAmountTk, setQuoteAmountTk] = useState('50000');

  // Payment entry state
  const [payAmountTk, setPayAmountTk] = useState('10000');
  const [payMethod, setPayMethod] = useState<PaymentMethod>('BKASH');
  const [payRef, setPayRef] = useState('');
  const [payIdemKey, setPayIdemKey] = useState('');

  // Deliverable state
  const [delivLabel, setDelivLabel] = useState('');

  const notify = (type: 'ok' | 'err', text: string) => setFeedback({ type, text });

  const openBookingDetail = (bookingId: string) => {
    startTransition(async () => {
      const [bRes, lRes] = await Promise.all([getBooking(bookingId), getBookingLedger(bookingId)]);
      if (bRes.ok && bRes.data) {
        setSelectedBooking(bRes.data);
      }
      if (lRes.ok && lRes.data) {
        setLedger(lRes.data);
      }
    });
  };

  const handleCreateInquiry = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await createPhoneInquiry({
        eventTitle: inqTitle,
        requestedDate: inqDate || undefined,
        clientName: inqClient,
        clientPhone: inqPhone,
      });
      if (!res.ok || !res.data) {
        notify('err', res.message || 'Failed to create inquiry');
        return;
      }
      setInquiries([res.data, ...inquiries]);
      setInqTitle('');
      setInqClient('');
      setInqPhone('');
      notify('ok', `Created inquiry ${res.data.reference}`);
    });
  };

  const prefillQuoteFromInquiry = (inq: Inquiry) => {
    setQuoteInquiryId(inq.id);
    setQuoteEventTitle(inq.eventTitle);
    setQuoteClientName(inq.clientName);
    setQuoteClientPhone(inq.clientPhone);
    setQuoteDate(inq.requestedDate ? inq.requestedDate.slice(0, 10) : '');
    const pkg = packages.find((p) => p.id === inq.packageId);
    if (pkg) {
      setQuoteItemDesc(pkg.name);
      setQuoteAmountTk(String(Math.round(pkg.basePricePoisha / 100)));
    } else {
      setQuoteItemDesc(inq.eventTitle);
    }
    setTab('quotes');
    setShowQuoteForm(true);
  };

  const handleCreateQuote = (e: React.FormEvent) => {
    e.preventDefault();
    const poisha = Math.round(Number(quoteAmountTk) * 100);
    if (!Number.isFinite(poisha) || poisha < 0) {
      notify('err', 'Enter a valid amount');
      return;
    }
    startTransition(async () => {
      const res = await createQuote({
        inquiryId: quoteInquiryId || undefined,
        eventTitle: quoteEventTitle,
        requestedDate: quoteDate || undefined,
        clientName: quoteClientName,
        clientPhone: quoteClientPhone,
        items: [
          {
            description: quoteItemDesc || quoteEventTitle,
            quantity: 1,
            unitPricePoisha: poisha,
          },
        ],
      });
      if (!res.ok || !res.data) {
        notify('err', res.message || 'Failed to create quote');
        return;
      }
      setQuotes([res.data, ...quotes]);
      setQuoteInquiryId('');
      notify('ok', `Created quote ${res.data.reference}`);
    });
  };

  const handleAcceptQuote = (q: Quote) => {
    startTransition(async () => {
      const res = await acceptQuote(q.id, {
        acceptedBy: q.clientName,
        acceptedChannel: 'PHONE' as AcceptanceChannel,
      });
      if (!res.ok || !res.data) {
        notify('err', res.message || 'Failed to accept quote');
        return;
      }
      setQuotes(quotes.map((item) => (item.id === q.id ? { ...item, status: 'ACCEPTED' } : item)));
      setBookings([res.data.booking, ...bookings]);
      setTab('bookings');
      openBookingDetail(res.data.booking.id);
      notify('ok', `Accepted quote ${q.reference} → Booking ${res.data.booking.reference}`);
    });
  };

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBooking) return;
    const amountPoisha = Math.round(Number(payAmountTk) * 100);
    startTransition(async () => {
      const res = await recordPayment(selectedBooking.id, {
        amountPoisha,
        method: payMethod,
        transactionRef: payRef || undefined,
        idempotencyKey: payIdemKey || undefined,
      });
      if (!res.ok || !res.data) {
        notify('err', res.message || 'Failed to record payment');
        return;
      }
      notify(
        'ok',
        res.data.idempotentReplay
          ? 'This payment was already recorded.'
          : 'Payment recorded. Click Verify to add it to the paid balance.',
      );
      setPayRef('');
      setPayIdemKey('');
      openBookingDetail(selectedBooking.id);
    });
  };

  const handleVerifyPayment = (paymentId: string) => {
    if (!selectedBooking) return;
    startTransition(async () => {
      const res = await verifyPayment(paymentId);
      if (!res.ok) {
        notify('err', res.message || 'Verification failed (requires Owner or Accountant)');
        return;
      }
      notify('ok', 'Payment verified and applied to booking balance');
      openBookingDetail(selectedBooking.id);
    });
  };

  const handleConfirmBooking = () => {
    if (!selectedBooking) return;
    startTransition(async () => {
      const res = await confirmBooking(selectedBooking.id, selectedBooking.version);
      if (!res.ok || !res.data) {
        notify('err', res.message || 'Unable to confirm booking');
        return;
      }
      setBookings(
        bookings.map((b) => (b.id === selectedBooking.id ? res.data!.booking : b)),
      );
      openBookingDetail(selectedBooking.id);
      notify('ok', `Booking ${selectedBooking.reference} confirmed`);
    });
  };

  const handleCompleteBooking = () => {
    if (!selectedBooking) return;
    startTransition(async () => {
      const res = await completeBooking(selectedBooking.id);
      if (!res.ok) {
        notify('err', res.message || 'Failed to mark booking completed');
        return;
      }
      openBookingDetail(selectedBooking.id);
      notify('ok', 'Booking marked as completed.');
    });
  };

  const handleAddDeliverable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBooking || !delivLabel.trim()) return;
    startTransition(async () => {
      const res = await createDeliverable(selectedBooking.id, { label: delivLabel.trim() });
      if (!res.ok) {
        notify('err', res.message || 'Failed to add deliverable');
        return;
      }
      setDelivLabel('');
      openBookingDetail(selectedBooking.id);
      notify('ok', 'Deliverable added');
    });
  };

  const handleDeliverItem = (d: Deliverable) => {
    if (!selectedBooking) return;
    startTransition(async () => {
      const res = await deliverDeliverable(d.id, {});
      if (!res.ok) {
        notify('err', res.message || 'Failed to mark delivered');
        return;
      }
      openBookingDetail(selectedBooking.id);
      notify('ok', `"${d.label}" marked as delivered.`);
    });
  };

  const q = searchQuery.trim().toLowerCase();
  const filteredInquiries = inquiries.filter(
    (i) =>
      !q ||
      i.eventTitle.toLowerCase().includes(q) ||
      i.clientName.toLowerCase().includes(q) ||
      i.reference.toLowerCase().includes(q),
  );
  const filteredQuotes = quotes.filter(
    (item) =>
      !q ||
      item.eventTitle.toLowerCase().includes(q) ||
      item.clientName.toLowerCase().includes(q) ||
      item.reference.toLowerCase().includes(q),
  );
  const filteredBookings = bookings.filter(
    (b) =>
      !q ||
      b.eventTitle.toLowerCase().includes(q) ||
      b.clientName.toLowerCase().includes(q) ||
      b.reference.toLowerCase().includes(q),
  );

  const inputClass =
    'w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/15 transition-all';

  return (
    <div className="space-y-6">
      {/* Header & Step Tabs */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Bookings &amp; Payments
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            3 easy steps: 1. Client Request → 2. Price Quote → 3. Booking &amp; Payments
          </p>
        </div>

        <div className="inline-flex flex-wrap rounded-xl border border-slate-200 bg-white p-1 gap-1">
          {[
            { key: 'inquiries' as const, label: `1. Requests (${inquiries.length})` },
            { key: 'quotes' as const, label: `2. Quotes (${quotes.length})` },
            { key: 'bookings' as const, label: `3. Bookings (${bookings.length})` },
          ].map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setTab(item.key)}
              className={cn(
                'rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors',
                tab === item.key
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50',
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Search + Quick Add Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by client name, event, or reference..."
          className="w-full sm:max-w-sm rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15"
        />

        {tab === 'inquiries' && (
          <button
            type="button"
            onClick={() => setShowInquiryForm((v) => !v)}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors"
          >
            <PlusIcon className="w-3.5 h-3.5" />
            <span>{showInquiryForm ? 'Close Form' : 'New Request'}</span>
          </button>
        )}

        {tab === 'quotes' && (
          <button
            type="button"
            onClick={() => setShowQuoteForm((v) => !v)}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors"
          >
            <PlusIcon className="w-3.5 h-3.5" />
            <span>{showQuoteForm ? 'Close Form' : 'New Quote'}</span>
          </button>
        )}
      </div>

      {feedback && (
        <div
          className={cn(
            'rounded-xl border px-4 py-3 text-sm flex items-center justify-between',
            feedback.type === 'ok'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
              : 'border-rose-200 bg-rose-50 text-rose-900',
          )}
        >
          <span>{feedback.text}</span>
          <button type="button" onClick={() => setFeedback(null)} className="text-xs underline">
            Dismiss
          </button>
        </div>
      )}

      {/* TAB 1: INQUIRIES */}
      {tab === 'inquiries' && (
        <div className="space-y-5">
          {showInquiryForm && (
            <form
              onSubmit={(e) => {
                handleCreateInquiry(e);
                setShowInquiryForm(false);
              }}
              className="atelier-card p-6 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="text-base font-bold tracking-tight text-slate-900">
                  Log Phone / Walk-In Inquiry
                </h2>
                <button
                  type="button"
                  onClick={() => setShowInquiryForm(false)}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-900"
                >
                  Cancel
                </button>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <input
                  required
                  value={inqTitle}
                  onChange={(e) => setInqTitle(e.target.value)}
                  placeholder="Event title *"
                  className={inputClass}
                />
                <input
                  type="date"
                  value={inqDate}
                  onChange={(e) => setInqDate(e.target.value)}
                  className={inputClass}
                />
                <input
                  required
                  value={inqClient}
                  onChange={(e) => setInqClient(e.target.value)}
                  placeholder="Client name *"
                  className={inputClass}
                />
                <input
                  required
                  value={inqPhone}
                  onChange={(e) => setInqPhone(e.target.value)}
                  placeholder="Client phone *"
                  className={inputClass}
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
                >
                  <PlusIcon className="w-3.5 h-3.5" />
                  <span>Save Inquiry</span>
                </button>
              </div>
            </form>
          )}

          <div className="atelier-card p-6 space-y-3">
            {filteredInquiries.length === 0 ? (
              <p className="text-sm text-slate-500 py-8 text-center">
                No inquiries found. Click &ldquo;New Phone Inquiry&rdquo; to log one.
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredInquiries.map((inq) => (
                  <div key={inq.id} className="py-3.5 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono-code text-xs font-semibold text-slate-500">
                          {inq.reference}
                        </span>
                        <StatusBadge status={inq.status} />
                      </div>
                      <p className="font-semibold text-sm text-slate-900 mt-1">{inq.eventTitle}</p>
                      <p className="text-xs text-slate-500">
                        {inq.clientName} ({inq.clientPhone}) • Date: {formatLocalDate(inq.requestedDate)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => prefillQuoteFromInquiry(inq)}
                      className="rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition-colors"
                    >
                      Create Quote →
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: QUOTES */}
      {tab === 'quotes' && (
        <div className="space-y-5">
          {showQuoteForm && (
            <form
              onSubmit={(e) => {
                handleCreateQuote(e);
                setShowQuoteForm(false);
              }}
              className="atelier-card p-6 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="text-base font-bold tracking-tight text-slate-900">
                  Create Price Quote
                </h2>
                <button
                  type="button"
                  onClick={() => setShowQuoteForm(false)}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-900"
                >
                  Cancel
                </button>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <input
                  required
                  value={quoteEventTitle}
                  onChange={(e) => setQuoteEventTitle(e.target.value)}
                  placeholder="Event title *"
                  className={inputClass}
                />
                <input
                  type="date"
                  value={quoteDate}
                  onChange={(e) => setQuoteDate(e.target.value)}
                  className={inputClass}
                />
                <input
                  required
                  value={quoteClientName}
                  onChange={(e) => setQuoteClientName(e.target.value)}
                  placeholder="Client name *"
                  className={inputClass}
                />
                <input
                  required
                  value={quoteClientPhone}
                  onChange={(e) => setQuoteClientPhone(e.target.value)}
                  placeholder="Client phone *"
                  className={inputClass}
                />
                <input
                  required
                  value={quoteItemDesc}
                  onChange={(e) => setQuoteItemDesc(e.target.value)}
                  placeholder="Package / service description *"
                  className={inputClass}
                />
                <input
                  required
                  type="number"
                  min="0"
                  value={quoteAmountTk}
                  onChange={(e) => setQuoteAmountTk(e.target.value)}
                  placeholder={`Total price (${currency}) *`}
                  className={`${inputClass} font-mono-code`}
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
                >
                  <span>Save Quote</span>
                </button>
              </div>
            </form>
          )}

          <div className="atelier-card p-6 space-y-3">
            {filteredQuotes.length === 0 ? (
              <p className="text-sm text-slate-500 py-8 text-center">
                No quotes found. Click &ldquo;New Quote&rdquo; or create one from an inquiry.
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredQuotes.map((item) => {
                  const latest = item.versions?.[0] || item.currentVersion;
                  return (
                    <div key={item.id} className="py-3.5 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono-code text-xs font-semibold text-slate-500">
                            {item.reference}
                          </span>
                          <StatusBadge status={item.status} />
                          {latest && (
                            <span className="text-[11px] font-mono-code text-slate-400">
                              v{latest.versionNumber}
                            </span>
                          )}
                        </div>
                        <p className="font-semibold text-sm text-slate-900 mt-1">{item.eventTitle}</p>
                        <p className="text-xs text-slate-500">{item.clientName}</p>
                      </div>

                      <div className="flex items-center gap-3">
                        {latest && (
                          <span className="font-mono-code text-sm font-semibold text-slate-900 tabular-nums">
                            {formatPoisha(latest.totalPoisha, item.currency)}
                          </span>
                        )}
                        {item.status !== 'ACCEPTED' && (
                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() => handleAcceptQuote(item)}
                            className="rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors"
                          >
                            Accept &amp; Create Booking
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: BOOKINGS */}
      {tab === 'bookings' && (
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-5 atelier-card p-5 space-y-3 h-fit">
            <h2 className="text-base font-bold tracking-tight text-slate-900">
              All Bookings ({filteredBookings.length})
            </h2>
            {filteredBookings.length === 0 ? (
              <p className="text-sm text-slate-500 py-8 text-center">
                No bookings yet. Accept a quote to create your first booking.
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredBookings.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => openBookingDetail(b.id)}
                    className={cn(
                      'w-full text-left py-3 px-3 rounded-xl transition-colors flex items-center justify-between gap-2',
                      selectedBooking?.id === b.id
                        ? 'bg-indigo-50/70 ring-1 ring-indigo-200'
                        : 'hover:bg-slate-50',
                    )}
                  >
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
                      <p className="text-xs text-slate-500">{b.clientName}</p>
                    </div>
                    <span className="font-mono-code text-xs font-semibold text-slate-900 shrink-0 tabular-nums">
                      {formatPoisha(b.agreedTotalPoisha, b.currency)}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-7 space-y-6">
            {!selectedBooking ? (
              <div className="atelier-card p-12 text-center text-sm text-slate-500">
                Click any booking on the left to view payments, confirm the event, or track
                deliverables.
              </div>
            ) : (
              <>
                <div className="atelier-card p-6 space-y-5">
                  <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono-code text-xs font-semibold text-slate-500">
                          {selectedBooking.reference}
                        </span>
                        <StatusBadge status={selectedBooking.status} />
                      </div>
                      <h3 className="text-lg font-bold tracking-tight text-slate-900 mt-1">
                        {selectedBooking.eventTitle}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {selectedBooking.clientName} ({selectedBooking.clientPhone}) • Event Date:{' '}
                        {formatLocalDate(selectedBooking.eventDate)}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {selectedBooking.status === 'PENDING_CONFIRMATION' && (
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={handleConfirmBooking}
                          className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
                        >
                          Confirm Booking
                        </button>
                      )}
                      {selectedBooking.status === 'CONFIRMED' && (
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={handleCompleteBooking}
                          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          Mark Completed
                        </button>
                      )}
                    </div>
                  </div>

                  {ledger && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="rounded-xl bg-slate-50 p-3 border border-slate-200">
                        <p className="text-[11px] font-semibold text-slate-500">Total Price</p>
                        <p className="font-mono-code text-sm font-semibold text-slate-900 mt-1 tabular-nums">
                          {formatPoisha(ledger.summary.effectiveAgreedChargePoisha, ledger.summary.currency)}
                        </p>
                      </div>
                      <div className="rounded-xl bg-emerald-50/70 p-3 border border-emerald-200">
                        <p className="text-[11px] font-semibold text-emerald-700">Paid (Verified)</p>
                        <p className="font-mono-code text-sm font-semibold text-emerald-900 mt-1 tabular-nums">
                          {formatPoisha(ledger.summary.verifiedReceiptsPoisha, ledger.summary.currency)}
                        </p>
                      </div>
                      <div className="rounded-xl bg-amber-50/70 p-3 border border-amber-200">
                        <p className="text-[11px] font-semibold text-amber-700">Pending Approval</p>
                        <p className="font-mono-code text-sm font-semibold text-amber-900 mt-1 tabular-nums">
                          {formatPoisha(ledger.summary.pendingReceiptsPoisha, ledger.summary.currency)}
                        </p>
                      </div>
                      <div className="rounded-xl bg-slate-50 p-3 border border-slate-200">
                        <p className="text-[11px] font-semibold text-slate-500">Remaining Due</p>
                        <p className="font-mono-code text-sm font-semibold text-slate-900 mt-1 tabular-nums">
                          {formatPoisha(ledger.summary.outstandingDuePoisha, ledger.summary.currency)}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Record Payment */}
                  <div className="space-y-2 pt-1">
                    <p className="text-xs font-semibold text-slate-600">Add a Payment</p>
                    <form onSubmit={handleRecordPayment} className="grid sm:grid-cols-4 gap-2.5">
                      <input
                        type="number"
                        min="1"
                        required
                        value={payAmountTk}
                        onChange={(e) => setPayAmountTk(e.target.value)}
                        placeholder={`Amount (${currency})`}
                        className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono-code"
                      />
                      <select
                        value={payMethod}
                        onChange={(e) => setPayMethod(e.target.value as PaymentMethod)}
                        className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
                      >
                        <option value="BKASH">bKash</option>
                        <option value="NAGAD">Nagad</option>
                        <option value="BANK">Bank</option>
                        <option value="CASH">Cash</option>
                      </select>
                      <input
                        value={payRef}
                        onChange={(e) => setPayRef(e.target.value)}
                        placeholder="Receipt / Tx Ref (optional)"
                        className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
                      />
                      <button
                        type="submit"
                        disabled={isPending}
                        className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800"
                      >
                        Save Payment
                      </button>
                    </form>
                  </div>

                  {/* Payment History */}
                  {ledger && ledger.entries.length > 0 && (
                    <div className="divide-y divide-slate-100 pt-2">
                      {ledger.entries.map((entry) => (
                        <div key={entry.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                          <div>
                            <span className="font-semibold text-slate-900">{entry.type}</span> •{' '}
                            {entry.method}{' '}
                            {entry.transactionRef && (
                              <span className="font-mono-code text-slate-500">
                                ({entry.transactionRef})
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2.5">
                            <span className="font-mono-code font-semibold tabular-nums">
                              {formatPoisha(entry.amountPoisha, entry.currency)}
                            </span>
                            <StatusBadge status={entry.verificationState} />
                            {entry.verificationState === 'PENDING' && (
                              <button
                                type="button"
                                disabled={isPending}
                                onClick={() => handleVerifyPayment(entry.id)}
                                className="rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-emerald-700"
                              >
                                Verify
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

            <div className="atelier-card p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="text-base font-bold tracking-tight text-slate-900">
                  Files &amp; Items to Deliver
                </h4>
                    <form onSubmit={handleAddDeliverable} className="flex gap-2">
                      <input
                        value={delivLabel}
                        onChange={(e) => setDelivLabel(e.target.value)}
                        placeholder="e.g. Photo Gallery, Highlight Film"
                        className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs"
                      />
                      <button
                        type="submit"
                        disabled={isPending}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        + Add
                      </button>
                    </form>
                  </div>

                  {!selectedBooking.deliverables || selectedBooking.deliverables.length === 0 ? (
                    <p className="text-xs text-slate-500">
                      No deliverables added yet. Add items like Photo Gallery or Video to track
                      delivery status.
                    </p>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {selectedBooking.deliverables.map((d) => (
                        <div key={d.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                          <div>
                            <p className="font-semibold text-sm text-slate-900">{d.label}</p>
                            {d.deliveredAt && (
                              <p className="text-slate-500">
                                Delivered {formatLocalDate(d.deliveredAt)}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <StatusBadge status={d.reviewStatus} />
                            {d.reviewStatus !== 'DELIVERED' && (
                              <button
                                type="button"
                                disabled={isPending}
                                onClick={() => handleDeliverItem(d)}
                                className="rounded-lg bg-slate-900 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-slate-800"
                              >
                                Mark Delivered
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
