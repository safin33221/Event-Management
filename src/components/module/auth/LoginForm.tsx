'use client';

import React, { useActionState, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { login } from '@/service/auth';
import { PublicBranding } from '@/types/event-management';
import { resolvePublicBranding } from '@/lib/publicStorefront';
import { ArrowRightIcon, ShieldCheckIcon } from '@/components/shared/Icons';

export function LoginForm({
  callbackUrl,
  branding,
}: {
  callbackUrl?: string;
  branding?: PublicBranding | null;
}) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [state, formAction, isPending] = useActionState(login, {
    success: false,
    message: '',
  });

  const resolvedBrand = resolvePublicBranding(branding);
  const accent = resolvedBrand.themeTokens.accentColor || '#B91C47';
  const secondary = resolvedBrand.themeTokens.secondaryColor || '#C98A2C';

  useEffect(() => {
    if (state.success && state.redirectTo) {
      router.push(state.redirectTo);
      router.refresh();
    }
  }, [state, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7] px-4 py-12">
      <div className="w-full max-w-4xl grid lg:grid-cols-12 atelier-card overflow-hidden shadow-[0_28px_64px_-24px_rgba(24,18,22,0.18)] bg-white">
        <div className="lg:col-span-5 bg-[#141013] text-[#FAF6F0] p-8 sm:p-9 flex flex-col justify-between relative overflow-hidden">
          <div
            className="absolute inset-0 opacity-25 pointer-events-none"
            style={{
              background: `radial-gradient(circle at 12% 15%, ${accent}, transparent 55%), radial-gradient(circle at 88% 85%, ${secondary}, transparent 50%)`,
            }}
          />
          <div className="relative space-y-6">
            <Link
              href="/"
              className="inline-flex items-center gap-3 text-white hover:opacity-90 transition-opacity"
            >
              <span
                className="flex h-9 w-9 items-center justify-center rounded-xl text-white shadow-sm"
                style={{
                  background: `linear-gradient(135deg, ${accent} 0%, ${secondary} 100%)`,
                }}
              >
                <span className="font-editorial text-lg font-bold">
                  {(resolvedBrand.displayName || 'R').slice(0, 1).toUpperCase()}
                </span>
              </span>
              <div className="leading-none">
                <span className="font-editorial text-xl font-semibold block">
                  {resolvedBrand.displayName}
                </span>
                <span className="text-[10px] uppercase tracking-[0.2em] text-[#E9BE78] block mt-1">
                  Studio Workspace
                </span>
              </div>
            </Link>

            <div>
              <h1 className="font-editorial text-3xl sm:text-4xl font-semibold tracking-tight leading-tight text-white">
                Team Portal
              </h1>
              <p className="mt-3 text-sm text-[#C7B9AE] leading-relaxed">
                Sign in to manage client inquiries, craft itemized quotes, verify deposits,
                dispatch studio crew, and curate bespoke digital albums.
              </p>
            </div>
          </div>

          <div className="relative pt-8 mt-8 border-t border-white/10 space-y-2 text-xs text-[#C7B9AE]">
            <div className="flex items-center gap-2 text-white font-semibold">
              <ShieldCheckIcon className="w-4 h-4 text-[#E9BE78]" />
              <span>Role-Scoped Access</span>
            </div>
            <p>Coordinators, Accountants, and Production Crew see only their dedicated tools.</p>
          </div>
        </div>

        <div className="lg:col-span-7 p-8 sm:p-10 bg-white">
          <h2 className="font-editorial text-3xl font-semibold text-[#181216]">Sign In</h2>
          <p className="text-sm text-[#6B5A62] mt-1">
            Enter your studio credentials to open the {resolvedBrand.displayName} dashboard.
          </p>

          <form action={formAction} className="mt-6 space-y-4">
            {callbackUrl && <input type="hidden" name="callbackUrl" value={callbackUrl} />}
            {state.message && !state.success && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                {state.message}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#54474E] mb-1.5">
                Email Address
              </label>
              <input
                name="email"
                type="email"
                required
                placeholder="coordinator@rongiloevents.com"
                className="w-full rounded-xl border border-[#DFD5C7] bg-[#FDFBF7] px-3.5 py-2.5 text-sm text-[#181216] placeholder:text-[#9A8A80] outline-none focus:border-[#B91C47] focus:bg-white focus:ring-2 focus:ring-[#B91C47]/15 transition-all"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#54474E]">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="text-xs font-semibold hover:underline cursor-pointer"
                  style={{ color: accent }}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              <input
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                className="w-full rounded-xl border border-[#DFD5C7] bg-[#FDFBF7] px-3.5 py-2.5 text-sm text-[#181216] placeholder:text-[#9A8A80] outline-none focus:border-[#B91C47] focus:bg-white focus:ring-2 focus:ring-[#B91C47]/15 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={isPending}
              style={{ backgroundColor: accent }}
              className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white shadow-sm hover:opacity-95 active:scale-[0.99] transition-all disabled:opacity-60 cursor-pointer"
            >
              <span>{isPending ? 'Signing In...' : 'Enter Workspace'}</span>
              <ArrowRightIcon className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-[#EFE8DC] flex items-center justify-between text-xs text-[#6B5A62]">
            <span>Looking for the public storefront?</span>
            <Link
              href="/"
              className="font-semibold underline underline-offset-4"
              style={{ color: accent }}
            >
              Return Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
