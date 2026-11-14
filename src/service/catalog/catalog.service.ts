'use server';

import { revalidatePath } from 'next/cache';
import { serverFetch } from '@/lib/serverFetch';
import {
  DeliverableLabelTemplate,
  EventType,
  PaginatedResponse,
  PortfolioItem,
  ServiceItem,
  StudioPackage,
  TaskTemplate,
} from '@/types/event-management';
import { ActionResult, parseApiResponse } from '../shared/apiResult';

export async function getPublicEventTypes(): Promise<ActionResult<EventType[]>> {
  const res = await serverFetch.get('/public/event-types');
  return parseApiResponse<EventType[]>(res);
}

export async function getPublicPackages(): Promise<
  ActionResult<PaginatedResponse<StudioPackage>>
> {
  const res = await serverFetch.get('/public/packages');
  return parseApiResponse<PaginatedResponse<StudioPackage>>(res);
}

export async function getPublicPortfolio(): Promise<
  ActionResult<PaginatedResponse<PortfolioItem>>
> {
  const res = await serverFetch.get('/public/portfolio');
  return parseApiResponse<PaginatedResponse<PortfolioItem>>(res);
}

export async function listEventTypes(): Promise<ActionResult<EventType[]>> {
  const res = await serverFetch.get('/catalog/event-types');
  return parseApiResponse<EventType[]>(res);
}

export async function createEventType(payload: {
  name: string;
  slug: string;
  description?: string;
}): Promise<ActionResult<EventType>> {
  const res = await serverFetch.post('/catalog/event-types', {
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const result = await parseApiResponse<EventType>(res);
  if (result.ok) revalidatePath('/admin/catalog');
  return result;
}

export async function listServiceItems(): Promise<ActionResult<ServiceItem[]>> {
  const res = await serverFetch.get('/catalog/services');
  return parseApiResponse<ServiceItem[]>(res);
}

export async function createServiceItem(payload: {
  name: string;
  unitLabel?: string;
  defaultUnitPricePoisha: number;
  description?: string;
}): Promise<ActionResult<ServiceItem>> {
  const res = await serverFetch.post('/catalog/services', {
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const result = await parseApiResponse<ServiceItem>(res);
  if (result.ok) revalidatePath('/admin/catalog');
  return result;
}

export async function listPackages(): Promise<ActionResult<PaginatedResponse<StudioPackage>>> {
  const res = await serverFetch.get('/catalog/packages?limit=50');
  return parseApiResponse<PaginatedResponse<StudioPackage>>(res);
}

export async function createPackage(payload: {
  eventTypeId?: string;
  name: string;
  slug: string;
  description?: string;
  basePricePoisha: number;
  isPublished?: boolean;
}): Promise<ActionResult<StudioPackage>> {
  const res = await serverFetch.post('/catalog/packages', {
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const result = await parseApiResponse<StudioPackage>(res);
  if (result.ok) revalidatePath('/admin/catalog');
  return result;
}

export async function updatePackage(
  packageId: string,
  payload: {
    name?: string;
    description?: string;
    basePricePoisha?: number;
    isPublished?: boolean;
    isActive?: boolean;
  },
): Promise<ActionResult<StudioPackage>> {
  const res = await serverFetch.patch(`/catalog/packages/${encodeURIComponent(packageId)}`, {
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const result = await parseApiResponse<StudioPackage>(res);
  if (result.ok) revalidatePath('/admin/catalog');
  return result;
}

export async function createPortfolioItem(payload: {
  eventTypeId?: string;
  title: string;
  description?: string;
  mediaUrl: string;
  isApproved?: boolean;
  isPublished?: boolean;
}): Promise<ActionResult<PortfolioItem>> {
  const res = await serverFetch.post('/catalog/portfolio', {
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const result = await parseApiResponse<PortfolioItem>(res);
  if (result.ok) revalidatePath('/admin/catalog');
  return result;
}

export async function listDeliverableLabels(): Promise<
  ActionResult<DeliverableLabelTemplate[]>
> {
  const res = await serverFetch.get('/catalog/deliverable-labels');
  return parseApiResponse<DeliverableLabelTemplate[]>(res);
}

export async function createDeliverableLabel(payload: {
  eventTypeId?: string;
  label: string;
  defaultDueDays?: number;
}): Promise<ActionResult<DeliverableLabelTemplate>> {
  const res = await serverFetch.post('/catalog/deliverable-labels', {
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const result = await parseApiResponse<DeliverableLabelTemplate>(res);
  if (result.ok) revalidatePath('/admin/catalog');
  return result;
}

export async function updateDeliverableLabel(
  id: string,
  payload: { label?: string; defaultDueDays?: number; isActive?: boolean },
): Promise<ActionResult<DeliverableLabelTemplate>> {
  const res = await serverFetch.patch(`/catalog/deliverable-labels/${encodeURIComponent(id)}`, {
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const result = await parseApiResponse<DeliverableLabelTemplate>(res);
  if (result.ok) revalidatePath('/admin/catalog');
  return result;
}

export async function listTaskTemplates(): Promise<ActionResult<TaskTemplate[]>> {
  const res = await serverFetch.get('/catalog/task-templates');
  return parseApiResponse<TaskTemplate[]>(res);
}

export async function createTaskTemplate(payload: {
  eventTypeId?: string;
  title: string;
  roleLabel: string;
  defaultOffsetDays?: number;
}): Promise<ActionResult<TaskTemplate>> {
  const res = await serverFetch.post('/catalog/task-templates', {
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const result = await parseApiResponse<TaskTemplate>(res);
  if (result.ok) revalidatePath('/admin/catalog');
  return result;
}

export async function updateTaskTemplate(
  id: string,
  payload: { title?: string; roleLabel?: string; defaultOffsetDays?: number; isActive?: boolean },
): Promise<ActionResult<TaskTemplate>> {
  const res = await serverFetch.patch(`/catalog/task-templates/${encodeURIComponent(id)}`, {
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const result = await parseApiResponse<TaskTemplate>(res);
  if (result.ok) revalidatePath('/admin/catalog');
  return result;
}
