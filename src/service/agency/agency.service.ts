'use server';

import { revalidatePath } from 'next/cache';
import { serverFetch } from '@/lib/serverFetch';
import {
  PublicBranding,
  StudioSettings,
  UserRole,
} from '@/types/event-management';
import { ActionResult, parseApiResponse } from '../shared/apiResult';

export async function getPublicBranding(): Promise<ActionResult<PublicBranding>> {
  const res = await serverFetch.get('/public/branding');
  return parseApiResponse<PublicBranding>(res);
}

export async function getAgencySettings(): Promise<ActionResult<StudioSettings>> {
  const res = await serverFetch.get('/studio/settings');
  return parseApiResponse<StudioSettings>(res);
}

export async function updateAgencyBranding(payload: {
  name?: string;
  logoUrl?: string | null;
  themeTokens?: Record<string, string>;
  contactDetails?: Record<string, string>;
  timezone?: string;
  currency?: string;
  advancePolicyType?: 'NONE' | 'PERCENTAGE' | 'FIXED';
  advancePolicyValue?: number;
}): Promise<ActionResult<StudioSettings>> {
  const res = await serverFetch.patch('/studio/branding', {
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const result = await parseApiResponse<StudioSettings>(res);
  if (result.ok) {
    revalidatePath('/admin/catalog');
    revalidatePath('/admin');
    revalidatePath('/');
  }
  return result;
}

export async function listAgencyMembers(): Promise<
  ActionResult<
    Array<{
      id: string;
      email: string;
      name: string;
      role: UserRole;
      isActive: boolean;
    }>
  >
> {
  const res = await serverFetch.get('/studio/members');
  return parseApiResponse(res);
}

export async function addAgencyMember(payload: {
  email: string;
  name: string;
  password?: string;
  role: UserRole;
}): Promise<ActionResult<{ id: string; email: string; name: string; role: UserRole; isActive: boolean }>> {
  const res = await serverFetch.post('/studio/members', {
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const result = await parseApiResponse<{
    id: string;
    email: string;
    name: string;
    role: UserRole;
    isActive: boolean;
  }>(res);
  if (result.ok) {
    revalidatePath('/admin/catalog');
  }
  return result;
}
