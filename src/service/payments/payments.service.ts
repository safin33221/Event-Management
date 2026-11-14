'use server';

import { revalidatePath } from 'next/cache';
import { serverFetch } from '@/lib/serverFetch';
import {
  AdjustmentType,
  BookingLedgerSummary,
  PaymentEntry,
  PaymentMethod,
} from '@/types/event-management';
import { ActionResult, parseApiResponse } from '../shared/apiResult';

export async function getBookingLedger(bookingId: string): Promise<
  ActionResult<{
    summary: BookingLedgerSummary;
    entries: PaymentEntry[];
  }>
> {
  const res = await serverFetch.get(`/bookings/${encodeURIComponent(bookingId)}/ledger`);
  return parseApiResponse(res);
}

export async function recordPayment(
  bookingId: string,
  payload: {
    amountPoisha: number;
    method: PaymentMethod;
    transactionRef?: string;
    idempotencyKey?: string;
    reason?: string;
  },
): Promise<ActionResult<{ entry: PaymentEntry; idempotentReplay: boolean }>> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (payload.idempotencyKey) {
    headers['Idempotency-Key'] = payload.idempotencyKey;
  }
  const res = await serverFetch.post(`/bookings/${encodeURIComponent(bookingId)}/payments`, {
    headers,
    body: JSON.stringify(payload),
  });
  const result = await parseApiResponse<{ entry: PaymentEntry; idempotentReplay: boolean }>(res);
  if (result.ok) {
    revalidatePath('/admin/bookings');
    revalidatePath('/admin');
  }
  return result;
}

export async function verifyPayment(
  paymentId: string,
): Promise<
  ActionResult<{
    entry: PaymentEntry;
    ledger: BookingLedgerSummary;
    bookingStatus?: string | null;
  }>
> {
  const res = await serverFetch.post(`/payments/${encodeURIComponent(paymentId)}/verify`, {
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  const result = await parseApiResponse<{
    entry: PaymentEntry;
    ledger: BookingLedgerSummary;
    bookingStatus?: string | null;
  }>(res);
  if (result.ok) {
    revalidatePath('/admin/bookings');
    revalidatePath('/admin');
  }
  return result;
}

export async function rejectPayment(
  paymentId: string,
  reason: string,
): Promise<ActionResult<PaymentEntry>> {
  const res = await serverFetch.post(`/payments/${encodeURIComponent(paymentId)}/reject`, {
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason }),
  });
  const result = await parseApiResponse<PaymentEntry>(res);
  if (result.ok) revalidatePath('/admin/bookings');
  return result;
}

export async function issueRefund(
  bookingId: string,
  payload: {
    amountPoisha: number;
    method: PaymentMethod;
    reason: string;
    transactionRef?: string;
    idempotencyKey?: string;
  },
): Promise<ActionResult<{ entry: PaymentEntry; ledger: BookingLedgerSummary }>> {
  const res = await serverFetch.post(`/bookings/${encodeURIComponent(bookingId)}/refunds`, {
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const result = await parseApiResponse<{ entry: PaymentEntry; ledger: BookingLedgerSummary }>(res);
  if (result.ok) revalidatePath('/admin/bookings');
  return result;
}

export async function createAdjustment(
  bookingId: string,
  payload: {
    type: AdjustmentType;
    amountPoisha: number;
    reason: string;
    idempotencyKey?: string;
  },
): Promise<ActionResult<{ ledger: BookingLedgerSummary }>> {
  const res = await serverFetch.post(`/bookings/${encodeURIComponent(bookingId)}/adjustments`, {
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const result = await parseApiResponse<{ ledger: BookingLedgerSummary }>(res);
  if (result.ok) revalidatePath('/admin/bookings');
  return result;
}
