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

  // UI panel toggle ('none' | 'schedule' | 'resources')
  const [activePanel, setActivePanel] = useState<'none' | 'schedule' | 'resources'>('none');

  // Add resource state
  const [resName, setResName] = useState('');
  const [resType, setResType] = useState<ResourceType>('CREW');

  // Schedule session state
  const defaultBooking = bookings[0];
  const defaultDatePart = defaultBooking?.eventDate ? defaultBooking.eventDate.slice(0, 10) : '';
  const [bookingId, setBookingId] = useState(defaultBooking?.id || '');
  const [sessionTitle, setSessionTitle] = useState(
    defaultBooking ? `${defaultBooking.eventTitle} — Shoot` : '',
  );
  const [startLocal, setStartLocal] = useState(defaultDatePart ? `${defaultDatePart}T17:00` : '');
  const [endLocal, setEndLocal] = useState(defaultDatePart ? `${defaultDatePart}T23:00` : '');
  const [location, setLocation] = useState('');
  const [selectedResourceIds, setSelectedResourceIds] = useState<string[]>([]);

  const handleSelectBooking = (nextId: string) => {
    setBookingId(nextId);
    const chosen = bookings.find((b) => b.id === nextId);
    if (!chosen) return;
    setSessionTitle(`${chosen.eventTitle} — Shoot`);
    if (chosen.eventDate) {
      const d = chosen.eventDate.slice(0, 10);
      setStartLocal(`${d}T17:00`);
      setEndLocal(`${d}T23:00`);
    }
  };

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
      setActivePanel('none');
      setFeedback({ type: 'ok', text: 'Event session scheduled and crew reserved.' });
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

  const inputClass =
    'w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/15 transition-all';

  return (
    <div className="space-y-6">
      {/* Header + Action Buttons */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
            Schedule
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            View upcoming shoots &amp; events or reserve crew and equipment • {timezone}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setActivePanel(activePanel === 'resources' ? 'none' : 'resources')}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-sm font-semibold transition-colors',
              activePanel === 'resources'
                ? 'border-slate-900 bg-slate-900 text-white'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
            )}
          >
            <span>Crew &amp; Gear ({resources.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActivePanel(activePanel === 'schedule' ? 'none' : 'schedule')}
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors"
          >
            <PlusIcon className="w-3.5 h-3.5" />
            <span>{activePanel === 'schedule' ? 'Close Form' : 'Schedule Event'}</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div
          className={cn(
            'rounded-xl border px-4 py-3 text-sm flex items-center justify-between',
            feedback.type === 'ok'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
              : 'border-rose-200 bg-rose-50 text-rose-900',
          )}
        >
          <span>{feedback.text}</span>
          <button type="button" onClick={() => setFeedback(null)} className="text-xs underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Collapsible: Schedule Event Form */}
      {activePanel === 'schedule' && (
        <form onSubmit={handleCreateSession} className="atelier-card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-lg font-bold tracking-tight text-slate-900">
                Schedule an Event Session
              </h2>
              <p className="text-sm text-slate-500 mt-0.5">
                Pick a booking, date, and time. Double-bookings for the same crew or gear are blocked automatically.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActivePanel('none')}
              className="text-xs font-semibold text-slate-500 hover:text-slate-900"
            >
              Cancel
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-1">Booking *</label>
              <select
                required
                value={bookingId}
                onChange={(e) => handleSelectBooking(e.target.value)}
                className={inputClass}
              >
                <option value="">Select a booking...</option>
                {bookings.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.reference} — {b.eventTitle}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-1">
                Session Name *
              </label>
              <input
                required
                value={sessionTitle}
                onChange={(e) => setSessionTitle(e.target.value)}
                placeholder="e.g. Main Ceremony / Keynote"
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-1">
                Start Date &amp; Time *
              </label>
              <input
                type="datetime-local"
                required
                value={startLocal}
                onChange={(e) => setStartLocal(e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-1">
                End Date &amp; Time *
              </label>
              <input
                type="datetime-local"
                required
                value={endLocal}
                onChange={(e) => setEndLocal(e.target.value)}
                className={inputClass}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-slate-600 mb-1">
                Venue / Location (optional)
              </label>
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Dhaka Regency Hall"
                className={inputClass}
              />
            </div>
          </div>

          {resources.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-slate-600 mb-2">
                Assign Crew &amp; Equipment (optional)
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
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300',
                      )}
                    >
                      {r.name} ({r.type})
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
            >
              <CalendarIcon className="w-4 h-4" />
              <span>Save to Schedule</span>
            </button>
          </div>
        </form>
      )}

      {/* Collapsible: Crew & Gear Pool */}
      {activePanel === 'resources' && (
        <div className="atelier-card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-lg font-bold tracking-tight text-slate-900">
                Crew &amp; Equipment Pool
              </h2>
              <p className="text-sm text-slate-500 mt-0.5">
                Add photographers, editors, cameras, or rooms so you can assign them to events.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActivePanel('none')}
              className="text-xs font-semibold text-slate-500 hover:text-slate-900"
            >
              Close
            </button>
          </div>

          <form onSubmit={handleAddResource} className="flex flex-wrap gap-2">
            <input
              required
              value={resName}
              onChange={(e) => setResName(e.target.value)}
              placeholder="Name (e.g. Lead Photographer / Sony FX3)"
              className="flex-1 min-w-[200px] rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:bg-white"
            />
            <select
              value={resType}
              onChange={(e) => setResType(e.target.value as ResourceType)}
              className="rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-sm"
            >
              <option value="CREW">Crew</option>
              <option value="EQUIPMENT">Equipment</option>
              <option value="ROOM">Room</option>
              <option value="OTHER">Other</option>
            </select>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              <PlusIcon className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </form>

          {resources.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {resources.map((r) => (
                <span
                  key={r.id}
                  className="rounded-full bg-slate-100 border border-slate-200 px-3 py-1 text-xs font-medium text-slate-700"
                >
                  {r.name} <span className="text-slate-400">• {r.type}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Main Schedule Timeline */}
      <div className="atelier-card p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <h2 className="text-lg font-bold tracking-tight text-slate-900">
            Scheduled Sessions ({sessions.length})
          </h2>

          <div className="flex flex-wrap items-center gap-2">
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700"
            />
            <span className="text-xs text-slate-400">to</span>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700"
            />
            <button
              type="button"
              disabled={isPending}
              onClick={() => refreshCalendar(from, to)}
              className="rounded-xl bg-slate-900 px-3.5 py-1.5 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Apply
            </button>
          </div>
        </div>

        {Object.keys(grouped).length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <CalendarIcon className="w-8 h-8 mx-auto text-slate-300" />
            <p className="text-sm font-medium text-slate-700">No sessions in this date range</p>
            <p className="text-xs text-slate-500">
              Click &ldquo;Schedule Event&rdquo; above to add a shoot or event session.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([localDate, items]) => (
                <div key={localDate} className="space-y-2.5">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-1.5">
                    <span className="font-mono-code text-sm font-semibold text-indigo-600">
                      {localDate}
                    </span>
                    <span className="text-xs text-slate-400">
                      ({items.length} session{items.length === 1 ? '' : 's'})
                    </span>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    {items.map((s) => (
                      <div
                        key={s.id}
                        className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 flex items-start justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-sm text-slate-900 truncate">
                              {s.title}
                            </p>
                            <StatusBadge status={s.status} />
                          </div>
                          <p className="text-sm text-slate-500 mt-1">
                            {formatDateTimeInTz(s.startAt, timezone)} →{' '}
                            {formatDateTimeInTz(s.endAt, timezone)}
                            {s.location ? ` • ${s.location}` : ''}
                          </p>
                          {s.booking && (
                            <p className="text-xs text-slate-600 mt-1">
                              {s.booking.reference} • {s.booking.eventTitle} ({s.booking.clientName})
                            </p>
                          )}
                          {s.reservations && s.reservations.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {s.reservations.map((r) => (
                                <span
                                  key={r.id}
                                  className="rounded-full bg-white border border-slate-200 px-2.5 py-0.5 text-xs font-medium text-slate-700"
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
                            className="shrink-0 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-colors"
                          >
                            Mark Done
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
