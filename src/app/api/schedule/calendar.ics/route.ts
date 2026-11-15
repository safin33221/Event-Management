import { NextRequest, NextResponse } from 'next/server';
import { getCookies } from '@/service/auth/tokenHandler';

const BackendURL =
  process.env.BACKEND_URL ?? process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:3000';

export async function GET(request: NextRequest) {
  const accessToken = await getCookies('accessToken');
  if (!accessToken) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const from = request.nextUrl.searchParams.get('from');
  const to = request.nextUrl.searchParams.get('to');
  const qs = new URLSearchParams();
  if (from && /^\d{4}-\d{2}-\d{2}$/.test(from)) qs.set('from', from);
  if (to && /^\d{4}-\d{2}-\d{2}$/.test(to)) qs.set('to', to);

  const queryStr = qs.toString();
  const targetUrl = new URL(
    queryStr ? `calendar.ics?${queryStr}` : 'calendar.ics',
    BackendURL.endsWith('/') ? BackendURL : `${BackendURL}/`,
  ).toString();

  try {
    const upstream = await fetch(targetUrl, {
      method: 'GET',
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: 'no-store',
    });

    if (!upstream.ok) {
      return NextResponse.json(
        { message: 'Failed to export studio calendar' },
        { status: upstream.status },
      );
    }

    const icsText = await upstream.text();
    return new NextResponse(icsText, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition':
          upstream.headers.get('content-disposition') ||
          'attachment; filename="studio-schedule.ics"',
        'Cache-Control': 'no-store',
      },
    });
  } catch {
    return NextResponse.json(
      { message: 'Unable to reach scheduling service' },
      { status: 502 },
    );
  }
}
