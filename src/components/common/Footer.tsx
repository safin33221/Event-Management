import React from 'react';
import Link from 'next/link';
import { PublicBranding } from '@/types/event-management';

export function Footer({ branding }: { branding?: PublicBranding | null }) {
  const displayName = branding?.displayName || 'Softilo Event Management';
  const contact = branding?.contactDetails;

  return (
    <footer className="mt-auto border-t border-[#E6DFD5] bg-[#F3EFE9]/70">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <p className="font-display text-2xl font-semibold text-[#141312]">{displayName}</p>
            <p className="mt-2 text-sm text-[#6B655D] max-w-xs leading-relaxed">
              Precision event planning, transparent quotes, synchronized crew calendars, and
              milestone-tracked delivery.
            </p>
          </div>

          <div className="text-sm text-[#4A453F] space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#6B655D]">
              Studio Contact
            </p>
            {contact?.phone ? <p>Phone: {contact.phone}</p> : <p>Direct concierge available</p>}
            {contact?.email && <p>Email: {contact.email}</p>}
            {contact?.address && <p>{contact.address}</p>}
          </div>

          <div className="text-sm text-[#4A453F] md:text-right space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#6B655D]">
              Operations
            </p>
            <p>
              Timezone:{' '}
              <span className="font-mono-code text-xs">
                {branding?.timezone || 'Asia/Dhaka'}
              </span>
            </p>
            <p>
              Currency:{' '}
              <span className="font-mono-code text-xs">{branding?.currency || 'BDT'}</span>
            </p>
            <div className="pt-2">
              <Link href="/login" className="text-xs font-semibold underline underline-offset-4">
                Team Sign In
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-[#E6DFD5] pt-6 text-xs text-[#6B655D]">
          <span>© {new Date().getFullYear()} {displayName}. All rights reserved.</span>
          <span>Powered by Softilo Event Platform</span>
        </div>
      </div>
    </footer>
  );
}
