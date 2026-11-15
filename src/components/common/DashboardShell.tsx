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
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

export function DashboardShell({ session, children }: DashboardShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const isStaffOnly = session.role === 'STAFF';

  const navGroups: NavGroup[] = isStaffOnly
    ? [
        {
          title: 'Workspace',
          items: [{ href: '/staff', label: 'My Assigned Tasks', icon: CheckCircleIcon }],
        },
      ]
    : [
        {
          title: 'Overview',
          items: [
            {
              href: '/admin',
              label: 'Dashboard',
              subtitle: 'Summary & alerts',
              icon: SparklesIcon,
              exact: true,
            },
          ],
        },
        {
          title: 'Client Pipeline',
          items: [
            {
              href: '/admin/inquiries',
              label: '1. Inquiries',
              subtitle: 'Client requests',
              icon: CameraIcon,
            },
            {
              href: '/admin/quotes',
              label: '2. Price Quotes',
              subtitle: 'Proposals & revisions',
              icon: ReceiptIcon,
            },
            {
              href: '/admin/bookings',
              label: '3. Bookings & Ledger',
              subtitle: 'Confirmed events & dues',
              icon: ShieldCheckIcon,
            },
          ],
        },
        {
          title: 'Schedule & Production',
          items: [
            {
              href: '/admin/calendar',
              label: 'Shoot Calendar',
              subtitle: 'Dates, crew & Google Sync',
              icon: CalendarIcon,
            },
            {
              href: '/staff',
              label: 'Crew Tasks',
              subtitle: 'Assigned shoot & edit work',
              icon: LayersIcon,
            },
          ],
        },
        {
          title: 'Studio Setup',
          items: [
            {
              href: '/admin/catalog',
              label: 'Packages & Showcase',
              subtitle: 'Pricing & public portfolio',
              icon: PaletteIcon,
            },
            {
              href: '/admin/team',
              label: 'Team & Automation',
              subtitle: 'Staff & auto-deliverables',
              icon: UsersIcon,
            },
            {
              href: '/admin/settings',
              label: 'Branding & Rules',
              subtitle: 'Logo, theme & advance policy',
              icon: SparklesIcon,
            },
          ],
        },
      ];

  const allItems = navGroups.flatMap((g) => g.items);

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

  return (
    <div className="min-h-screen flex bg-slate-50/80 text-slate-900">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 w-68 flex-col border-r border-slate-200/90 bg-white">
        {/* Brand Header */}
        <div className="px-5 py-4 border-b border-slate-100 shrink-0">
          <Link href={isStaffOnly ? '/staff' : '/admin'} className="flex items-center gap-3 group">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs group-hover:bg-indigo-700 transition-colors">
              <SparklesIcon className="w-4 h-4" />
            </span>
            <div className="min-w-0">
              <p className="text-base font-bold tracking-tight text-slate-900 truncate">
                {session.studioName}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <p className="text-[11px] font-mono-code uppercase tracking-wider text-slate-500 font-semibold">
                  {session.role}
                </p>
              </div>
            </div>
          </Link>
        </div>

        {/* Grouped Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          {navGroups.map((group) => (
            <div key={group.title} className="space-y-1">
              <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                {group.title}
              </p>
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isItemActive(item);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all group',
                      active
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900',
                    )}
                  >
                    <Icon
                      className={cn(
                        'w-4 h-4 shrink-0 transition-colors',
                        active ? 'text-white' : 'text-slate-400 group-hover:text-indigo-600',
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold leading-tight truncate">{item.label}</p>
                      {item.subtitle && (
                        <p
                          className={cn(
                            'text-[11px] truncate mt-0.5',
                            active ? 'text-indigo-100' : 'text-slate-400',
                          )}
                        >
                          {item.subtitle}
                        </p>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-100 space-y-3 bg-slate-50/50">
          <Link
            href="/"
            className="flex items-center justify-center gap-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-2xs"
          >
            <span>Public Storefront</span>
            <span className="text-slate-400">↗</span>
          </Link>

          <div className="flex items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
                {initials}
              </span>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-900 truncate">{session.name}</p>
                <p className="text-[11px] text-slate-500 truncate">{session.email}</p>
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
      <div className="flex-1 flex flex-col min-w-0 lg:pl-68">
        {/* Desktop Top Utility Bar */}
        <header className="hidden lg:flex sticky top-0 z-20 h-15 items-center justify-between border-b border-slate-200/80 bg-white/90 backdrop-blur-md px-8">
          <div className="flex items-center gap-2.5 text-sm">
            <span className="text-slate-400 font-medium">{session.studioName}</span>
            <span className="text-slate-300">/</span>
            <span className="font-semibold text-slate-900">
              {pathname.startsWith('/admin/bookings/')
                ? 'Booking Workspace'
                : activeNav?.label || 'Workspace'}
            </span>
          </div>

          {!isStaffOnly && (
            <div className="flex items-center gap-2.5">
              <Link
                href="/admin/inquiries?new=1"
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <PlusIcon className="w-3.5 h-3.5 text-indigo-600" />
                <span>Log Inquiry</span>
              </Link>
              <Link
                href="/admin/quotes?new=1"
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <PlusIcon className="w-3.5 h-3.5 text-indigo-600" />
                <span>New Quote</span>
              </Link>
              <Link
                href="/admin/calendar"
                className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 transition-colors"
              >
                <CalendarIcon className="w-3.5 h-3.5" />
                <span>Schedule</span>
              </Link>
            </div>
          )}
        </header>

        {/* Mobile Header */}
        <header className="lg:hidden sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-md px-4 py-3 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-white">
                <SparklesIcon className="w-3.5 h-3.5" />
              </span>
              <span className="text-sm font-bold tracking-tight text-slate-900">
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
            {allItems.map((item) => {
              const active = isItemActive(item);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors',
                    active
                      ? 'bg-indigo-600 text-white'
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
