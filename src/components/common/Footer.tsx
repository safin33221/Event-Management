import React from 'react';
import Link from 'next/link';
import { PublicBranding } from '@/types/event-management';

export function Footer({ branding }: { branding?: PublicBranding | null }) {
  const displayName = branding?.displayName || 'Softilo Event Management';
  const contact = branding?.contactDetails;

  return (
    <footer className="mt-auto border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <p className="text-lg font-bold tracking-tight text-slate-900">{displayName}</p>
            <p className="mt-2 text-sm text-slate-600 max-w-xs leading-relaxed">
              Precision event planning, transparent quotes, synchronized crew calendars, and
              milestone-tracked delivery.
            </p>
          </div>

          <div className="text-sm text-slate-600 space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Studio Contact
            </p>
            {contact?.phone ? <p>Phone: {contact.phone}</p> : <p>Direct concierge available</p>}
            {contact?.email && <p>Email: {contact.email}</p>}
            {contact?.address && <p>{contact.address}</p>}
          </div>

          <div className="text-sm text-slate-600 md:text-right space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Operations
            </p>
            <p>
              Timezone:{' '}
              <span className="font-mono-code text-xs text-slate-800">
                {branding?.timezone || 'Asia/Dhaka'}
              </span>
            </p>
            <p>
              Currency:{' '}
              <span className="font-mono-code text-xs text-slate-800">
                {branding?.currency || 'BDT'}
              </span>
            </p>
            <div className="pt-2">
              <Link
                href="/login"
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 underline underline-offset-4"
              >
                Team Sign In
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-slate-100 pt-6 text-xs text-slate-500">
          <span>© {new Date().getFullYear()} {displayName}. All rights reserved.</span>
          <span>Powered by Softilo Event Platform</span>
        </div>
      </div>
    </footer>
  );
}
