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
          ? 'Idempotent replay returned existing payment entry'
          : 'Recorded payment as PENDING verification',
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
      notify('ok', 'Booking marked completed (outstanding dues & deliverables preserved)');
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
      notify('ok', `Delivered "${d.label}" without affecting siblings or balance`);
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#64748B]">
            Pipeline & Finance
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A] mt-1">
            Inquiries, Quotes, Bookings & Ledger
          </h1>
        </div>

        <div className="inline-flex rounded-xl border border-[#CBD5E1] bg-white p-1">
          {(['inquiries', 'quotes', 'bookings'] as const).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={cn(
                'rounded-lg px-4 py-1.5 text-xs font-semibold capitalize transition-colors',
                tab === key ? 'bg-[#0F172A] text-white' : 'text-[#475569] hover:text-[#0F172A]',
              )}
            >
              {key}
            </button>
          ))}
        </div>
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

      {tab === 'inquiries' && (
        <div className="grid gap-6 lg:grid-cols-12">
          <form onSubmit={handleCreateInquiry} className="lg:col-span-4 atelier-card p-5 space-y-3 h-fit">
            <h2 className="text-lg font-bold tracking-tight">Log Phone Inquiry</h2>
            <input
              required
              value={inqTitle}
              onChange={(e) => setInqTitle(e.target.value)}
              placeholder="Event title (e.g. Q4 Product Launch)"
              className="w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-3 py-2 text-sm"
            />
            <input
              type="date"
              value={inqDate}
              onChange={(e) => setInqDate(e.target.value)}
              className="w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-3 py-2 text-sm"
            />
            <input
              required
              value={inqClient}
              onChange={(e) => setInqClient(e.target.value)}
              placeholder="Client name"
              className="w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-3 py-2 text-sm"
            />
            <input
              required
              value={inqPhone}
              onChange={(e) => setInqPhone(e.target.value)}
              placeholder="Client phone"
              className="w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-3 py-2 text-sm"
            />
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#0F172A] px-4 py-2.5 text-xs font-semibold text-white"
            >
              <PlusIcon className="w-4 h-4" />
              <span>Record Inquiry</span>
            </button>
          </form>

          <div className="lg:col-span-8 atelier-card p-5 space-y-3">
            <h2 className="text-lg font-bold tracking-tight">All Inquiries</h2>
            {inquiries.length === 0 ? (
              <p className="text-sm text-[#64748B] py-6 text-center">No inquiries logged yet.</p>
            ) : (
              <div className="divide-y divide-[#E2E8F0]">
                {inquiries.map((inq) => (
                  <div key={inq.id} className="py-3.5 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono-code text-xs font-semibold text-[#64748B]">
                          {inq.reference}
                        </span>
                        <StatusBadge status={inq.status} />
                      </div>
                      <p className="font-semibold text-sm mt-1">{inq.eventTitle}</p>
                      <p className="text-xs text-[#64748B]">
                        {inq.clientName} ({inq.clientPhone}) • Requested: {formatLocalDate(inq.requestedDate)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => prefillQuoteFromInquiry(inq)}
                      className="rounded-xl border border-[#CBD5E1] px-3 py-1.5 text-xs font-semibold hover:bg-[#F1F5F9]"
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

      {tab === 'quotes' && (
        <div className="grid gap-6 lg:grid-cols-12">
          <form onSubmit={handleCreateQuote} className="lg:col-span-4 atelier-card p-5 space-y-3 h-fit">
            <h2 className="text-lg font-bold tracking-tight">Create Quote</h2>
            <input
              required
              value={quoteEventTitle}
              onChange={(e) => setQuoteEventTitle(e.target.value)}
              placeholder="Event title"
              className="w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-3 py-2 text-sm"
            />
            <input
              type="date"
              value={quoteDate}
              onChange={(e) => setQuoteDate(e.target.value)}
              className="w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-3 py-2 text-sm"
            />
            <input
              required
              value={quoteClientName}
              onChange={(e) => setQuoteClientName(e.target.value)}
              placeholder="Client name"
              className="w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-3 py-2 text-sm"
            />
            <input
              required
              value={quoteClientPhone}
              onChange={(e) => setQuoteClientPhone(e.target.value)}
              placeholder="Client phone"
              className="w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-3 py-2 text-sm"
            />
            <input
              required
              value={quoteItemDesc}
              onChange={(e) => setQuoteItemDesc(e.target.value)}
              placeholder="Line item description"
              className="w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-3 py-2 text-sm"
            />
            <div>
              <label className="block text-[11px] font-semibold uppercase text-[#64748B] mb-1">
                Amount ({currency})
              </label>
              <input
                required
                type="number"
                min="0"
                value={quoteAmountTk}
                onChange={(e) => setQuoteAmountTk(e.target.value)}
                className="w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-3 py-2 text-sm font-mono-code"
              />
            </div>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#0F172A] px-4 py-2.5 text-xs font-semibold text-white"
            >
              <span>Create Quote Snapshot</span>
            </button>
          </form>

          <div className="lg:col-span-8 atelier-card p-5 space-y-3">
            <h2 className="text-lg font-bold tracking-tight">Quotes</h2>
            {quotes.length === 0 ? (
              <p className="text-sm text-[#64748B] py-6 text-center">No quotes created yet.</p>
            ) : (
              <div className="divide-y divide-[#E2E8F0]">
                {quotes.map((q) => {
                  const latest = q.versions?.[0] || q.currentVersion;
                  return (
                    <div key={q.id} className="py-3.5 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono-code text-xs font-semibold text-[#64748B]">
                            {q.reference}
                          </span>
                          <StatusBadge status={q.status} />
                          {latest && (
                            <span className="text-[11px] font-mono-code text-[#64748B]">
                              v{latest.versionNumber}
                            </span>
                          )}
                        </div>
                        <p className="font-semibold text-sm mt-1">{q.eventTitle}</p>
                        <p className="text-xs text-[#64748B]">{q.clientName}</p>
                      </div>

                      <div className="flex items-center gap-3">
                        {latest && (
                          <span className="font-mono-code text-sm font-semibold">
                            {formatPoisha(latest.totalPoisha, q.currency)}
                          </span>
                        )}
                        {q.status !== 'ACCEPTED' && (
                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() => handleAcceptQuote(q)}
                            className="rounded-xl bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800"
                          >
                            Accept & Create Booking
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

      {tab === 'bookings' && (
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-5 atelier-card p-5 space-y-3 h-fit">
            <h2 className="text-lg font-bold tracking-tight">Bookings</h2>
            {bookings.length === 0 ? (
              <p className="text-sm text-[#64748B] py-6 text-center">
                Accept a quote to generate your first booking.
              </p>
            ) : (
              <div className="divide-y divide-[#E2E8F0]">
                {bookings.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => openBookingDetail(b.id)}
                    className={cn(
                      'w-full text-left py-3 px-2 rounded-lg transition-colors flex items-center justify-between gap-2',
                      selectedBooking?.id === b.id ? 'bg-[#F1F5F9]' : 'hover:bg-[#F8FAFC]',
                    )}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono-code text-xs font-semibold text-[#64748B]">
                          {b.reference}
                        </span>
                        <StatusBadge status={b.status} />
                      </div>
                      <p className="text-sm font-semibold truncate mt-1">{b.eventTitle}</p>
                      <p className="text-xs text-[#64748B]">{b.clientName}</p>
                    </div>
                    <span className="font-mono-code text-xs font-semibold shrink-0">
                      {formatPoisha(b.agreedTotalPoisha, b.currency)}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-7 space-y-6">
            {!selectedBooking ? (
              <div className="atelier-card p-10 text-center text-sm text-[#64748B]">
                Select a booking on the left to inspect its financial ledger, advance verification,
                confirmation status, and independent deliverables.
              </div>
            ) : (
              <>
                <div className="atelier-card p-6 space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#E2E8F0] pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono-code text-xs font-semibold text-[#64748B]">
                          {selectedBooking.reference}
                        </span>
                        <StatusBadge status={selectedBooking.status} />
                      </div>
                      <h3 className="text-lg font-bold tracking-tight mt-1">
                        {selectedBooking.eventTitle}
                      </h3>
                      <p className="text-xs text-[#64748B]">
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
                          className="rounded-xl bg-[#0F172A] px-4 py-2 text-xs font-semibold text-white"
                        >
                          Confirm Booking
                        </button>
                      )}
                      {selectedBooking.status === 'CONFIRMED' && (
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={handleCompleteBooking}
                          className="rounded-xl border border-[#CBD5E1] px-4 py-2 text-xs font-semibold"
                        >
                          Mark Completed
                        </button>
                      )}
                    </div>
                  </div>

                  {ledger && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="rounded-xl bg-[#F8FAFC] p-3 border border-[#E2E8F0]">
                        <p className="text-[10px] font-semibold uppercase text-[#64748B]">Agreed</p>
                        <p className="font-mono-code text-sm font-semibold mt-1">
                          {formatPoisha(ledger.summary.effectiveAgreedChargePoisha, ledger.summary.currency)}
                        </p>
                      </div>
                      <div className="rounded-xl bg-emerald-50/70 p-3 border border-emerald-200">
                        <p className="text-[10px] font-semibold uppercase text-emerald-800">Verified Paid</p>
                        <p className="font-mono-code text-sm font-semibold text-emerald-900 mt-1">
                          {formatPoisha(ledger.summary.verifiedReceiptsPoisha, ledger.summary.currency)}
                        </p>
                      </div>
                      <div className="rounded-xl bg-amber-50/70 p-3 border border-amber-200">
                        <p className="text-[10px] font-semibold uppercase text-amber-800">Pending</p>
                        <p className="font-mono-code text-sm font-semibold text-amber-900 mt-1">
                          {formatPoisha(ledger.summary.pendingReceiptsPoisha, ledger.summary.currency)}
                        </p>
                      </div>
                      <div className="rounded-xl bg-[#F8FAFC] p-3 border border-[#E2E8F0]">
                        <p className="text-[10px] font-semibold uppercase text-[#64748B]">Due</p>
                        <p className="font-mono-code text-sm font-semibold mt-1">
                          {formatPoisha(ledger.summary.outstandingDuePoisha, ledger.summary.currency)}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Record Payment */}
                  <form onSubmit={handleRecordPayment} className="grid sm:grid-cols-4 gap-2.5 pt-2">
                    <input
                      type="number"
                      min="1"
                      required
                      value={payAmountTk}
                      onChange={(e) => setPayAmountTk(e.target.value)}
                      placeholder={`Amount (${currency})`}
                      className="rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-3 py-2 text-xs font-mono-code"
                    />
                    <select
                      value={payMethod}
                      onChange={(e) => setPayMethod(e.target.value as PaymentMethod)}
                      className="rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-3 py-2 text-xs"
                    >
                      <option value="BKASH">bKash</option>
                      <option value="NAGAD">Nagad</option>
                      <option value="BANK">Bank</option>
                      <option value="CASH">Cash</option>
                    </select>
                    <input
                      value={payRef}
                      onChange={(e) => setPayRef(e.target.value)}
                      placeholder="Tx Ref (e.g. TRX99)"
                      className="rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-3 py-2 text-xs"
                    />
                    <button
                      type="submit"
                      disabled={isPending}
                      className="rounded-xl bg-[#0F172A] px-3 py-2 text-xs font-semibold text-white"
                    >
                      Record Payment
                    </button>
                  </form>

                  {/* Ledger Entries */}
                  {ledger && ledger.entries.length > 0 && (
                    <div className="divide-y divide-[#E2E8F0] pt-2">
                      {ledger.entries.map((entry) => (
                        <div key={entry.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                          <div>
                            <span className="font-semibold">{entry.type}</span> • {entry.method}{' '}
                            {entry.transactionRef && (
                              <span className="font-mono-code text-[#64748B]">
                                ({entry.transactionRef})
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2.5">
                            <span className="font-mono-code font-semibold">
                              {formatPoisha(entry.amountPoisha, entry.currency)}
                            </span>
                            <StatusBadge status={entry.verificationState} />
                            {entry.verificationState === 'PENDING' && (
                              <button
                                type="button"
                                disabled={isPending}
                                onClick={() => handleVerifyPayment(entry.id)}
                                className="rounded-lg bg-emerald-700 px-2.5 py-1 text-[11px] font-semibold text-white"
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

                {/* Deliverables Track */}
                <div className="atelier-card p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-base font-bold tracking-tight">Deliverables</h4>
                    <form onSubmit={handleAddDeliverable} className="flex gap-2">
                      <input
                        value={delivLabel}
                        onChange={(e) => setDelivLabel(e.target.value)}
                        placeholder="e.g. Gallery, Film, Event Report"
                        className="rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-3 py-1.5 text-xs"
                      />
                      <button
                        type="submit"
                        disabled={isPending}
                        className="rounded-xl border border-[#CBD5E1] px-3 py-1.5 text-xs font-semibold hover:bg-[#F1F5F9]"
                      >
                        + Add
                      </button>
                    </form>
                  </div>

                  {!selectedBooking.deliverables || selectedBooking.deliverables.length === 0 ? (
                    <p className="text-xs text-[#64748B]">
                      No deliverables added yet. Each deliverable tracks its own status and delivery
                      independently.
                    </p>
                  ) : (
                    <div className="divide-y divide-[#E2E8F0]">
                      {selectedBooking.deliverables.map((d) => (
                        <div key={d.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                          <div>
                            <p className="font-semibold text-sm">{d.label}</p>
                            {d.deliveredAt && (
                              <p className="text-[#64748B]">
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
                                className="rounded-lg bg-[#0F172A] px-2.5 py-1 text-[11px] font-semibold text-white"
                              >
                                Deliver
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
