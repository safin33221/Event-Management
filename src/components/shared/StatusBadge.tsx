import React from 'react';
import { cn } from '@/lib/utils';

const STATUS_STYLES: Record<string, { pill: string; dot: string }> = {
  NEW: { pill: 'bg-sky-50/80 text-sky-700 ring-sky-600/20', dot: 'bg-sky-500' },
  QUALIFIED: { pill: 'bg-indigo-50/80 text-indigo-700 ring-indigo-600/20', dot: 'bg-indigo-500' },
  QUOTED: { pill: 'bg-amber-50/80 text-amber-700 ring-amber-600/20', dot: 'bg-amber-500' },
  CONVERTED: { pill: 'bg-emerald-50/80 text-emerald-700 ring-emerald-600/20', dot: 'bg-emerald-500' },
  DRAFT: { pill: 'bg-slate-100/80 text-slate-600 ring-slate-500/20', dot: 'bg-slate-400' },
  SENT: { pill: 'bg-sky-50/80 text-sky-700 ring-sky-600/20', dot: 'bg-sky-500' },
  ACCEPTED: { pill: 'bg-emerald-50/80 text-emerald-700 ring-emerald-600/20', dot: 'bg-emerald-500' },
  SUPERSEDED: { pill: 'bg-slate-100/80 text-slate-500 ring-slate-400/20', dot: 'bg-slate-400' },
  PENDING_CONFIRMATION: { pill: 'bg-amber-50/80 text-amber-700 ring-amber-600/20', dot: 'bg-amber-500' },
  CONFIRMED: { pill: 'bg-emerald-50/80 text-emerald-700 ring-emerald-600/20', dot: 'bg-emerald-500' },
  COMPLETED: { pill: 'bg-emerald-50/80 text-emerald-700 ring-emerald-600/20', dot: 'bg-emerald-500' },
  CANCELLED: { pill: 'bg-rose-50/80 text-rose-700 ring-rose-600/20', dot: 'bg-rose-500' },
  PENDING: { pill: 'bg-amber-50/80 text-amber-700 ring-amber-600/20', dot: 'bg-amber-500' },
  VERIFIED: { pill: 'bg-emerald-50/80 text-emerald-700 ring-emerald-600/20', dot: 'bg-emerald-500' },
  REJECTED: { pill: 'bg-rose-50/80 text-rose-700 ring-rose-600/20', dot: 'bg-rose-500' },
  SCHEDULED: { pill: 'bg-amber-50/80 text-amber-700 ring-amber-600/20', dot: 'bg-amber-500' },
  IN_PROGRESS: { pill: 'bg-indigo-50/80 text-indigo-700 ring-indigo-600/20', dot: 'bg-indigo-500' },
  IN_REVIEW: { pill: 'bg-violet-50/80 text-violet-700 ring-violet-600/20', dot: 'bg-violet-500' },
  CHANGES_REQUESTED: { pill: 'bg-orange-50/80 text-orange-700 ring-orange-600/20', dot: 'bg-orange-500' },
  APPROVED: { pill: 'bg-emerald-50/80 text-emerald-700 ring-emerald-600/20', dot: 'bg-emerald-500' },
  DELIVERED: { pill: 'bg-emerald-50/80 text-emerald-700 ring-emerald-600/20', dot: 'bg-emerald-500' },
  ASSIGNED: { pill: 'bg-amber-50/80 text-amber-700 ring-amber-600/20', dot: 'bg-amber-500' },
};

const DEFAULT_STYLE = {
  pill: 'bg-slate-100/80 text-slate-600 ring-slate-500/20',
  dot: 'bg-slate-400',
};

export function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status] ?? DEFAULT_STYLE;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium tracking-tight ring-1 ring-inset capitalize',
        style.pill,
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', style.dot)} />
      {status.replace(/_/g, ' ').toLowerCase()}
    </span>
  );
}
