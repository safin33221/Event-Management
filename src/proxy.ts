import { NextRequest, NextResponse } from 'next/server';
import { getDefaultDashboard } from '@/lib/auth-utils';
import { verifyAccessToken } from '@/lib/jwtHandler';
import type { UserRole } from '@/types/event-management';

const ADMIN_ROLES = new Set<UserRole>(['OWNER', 'COORDINATOR', 'ACCOUNTANT']);
const QUOTE_ROLES = new Set<UserRole>(['OWNER', 'COORDINATOR']);
const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

function getSafeCallbackUrl(raw: string | null): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (
    !trimmed.startsWith('/') ||
    trimmed.startsWith('//') ||
    trimmed.includes('\\') ||
    trimmed.includes('://')
  ) {
    return null;
  }
  return trimmed;
}

function canRoleAccessPath(role: UserRole, pathname: string): boolean {
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    return ADMIN_ROLES.has(role);
  }
  if (pathname.startsWith('/api/bookings/') && pathname.endsWith('/invoice.pdf')) {
    return ADMIN_ROLES.has(role);
  }
  if (pathname.startsWith('/api/quotes/') && pathname.endsWith('/invoice.pdf')) {
    return QUOTE_ROLES.has(role);
  }
  return true;
}

function clearAuthCookies(response: NextResponse): NextResponse {
  const expiredOpts = {
    path: '/',
    maxAge: 0,
    expires: new Date(0),
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
  };
  response.cookies.set('accessToken', '', expiredOpts);
  response.cookies.set('userSession', '', expiredOpts);
  return response;
}

function applySecurityHeaders(
  request: NextRequest,
  response: NextResponse,
  options: { privateNoCache?: boolean } = {},
): NextResponse {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.headers.set('X-DNS-Prefetch-Control', 'off');
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');

  if (request.nextUrl.protocol === 'https:') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  if (options.privateNoCache) {
    if (!response.headers.has('Cache-Control')) {
      response.headers.set('Cache-Control', 'private, no-store, max-age=0');
    }
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  }

  return response;
}

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const token = request.cookies.get('accessToken')?.value ?? null;
  const hasAnyAuthCookie = Boolean(token) || request.cookies.has('userSession');
  const verified = token ? verifyAccessToken(token) : null;

  const isAdminRoute = pathname === '/admin' || pathname.startsWith('/admin/');
  const isStaffRoute = pathname === '/staff' || pathname.startsWith('/staff/');
  const isApiRoute = pathname.startsWith('/api/');
  const isLoginRoute = pathname === '/login';

  // Enforce same-origin check on mutating API calls when browser sends Origin header
  if (isApiRoute && MUTATING_METHODS.has(request.method)) {
    const originHeader = request.headers.get('origin');
    const hostHeader = request.headers.get('host');
    if (originHeader && hostHeader) {
      try {
        if (new URL(originHeader).host !== hostHeader) {
          return applySecurityHeaders(
            request,
            NextResponse.json({ message: 'Forbidden cross-origin request' }, { status: 403 }),
            { privateNoCache: true },
          );
        }
      } catch {
        return applySecurityHeaders(
          request,
          NextResponse.json({ message: 'Invalid origin header' }, { status: 403 }),
          { privateNoCache: true },
        );
      }
    }
  }

  // Protected API endpoints (e.g. /api/bookings/[id]/invoice.pdf)
  if (isApiRoute) {
    if (!verified) {
      const res = NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
      if (hasAnyAuthCookie) clearAuthCookies(res);
      return applySecurityHeaders(request, res, { privateNoCache: true });
    }

    if (!canRoleAccessPath(verified.role, pathname)) {
      return applySecurityHeaders(
        request,
        NextResponse.json({ message: 'Insufficient permissions' }, { status: 403 }),
        { privateNoCache: true },
      );
    }

    return applySecurityHeaders(request, NextResponse.next(), { privateNoCache: true });
  }

  // Protected Dashboard Routes (/admin/* and /staff/*)
  if (isAdminRoute || isStaffRoute) {
    if (!verified) {
      const loginUrl = new URL('/login', request.url);
      const requestedPath = getSafeCallbackUrl(`${pathname}${search}`);
      if (requestedPath) {
        loginUrl.searchParams.set('callbackUrl', requestedPath);
      }
      const res = NextResponse.redirect(loginUrl);
      if (hasAnyAuthCookie) clearAuthCookies(res);
      return applySecurityHeaders(request, res, { privateNoCache: true });
    }

    if (isAdminRoute && !ADMIN_ROLES.has(verified.role)) {
      const staffUrl = new URL('/staff', request.url);
      return applySecurityHeaders(request, NextResponse.redirect(staffUrl), {
        privateNoCache: true,
      });
    }

    return applySecurityHeaders(request, NextResponse.next(), { privateNoCache: true });
  }

  // Auth page (/login): redirect already authenticated users to their workspace
  if (isLoginRoute) {
    if (verified) {
      const requestedCallback = getSafeCallbackUrl(request.nextUrl.searchParams.get('callbackUrl'));
      const destination =
        requestedCallback && canRoleAccessPath(verified.role, requestedCallback)
          ? requestedCallback
          : getDefaultDashboard(verified.role);
      return applySecurityHeaders(
        request,
        NextResponse.redirect(new URL(destination, request.url)),
        { privateNoCache: true },
      );
    }

    const res = NextResponse.next();
    if (hasAnyAuthCookie) clearAuthCookies(res);
    return applySecurityHeaders(request, res, { privateNoCache: true });
  }

  // Public storefront & remaining routes
  return applySecurityHeaders(request, NextResponse.next());
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
