'use client';

import React, { useState, useTransition } from 'react';
import { PublicBranding, StudioPackage } from '@/types/event-management';
import { submitPublicInquiry } from '@/service/inquiries/inquiries.service';
import { formatPoisha } from '@/lib/utils';
import { ArrowRightIcon, CalendarIcon, CheckCircleIcon } from '@/components/shared/Icons';

interface InquiryFormProps {
  branding: PublicBranding;
  packages: StudioPackage[];
  selectedPackageId?: string;
  onPackageChange?: (id: string) => void;
}

export function InquiryForm({
  branding,
  packages,
  selectedPackageId,
  onPackageChange,
}: InquiryFormProps) {
  const [isPending, startTransition] = useTransition();
  const [localPackageId, setLocalPackageId] = useState(selectedPackageId || '');
  const packageId = selectedPackageId !== undefined ? selectedPackageId : localPackageId;
  const setPackageId = (val: string) => {
    setLocalPackageId(val);
    onPackageChange?.(val);
  };
  const [eventTitle, setEventTitle] = useState('');
  const [requestedDate, setRequestedDate] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<{
    reference: string;
    requestedDate: string | null;
  } | null>(null);

  const [copied, setCopied] = useState(false);

  const accent = branding.themeTokens.accentColor || '#4F46E5';
  const selectedPkg = packages.find((p) => p.id === packageId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const res = await submitPublicInquiry({
        packageId: packageId || undefined,
        eventTitle,
        requestedDate: requestedDate || undefined,
        clientName,
        clientPhone,
        clientEmail: clientEmail || undefined,
        notes: notes || undefined,
      });

      if (!res.ok || !res.data) {
        setError(res.message || 'Unable to submit inquiry right now.');
        return;
      }

      setConfirmation({
        reference: res.data.reference,
        requestedDate: res.data.requestedDate,
      });
      setEventTitle('');
      setNotes('');
    });
  };

  const handleCopyRef = async (refCode: string) => {
    try {
      await navigator.clipboard.writeText(refCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable
    }
  };

  if (confirmation) {
    return (
      <div className="atelier-card p-8 sm:p-10 text-center space-y-4">
        <div
          className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-sm"
          style={{ backgroundColor: accent }}
        >
          <CheckCircleIcon className="w-6 h-6" />
        </div>
        <h3 className="text-2xl font-bold tracking-tight text-slate-900">
          Inquiry Received
        </h3>
        <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
          Thank you. Your inquiry has been logged with {branding.displayName}. Our coordinator will
          prepare your tailored quote shortly.
        </p>
        <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2">
          <span className="text-xs text-slate-500">Reference:</span>
          <span className="font-mono-code text-sm font-semibold text-slate-900">
            {confirmation.reference}
          </span>
          <button
            type="button"
            onClick={() => handleCopyRef(confirmation.reference)}
            className="ml-1 rounded-md bg-white px-2 py-0.5 text-[11px] font-semibold text-indigo-600 border border-slate-200 hover:bg-indigo-50 transition-colors"
          >
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Note: Submitting an inquiry requests availability review; dates are reserved upon quote
          acceptance and booking confirmation.
        </p>
        <div>
          <button
            type="button"
            onClick={() => setConfirmation(null)}
            className="mt-2 text-xs font-semibold text-indigo-600 hover:text-indigo-700 underline underline-offset-4"
          >
            Submit another inquiry
          </button>
        </div>
      </div>
    );
  }

  const inputClass =
    'w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/15 transition-all';

  return (
    <form onSubmit={handleSubmit} className="atelier-card p-6 sm:p-8 space-y-5">
      <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Request a Custom Quote
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            Tell us about your event date, format, and preferred collection.
          </p>
        </div>
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500 shrink-0">
          <CalendarIcon className="w-4 h-4" />
        </span>
      </div>

      {selectedPkg && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-indigo-200 bg-indigo-50/70 px-4 py-2.5 text-xs">
          <div className="flex items-center gap-2 text-indigo-950">
            <span className="font-semibold">Selected Package:</span>
            <span>{selectedPkg.name}</span>
            <span className="font-mono-code font-semibold text-indigo-700">
              ({formatPoisha(selectedPkg.basePricePoisha, branding.currency)})
            </span>
          </div>
          <button
            type="button"
            onClick={() => setPackageId('')}
            className="font-semibold text-indigo-700 hover:text-indigo-900"
          >
            Clear
          </button>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
            Event Title *
          </label>
          <input
            type="text"
            required
            value={eventTitle}
            onChange={(e) => setEventTitle(e.target.value)}
            placeholder="e.g. Autumn Reception or Annual Leadership Summit"
            className={inputClass}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
            Preferred Date
          </label>
          <input
            type="date"
            value={requestedDate}
            onChange={(e) => setRequestedDate(e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
            Collection / Package
          </label>
          <select
            value={packageId}
            onChange={(e) => setPackageId(e.target.value)}
            className={inputClass}
          >
            <option value="">Custom / Discuss with coordinator</option>
            {packages.map((pkg) => (
              <option key={pkg.id} value={pkg.id}>
                {pkg.name} ({formatPoisha(pkg.basePricePoisha, branding.currency)})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
            Your Name *
          </label>
          <input
            type="text"
            required
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            placeholder="Full name or organization contact"
            className={inputClass}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
            Phone Number *
          </label>
          <input
            type="tel"
            required
            value={clientPhone}
            onChange={(e) => setClientPhone(e.target.value)}
            placeholder="+880 17XX-XXXXXX"
            className={inputClass}
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
            Email Address
          </label>
          <input
            type="email"
            value={clientEmail}
            onChange={(e) => setClientEmail(e.target.value)}
            placeholder="you@example.com"
            className={inputClass}
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
            Venue, Schedule &amp; Notes
          </label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Share venue details, estimated guest count, or multi-day schedule needs..."
            className={inputClass}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:opacity-90 active:scale-[0.99] disabled:opacity-60"
        style={{ backgroundColor: accent }}
      >
        <span>{isPending ? 'Submitting Inquiry...' : 'Request Quote & Availability'}</span>
        <ArrowRightIcon className="w-4 h-4" />
      </button>
    </form>
  );
}
