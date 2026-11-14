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

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#64748B]">
          White-Label Studio & Offerings
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A] mt-1">
          Catalog, Team & Branding
        </h1>
      </div>

      {feedback && (
        <div
          className={cn(
            'rounded-xl border px-4 py-3 text-sm',
            feedback.type === 'ok'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
              : 'border-rose-200 bg-rose-50 text-rose-900',
          )}
        >
          {feedback.text}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Branding & Policy */}
        <form onSubmit={handleSaveBranding} className="lg:col-span-6 atelier-card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
            <h2 className="text-lg font-bold tracking-tight">White-Label Branding</h2>
            <PaletteIcon className="w-5 h-5 text-[#64748B]" />
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold uppercase text-[#64748B] mb-1">
                Studio Display Name
              </label>
              <input
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                className="w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-3 py-2 text-sm"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold uppercase text-[#64748B] mb-1">
                Logo URL
              </label>
              <input
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://cdn.example.com/logo.png"
                className="w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase text-[#64748B] mb-1">
                Primary Color
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="h-9 w-10 rounded border border-[#CBD5E1]"
                />
                <input
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="flex-1 rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-3 py-2 text-xs font-mono-code"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase text-[#64748B] mb-1">
                Accent Color
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="h-9 w-10 rounded border border-[#CBD5E1]"
                />
                <input
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="flex-1 rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-3 py-2 text-xs font-mono-code"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase text-[#64748B] mb-1">
                Timezone
              </label>
              <input
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-3 py-2 text-xs font-mono-code"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase text-[#64748B] mb-1">
                Advance Policy
              </label>
              <div className="flex gap-2">
                <select
                  value={advancePolicyType}
                  onChange={(e) =>
                    setAdvancePolicyType(e.target.value as 'NONE' | 'PERCENTAGE' | 'FIXED')
                  }
                  className="rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-2.5 py-2 text-xs"
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
                  className="w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-3 py-2 text-xs font-mono-code"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="rounded-xl bg-[#0F172A] px-5 py-2.5 text-xs font-semibold text-white"
          >
            Save Studio Branding
          </button>
        </form>

        {/* Packages */}
        <div className="lg:col-span-6 atelier-card p-6 space-y-4">
          <h2 className="text-lg font-bold tracking-tight border-b border-[#E2E8F0] pb-3">
            Packages
          </h2>

          <form onSubmit={handleCreatePackage} className="grid sm:grid-cols-2 gap-2.5">
            <input
              required
              value={pkgName}
              onChange={(e) => setPkgName(e.target.value)}
              placeholder="Package name"
              className="rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-3 py-2 text-xs"
            />
            <input
              type="number"
              min="0"
              required
              value={pkgPriceTk}
              onChange={(e) => setPkgPriceTk(e.target.value)}
              placeholder={`Base price (${currency})`}
              className="rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-3 py-2 text-xs font-mono-code"
            />
            <select
              value={pkgEventTypeId}
              onChange={(e) => setPkgEventTypeId(e.target.value)}
              className="rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-3 py-2 text-xs"
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
              className="rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-3 py-2 text-xs"
            />
            <button
              type="submit"
              disabled={isPending}
              className="sm:col-span-2 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#0F172A] px-4 py-2 text-xs font-semibold text-white"
            >
              <PlusIcon className="w-3.5 h-3.5" />
              <span>Add & Publish Package</span>
            </button>
          </form>

          <div className="divide-y divide-[#E2E8F0] pt-2">
            {packages.map((pkg) => (
              <div key={pkg.id} className="py-2.5 flex items-center justify-between gap-2 text-xs">
                <div>
                  <p className="font-semibold text-sm">{pkg.name}</p>
                  <p className="font-mono-code text-[#64748B]">
                    {formatPoisha(pkg.basePricePoisha, currency)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleTogglePublish(pkg)}
                  className={cn(
                    'rounded-full px-3 py-1 text-[11px] font-semibold border',
                    pkg.isPublished
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-stone-100 text-stone-600 border-stone-200',
                  )}
                >
                  {pkg.isPublished ? 'Published' : 'Draft'}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Portfolio Publisher */}
        <form onSubmit={handleAddPortfolio} className="lg:col-span-6 atelier-card p-6 space-y-3">
          <h2 className="text-lg font-bold tracking-tight">Publish Showcase Asset</h2>
          <input
            required
            value={portTitle}
            onChange={(e) => setPortTitle(e.target.value)}
            placeholder="Showcase title"
            className="w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-3 py-2 text-sm"
          />
          <input
            required
            value={portMediaUrl}
            onChange={(e) => setPortMediaUrl(e.target.value)}
            placeholder="https://images.example.com/story.jpg"
            className="w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={isPending}
            className="rounded-xl border border-[#CBD5E1] px-4 py-2 text-xs font-semibold hover:bg-[#F1F5F9]"
          >
            Approve & Publish to Storefront
          </button>
        </form>

        {/* Team Members */}
        <div className="lg:col-span-6 atelier-card p-6 space-y-4">
          <h2 className="text-lg font-bold tracking-tight">Studio Team</h2>
          <form onSubmit={handleAddMember} className="grid sm:grid-cols-2 gap-2.5">
            <input
              required
              value={memName}
              onChange={(e) => setMemName(e.target.value)}
              placeholder="Name"
              className="rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-3 py-2 text-xs"
            />
            <input
              required
              type="email"
              value={memEmail}
              onChange={(e) => setMemEmail(e.target.value)}
              placeholder="Email"
              className="rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-3 py-2 text-xs"
            />
            <input
              type="password"
              value={memPassword}
              onChange={(e) => setMemPassword(e.target.value)}
              placeholder="Initial password (min 6 chars)"
              className="rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-3 py-2 text-xs"
            />
            <select
              value={memRole}
              onChange={(e) => setMemRole(e.target.value as UserRole)}
              className="rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-3 py-2 text-xs"
            >
              <option value="COORDINATOR">Coordinator</option>
              <option value="ACCOUNTANT">Accountant</option>
              <option value="STAFF">Staff / Crew</option>
              <option value="OWNER">Owner</option>
            </select>
            <button
              type="submit"
              disabled={isPending}
              className="sm:col-span-2 rounded-xl bg-[#0F172A] px-4 py-2 text-xs font-semibold text-white"
            >
              Add Team Member
            </button>
          </form>

          <div className="divide-y divide-[#E2E8F0]">
            {members.map((m) => (
              <div key={m.id} className="py-2 flex items-center justify-between text-xs">
                <div>
                  <p className="font-semibold">{m.name}</p>
                  <p className="text-[#64748B]">{m.email}</p>
                </div>
                <span className="rounded-full bg-[#F1F5F9] px-2.5 py-0.5 font-mono-code text-[10px] font-semibold">
                  {m.role}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
