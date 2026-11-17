'use server';

import { revalidatePath } from 'next/cache';
import { serverFetch } from '@/lib/serverFetch';
import {
  AcceptanceChannel,
  Booking,
  PaginatedResponse,
  Quote,
  QuoteVersion,
} from '@/types/event-management';
import { ActionResult, parseApiResponse } from '../shared/apiResult';

function revalidateQuotePaths() {
  revalidatePath('/admin/quotes');
  revalidatePath('/admin/inquiries');
  revalidatePath('/admin/bookings');
  revalidatePath('/admin');
}

export async function listQuotes(): Promise<ActionResult<PaginatedResponse<Quote>>> {
  const res = await serverFetch.get('/quotes?limit=50');
  return parseApiResponse<PaginatedResponse<Quote>>(res);
}

export async function createQuote(payload: {
  inquiryId?: string;
  eventTypeId?: string;
  eventTitle: string;
  requestedDate?: string;
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  items: Array<{
    packageId?: string;
    serviceItemId?: string;
    description: string;
    quantity: number;
    unitPricePoisha: number;
  }>;
  discountPoisha?: number;
  terms?: string;
}): Promise<ActionResult<Quote>> {
  const res = await serverFetch.post('/quotes', {
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const result = await parseApiResponse<Quote>(res);
  if (result.ok) revalidateQuotePaths();
  return result;
}

export async function createQuoteVersion(
  quoteId: string,
  payload: {
    items: Array<{
      packageId?: string;
      serviceItemId?: string;
      description: string;
      quantity: number;
      unitPricePoisha: number;
    }>;
    discountPoisha?: number;
    terms?: string;
  },
): Promise<ActionResult<QuoteVersion>> {
  const res = await serverFetch.post(`/quotes/${encodeURIComponent(quoteId)}/versions`, {
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const result = await parseApiResponse<QuoteVersion>(res);
  if (result.ok) revalidateQuotePaths();
  return result;
}

export async function sendQuote(quoteId: string): Promise<ActionResult<Quote>> {
  const res = await serverFetch.post(`/quotes/${encodeURIComponent(quoteId)}/send`, {
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  const result = await parseApiResponse<Quote>(res);
  if (result.ok) revalidateQuotePaths();
  return result;
}

export async function acceptQuote(
  quoteId: string,
  payload: {
    versionId?: string;
    acceptedBy: string;
    acceptedChannel: AcceptanceChannel;
  },
): Promise<ActionResult<{ quoteId: string; acceptedVersion: QuoteVersion; booking: Booking }>> {
  const res = await serverFetch.post(`/quotes/${encodeURIComponent(quoteId)}/accept`, {
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const result = await parseApiResponse<{
    quoteId: string;
    acceptedVersion: QuoteVersion;
    booking: Booking;
  }>(res);
  if (result.ok) {
    revalidateQuotePaths();
  }
  return result;
}
