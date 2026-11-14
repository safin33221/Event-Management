'use client';

import React, { useState, useTransition } from 'react';
import {
  Booking,
  EventSession,
  Resource,
  ResourceType,
} from '@/types/event-management';
import {
  completeSession,
  createResource,
  createSession,
  getCalendar,
} from '@/service/schedule/schedule.service';
import { cn, formatDateTimeInTz } from '@/lib/utils';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { CalendarIcon, PlusIcon } from '@/components/shared/Icons';

interface CalendarWorkspaceProps {
  timezone: string;
  initialFrom: string;
  initialTo: string;
  initialSessions: EventSession[];
  initialResources: Resource[];
  bookings: Booking[];
}

export function CalendarWorkspace({
  timezone,
  initialFrom,
  initialTo,
  initialSessions,
  initialResources,
  bookings,
}: CalendarWorkspaceProps) {
  const [from, setFrom] = useState(initialFrom);
  const [to, setTo] = useState(initialTo);
  const [sessions, setSessions] = useState<EventSession[]>(initialSessions);
  const [resources, setResources] = useState<Resource[]>(initialResources);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  // Add resource state
  const [resName, setResName] = useState('');
  const [resType, setResType] = useState<ResourceType>('CREW');

  // Schedule session state
  const [bookingId, setBookingId] = useState(bookings[0]?.id || '');
  const [sessionTitle, setSessionTitle] = useState('');
  const [startLocal, setStartLocal] = useState('');
  const [endLocal, setEndLocal] = useState('');
  const [location, setLocation] = useState('');
  const [selectedResourceIds, setSelectedResourceIds] = useState<string[]>([]);

  const refreshCalendar = (nextFrom = from, nextTo = to) => {
    startTransition(async () => {
      const res = await getCalendar(nextFrom, nextTo);
      if (res.ok && res.data) {
        setSessions(res.data.sessions);
      }
    });
  };

  const handleAddResource = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await createResource({ name: resName, type: resType });
      if (!res.ok || !res.data) {
        setFeedback({ type: 'err', text: res.message || 'Failed to add resource' });
        return;
      }
      setResources([...resources, res.data]);
      setResName('');
      setFeedback({ type: 'ok', text: `Added ${res.data.type}: ${res.data.name}` });
    });
  };

  const toggleResource = (id: string) => {
    setSelectedResourceIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleCreateSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingId || !startLocal || !endLocal) {
      setFeedback({ type: 'err', text: 'Select a booking and valid start/end timestamps' });
      return;
    }
    startTransition(async () => {
      const res = await createSession(bookingId, {
        title: sessionTitle,
        startAt: new Date(startLocal).toISOString(),
        endAt: new Date(endLocal).toISOString(),
        location: location || undefined,
        resourceIds: selectedResourceIds,
      });
      if (!res.ok) {
        setFeedback({
          type: 'err',
          text: res.message || 'Resource conflict or invalid schedule slot',
        });
        return;
      }
      setSessionTitle('');
      setLocation('');
      setSelectedResourceIds([]);
      setFeedback({ type: 'ok', text: 'Session scheduled with atomic resource reservation' });
      refreshCalendar();
    });
  };

  const handleCompleteSession = (id: string) => {
    startTransition(async () => {
      const res = await completeSession(id);
      if (!res.ok) {
        setFeedback({ type: 'err', text: res.message || 'Failed to complete session' });
        return;
      }
      setFeedback({
        type: 'ok',
        text: 'Session completed (booking balance & deliverables preserved)',
      });
      refreshCalendar();
    });
  };

  // Group sessions by agencyLocalDate
  const grouped = sessions.reduce<Record<string, EventSession[]>>((acc, s) => {
    const key = s.agencyLocalDate || s.startAt.slice(0, 10);
    if (!acc[key]) acc[key] = [];
    acc[key].push(s);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#64748B]">
            Studio Calendar • {timezone}
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A] mt-1">
            Shoot & Event Schedule
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="rounded-xl border border-[#CBD5E1] bg-white px-3 py-2 text-xs"
          />
          <span className="text-xs text-[#64748B]">to</span>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="rounded-xl border border-[#CBD5E1] bg-white px-3 py-2 text-xs"
          />
          <button
            type="button"
            disabled={isPending}
            onClick={() => refreshCalendar(from, to)}
            className="rounded-xl bg-[#0F172A] px-4 py-2 text-xs font-semibold text-white"
          >
            Filter
          </button>
        </div>
      </div>

      {feedback && (
        <div
          className={cn(
            'rounded-xl border px-4 py-3 text-sm',
            feedback.type === 'ok'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
              : 'border-rose-200 bg-rose-50 text-rose-900',
          )}
        >
          {feedback.text}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left: Schedule Session & Resources */}
        <div className="lg:col-span-5 space-y-6">
          <form onSubmit={handleCreateSession} className="atelier-card p-5 space-y-3">
            <h2 className="text-lg font-bold tracking-tight">Schedule Session</h2>
            <p className="text-xs text-[#64748B]">
              Half-open slots <span className="font-mono-code">[start, end)</span> allow adjacent
              bookings while blocking overlaps atomically.
            </p>
            <select
              required
              value={bookingId}
              onChange={(e) => setBookingId(e.target.value)}
              className="w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-3 py-2 text-sm"
            >
              <option value="">Select a booking...</option>
              {bookings.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.reference} — {b.eventTitle}
                </option>
              ))}
            </select>
            <input
              required
              value={sessionTitle}
              onChange={(e) => setSessionTitle(e.target.value)}
              placeholder="Session title (e.g. Holud Coverage / Keynote)"
              className="w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-3 py-2 text-sm"
            />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-semibold uppercase text-[#64748B] mb-1">
                  Start
                </label>
                <input
                  type="datetime-local"
                  required
                  value={startLocal}
                  onChange={(e) => setStartLocal(e.target.value)}
                  className="w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-2.5 py-2 text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold uppercase text-[#64748B] mb-1">
                  End
                </label>
                <input
                  type="datetime-local"
                  required
                  value={endLocal}
                  onChange={(e) => setEndLocal(e.target.value)}
                  className="w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-2.5 py-2 text-xs"
                />
              </div>
            </div>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Venue / Location (optional)"
              className="w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-3 py-2 text-sm"
            />

            {resources.length > 0 && (
              <div>
                <p className="text-[11px] font-semibold uppercase text-[#64748B] mb-1.5">
                  Reserve Crew & Resources
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {resources.map((r) => {
                    const active = selectedResourceIds.includes(r.id);
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => toggleResource(r.id)}
                        className={cn(
                          'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                          active
                            ? 'bg-[#0F172A] text-white border-[#0F172A]'
                            : 'bg-[#F8FAFC] text-[#475569] border-[#CBD5E1]',
                        )}
                      >
                        {r.name} ({r.type})
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#0F172A] px-4 py-2.5 text-xs font-semibold text-white"
            >
              <CalendarIcon className="w-4 h-4" />
              <span>Reserve Slot</span>
            </button>
          </form>

          <form onSubmit={handleAddResource} className="atelier-card p-5 space-y-3">
            <h3 className="text-base font-bold tracking-tight">Crew & Equipment Pool</h3>
            <div className="flex gap-2">
              <input
                required
                value={resName}
                onChange={(e) => setResName(e.target.value)}
                placeholder="Resource name"
                className="flex-1 rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-3 py-2 text-xs"
              />
              <select
                value={resType}
                onChange={(e) => setResType(e.target.value as ResourceType)}
                className="rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-2.5 py-2 text-xs"
              >
                <option value="CREW">Crew</option>
                <option value="EQUIPMENT">Equipment</option>
                <option value="ROOM">Room</option>
                <option value="OTHER">Other</option>
              </select>
              <button
                type="submit"
                disabled={isPending}
                className="rounded-xl border border-[#CBD5E1] px-3 py-2 text-xs font-semibold hover:bg-[#F1F5F9]"
              >
                <PlusIcon className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>

        {/* Right: Local-Date Grouped Timeline */}
        <div className="lg:col-span-7 atelier-card p-6 space-y-5">
          <h2 className="text-lg font-bold tracking-tight">Scheduled Sessions</h2>
          {Object.keys(grouped).length === 0 ? (
            <p className="text-sm text-[#64748B] py-10 text-center">
              No sessions scheduled between {from} and {to} ({timezone}).
            </p>
          ) : (
            <div className="space-y-6">
              {Object.entries(grouped)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([localDate, items]) => (
                  <div key={localDate} className="space-y-2.5">
                    <div className="flex items-center gap-2 border-b border-[#E2E8F0] pb-1.5">
                      <span className="font-mono-code text-xs font-semibold text-[#4F46E5]">
                        {localDate}
                      </span>
                      <span className="text-[11px] text-[#64748B]">
                        ({items.length} session{items.length === 1 ? '' : 's'})
                      </span>
                    </div>

                    {items.map((s) => (
                      <div
                        key={s.id}
                        className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 flex flex-wrap items-center justify-between gap-3"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-sm">{s.title}</p>
                            <StatusBadge status={s.status} />
                          </div>
                          <p className="text-xs text-[#64748B] mt-1">
                            {formatDateTimeInTz(s.startAt, timezone)} →{' '}
                            {formatDateTimeInTz(s.endAt, timezone)}
                            {s.location ? ` • ${s.location}` : ''}
                          </p>
                          {s.booking && (
                            <p className="text-[11px] text-[#475569] mt-1">
                              {s.booking.reference} • {s.booking.eventTitle} ({s.booking.clientName})
                            </p>
                          )}
                          {s.reservations && s.reservations.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {s.reservations.map((r) => (
                                <span
                                  key={r.id}
                                  className="rounded-full bg-white border border-[#CBD5E1] px-2.5 py-0.5 text-[10px] font-medium"
                                >
                                  {r.resource?.name || r.resourceId}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {s.status === 'SCHEDULED' && (
                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() => handleCompleteSession(s.id)}
                            className="rounded-xl border border-[#CBD5E1] bg-white px-3 py-1.5 text-xs font-semibold hover:bg-[#0F172A] hover:text-white transition-colors"
                          >
                            Complete
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
