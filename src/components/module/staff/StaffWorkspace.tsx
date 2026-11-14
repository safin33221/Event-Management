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
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6B655D]">
          Crew & Editor Portal
        </p>
        <h1 className="font-display text-3xl sm:text-4xl font-semibold text-[#141312] mt-1">
          My Assigned Work
        </h1>
      </div>

      {assignments.length === 0 ? (
        <div className="atelier-card p-10 text-center space-y-2">
          <UsersIcon className="w-7 h-7 mx-auto text-[#6B655D]" />
          <p className="text-sm font-semibold">No active assignments</p>
          <p className="text-xs text-[#6B655D]">
            When a coordinator assigns you to a booking or session, it will appear here with client
            contact details and schedule times.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {assignments.map((a) => (
            <div key={a.id} className="atelier-card p-5 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-mono-code text-xs text-[#6B655D]">
                    {a.booking?.reference || 'BOOKING'}
                  </span>
                  <h2 className="font-display text-2xl font-semibold">
                    {a.booking?.eventTitle || a.roleLabel}
                  </h2>
                </div>
                <StatusBadge status={a.status} />
              </div>

              <p className="text-xs font-semibold uppercase tracking-wider text-[#B45309]">
                Role: {a.roleLabel}
              </p>

              {a.booking && (
                <div className="rounded-xl bg-[#FAF8F5] border border-[#E6DFD5] p-3 text-xs space-y-1">
                  <p>
                    <span className="text-[#6B655D]">Client:</span>{' '}
                    <span className="font-semibold">{a.booking.clientName}</span> (
                    {a.booking.clientPhone})
                  </p>
                  <p>
                    <span className="text-[#6B655D]">Event Date:</span>{' '}
                    {formatLocalDate(a.booking.eventDate)}
                  </p>
                </div>
              )}

              {a.session && (
                <div className="flex items-center gap-2 text-xs text-[#4A453F]">
                  <CalendarIcon className="w-4 h-4 text-[#6B655D]" />
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
                    className="rounded-xl bg-[#141312] px-3.5 py-2 text-xs font-semibold text-white"
                  >
                    Accept Assignment
                  </button>
                )}
                {a.status === 'ACCEPTED' && (
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => handleStatusChange(a.id, 'COMPLETED')}
                    className="rounded-xl bg-emerald-700 px-3.5 py-2 text-xs font-semibold text-white"
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
