'use client';

import React, { useTransition } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { AuthUserSession } from '@/types/event-management';
import { logout } from '@/service/auth';
import { cn } from '@/lib/utils';
import {
  CalendarIcon,
  CameraIcon,
  CheckCircleIcon,
  LayersIcon,
  LogOutIcon,
  PaletteIcon,
  PlusIcon,
  ReceiptIcon,
  ShieldCheckIcon,
  SparklesIcon,
  UsersIcon,
} from '@/components/shared/Icons';

interface DashboardShellProps {
  session: AuthUserSession;
  children: React.ReactNode;
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
}

export function DashboardShell({ session, children }: DashboardShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const isStaffOnly = session.role === 'STAFF';

  const primaryNav: NavItem[] = isStaffOnly
    ? [{ href: '/staff', label: 'My Tasks', icon: CheckCircleIcon }]
    : [
        { href: '/admin', label: 'Overview', icon: SparklesIcon, exact: true },
        { href: '/admin/inquiries', label: 'Inquiries', icon: CameraIcon },
        { href: '/admin/quotes', label: 'Quotes', icon: ReceiptIcon },
        { href: '/admin/bookings', label: 'Bookings', icon: ShieldCheckIcon },
        { href: '/admin/calendar', label: 'Schedule', icon: CalendarIcon },
        { href: '/staff', label: 'Crew Tasks', icon: LayersIcon },
      ];

  const studioNav: NavItem[] = isStaffOnly
    ? []
    : [
        { href: '/admin/portfolio', label: 'Portfolio', icon: CameraIcon },
        { href: '/admin/catalog', label: 'Packages', icon: PaletteIcon },
        { href: '/admin/team', label: 'Team & Rules', icon: UsersIcon },
        { href: '/admin/settings', label: 'Settings', icon: SparklesIcon },
      ];

  const allItems = [...primaryNav, ...studioNav];

  const isItemActive = (item: NavItem) => {
    if (item.exact || item.href === '/admin') {
      return pathname === item.href;
    }
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  };

  const activeNav = allItems.find(isItemActive) || allItems[0];

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

  const renderNavLink = (item: NavItem) => {
    const Icon = item.icon;
    const active = isItemActive(item);
    return (
      <Link
        key={item.href}
        href={item.href}
        className={cn(
          'flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors',
          active
            ? 'bg-slate-900 text-white'
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
        )}
      >
        <Icon
          className={cn(
            'w-4 h-4 shrink-0',
            active ? 'text-indigo-400' : 'text-slate-400',
          )}
        />
        <span className="truncate">{item.label}</span>
      </Link>
    );
  };

  return (
    <div className="min-h-screen flex bg-slate-50/70 text-slate-900">
      {/* Minimal Desktop Sidebar */}
      <aside className="hidden lg:flex lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 w-56 flex-col border-r border-slate-200/80 bg-white">
        {/* Studio Brand */}
        <div className="h-14 px-4 flex items-center border-b border-slate-100 shrink-0">
          <Link
            href={isStaffOnly ? '/staff' : '/admin'}
            className="flex items-center gap-2.5 min-w-0"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-white">
              <SparklesIcon className="w-3.5 h-3.5" />
            </span>
            <span className="text-sm font-bold tracking-tight text-slate-900 truncate">
              {session.studioName}
            </span>
          </Link>
        </div>

        {/* Clean Single-Line Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
          <div className="space-y-0.5">{primaryNav.map(renderNavLink)}</div>

          {studioNav.length > 0 && (
            <div className="pt-3 border-t border-slate-100 space-y-0.5">
              <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Studio
              </p>
              {studioNav.map(renderNavLink)}
            </div>
          )}
        </nav>

        {/* Minimal Footer */}
        <div className="p-3 border-t border-slate-100 space-y-2">
          <Link
            href="/"
            className="flex items-center justify-between rounded-lg px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
          >
            <span>Public Website</span>
            <span>↗</span>
          </Link>

          <div className="flex items-center justify-between gap-2 px-2 py-1">
            <div className="flex items-center gap-2 min-w-0">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[11px] font-bold text-slate-700">
                {initials}
              </span>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-900 truncate">{session.name}</p>
                <p className="text-[10px] font-mono-code uppercase text-slate-400">
                  {session.role}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              disabled={isPending}
              title="Sign out"
              className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
            >
              <LogOutIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-56">
        {/* Desktop Top Bar */}
        <header className="hidden lg:flex sticky top-0 z-20 h-14 items-center justify-between border-b border-slate-200/70 bg-white/90 backdrop-blur-md px-8">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-semibold text-slate-900">
              {pathname.startsWith('/admin/bookings/')
                ? 'Booking Details'
                : activeNav?.label || 'Workspace'}
            </span>
          </div>

          {!isStaffOnly && (
            <div className="flex items-center gap-2">
              <Link
                href="/admin/inquiries?new=1"
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <PlusIcon className="w-3.5 h-3.5 text-slate-500" />
                <span>Inquiry</span>
              </Link>
              <Link
                href="/admin/quotes?new=1"
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <PlusIcon className="w-3.5 h-3.5 text-slate-500" />
                <span>Quote</span>
              </Link>
              <Link
                href="/admin/calendar"
                className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 transition-colors"
              >
                <CalendarIcon className="w-3.5 h-3.5" />
                <span>Schedule</span>
              </Link>
            </div>
          )}
        </header>

        {/* Mobile Header */}
        <header className="lg:hidden sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-md px-4 py-2.5 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900 text-white">
                <SparklesIcon className="w-3.5 h-3.5" />
              </span>
              <span className="text-sm font-bold tracking-tight text-slate-900">
                {session.studioName}
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
          <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
            {allItems.map((item) => {
              const active = isItemActive(item);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'rounded-lg px-2.5 py-1 text-xs font-medium whitespace-nowrap transition-colors',
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
