import React from 'react';
import { cn } from '@/lib/utils';

const STATUS_STYLES: Record<string, string> = {
  NEW: 'bg-sky-50 text-sky-800 border-sky-200',
  QUALIFIED: 'bg-indigo-50 text-indigo-800 border-indigo-200',
  QUOTED: 'bg-amber-50 text-amber-800 border-amber-200',
  CONVERTED: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  DRAFT: 'bg-stone-100 text-stone-700 border-stone-200',
  SENT: 'bg-sky-50 text-sky-800 border-sky-200',
  ACCEPTED: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  SUPERSEDED: 'bg-stone-100 text-stone-500 border-stone-200',
  PENDING_CONFIRMATION: 'bg-amber-50 text-amber-800 border-amber-200',
  CONFIRMED: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  COMPLETED: 'bg-teal-50 text-teal-800 border-teal-200',
  CANCELLED: 'bg-rose-50 text-rose-800 border-rose-200',
  PENDING: 'bg-amber-50 text-amber-800 border-amber-200',
  VERIFIED: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  REJECTED: 'bg-rose-50 text-rose-800 border-rose-200',
  SCHEDULED: 'bg-sky-50 text-sky-800 border-sky-200',
  IN_PROGRESS: 'bg-indigo-50 text-indigo-800 border-indigo-200',
  IN_REVIEW: 'bg-purple-50 text-purple-800 border-purple-200',
  CHANGES_REQUESTED: 'bg-orange-50 text-orange-800 border-orange-200',
  APPROVED: 'bg-teal-50 text-teal-800 border-teal-200',
  DELIVERED: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  ASSIGNED: 'bg-amber-50 text-amber-800 border-amber-200',
};

export function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status] ?? 'bg-stone-100 text-stone-700 border-stone-200';
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide uppercase border',
        style,
      )}
    >
      {status.replace(/_/g, ' ')}
    </span>
  );
}
