'use server';

import { isJwtExpired } from '@/lib/jwtHandler';
import { getCookies } from './tokenHandler';

export async function hasValidAccessToken(): Promise<boolean> {
  const token = await getCookies('accessToken');
  if (!token) return false;
  return !isJwtExpired(token);
}
