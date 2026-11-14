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
    ? [{ href: '/staff', label: 'My Assignments', icon: UsersIcon }]
    : [
        { href: '/admin', label: 'Overview', icon: SparklesIcon },
        { href: '/admin/bookings', label: 'Bookings & Ledger', icon: ReceiptIcon },
        { href: '/admin/calendar', label: 'Schedule & Crew', icon: CalendarIcon },
        { href: '/admin/catalog', label: 'Catalog & Branding', icon: PaletteIcon },
        { href: '/staff', label: 'Crew View', icon: LayersIcon },
      ];

  const handleLogout = () => {
    startTransition(async () => {
      await logout();
      router.push('/login');
      router.refresh();
    });
  };

  return (
    <div className="min-h-screen flex bg-[#FAF8F5] text-[#141312]">
      {/* Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col border-r border-[#E6DFD5] bg-white">
        <div className="p-5 border-b border-[#E6DFD5]">
          <Link href="/admin" className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#141312] text-white">
              <SparklesIcon className="w-4 h-4" />
            </span>
            <div className="min-w-0">
              <p className="font-display text-lg font-semibold truncate">{session.studioName}</p>
              <p className="text-[10px] font-mono-code uppercase tracking-wider text-[#6B655D]">
                {session.role}
              </p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 p-3 space-y-1">
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
                  'flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors',
                  active
                    ? 'bg-[#141312] text-white shadow-sm'
                    : 'text-[#4A453F] hover:bg-[#F3EFE9] hover:text-[#141312]',
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[#E6DFD5] space-y-3">
          <Link
            href="/"
            className="block w-full rounded-xl border border-[#D8CFC2] px-3 py-2 text-center text-xs font-semibold text-[#141312] hover:bg-[#F3EFE9] transition-colors"
          >
            View Public Storefront ↗
          </Link>

          <div className="flex items-center justify-between gap-2 pt-1">
            <div className="min-w-0">
              <p className="text-xs font-semibold truncate">{session.name}</p>
              <p className="text-[11px] text-[#6B655D] truncate">{session.email}</p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              disabled={isPending}
              title="Sign out"
              className="rounded-lg p-2 text-[#6B655D] hover:bg-rose-50 hover:text-rose-700 transition-colors"
            >
              <LogOutIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between border-b border-[#E6DFD5] bg-white px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="font-display text-lg font-semibold">{session.studioName}</span>
            <span className="rounded-full bg-[#F3EFE9] px-2 py-0.5 text-[10px] font-mono-code font-semibold">
              {session.role}
            </span>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'rounded-lg px-2.5 py-1 text-xs font-medium whitespace-nowrap',
                  pathname === item.href ? 'bg-[#141312] text-white' : 'text-[#4A453F]',
                )}
              >
                {item.label}
              </Link>
            ))}
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg px-2 py-1 text-xs font-medium text-rose-700"
            >
              Exit
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
