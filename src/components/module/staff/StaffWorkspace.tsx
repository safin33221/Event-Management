'use client';

import React, { useState, useTransition } from 'react';
import { Assignment, AssignmentStatus } from '@/types/event-management';
import { updateAssignment } from '@/service/operations/operations.service';
import { formatDateTimeInTz, formatLocalDate } from '@/lib/utils';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { CalendarIcon, UsersIcon } from '@/components/shared/Icons';

export function StaffWorkspace({
  initialAssignments,
  timezone = 'Asia/Dhaka',
}: {
  initialAssignments: Assignment[];
  timezone?: string;
}) {
  const [assignments, setAssignments] = useState<Assignment[]>(initialAssignments);
  const [isPending, startTransition] = useTransition();

  const handleStatusChange = (id: string, status: AssignmentStatus) => {
    startTransition(async () => {
      const res = await updateAssignment(id, { status });
      if (res.ok && res.data) {
        setAssignments(assignments.map((a) => (a.id === id ? { ...a, status: res.data!.status } : a)));
      }
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
          Team Portal
        </p>
        <h1 className="text-2xl sm:text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 mt-1">
          My Tasks
        </h1>
      </div>

      {assignments.length === 0 ? (
        <div className="atelier-card p-10 text-center space-y-2">
          <UsersIcon className="w-7 h-7 mx-auto text-slate-400" />
          <p className="text-sm font-semibold text-slate-900">No tasks right now</p>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            When a manager assigns you to an event, you will see the client details and time
            here.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {assignments.map((a) => (
            <div key={a.id} className="atelier-card p-5 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-mono-code text-xs text-slate-500">
                    {a.booking?.reference || 'BOOKING'}
                  </span>
                  <h2 className="text-lg font-semibold tracking-tight text-slate-900">
                    {a.booking?.eventTitle || a.roleLabel}
                  </h2>
                </div>
                <StatusBadge status={a.status} />
              </div>

              <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
                Role: {a.roleLabel}
              </p>

              {a.booking && (
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-xs space-y-1 text-slate-700">
                  <p>
                    <span className="text-slate-500">Client:</span>{' '}
                    <span className="font-semibold text-slate-900">{a.booking.clientName}</span> (
                    {a.booking.clientPhone})
                  </p>
                  <p>
                    <span className="text-slate-500">Event Date:</span>{' '}
                    {formatLocalDate(a.booking.eventDate)}
                  </p>
                </div>
              )}

              {a.session && (
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <CalendarIcon className="w-4 h-4 text-slate-400" />
                  <span>
                    {a.session.title}: {formatDateTimeInTz(a.session.startAt, timezone)}
                    {a.session.location ? ` • ${a.session.location}` : ''}
                  </span>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                {a.status === 'ASSIGNED' && (
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => handleStatusChange(a.id, 'ACCEPTED')}
                    className="rounded-xl bg-indigo-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors disabled:opacity-60"
                  >
                    Accept Assignment
                  </button>
                )}
                {a.status === 'ACCEPTED' && (
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => handleStatusChange(a.id, 'COMPLETED')}
                    className="rounded-xl bg-emerald-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors disabled:opacity-60"
                  >
                    Mark Complete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
