'use server';

import { revalidatePath } from 'next/cache';
import { serverFetch } from '@/lib/serverFetch';
import { Inquiry, InquiryStatus, PaginatedResponse } from '@/types/event-management';
import { ActionResult, parseApiResponse } from '../shared/apiResult';

export async function submitPublicInquiry(payload: {
  eventTypeId?: string;
  packageId?: string;
  eventTitle: string;
  requestedDate?: string;
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  notes?: string;
  metadata?: Record<string, unknown>;
}): Promise<ActionResult<{ reference: string; status: InquiryStatus; requestedDate: string | null }>> {
  const res = await serverFetch.post('/public/inquiries', {
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return parseApiResponse(res);
}

export async function listInquiries(params?: {
  status?: InquiryStatus;
  reference?: string;
  page?: number;
}): Promise<ActionResult<PaginatedResponse<Inquiry>>> {
  const qs = new URLSearchParams();
  if (params?.status) qs.set('status', params.status);
  if (params?.reference) qs.set('reference', params.reference);
  if (params?.page) qs.set('page', String(params.page));
  const query = qs.toString();
  const res = await serverFetch.get(`/inquiries${query ? `?${query}` : ''}`);
  return parseApiResponse<PaginatedResponse<Inquiry>>(res);
}

export async function createPhoneInquiry(payload: {
  eventTypeId?: string;
  packageId?: string;
  eventTitle: string;
  requestedDate?: string;
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  notes?: string;
}): Promise<ActionResult<Inquiry>> {
  const res = await serverFetch.post('/inquiries', {
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const result = await parseApiResponse<Inquiry>(res);
  if (result.ok) revalidatePath('/admin/bookings');
  return result;
}

export async function updateInquiryStatus(
  id: string,
  status: InquiryStatus,
): Promise<ActionResult<Inquiry>> {
  const res = await serverFetch.patch(`/inquiries/${encodeURIComponent(id)}/status`, {
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  const result = await parseApiResponse<Inquiry>(res);
  if (result.ok) revalidatePath('/admin/bookings');
  return result;
}
