import { createHmac, timingSafeEqual } from 'node:crypto';
import type { UserRole } from '@/types/event-management';

export interface DecodedJwtPayload {
  sub?: string;
  email?: string;
  role?: string;
  iat?: number;
  exp?: number;
}

export interface VerifiedJwtPayload {
  sub: string;
  email?: string;
  role: UserRole;
  iat?: number;
  exp: number;
}

const VALID_ROLES = new Set<UserRole>(['OWNER', 'COORDINATOR', 'ACCOUNTANT', 'STAFF']);

export function isValidUserRole(role: unknown): role is UserRole {
  return typeof role === 'string' && VALID_ROLES.has(role as UserRole);
}

export function decodeJwtPayload(token: string): DecodedJwtPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3 || !parts[1]) return null;
    const json = Buffer.from(parts[1], 'base64url').toString('utf8');
    return JSON.parse(json) as DecodedJwtPayload;
  } catch {
    return null;
  }
}

export function isJwtExpired(token: string): boolean {
  const payload = decodeJwtPayload(token);
  if (!payload || typeof payload.exp !== 'number') return true;
  return payload.exp * 1000 <= Date.now();
}

/**
 * Validates JWT structure, required claims (`sub`, `role`, `exp`), and expiration.
 * When `secret` (AUTH_SECRET) is provided, also verifies the HS256 HMAC signature
 * in constant time before trusting token claims.
 */
export function verifyAccessToken(
  token: string,
  secret = process.env.AUTH_SECRET,
): VerifiedJwtPayload | null {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [headerB64, bodyB64, sigB64] = parts;
  if (!headerB64 || !bodyB64 || !sigB64) return null;

  if (secret && secret.trim().length > 0) {
    try {
      const expectedSig = createHmac('sha256', secret.trim())
        .update(`${headerB64}.${bodyB64}`)
        .digest();
      const actualSig = Buffer.from(sigB64, 'base64url');
      if (actualSig.length !== expectedSig.length || !timingSafeEqual(actualSig, expectedSig)) {
        return null;
      }
    } catch {
      return null;
    }
  }

  const payload = decodeJwtPayload(token);
  if (
    !payload ||
    typeof payload.sub !== 'string' ||
    payload.sub.length === 0 ||
    typeof payload.exp !== 'number' ||
    !isValidUserRole(payload.role)
  ) {
    return null;
  }

  if (payload.exp * 1000 <= Date.now()) {
    return null;
  }

  return {
    sub: payload.sub,
    email: typeof payload.email === 'string' ? payload.email : undefined,
    role: payload.role,
    iat: typeof payload.iat === 'number' ? payload.iat : undefined,
    exp: payload.exp,
  };
}
