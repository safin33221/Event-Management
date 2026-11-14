'use client';

import React, { useTransition } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { AuthUserSession } from '@/types/event-management';
import { logout } from '@/service/auth';
import { cn } from '@/lib/utils';
import {
  CalendarIcon,
  LayersIcon,
  LogOutIcon,
  PaletteIcon,
  ReceiptIcon,
  SparklesIcon,
  UsersIcon,
} from '@/components/shared/Icons';

interface DashboardShellProps {
  session: AuthUserSession;
  children: React.ReactNode;
}

export function DashboardShell({ session, children }: DashboardShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const isStaffOnly = session.role === 'STAFF';

  const navItems = isStaffOnly
    ? [{ href: '/staff', label: 'My Tasks', icon: UsersIcon }]
    : [
      { href: '/admin', label: 'Home', icon: SparklesIcon },
      { href: '/admin/bookings', label: 'Bookings & Payments', icon: ReceiptIcon },
      { href: '/admin/calendar', label: 'Schedule', icon: CalendarIcon },
      { href: '/admin/catalog', label: 'Packages & Settings', icon: PaletteIcon },
      { href: '/staff', label: 'Staff Tasks', icon: LayersIcon },
    ];

  const handleLogout = () => {
    startTransition(async () => {
      await logout();
      router.push('/login');
      router.refresh();
    });
  };

  const initials = (session.name || 'U')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900">
      {/* Fixed Sidebar */}
      <aside className="hidden lg:flex lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 w-64 flex-col border-r border-slate-200 bg-white">
        <div className="p-5 border-b border-slate-200 shrink-0">
          <Link href="/admin" className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
              <SparklesIcon className="w-4 h-4" />
            </span>
            <div className="min-w-0">
              <p className="text-lg font-bold tracking-tight text-slate-900 truncate">
                {session.studioName}
              </p>
              <p className="text-xs font-mono-code uppercase tracking-wider text-indigo-600 font-medium">
                {session.role}
              </p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active =
              item.href === '/admin'
                ? pathname === '/admin'
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[15px] font-medium transition-all',
                  active
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                )}
              >
                <Icon className={cn('w-4 h-4 shrink-0', active ? 'text-indigo-400' : 'text-slate-400')} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-200 space-y-3">
          <Link
            href="/"
            className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-center text-sm font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
          >
            View Public Website ↗
          </Link>

          <div className="flex items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-xs font-bold text-indigo-700 border border-indigo-100">
                {initials}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">{session.name}</p>
                <p className="text-xs text-slate-500 truncate">{session.email}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              disabled={isPending}
              title="Sign out"
              className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
            >
              <LogOutIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Mobile Header */}
        <header className="lg:hidden sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-md px-4 py-3 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-white">
                <SparklesIcon className="w-3.5 h-3.5" />
              </span>
              <span className="text-base font-bold tracking-tight text-slate-900">
                {session.studioName}
              </span>
              <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-mono-code font-semibold text-indigo-700 border border-indigo-100">
                {session.role}
              </span>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              disabled={isPending}
              className="rounded-lg px-2.5 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50"
            >
              Sign out
            </button>
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
            {navItems.map((item) => {
              const active =
                item.href === '/admin'
                  ? pathname === '/admin'
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors',
                    active
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:text-slate-900',
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
