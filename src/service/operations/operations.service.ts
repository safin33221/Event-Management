'use server';

import { revalidatePath } from 'next/cache';
import { serverFetch } from '@/lib/serverFetch';
import {
  Assignment,
  AssignmentStatus,
  Deliverable,
  DeliverableStatus,
  MyCrewWorkspaceData,
  StudioDispatchData,
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

export async function getMyCrewWorkspace(
  currentUserId?: string,
): Promise<ActionResult<MyCrewWorkspaceData>> {
  const res = await serverFetch.get('/assignments/my-workspace');
  if (res.status !== 404) {
    return parseApiResponse<MyCrewWorkspaceData>(res);
  }

  // Graceful fallback if running against an older backend process prior to restart
  const [assignRes, calRes, resList] = await Promise.all([
    listMyAssignments(),
    serverFetch.get(
      `/calendar?from=${new Date().toISOString().slice(0, 10)}&to=${new Date(Date.now() + 90 * 86_400_000).toISOString().slice(0, 10)}`,
    ),
    serverFetch.get('/resources'),
  ]);
  const calData = await parseApiResponse<{ sessions: MyCrewWorkspaceData['upcomingShoots'] }>(
    calRes,
  );
  const resourcesData = await parseApiResponse<
    Array<{ id: string; userId: string | null }>
  >(resList);

  const myResourceIds = new Set(
    (resourcesData.ok && resourcesData.data ? resourcesData.data : [])
      .filter((r) => currentUserId && r.userId === currentUserId)
      .map((r) => r.id),
  );

  const upcomingShoots = (calData.ok && calData.data ? calData.data.sessions : []).filter((s) =>
    s.reservations?.some((r) => myResourceIds.has(r.resourceId)),
  );

  return {
    ok: assignRes.ok,
    data: {
      assignments: assignRes.ok && assignRes.data ? assignRes.data : [],
      upcomingShoots,
    },
    message: assignRes.message,
  };
}

export async function getStudioDispatch(): Promise<ActionResult<StudioDispatchData>> {
  const res = await serverFetch.get('/assignments/studio');
  if (res.status !== 404) {
    return parseApiResponse<StudioDispatchData>(res);
  }

  // Graceful fallback if running against an older backend process prior to restart
  const today = new Date().toISOString().slice(0, 10);
  const future = new Date(Date.now() + 60 * 86_400_000).toISOString().slice(0, 10);
  const [myRes, membersRes, resourcesRes, calRes] = await Promise.all([
    listMyAssignments(),
    serverFetch.get('/studio/members'),
    serverFetch.get('/resources'),
    serverFetch.get(`/calendar?from=${today}&to=${future}`),
  ]);

  const membersParsed = await parseApiResponse<
    Array<{ id: string; name: string; email: string; role: StudioDispatchData['crewSummary'][number]['role']; isActive: boolean }>
  >(membersRes);
  const resourcesParsed = await parseApiResponse<StudioDispatchData['crewSummary'][number]['crewResources']>(resourcesRes);
  const calParsed = await parseApiResponse<{ sessions: StudioDispatchData['upcomingSessions'] }>(calRes);

  const activeMembers = (membersParsed.ok && membersParsed.data ? membersParsed.data : []).filter(
    (m) => m.isActive,
  );
  const crewResources = (resourcesParsed.ok && resourcesParsed.data ? resourcesParsed.data : []).filter(
    (r) => r.type === 'CREW',
  );
  const upcomingSessions = calParsed.ok && calParsed.data ? calParsed.data.sessions : [];

  return {
    ok: true,
    data: {
      assignments: myRes.ok && myRes.data ? myRes.data : [],
      upcomingSessions,
      crewSummary: activeMembers.map((m) => {
        const linked = crewResources.filter((r) => r.userId === m.id);
        return {
          id: m.id,
          name: m.name,
          email: m.email,
          role: m.role,
          crewResources: linked,
          openTasksCount: 0,
          upcomingShootsCount: upcomingSessions.filter((s) =>
            s.reservations?.some((r) => linked.some((lr) => lr.id === r.resourceId)),
          ).length,
        };
      }),
    },
  };
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
  payload: {
    assigneeUserId?: string | null;
    dueAt?: string | null;
    reviewStatus?: DeliverableStatus;
    notes?: string;
  },
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

export async function syncBookingDeliverablesFromQuote(
  bookingId: string,
): Promise<ActionResult<{ createdCount: number; deliverables: Deliverable[] }>> {
  const res = await serverFetch.post(
    `/bookings/${encodeURIComponent(bookingId)}/deliverables/sync-quote`,
  );
  const result = await parseApiResponse<{ createdCount: number; deliverables: Deliverable[] }>(res);
  if (result.ok) {
    revalidatePath('/admin/bookings');
  }
  return result;
}

export async function deleteDeliverable(
  deliverableId: string,
): Promise<ActionResult<{ deleted: boolean; id: string }>> {
  const res = await serverFetch.delete(`/deliverables/${encodeURIComponent(deliverableId)}`);
  const result = await parseApiResponse<{ deleted: boolean; id: string }>(res);
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
