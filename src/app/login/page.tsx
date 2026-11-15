import React, { Suspense } from 'react';
import { LoginForm } from '@/components/module/auth/LoginForm';
import { PageSkeleton } from '@/components/shared/PageSkeleton';

async function LoginContent({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const params = await searchParams;
  const raw = params?.callbackUrl;
  const callbackUrl =
    typeof raw === 'string' &&
    raw.startsWith('/') &&
    !raw.startsWith('//') &&
    !raw.includes('\\') &&
    !raw.includes('://')
      ? raw
      : undefined;

  return <LoginForm callbackUrl={callbackUrl} />;
}

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  return (
    <Suspense fallback={<PageSkeleton label="Loading sign in..." />}>
      <LoginContent searchParams={searchParams} />
    </Suspense>
  );
}
