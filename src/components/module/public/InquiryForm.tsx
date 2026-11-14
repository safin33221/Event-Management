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

  const accent = branding.themeTokens.accentColor || '#B45309';

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

  if (confirmation) {
    return (
      <div className="atelier-card p-8 text-center space-y-4">
        <div
          className="mx-auto flex h-12 w-12 items-center justify-center rounded-full text-white"
          style={{ backgroundColor: accent }}
        >
          <CheckCircleIcon className="w-6 h-6" />
        </div>
        <h3 className="font-display text-3xl font-semibold text-[#141312]">
          Inquiry Received
        </h3>
        <p className="text-sm text-[#6B655D] max-w-md mx-auto">
          Thank you. Your inquiry has been logged with {branding.displayName}. Our coordinator will
          prepare your tailored quote shortly.
        </p>
        <div className="inline-flex items-center gap-2 rounded-full border border-[#D8CFC2] bg-[#FAF8F5] px-4 py-2">
          <span className="text-xs text-[#6B655D]">Reference:</span>
          <span className="font-mono-code text-sm font-semibold text-[#141312]">
            {confirmation.reference}
          </span>
        </div>
        <p className="text-xs text-[#6B655D]">
          Note: Submitting an inquiry requests availability review; dates are reserved upon quote
          acceptance and booking confirmation.
        </p>
        <div>
          <button
            type="button"
            onClick={() => setConfirmation(null)}
            className="mt-2 text-xs font-semibold underline underline-offset-4 text-[#141312]"
          >
            Submit another inquiry
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="atelier-card p-6 sm:p-8 space-y-5">
      <div className="flex items-start justify-between gap-4 border-b border-[#E6DFD5] pb-4">
        <div>
          <h3 className="font-display text-2xl sm:text-3xl font-semibold text-[#141312]">
            Request a Custom Quote
          </h3>
          <p className="text-sm text-[#6B655D] mt-1">
            Tell us about your event date, format, and preferred collection.
          </p>
        </div>
        <CalendarIcon className="w-5 h-5 text-[#6B655D] shrink-0 mt-1" />
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#4A453F] mb-1.5">
            Event Title *
          </label>
          <input
            type="text"
            required
            value={eventTitle}
            onChange={(e) => setEventTitle(e.target.value)}
            placeholder="e.g. Autumn Reception or Annual Leadership Summit"
            className="w-full rounded-xl border border-[#D8CFC2] bg-[#FAF8F5] px-3.5 py-2.5 text-sm outline-none focus:border-[#141312] focus:bg-white transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#4A453F] mb-1.5">
            Preferred Date
          </label>
          <input
            type="date"
            value={requestedDate}
            onChange={(e) => setRequestedDate(e.target.value)}
            className="w-full rounded-xl border border-[#D8CFC2] bg-[#FAF8F5] px-3.5 py-2.5 text-sm outline-none focus:border-[#141312] focus:bg-white transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#4A453F] mb-1.5">
            Collection / Package
          </label>
          <select
            value={packageId}
            onChange={(e) => setPackageId(e.target.value)}
            className="w-full rounded-xl border border-[#D8CFC2] bg-[#FAF8F5] px-3.5 py-2.5 text-sm outline-none focus:border-[#141312] focus:bg-white transition-colors"
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
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#4A453F] mb-1.5">
            Your Name *
          </label>
          <input
            type="text"
            required
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            placeholder="Full name or organization contact"
            className="w-full rounded-xl border border-[#D8CFC2] bg-[#FAF8F5] px-3.5 py-2.5 text-sm outline-none focus:border-[#141312] focus:bg-white transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#4A453F] mb-1.5">
            Phone Number *
          </label>
          <input
            type="tel"
            required
            value={clientPhone}
            onChange={(e) => setClientPhone(e.target.value)}
            placeholder="+880 17XX-XXXXXX"
            className="w-full rounded-xl border border-[#D8CFC2] bg-[#FAF8F5] px-3.5 py-2.5 text-sm outline-none focus:border-[#141312] focus:bg-white transition-colors"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#4A453F] mb-1.5">
            Email Address
          </label>
          <input
            type="email"
            value={clientEmail}
            onChange={(e) => setClientEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-xl border border-[#D8CFC2] bg-[#FAF8F5] px-3.5 py-2.5 text-sm outline-none focus:border-[#141312] focus:bg-white transition-colors"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#4A453F] mb-1.5">
            Venue, Schedule & Notes
          </label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Share venue details, estimated guest count, or multi-day schedule needs..."
            className="w-full rounded-xl border border-[#D8CFC2] bg-[#FAF8F5] px-3.5 py-2.5 text-sm outline-none focus:border-[#141312] focus:bg-white transition-colors"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-60"
        style={{ backgroundColor: accent }}
      >
        <span>{isPending ? 'Submitting Inquiry...' : 'Request Quote & Availability'}</span>
        <ArrowRightIcon className="w-4 h-4" />
      </button>
    </form>
  );
}
