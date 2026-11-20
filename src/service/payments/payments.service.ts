'use server';

import { revalidatePath } from 'next/cache';
import { serverFetch } from '@/lib/serverFetch';
import {
  AdjustmentType,
  BookingLedgerSummary,
  BookingStatus,
  ExpenseCategory,
  FinancialExpenseRow,
  FinancialReportData,
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
  if (result.ok) {
    revalidatePath('/admin/bookings');
    revalidatePath('/admin/finance');
  }
  return result;
}

export async function getFinancialReport(filters?: {
  from?: string;
  to?: string;
  method?: PaymentMethod;
  bookingStatus?: BookingStatus;
}): Promise<ActionResult<FinancialReportData>> {
  const params = new URLSearchParams();
  if (filters?.from) params.set('from', filters.from);
  if (filters?.to) params.set('to', filters.to);
  if (filters?.method) params.set('method', filters.method);
  if (filters?.bookingStatus) params.set('bookingStatus', filters.bookingStatus);

  const qs = params.toString() ? `?${params.toString()}` : '';
  const res = await serverFetch.get(`/finance/report${qs}`);
  return parseApiResponse<FinancialReportData>(res);
}

export async function recordExpense(payload: {
  category: ExpenseCategory;
  title: string;
  vendorOrPayee?: string;
  amountPoisha: number;
  method?: PaymentMethod;
  reference?: string;
  incurredOn?: string;
  bookingId?: string;
  notes?: string;
}): Promise<ActionResult<FinancialExpenseRow>> {
  const res = await serverFetch.post('/finance/expenses', {
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const result = await parseApiResponse<FinancialExpenseRow>(res);
  if (result.ok) {
    revalidatePath('/admin/finance');
    revalidatePath('/admin');
  }
  return result;
}

export async function deleteExpense(
  expenseId: string,
): Promise<ActionResult<{ deletedExpenseId: string }>> {
  const res = await serverFetch.delete(`/finance/expenses/${encodeURIComponent(expenseId)}`);
  const result = await parseApiResponse<{ deletedExpenseId: string }>(res);
  if (result.ok) {
    revalidatePath('/admin/finance');
    revalidatePath('/admin');
  }
  return result;
}


