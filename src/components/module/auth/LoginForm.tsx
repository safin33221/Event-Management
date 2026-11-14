'use client';

import React, { useActionState, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { login } from '@/service/auth';
import { ArrowRightIcon, ShieldCheckIcon, SparklesIcon } from '@/components/shared/Icons';

export function LoginForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
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
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-4xl grid lg:grid-cols-12 atelier-card overflow-hidden shadow-lg shadow-slate-900/5">
        <div className="lg:col-span-5 bg-slate-900 text-white p-8 flex flex-col justify-between relative overflow-hidden">
          <div
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{
              background:
                'radial-gradient(circle at 15% 15%, #6366F1, transparent 55%), radial-gradient(circle at 85% 85%, #4F46E5, transparent 50%)',
            }}
          />
          <div className="relative">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-300 hover:text-indigo-200 transition-colors"
            >
              <SparklesIcon className="w-4 h-4 text-indigo-400" />
              <span>Softilo Platform</span>
            </Link>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mt-6 leading-tight">
              Studio &amp; Event Command Portal
            </h1>
            <p className="mt-3 text-sm text-slate-300 leading-relaxed">
              Sign in with your studio credentials to manage inquiries, versioned quotes, verified
              advance ledgers, crew reservations, and deliverables.
            </p>
          </div>

          <div className="relative pt-8 border-t border-white/10 space-y-2 text-xs text-slate-300">
            <div className="flex items-center gap-2 text-white font-semibold">
              <ShieldCheckIcon className="w-4 h-4 text-emerald-400" />
              <span>Role-Based Studio Access</span>
            </div>
            <p>Owners, Coordinators, Accountants, and Crew see role-appropriate workspaces.</p>
          </div>
        </div>

        <div className="lg:col-span-7 p-8 sm:p-10 bg-white">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Sign In</h2>
          <p className="text-sm text-slate-500 mt-1">
            Enter your email and password to access your studio workspace.
          </p>

          <form action={formAction} className="mt-6 space-y-4">
            {state.message && !state.success && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                {state.message}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Email Address
              </label>
              <input
                name="email"
                type="email"
                required
                placeholder="admin@softilo.local"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/15 transition-all"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              <input
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/15 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 active:scale-[0.99] transition-all disabled:opacity-60"
            >
              <span>{isPending ? 'Signing In...' : 'Enter Workspace'}</span>
              <ArrowRightIcon className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Looking for the public storefront?</span>
            <Link
              href="/"
              className="font-semibold text-indigo-600 hover:text-indigo-700 underline underline-offset-4"
            >
              Return Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
