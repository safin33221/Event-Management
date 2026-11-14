'use client';

import React, { useState, useTransition } from 'react';
import {
  EventType,
  StudioPackage,
  StudioSettings,
  UserRole,
} from '@/types/event-management';
import {
  addAgencyMember,
  updateAgencyBranding,
} from '@/service/agency/agency.service';
import {
  createPackage,
  createPortfolioItem,
  updatePackage,
} from '@/service/catalog/catalog.service';
import { cn, formatPoisha } from '@/lib/utils';
import { PaletteIcon, PlusIcon } from '@/components/shared/Icons';

interface CatalogWorkspaceProps {
  initialSettings: StudioSettings | null;
  initialPackages: StudioPackage[];
  eventTypes: EventType[];
  initialMembers: Array<{
    id: string;
    email: string;
    name: string;
    role: UserRole;
    isActive: boolean;
  }>;
}

export function CatalogWorkspace({
  initialSettings,
  initialPackages,
  eventTypes,
  initialMembers,
}: CatalogWorkspaceProps) {
  const [settings, setSettings] = useState<StudioSettings | null>(initialSettings);
  const [packages, setPackages] = useState<StudioPackage[]>(initialPackages);
  const [members, setMembers] = useState(initialMembers);
  const [activeTab, setActiveTab] = useState<'packages' | 'team' | 'showcase' | 'settings'>('packages');
  const [showAddPkg, setShowAddPkg] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  // Branding state
  const [brandName, setBrandName] = useState(initialSettings?.displayName || '');
  const [logoUrl, setLogoUrl] = useState(initialSettings?.logoUrl || '');
  const [primaryColor, setPrimaryColor] = useState(
    initialSettings?.themeTokens?.primaryColor || '#0F172A',
  );
  const [accentColor, setAccentColor] = useState(
    initialSettings?.themeTokens?.accentColor || '#4F46E5',
  );
  const [timezone, setTimezone] = useState(initialSettings?.timezone || 'Asia/Dhaka');
  const [advancePolicyType, setAdvancePolicyType] = useState<'NONE' | 'PERCENTAGE' | 'FIXED'>(
    initialSettings?.advancePolicyType || 'PERCENTAGE',
  );
  const [advancePolicyValue, setAdvancePolicyValue] = useState(
    String(initialSettings?.advancePolicyValue ?? 20),
  );

  // Package creation state
  const [pkgName, setPkgName] = useState('');
  const [pkgSlug, setPkgSlug] = useState('');
  const [pkgPriceTk, setPkgPriceTk] = useState('50000');
  const [pkgDesc, setPkgDesc] = useState('');
  const [pkgEventTypeId, setPkgEventTypeId] = useState('');

  // Portfolio creation state
  const [portTitle, setPortTitle] = useState('');
  const [portMediaUrl, setPortMediaUrl] = useState('');

  // Team member creation state
  const [memName, setMemName] = useState('');
  const [memEmail, setMemEmail] = useState('');
  const [memPassword, setMemPassword] = useState('');
  const [memRole, setMemRole] = useState<UserRole>('STAFF');

  const notify = (type: 'ok' | 'err', text: string) => setFeedback({ type, text });

  const handleSaveBranding = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await updateAgencyBranding({
        name: brandName,
        logoUrl: logoUrl || null,
        themeTokens: {
          primaryColor,
          accentColor,
        },
        timezone,
        advancePolicyType,
        advancePolicyValue: Number(advancePolicyValue) || 0,
      });
      if (!res.ok || !res.data) {
        notify('err', res.message || 'Failed to update branding (Owner access required)');
        return;
      }
      setSettings(res.data);
      notify('ok', 'Studio branding & operational policy updated');
    });
  };

  const handleCreatePackage = (e: React.FormEvent) => {
    e.preventDefault();
    const basePricePoisha = Math.round(Number(pkgPriceTk) * 100);
    startTransition(async () => {
      const res = await createPackage({
        name: pkgName,
        slug: pkgSlug || pkgName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        description: pkgDesc || undefined,
        eventTypeId: pkgEventTypeId || undefined,
        basePricePoisha,
        isPublished: true,
      });
      if (!res.ok || !res.data) {
        notify('err', res.message || 'Failed to create package');
        return;
      }
      setPackages([...packages, res.data]);
      setPkgName('');
      setPkgSlug('');
      setPkgDesc('');
      notify('ok', `Package "${res.data.name}" published`);
    });
  };

  const handleTogglePublish = (pkg: StudioPackage) => {
    startTransition(async () => {
      const res = await updatePackage(pkg.id, { isPublished: !pkg.isPublished });
      if (!res.ok || !res.data) {
        notify('err', res.message || 'Failed to update package');
        return;
      }
      setPackages(packages.map((p) => (p.id === pkg.id ? res.data! : p)));
    });
  };

  const handleAddPortfolio = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await createPortfolioItem({
        title: portTitle,
        mediaUrl: portMediaUrl,
        isApproved: true,
        isPublished: true,
      });
      if (!res.ok) {
        notify('err', res.message || 'Failed to add portfolio item');
        return;
      }
      setPortTitle('');
      setPortMediaUrl('');
      notify('ok', 'Approved portfolio item published to public storefront');
    });
  };

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await addAgencyMember({
        name: memName,
        email: memEmail,
        password: memPassword || undefined,
        role: memRole,
      });
      if (!res.ok || !res.data) {
        notify('err', res.message || 'Failed to add member');
        return;
      }
      setMembers([
        ...members,
        {
          id: res.data.id,
          email: res.data.email,
          name: res.data.name,
          role: res.data.role,
          isActive: res.data.isActive,
        },
      ]);
      setMemName('');
      setMemEmail('');
      setMemPassword('');
      notify('ok', `Added ${res.data.name} (${res.data.role})`);
    });
  };

  const currency = settings?.currency || 'BDT';
  const inputClass =
    'w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/15 transition-all';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Packages &amp; Settings
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage your service packages, team members, showcase photos, and studio branding.
          </p>
        </div>

        <div className="inline-flex flex-wrap rounded-xl border border-slate-200 bg-white p-1 gap-1">
          {[
            { id: 'packages', label: `Packages (${packages.length})` },
            { id: 'team', label: `Team (${members.length})` },
            { id: 'showcase', label: 'Showcase' },
            { id: 'settings', label: 'Branding & Rules' },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id as typeof activeTab)}
              className={cn(
                'rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors',
                activeTab === t.id
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {feedback && (
        <div
          className={cn(
            'rounded-xl border px-4 py-3 text-sm flex items-center justify-between',
            feedback.type === 'ok'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
              : 'border-rose-200 bg-rose-50 text-rose-900',
          )}
        >
          <span>{feedback.text}</span>
          <button type="button" onClick={() => setFeedback(null)} className="text-xs underline">
            Dismiss
          </button>
        </div>
      )}

      {/* TAB 1: PACKAGES */}
      {activeTab === 'packages' && (
        <div className="atelier-card p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold tracking-tight text-slate-900">
                Service Packages
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Published packages appear on your public website for clients to select.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowAddPkg((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors"
            >
              <PlusIcon className="w-3.5 h-3.5" />
              <span>{showAddPkg ? 'Close' : 'Add Package'}</span>
            </button>
          </div>

          {showAddPkg && (
            <form
              onSubmit={(e) => {
                handleCreatePackage(e);
                setShowAddPkg(false);
              }}
              className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 grid sm:grid-cols-2 gap-3"
            >
              <input
                required
                value={pkgName}
                onChange={(e) => setPkgName(e.target.value)}
                placeholder="Package name (e.g. Gold Wedding)"
                className={inputClass}
              />
              <input
                type="number"
                min="0"
                required
                value={pkgPriceTk}
                onChange={(e) => setPkgPriceTk(e.target.value)}
                placeholder={`Base price (${currency})`}
                className={`${inputClass} font-mono-code`}
              />
              <select
                value={pkgEventTypeId}
                onChange={(e) => setPkgEventTypeId(e.target.value)}
                className={inputClass}
              >
                <option value="">Any event type</option>
                {eventTypes.map((et) => (
                  <option key={et.id} value={et.id}>
                    {et.name}
                  </option>
                ))}
              </select>
              <input
                value={pkgDesc}
                onChange={(e) => setPkgDesc(e.target.value)}
                placeholder="Short description"
                className={inputClass}
              />
              <div className="sm:col-span-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
                >
                  <PlusIcon className="w-3.5 h-3.5" />
                  <span>Save &amp; Publish Package</span>
                </button>
              </div>
            </form>
          )}

          {packages.length === 0 ? (
            <p className="text-sm text-slate-500 py-8 text-center">
              No packages yet. Click &ldquo;Add Package&rdquo; to create your first offering.
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {packages.map((pkg) => (
                <div key={pkg.id} className="py-3.5 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-sm text-slate-900">{pkg.name}</p>
                    <p className="font-mono-code text-xs text-slate-500 mt-0.5 tabular-nums">
                      {formatPoisha(pkg.basePricePoisha, currency)}
                      {pkg.description ? ` • ${pkg.description}` : ''}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleTogglePublish(pkg)}
                    className={cn(
                      'rounded-full px-3 py-1 text-[11px] font-semibold border transition-colors',
                      pkg.isPublished
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                        : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200',
                    )}
                  >
                    {pkg.isPublished ? 'Published' : 'Draft'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: TEAM */}
      {activeTab === 'team' && (
        <div className="atelier-card p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold tracking-tight text-slate-900">Studio Team</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Add coordinators, accountants, or crew members with their login role.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowAddMember((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors"
            >
              <PlusIcon className="w-3.5 h-3.5" />
              <span>{showAddMember ? 'Close' : 'Add Member'}</span>
            </button>
          </div>

          {showAddMember && (
            <form
              onSubmit={(e) => {
                handleAddMember(e);
                setShowAddMember(false);
              }}
              className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 grid sm:grid-cols-2 gap-3"
            >
              <input
                required
                value={memName}
                onChange={(e) => setMemName(e.target.value)}
                placeholder="Full name"
                className={inputClass}
              />
              <input
                required
                type="email"
                value={memEmail}
                onChange={(e) => setMemEmail(e.target.value)}
                placeholder="Email address"
                className={inputClass}
              />
              <input
                type="password"
                value={memPassword}
                onChange={(e) => setMemPassword(e.target.value)}
                placeholder="Initial password (min 6 chars)"
                className={inputClass}
              />
              <select
                value={memRole}
                onChange={(e) => setMemRole(e.target.value as UserRole)}
                className={inputClass}
              >
                <option value="COORDINATOR">Coordinator</option>
                <option value="ACCOUNTANT">Accountant</option>
                <option value="STAFF">Staff / Crew</option>
                <option value="OWNER">Owner</option>
              </select>
              <div className="sm:col-span-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
                >
                  Save Team Member
                </button>
              </div>
            </form>
          )}

          <div className="divide-y divide-slate-100">
            {members.map((m) => (
              <div key={m.id} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <p className="font-semibold text-sm text-slate-900">{m.name}</p>
                  <p className="text-slate-500">{m.email}</p>
                </div>
                <span className="rounded-full bg-slate-100 border border-slate-200 px-3 py-0.5 font-mono-code text-[11px] font-semibold text-slate-700">
                  {m.role}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: SHOWCASE */}
      {activeTab === 'showcase' && (
        <form onSubmit={handleAddPortfolio} className="atelier-card p-6 space-y-4 max-w-2xl">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold tracking-tight text-slate-900">
              Publish Showcase Photo
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Add an approved photo or story to your public homepage showcase.
            </p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Title *</label>
            <input
              required
              value={portTitle}
              onChange={(e) => setPortTitle(e.target.value)}
              placeholder="e.g. Autumn Wedding Reception at Dhaka"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Image URL *</label>
            <input
              required
              value={portMediaUrl}
              onChange={(e) => setPortMediaUrl(e.target.value)}
              placeholder="https://images.example.com/story.jpg"
              className={inputClass}
            />
          </div>
          <button
            type="submit"
            disabled={isPending}
            className="rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors"
          >
            Publish to Storefront
          </button>
        </form>
      )}

      {/* TAB 4: BRANDING & SETTINGS */}
      {activeTab === 'settings' && (
        <form onSubmit={handleSaveBranding} className="atelier-card p-6 space-y-5 max-w-2xl">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold tracking-tight text-slate-900">
                Branding &amp; Booking Rules
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Customize how your studio appears on the public storefront.
              </p>
            </div>
            <PaletteIcon className="w-5 h-5 text-slate-400" />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Studio Name
              </label>
              <input
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                className={inputClass}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1">Logo URL</label>
              <input
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://cdn.example.com/logo.png"
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Primary Color
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="h-9 w-10 rounded-lg border border-slate-200 cursor-pointer"
                />
                <input
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className={`${inputClass} font-mono-code text-xs`}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Accent Color
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="h-9 w-10 rounded-lg border border-slate-200 cursor-pointer"
                />
                <input
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className={`${inputClass} font-mono-code text-xs`}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Timezone</label>
              <input
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className={`${inputClass} font-mono-code text-xs`}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Required Advance Deposit
              </label>
              <div className="flex gap-2">
                <select
                  value={advancePolicyType}
                  onChange={(e) =>
                    setAdvancePolicyType(e.target.value as 'NONE' | 'PERCENTAGE' | 'FIXED')
                  }
                  className="rounded-xl border border-slate-200 bg-slate-50/70 px-2.5 py-2 text-xs"
                >
                  <option value="PERCENTAGE">%</option>
                  <option value="FIXED">Fixed</option>
                  <option value="NONE">None</option>
                </select>
                <input
                  type="number"
                  min="0"
                  value={advancePolicyValue}
                  onChange={(e) => setAdvancePolicyValue(e.target.value)}
                  className={`${inputClass} font-mono-code text-xs`}
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors"
          >
            Save Settings
          </button>
        </form>
      )}
    </div>
  );
}
