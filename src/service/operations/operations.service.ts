'use server';

import { revalidatePath } from 'next/cache';
import { serverFetch } from '@/lib/serverFetch';
import {
  Assignment,
  AssignmentStatus,
  Deliverable,
  DeliverableStatus,
} from '@/types/event-management';
import { ActionResult, parseApiResponse } from '../shared/apiResult';

export async function createAssignment(
  bookingId: string,
  payload: {
    sessionId?: string;
    assigneeUserId: string;
    roleLabel: string;
    notes?: string;
  },
): Promise<ActionResult<Assignment>> {
  const res = await serverFetch.post(`/bookings/${encodeURIComponent(bookingId)}/assignments`, {
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const result = await parseApiResponse<Assignment>(res);
  if (result.ok) {
    revalidatePath('/admin/bookings');
    revalidatePath('/staff');
  }
  return result;
}

export async function listMyAssignments(): Promise<ActionResult<Assignment[]>> {
  const res = await serverFetch.get('/assignments/my');
  return parseApiResponse<Assignment[]>(res);
}

export async function updateAssignment(
  assignmentId: string,
  payload: { status?: AssignmentStatus; notes?: string },
): Promise<ActionResult<Assignment>> {
  const res = await serverFetch.patch(`/assignments/${encodeURIComponent(assignmentId)}`, {
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const result = await parseApiResponse<Assignment>(res);
  if (result.ok) {
    revalidatePath('/staff');
    revalidatePath('/admin/bookings');
  }
  return result;
}

export async function createDeliverable(
  bookingId: string,
  payload: {
    label: string;
    assigneeUserId?: string;
    dueAt?: string;
    notes?: string;
  },
): Promise<ActionResult<Deliverable>> {
  const res = await serverFetch.post(`/bookings/${encodeURIComponent(bookingId)}/deliverables`, {
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const result = await parseApiResponse<Deliverable>(res);
  if (result.ok) revalidatePath('/admin/bookings');
  return result;
}

export async function updateDeliverable(
  deliverableId: string,
  payload: { reviewStatus?: DeliverableStatus; notes?: string },
): Promise<ActionResult<Deliverable>> {
  const res = await serverFetch.patch(`/deliverables/${encodeURIComponent(deliverableId)}`, {
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const result = await parseApiResponse<Deliverable>(res);
  if (result.ok) {
    revalidatePath('/admin/bookings');
    revalidatePath('/staff');
  }
  return result;
}

export async function deliverDeliverable(
  deliverableId: string,
  payload: { deliveryUrl?: string; notes?: string },
): Promise<ActionResult<Deliverable>> {
  const res = await serverFetch.post(`/deliverables/${encodeURIComponent(deliverableId)}/deliver`, {
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const result = await parseApiResponse<Deliverable>(res);
  if (result.ok) {
    revalidatePath('/admin/bookings');
    revalidatePath('/staff');
  }
  return result;
}
