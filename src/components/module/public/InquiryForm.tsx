'use client';

import React, { useState, useTransition } from 'react';
import { EventType, PublicBranding, StudioPackage } from '@/types/event-management';
import { submitPublicInquiry } from '@/service/inquiries/inquiries.service';
import { formatPoisha } from '@/lib/utils';
import { ArrowRightIcon, CalendarIcon, CheckCircleIcon } from '@/components/shared/Icons';

interface InquiryFormProps {
  branding: PublicBranding;
  eventTypes: EventType[];
  packages: StudioPackage[];
  selectedPackageId?: string;
  onPackageChange?: (id: string) => void;
}

export function InquiryForm({
  branding,
  eventTypes,
  packages,
  selectedPackageId,
  onPackageChange,
}: InquiryFormProps) {
  const [isPending, startTransition] = useTransition();
  const [localPackageId, setLocalPackageId] = useState(selectedPackageId || '');
  const [eventTypeId, setEventTypeId] = useState('');
  const packageId = selectedPackageId !== undefined ? selectedPackageId : localPackageId;
  const setPackageId = (val: string) => {
    setLocalPackageId(val);
    onPackageChange?.(val);
    const matchedPkg = packages.find((p) => p.id === val);
    if (matchedPkg?.eventTypeId) {
      setEventTypeId(matchedPkg.eventTypeId);
    }
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

  const accent = branding.themeTokens.accentColor || '#B91C47';
  const selectedPkg = packages.find((p) => p.id === packageId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedTitle = eventTitle.trim();
    const trimmedName = clientName.trim();
    const trimmedPhone = clientPhone.trim();
    if (!trimmedTitle || !trimmedName || !trimmedPhone) {
      setError('Please enter event title, your name, and phone number.');
      return;
    }

    startTransition(async () => {
      const resolvedEventTypeId = eventTypeId || selectedPkg?.eventTypeId || undefined;
      const res = await submitPublicInquiry({
        eventTypeId: resolvedEventTypeId,
        packageId: packageId || undefined,
        eventTitle: trimmedTitle,
        requestedDate: requestedDate || undefined,
        clientName: trimmedName,
        clientPhone: trimmedPhone,
        clientEmail: clientEmail.trim() || undefined,
        notes: notes.trim() || undefined,
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
      <div className="atelier-card p-8 sm:p-10 text-center space-y-4 bg-white">
        <div
          className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-sm"
          style={{ backgroundColor: accent }}
        >
          <CheckCircleIcon className="w-6 h-6" />
        </div>
        <h3 className="font-editorial text-3xl font-semibold text-[#181216]">
          Request Received
        </h3>
        <p className="text-sm text-[#54474E] max-w-md mx-auto leading-relaxed">
          Thank you. {branding.displayName} has logged your celebration inquiry and will send an
          itemized quote shortly.
        </p>
        <div className="inline-flex items-center gap-2 rounded-xl border border-[#E5DCCD] bg-[#FAF6EE] px-4 py-2">
          <span className="text-xs text-[#7D6860]">Reference:</span>
          <span className="font-mono-code text-sm font-semibold text-[#181216]">
            {confirmation.reference}
          </span>
          <button
            type="button"
            onClick={() => handleCopyRef(confirmation.reference)}
            className="ml-1 rounded-md bg-white px-2.5 py-0.5 text-xs font-semibold border border-[#DFD5C7] hover:bg-[#FEF7EC] transition-colors cursor-pointer"
            style={{ color: accent }}
          >
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
        <p className="text-xs text-[#7D6860] max-w-md mx-auto">
          Submitting an inquiry requests availability review; dates are locked once you accept your
          quote and confirm the booking deposit.
        </p>
        <div>
          <button
            type="button"
            onClick={() => setConfirmation(null)}
            className="mt-2 text-sm font-semibold underline underline-offset-4 cursor-pointer"
            style={{ color: accent }}
          >
            Submit another inquiry
          </button>
        </div>
      </div>
    );
  }

  const inputClass =
    'w-full rounded-xl border border-[#DFD5C7] bg-[#FDFBF7] px-3.5 py-2.5 text-sm text-[#181216] placeholder:text-[#9A8A80] outline-none focus:border-[#B91C47] focus:bg-white focus:ring-2 focus:ring-[#B91C47]/15 transition-all';

  return (
    <form onSubmit={handleSubmit} className="atelier-card p-6 sm:p-8 space-y-5 bg-white">
      <div className="flex items-start justify-between gap-4 border-b border-[#EFE8DC] pb-4">
        <div>
          <h3 className="font-editorial text-2xl sm:text-3xl font-semibold text-[#181216]">
            Ask for a Quote
          </h3>
          <p className="text-sm text-[#54474E] mt-1">
            Tell us your event date, venue, and the collection you have in mind.
          </p>
        </div>
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F7F3EB] text-[#8E5B17] border border-[#EAE2D6] shrink-0">
          <CalendarIcon className="w-4 h-4" />
        </span>
      </div>

      {selectedPkg && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-[#F3DEC0] bg-[#FEF7EC] px-4 py-2.5 text-sm">
          <div className="flex items-center gap-2 text-[#181216]">
            <span className="font-semibold">Selected Package:</span>
            <span>{selectedPkg.name}</span>
            <span className="font-mono-code font-semibold text-[#B91C47]">
              ({formatPoisha(selectedPkg.basePricePoisha, branding.currency)})
            </span>
          </div>
          <button
            type="button"
            onClick={() => setPackageId('')}
            className="font-semibold text-[#8E5B17] hover:text-[#181216] cursor-pointer"
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
            Event Category
          </label>
          <select
            value={eventTypeId || selectedPkg?.eventTypeId || ''}
            onChange={(e) => setEventTypeId(e.target.value)}
            className={inputClass}
          >
            <option value="">Select event type</option>
            {eventTypes.map((et) => (
              <option key={et.id} value={et.id}>
                {et.name}
              </option>
            ))}
          </select>
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

        <div className="sm:col-span-2">
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
        <span>{isPending ? 'Sending...' : 'Send Request'}</span>
        <ArrowRightIcon className="w-4 h-4" />
      </button>
    </form>
  );
}
