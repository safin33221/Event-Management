import { NextRequest, NextResponse } from 'next/server';
import { getCookies } from '@/service/auth/tokenHandler';

const BackendURL =
  process.env.BACKEND_URL ?? process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:3000';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  if (!id || !/^[a-zA-Z0-9-]+$/.test(id)) {
    return NextResponse.json({ message: 'Invalid booking identifier' }, { status: 400 });
  }

  const accessToken = await getCookies('accessToken');
  if (!accessToken) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const disposition = request.nextUrl.searchParams.get('disposition');
  const qs = disposition === 'inline' ? '?disposition=inline' : '';
  const targetUrl = new URL(
    `bookings/${encodeURIComponent(id)}/invoice.pdf${qs}`,
    BackendURL.endsWith('/') ? BackendURL : `${BackendURL}/`,
  ).toString();

  try {
    const upstream = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: 'no-store',
    });

    if (!upstream.ok) {
      const text = await upstream.text().catch(() => 'Failed to generate PDF invoice');
      return new NextResponse(text, {
        status: upstream.status,
        headers: {
          'Content-Type': upstream.headers.get('content-type') || 'application/json',
        },
      });
    }

    const pdfBytes = await upstream.arrayBuffer();
    const contentDisposition =
      upstream.headers.get('content-disposition') ||
      `attachment; filename="invoice-${id}.pdf"`;

    return new NextResponse(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': contentDisposition,
        'Cache-Control': 'no-store',
      },
    });
  } catch {
    return NextResponse.json(
      { message: 'Failed to connect to backend invoice generator' },
      { status: 503 },
    );
  }
}
