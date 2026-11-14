'use client';

import React, { useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { login } from '@/service/auth';
import { ArrowRightIcon, ShieldCheckIcon, SparklesIcon } from '@/components/shared/Icons';

export function LoginForm() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(login, {
    success: false,
    message: '',
  });

  useEffect(() => {
    if (state.success && state.redirectTo) {
      router.push(state.redirectTo);
      router.refresh();
    }
  }, [state, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF8F5] px-4 py-12">
      <div className="w-full max-w-4xl grid lg:grid-cols-12 atelier-card overflow-hidden">
        <div className="lg:col-span-5 bg-[#141312] text-white p-8 flex flex-col justify-between">
          <div>
            <Link href="/" className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[#D6CFC5]">
              <SparklesIcon className="w-4 h-4 text-[#D97706]" />
              <span>Softilo Platform</span>
            </Link>
            <h1 className="font-display text-4xl font-semibold mt-6 leading-tight">
              Studio & Event Command Portal
            </h1>
            <p className="mt-3 text-sm text-[#B8B0A6] leading-relaxed">
              Sign in with your studio credentials to manage inquiries, versioned quotes, verified
              advance ledgers, crew reservations, and deliverables.
            </p>
          </div>

          <div className="pt-8 border-t border-white/10 space-y-2 text-xs text-[#B8B0A6]">
            <div className="flex items-center gap-2 text-white font-medium">
              <ShieldCheckIcon className="w-4 h-4 text-emerald-400" />
              <span>Role-Based Studio Access</span>
            </div>
            <p>Owners, Coordinators, Accountants, and Crew see role-appropriate workspaces.</p>
          </div>
        </div>

        <div className="lg:col-span-7 p-8 sm:p-10 bg-white">
          <h2 className="font-display text-3xl font-semibold text-[#141312]">Sign In</h2>
          <p className="text-sm text-[#6B655D] mt-1">
            Enter your email and password to access your studio workspace.
          </p>

          <form action={formAction} className="mt-6 space-y-4">
            {state.message && !state.success && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                {state.message}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#4A453F] mb-1.5">
                Email Address
              </label>
              <input
                name="email"
                type="email"
                required
                placeholder="admin@softilo.local"
                className="w-full rounded-xl border border-[#D8CFC2] bg-[#FAF8F5] px-3.5 py-2.5 text-sm outline-none focus:border-[#141312] focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#4A453F] mb-1.5">
                Password
              </label>
              <input
                name="password"
                type="password"
                required
                placeholder="••••••••"
                className="w-full rounded-xl border border-[#D8CFC2] bg-[#FAF8F5] px-3.5 py-2.5 text-sm outline-none focus:border-[#141312] focus:bg-white"
              />
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#141312] px-5 py-3 text-sm font-semibold text-white hover:bg-[#2A2725] transition-colors disabled:opacity-60"
            >
              <span>{isPending ? 'Signing In...' : 'Enter Workspace'}</span>
              <ArrowRightIcon className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-[#E6DFD5] flex items-center justify-between text-xs text-[#6B655D]">
            <span>Looking for the public storefront?</span>
            <Link href="/" className="font-semibold text-[#141312] underline underline-offset-4">
              Return Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
