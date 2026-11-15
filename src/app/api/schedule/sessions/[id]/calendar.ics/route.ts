import { NextRequest, NextResponse } from 'next/server';
import { getCookies } from '@/service/auth/tokenHandler';

const BackendURL =
  process.env.BACKEND_URL ?? process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:3000';

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  if (!id || !/^[a-zA-Z0-9-]+$/.test(id)) {
    return NextResponse.json({ message: 'Invalid session identifier' }, { status: 400 });
  }

  const accessToken = await getCookies('accessToken');
  if (!accessToken) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const targetUrl = new URL(
    `sessions/${encodeURIComponent(id)}/calendar.ics`,
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
        { message: 'Failed to export session calendar file' },
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
          `attachment; filename="session-${id}.ics"`,
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
