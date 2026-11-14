'use server';

import { revalidatePath } from 'next/cache';
import { serverFetch } from '@/lib/serverFetch';
import { Booking, BookingStatus, PaginatedResponse } from '@/types/event-management';
import { ActionResult, parseApiResponse } from '../shared/apiResult';

export async function listBookings(params?: {
  status?: BookingStatus;
  reference?: string;
}): Promise<ActionResult<PaginatedResponse<Booking>>> {
  const qs = new URLSearchParams({ limit: '50' });
  if (params?.status) qs.set('status', params.status);
  if (params?.reference) qs.set('reference', params.reference);
  const res = await serverFetch.get(`/bookings?${qs.toString()}`);
  return parseApiResponse<PaginatedResponse<Booking>>(res);
}

export async function getBooking(id: string): Promise<ActionResult<Booking>> {
  const res = await serverFetch.get(`/bookings/${encodeURIComponent(id)}`);
  return parseApiResponse<Booking>(res);
}

export interface ConfirmBookingSessionInput {
  title: string;
  startAt: string;
  endAt: string;
  location?: string;
  notes?: string;
  resourceIds?: string[];
  reason?: string;
}

export async function confirmBooking(
  id: string,
  expectedVersion?: number,
  sessions?: ConfirmBookingSessionInput[],
): Promise<ActionResult<{ booking: Booking }>> {
  const body: { expectedVersion?: number; sessions?: ConfirmBookingSessionInput[] } = {};
  if (expectedVersion !== undefined) body.expectedVersion = expectedVersion;
  if (sessions && sessions.length > 0) body.sessions = sessions;

  const res = await serverFetch.post(`/bookings/${encodeURIComponent(id)}/confirm`, {
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const result = await parseApiResponse<{ booking: Booking }>(res);
  if (result.ok) {
    revalidatePath('/admin/bookings');
    revalidatePath('/admin/calendar');
    revalidatePath('/admin');
  }
  return result;
}

export async function completeBooking(id: string): Promise<ActionResult<{ booking: Booking }>> {
  const res = await serverFetch.post(`/bookings/${encodeURIComponent(id)}/complete`, {
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  const result = await parseApiResponse<{ booking: Booking }>(res);
  if (result.ok) {
    revalidatePath('/admin/bookings');
    revalidatePath('/admin/calendar');
    revalidatePath('/admin');
  }
  return result;
}

export async function cancelBooking(
  id: string,
  reason: string,
): Promise<ActionResult<Booking>> {
  const res = await serverFetch.post(`/bookings/${encodeURIComponent(id)}/cancel`, {
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason }),
  });
  const result = await parseApiResponse<Booking>(res);
  if (result.ok) {
    revalidatePath('/admin/bookings');
    revalidatePath('/admin/calendar');
  }
  return result;
}
