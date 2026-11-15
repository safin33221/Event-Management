'use server';

import { revalidatePath } from 'next/cache';
import { serverFetch } from '@/lib/serverFetch';
import {
  CalendarSubscriptionInfo,
  EventSession,
  Resource,
  ResourceAvailabilityItem,
  ResourceType,
} from '@/types/event-management';
import { ActionResult, parseApiResponse } from '../shared/apiResult';

export async function listResources(): Promise<ActionResult<Resource[]>> {
  const res = await serverFetch.get('/resources');
  return parseApiResponse<Resource[]>(res);
}

export async function createResource(payload: {
  name: string;
  type: ResourceType;
  userId?: string;
}): Promise<ActionResult<Resource>> {
  const res = await serverFetch.post('/resources', {
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const result = await parseApiResponse<Resource>(res);
  if (result.ok) {
    revalidatePath('/admin/calendar');
    revalidatePath('/admin/bookings');
  }
  return result;
}

export async function createSession(
  bookingId: string,
  payload: {
    title: string;
    startAt: string;
    endAt: string;
    location?: string;
    resourceIds?: string[];
    reason?: string;
  },
): Promise<ActionResult<EventSession>> {
  const res = await serverFetch.post(`/bookings/${encodeURIComponent(bookingId)}/sessions`, {
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const result = await parseApiResponse<EventSession>(res);
  if (result.ok) {
    revalidatePath('/admin/calendar');
    revalidatePath('/admin/bookings');
  }
  return result;
}

export async function rescheduleSession(
  sessionId: string,
  payload: {
    startAt: string;
    endAt: string;
    reason: string;
    resourceIds?: string[];
  },
): Promise<ActionResult<EventSession>> {
  const res = await serverFetch.patch(`/sessions/${encodeURIComponent(sessionId)}/reschedule`, {
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const result = await parseApiResponse<EventSession>(res);
  if (result.ok) {
    revalidatePath('/admin/calendar');
    revalidatePath('/admin/bookings');
    revalidatePath('/admin');
  }
  return result;
}

export async function cancelSession(
  sessionId: string,
  reason: string,
): Promise<ActionResult<EventSession>> {
  const res = await serverFetch.post(`/sessions/${encodeURIComponent(sessionId)}/cancel`, {
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason }),
  });
  const result = await parseApiResponse<EventSession>(res);
  if (result.ok) {
    revalidatePath('/admin/calendar');
    revalidatePath('/admin/bookings');
    revalidatePath('/admin');
  }
  return result;
}

export async function completeSession(sessionId: string): Promise<ActionResult<EventSession>> {
  const res = await serverFetch.post(`/sessions/${encodeURIComponent(sessionId)}/complete`, {
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  const result = await parseApiResponse<EventSession>(res);
  if (result.ok) {
    revalidatePath('/admin/calendar');
    revalidatePath('/admin/bookings');
    revalidatePath('/admin');
  }
  return result;
}

export async function getCalendar(
  from: string,
  to: string,
): Promise<ActionResult<{ timezone: string; from: string; to: string; sessions: EventSession[] }>> {
  const qs = new URLSearchParams({ from, to });
  const res = await serverFetch.get(`/calendar?${qs.toString()}`);
  return parseApiResponse(res);
}

export async function checkResourceAvailability(
  startAt: string,
  endAt: string,
  excludeSessionId?: string,
): Promise<
  ActionResult<{ startAt: string; endAt: string; resources: ResourceAvailabilityItem[] }>
> {
  const qs = new URLSearchParams({ startAt, endAt });
  if (excludeSessionId) {
    qs.set('excludeSessionId', excludeSessionId);
  }
  const res = await serverFetch.get(`/resources/availability?${qs.toString()}`);
  return parseApiResponse(res);
}

export async function getCalendarSubscription(): Promise<ActionResult<CalendarSubscriptionInfo>> {
  const res = await serverFetch.get('/calendar/subscription');
  return parseApiResponse<CalendarSubscriptionInfo>(res);
}
