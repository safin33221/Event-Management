'use client';

import React, { useRef, useState, useTransition } from 'react';
import {
  EventType,
  PortfolioEventStatus,
  PortfolioMediaItem,
  PortfolioMediaType,
  PortfolioShowcaseEvent,
} from '@/types/event-management';
import {
  archivePortfolioEvent,
  createPortfolioEvent,
  getAdminPortfolioEvent,
  publishPortfolioEvent,
  registerPortfolioMedia,
  removePortfolioMedia,
  reorderPortfolioMedia,
  signPortfolioUpload,
  unpublishPortfolioEvent,
  updatePortfolioEvent,
  updatePortfolioMedia,
} from '@/service/catalog/catalog.service';
import {
  buildCloudinaryImageUrl,
  buildCloudinaryVideoPosterUrl,
} from '@/lib/showcaseMedia';
import { cn, formatLocalDate } from '@/lib/utils';
import { PlusIcon } from '@/components/shared/Icons';
import { PortfolioEventDetailModal } from '../public/PortfolioEventDetailModal';

interface UploadQueueItem {
  localId: string;
  file: File;
  resourceType: PortfolioMediaType;
  format: string;
  progress: number;
  state: 'SIGNING' | 'UPLOADING' | 'REGISTERING' | 'DONE' | 'FAILED';
  errorMessage?: string;
  /** Cached Cloudinary response if upload succeeded before registration */
  cloudinaryResult?: {
    asset_id: string;
    public_id: string;
    secure_url: string;
    format: string;
    bytes: number;
    width?: number;
    height?: number;
    duration?: number;
    version?: number;
    signature?: string;
  };
}

function slugifyTitle(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function detectFileFormat(file: File): {
  resourceType: PortfolioMediaType;
  format: string;
} {
  const isVideo =
    file.type.startsWith('video/') ||
    /\.(mp4|webm|mov)$/i.test(file.name);
  const extFromName = file.name.split('.').pop()?.toLowerCase() || '';
  const extFromMime = file.type.split('/').pop()?.toLowerCase() || '';
  const rawFormat = extFromName || extFromMime || (isVideo ? 'mp4' : 'jpg');
  const format = rawFormat === 'quicktime' ? 'mov' : rawFormat === 'jpeg' ? 'jpg' : rawFormat;
  return {
    resourceType: isVideo ? 'VIDEO' : 'IMAGE',
    format,
  };
}

interface PortfolioEventManagerProps {
  initialEvents: PortfolioShowcaseEvent[];
  eventTypes: EventType[];
}

export function PortfolioEventManager({
  initialEvents,
  eventTypes,
}: PortfolioEventManagerProps) {
  const [events, setEvents] = useState<PortfolioShowcaseEvent[]>(initialEvents);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(
    initialEvents[0]?.id ?? null,
  );
  const [statusFilter, setStatusFilter] = useState<'ALL' | PortfolioEventStatus>('ALL');
  const [showCreateForm, setShowCreateForm] = useState(initialEvents.length === 0);
  const [previewEvent, setPreviewEvent] = useState<PortfolioShowcaseEvent | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  // Create Draft form state
  const [newTitle, setNewTitle] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [newDate, setNewDate] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newEventTypeId, setNewEventTypeId] = useState('');
  const [newDescription, setNewDescription] = useState('');

  // Edit active event metadata state
  const selectedEvent = events.find((e) => e.id === selectedEventId) ?? null;
  const [editTitle, setEditTitle] = useState(selectedEvent?.title || '');
  const [editSlug, setEditSlug] = useState(selectedEvent?.slug || '');
  const [editDate, setEditDate] = useState(
    selectedEvent?.eventDate ? selectedEvent.eventDate.slice(0, 10) : '',
  );
  const [editLocation, setEditLocation] = useState(selectedEvent?.location || '');
  const [editEventTypeId, setEditEventTypeId] = useState(selectedEvent?.eventTypeId || '');
  const [editDescription, setEditDescription] = useState(selectedEvent?.description || '');

  // Per-file upload queue (keyed by eventId)
  const [uploadQueues, setUploadQueues] = useState<Record<string, UploadQueueItem[]>>({});
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Inline caption / altText draft state per mediaId
  const [mediaEdits, setMediaEdits] = useState<
    Record<string, { caption: string; altText: string }>
  >({});

  const notify = (type: 'ok' | 'err', text: string) => setFeedback({ type, text });

  const selectEventForEditing = (ev: PortfolioShowcaseEvent) => {
    setSelectedEventId(ev.id);
    setEditTitle(ev.title);
    setEditSlug(ev.slug);
    setEditDate(ev.eventDate ? ev.eventDate.slice(0, 10) : '');
    setEditLocation(ev.location || '');
    setEditEventTypeId(ev.eventTypeId || '');
    setEditDescription(ev.description || '');
    setShowCreateForm(false);
  };

  const refreshEventInList = async (eventId: string) => {
    const res = await getAdminPortfolioEvent(eventId);
    if (res.ok && res.data) {
      setEvents((prev) =>
        prev.map((item) => (item.id === eventId ? res.data! : item)),
      );
    }
  };

  const handleCreateDraft = (e: React.FormEvent) => {
    e.preventDefault();
    const finalSlug = (newSlug || slugifyTitle(newTitle)).trim();
    if (!finalSlug) {
      notify('err', 'Please provide a valid URL slug (lowercase letters, numbers, and hyphens).');
      return;
    }

    startTransition(async () => {
      const res = await createPortfolioEvent({
        title: newTitle.trim(),
        slug: finalSlug,
        eventDate: newDate || undefined,
        location: newLocation.trim() || undefined,
        eventTypeId: newEventTypeId || undefined,
        description: newDescription.trim() || undefined,
      });
      if (!res.ok || !res.data) {
        notify('err', res.message || 'Failed to create showcase event draft.');
        return;
      }
      const created = res.data;
      setEvents((prev) => [created, ...prev]);
      selectEventForEditing(created);
      setNewTitle('');
      setNewSlug('');
      setSlugManuallyEdited(false);
      setNewDate('');
      setNewLocation('');
      setNewEventTypeId('');
      setNewDescription('');
      notify('ok', `Draft "${created.title}" created. Now drag & drop photos and highlight videos below.`);
    });
  };

  const handleSaveEventMetadata = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent) return;

    startTransition(async () => {
      const res = await updatePortfolioEvent(selectedEvent.id, {
        title: editTitle.trim(),
        slug: editSlug.trim().toLowerCase(),
        eventDate: editDate || undefined,
        location: editLocation.trim() || undefined,
        eventTypeId: editEventTypeId || undefined,
        description: editDescription.trim() || undefined,
      });
      if (!res.ok || !res.data) {
        notify('err', res.message || 'Failed to update event details.');
        return;
      }
      setEvents((prev) => prev.map((ev) => (ev.id === res.data!.id ? res.data! : ev)));
      notify('ok', 'Showcase event details saved.');
    });
  };

  const updateQueueItem = (
    eventId: string,
    localId: string,
    patch: Partial<UploadQueueItem>,
  ) => {
    setUploadQueues((prev) => ({
      ...prev,
      [eventId]: (prev[eventId] || []).map((item) =>
        item.localId === localId ? { ...item, ...patch } : item,
      ),
    }));
  };

  const removeQueueItem = (eventId: string, localId: string) => {
    setUploadQueues((prev) => ({
      ...prev,
      [eventId]: (prev[eventId] || []).filter((item) => item.localId !== localId),
    }));
  };

  /**
   * Executes direct browser-to-Cloudinary upload with live XHR progress tracking,
   * then registers the uploaded asset in PostgreSQL idempotently.
   */
  const processSingleUpload = async (eventId: string, item: UploadQueueItem) => {
    try {
      let cld = item.cloudinaryResult;

      if (!cld) {
        updateQueueItem(eventId, item.localId, {
          state: 'SIGNING',
          progress: 5,
          errorMessage: undefined,
        });

        const signRes = await signPortfolioUpload(eventId, {
          resourceType: item.resourceType,
          format: item.format,
          bytes: item.file.size,
        });

        if (!signRes.ok || !signRes.data) {
          updateQueueItem(eventId, item.localId, {
            state: 'FAILED',
            errorMessage: signRes.message || 'Upload signature request failed.',
          });
          return;
        }

        const signed = signRes.data;
        updateQueueItem(eventId, item.localId, {
          state: 'UPLOADING',
          progress: 10,
        });

        cld = await new Promise<NonNullable<UploadQueueItem['cloudinaryResult']>>(
          (resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('POST', signed.uploadUrl, true);

            xhr.upload.onprogress = (ev) => {
              if (ev.lengthComputable && ev.total > 0) {
                const pct = Math.min(95, Math.max(10, Math.round((ev.loaded / ev.total) * 90)));
                updateQueueItem(eventId, item.localId, { progress: pct });
              }
            };

            xhr.onload = () => {
              try {
                const body = JSON.parse(xhr.responseText || '{}');
                if (xhr.status >= 200 && xhr.status < 300 && body.asset_id && body.public_id) {
                  resolve(body);
                } else {
                  reject(
                    new Error(
                      body?.error?.message ||
                        `Cloudinary upload failed (HTTP ${xhr.status}).`,
                    ),
                  );
                }
              } catch {
                reject(new Error(`Cloudinary upload failed (HTTP ${xhr.status}).`));
              }
            };

            xhr.onerror = () => {
              reject(new Error('Network error while uploading directly to Cloudinary.'));
            };

            const formData = new FormData();
            formData.append('file', item.file);
            formData.append('api_key', signed.apiKey);
            formData.append('timestamp', String(signed.timestamp));
            formData.append('signature', signed.signature);
            formData.append('folder', signed.folder);
            formData.append('allowed_formats', signed.allowedFormats.join(','));
            formData.append('context', signed.context);
            if (signed.uploadPreset) {
              formData.append('upload_preset', signed.uploadPreset);
            }

            xhr.send(formData);
          },
        );

        updateQueueItem(eventId, item.localId, {
          cloudinaryResult: cld,
          progress: 96,
          state: 'REGISTERING',
        });
      } else {
        updateQueueItem(eventId, item.localId, {
          state: 'REGISTERING',
          progress: 96,
          errorMessage: undefined,
        });
      }

      const regRes = await registerPortfolioMedia(eventId, {
        assetId: cld.asset_id,
        publicId: cld.public_id,
        resourceType: item.resourceType,
        format: cld.format || item.format,
        secureUrl: cld.secure_url,
        bytes: cld.bytes || item.file.size,
        width: cld.width,
        height: cld.height,
        durationSeconds: cld.duration,
        status: 'READY',
        version: cld.version,
        responseSignature: cld.signature,
      });

      if (!regRes.ok || !regRes.data) {
        updateQueueItem(eventId, item.localId, {
          state: 'FAILED',
          errorMessage: regRes.message || 'Failed to save uploaded media in database.',
        });
        return;
      }

      updateQueueItem(eventId, item.localId, {
        state: 'DONE',
        progress: 100,
      });

      await refreshEventInList(eventId);
    } catch (err) {
      updateQueueItem(eventId, item.localId, {
        state: 'FAILED',
        errorMessage: err instanceof Error ? err.message : 'Upload failed',
      });
    }
  };

  const enqueueFilesForUpload = (files: FileList | File[]) => {
    if (!selectedEvent) return;
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    const newItems: UploadQueueItem[] = fileArray.map((file, idx) => {
      const { resourceType, format } = detectFileFormat(file);
      return {
        localId: `${Date.now()}-${idx}-${file.name}`,
        file,
        resourceType,
        format,
        progress: 0,
        state: 'SIGNING',
      };
    });

    setUploadQueues((prev) => ({
      ...prev,
      [selectedEvent.id]: [...(prev[selectedEvent.id] || []), ...newItems],
    }));

    // Upload each file independently in parallel so one failure never blocks or re-uploads others
    for (const item of newItems) {
      void processSingleUpload(selectedEvent.id, item);
    }
  };

  const handleSetCoverImage = (media: PortfolioMediaItem) => {
    if (!selectedEvent) return;
    startTransition(async () => {
      const res = await updatePortfolioMedia(selectedEvent.id, media.id, {
        isCover: true,
      });
      if (!res.ok) {
        notify('err', res.message || 'Failed to set cover image.');
        return;
      }
      await refreshEventInList(selectedEvent.id);
      notify('ok', 'Cover image updated.');
    });
  };

  const handleSaveMediaDetails = (media: PortfolioMediaItem) => {
    if (!selectedEvent) return;
    const draft = mediaEdits[media.id] ?? {
      caption: media.caption || '',
      altText: media.altText || '',
    };
    startTransition(async () => {
      const res = await updatePortfolioMedia(selectedEvent.id, media.id, {
        caption: draft.caption,
        altText: draft.altText,
      });
      if (!res.ok) {
        notify('err', res.message || 'Failed to save caption / alt text.');
        return;
      }
      await refreshEventInList(selectedEvent.id);
      notify('ok', 'Media caption & alt text saved.');
    });
  };

  const handleRetryFailedStoredMedia = (media: PortfolioMediaItem) => {
    if (!selectedEvent) return;
    startTransition(async () => {
      const res = await updatePortfolioMedia(selectedEvent.id, media.id, {
        status: 'READY',
        errorMessage: '',
      });
      if (!res.ok) {
        notify('err', res.message || 'Failed to retry media processing.');
        return;
      }
      await refreshEventInList(selectedEvent.id);
      notify('ok', 'Media marked READY.');
    });
  };

  const handleMoveMediaOrder = (index: number, direction: -1 | 1) => {
    if (!selectedEvent) return;
    const list = [...(selectedEvent.media || [])];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= list.length) return;

    const swapped = [...list];
    const temp = swapped[index];
    swapped[index] = swapped[targetIndex];
    swapped[targetIndex] = temp;

    startTransition(async () => {
      const res = await reorderPortfolioMedia(
        selectedEvent.id,
        swapped.map((m) => m.id),
      );
      if (!res.ok || !res.data) {
        notify('err', res.message || 'Failed to reorder media.');
        return;
      }
      setEvents((prev) => prev.map((ev) => (ev.id === res.data!.id ? res.data! : ev)));
    });
  };

  const handleDeleteMedia = (mediaId: string) => {
    if (!selectedEvent) return;
    startTransition(async () => {
      const res = await removePortfolioMedia(selectedEvent.id, mediaId);
      if (!res.ok) {
        notify('err', res.message || 'Failed to remove media.');
        return;
      }
      await refreshEventInList(selectedEvent.id);
      notify('ok', 'Media removed from event.');
    });
  };

  const handlePublish = () => {
    if (!selectedEvent) return;
    startTransition(async () => {
      const res = await publishPortfolioEvent(selectedEvent.id);
      if (!res.ok || !res.data) {
        notify('err', res.message || 'Cannot publish showcase event without a READY cover image.');
        return;
      }
      setEvents((prev) => prev.map((ev) => (ev.id === res.data!.id ? res.data! : ev)));
      notify('ok', `"${res.data.title}" is now PUBLISHED on the public portfolio!`);
    });
  };

  const handleUnpublish = () => {
    if (!selectedEvent) return;
    startTransition(async () => {
      const res = await unpublishPortfolioEvent(selectedEvent.id);
      if (!res.ok || !res.data) {
        notify('err', res.message || 'Failed to unpublish event.');
        return;
      }
      setEvents((prev) => prev.map((ev) => (ev.id === res.data!.id ? res.data! : ev)));
      notify('ok', `"${res.data.title}" moved back to DRAFT and removed from public listing.`);
    });
  };

  const handleArchive = () => {
    if (!selectedEvent) return;
    startTransition(async () => {
      const res = await archivePortfolioEvent(selectedEvent.id);
      if (!res.ok || !res.data) {
        notify('err', res.message || 'Failed to archive event.');
        return;
      }
      setEvents((prev) => prev.map((ev) => (ev.id === res.data!.id ? res.data! : ev)));
      notify('ok', `"${res.data.title}" archived and removed from public listing.`);
    });
  };

  const filteredEvents = events.filter((ev) =>
    statusFilter === 'ALL' ? true : ev.status === statusFilter,
  );

  const activeQueue = selectedEvent ? uploadQueues[selectedEvent.id] || [] : [];
  const hasReadyCoverImage = Boolean(
    selectedEvent &&
      ((selectedEvent.coverMedia &&
        selectedEvent.coverMedia.resourceType === 'IMAGE' &&
        selectedEvent.coverMedia.status === 'READY') ||
        (selectedEvent.media || []).some(
          (m) => m.resourceType === 'IMAGE' && m.status === 'READY',
        )),
  );

  const inputClass =
    'w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-500 focus:bg-white transition-all';

  return (
    <div className="space-y-6">
      {feedback && (
        <div
          className={cn(
            'rounded-xl border px-4 py-3 text-xs sm:text-sm font-medium flex items-center justify-between gap-3',
            feedback.type === 'ok'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
              : 'border-rose-200 bg-rose-50 text-rose-900',
          )}
        >
          <span>{feedback.text}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-xs underline shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Top Bar: Filter Tabs & Create Event Button */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 gap-1">
          {(['ALL', 'DRAFT', 'PUBLISHED', 'ARCHIVED'] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={cn(
                'rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors',
                statusFilter === st
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100',
              )}
            >
              {st === 'ALL' ? `All Events (${events.length})` : st}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setShowCreateForm((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors"
        >
          <PlusIcon className="w-3.5 h-3.5" />
          <span>{showCreateForm ? 'Close Create Form' : 'Create Event'}</span>
        </button>
      </div>

      {/* Create Showcase Event Draft Card */}
      {showCreateForm && (
        <form
          onSubmit={handleCreateDraft}
          className="atelier-card p-6 space-y-4 border-indigo-200 bg-indigo-50/20"
        >
          <div className="flex items-center justify-between border-b border-slate-200/70 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Create Showcase Event (Draft)
              </h3>
              <p className="text-xs text-slate-500">
                Create a standalone portfolio event (no customer booking required), then drag &amp;
                drop photos and highlight videos.
              </p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Event Title *
              </label>
              <input
                required
                value={newTitle}
                onChange={(e) => {
                  const val = e.target.value;
                  setNewTitle(val);
                  if (!slugManuallyEdited) {
                    setNewSlug(slugifyTitle(val));
                  }
                }}
                placeholder="e.g. Ayesha & Rafiq Royal Wedding Reception"
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                URL Slug *
              </label>
              <input
                required
                value={newSlug}
                onChange={(e) => {
                  setSlugManuallyEdited(true);
                  setNewSlug(slugifyTitle(e.target.value));
                }}
                placeholder="ayesha-rafiq-royal-wedding"
                className={`${inputClass} font-mono-code`}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Event Date
              </label>
              <input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className={`${inputClass} font-mono-code`}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Event Category
              </label>
              <select
                value={newEventTypeId}
                onChange={(e) => setNewEventTypeId(e.target.value)}
                className={inputClass}
              >
                <option value="">Select category (optional)</option>
                {eventTypes.map((et) => (
                  <option key={et.id} value={et.id}>
                    {et.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Venue / Location
              </label>
              <input
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
                placeholder="e.g. Radisson Blu Water Garden, Dhaka"
                className={inputClass}
              />
            </div>

            <div className="sm:col-span-2 lg:col-span-3">
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Story / Description
              </label>
              <textarea
                rows={2}
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Describe the event atmosphere, lighting, and story highlights..."
                className={inputClass}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-xl bg-slate-900 px-5 py-2 text-xs font-semibold text-white hover:bg-slate-800"
            >
              Create Draft &amp; Open Media Uploader →
            </button>
          </div>
        </form>
      )}

      {/* Main Split Workspace: Event List (Left) + Event Editor & Direct Cloudinary Uploader (Right) */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Column: Events List */}
        <div className="lg:col-span-4 space-y-3">
          {filteredEvents.length === 0 ? (
            <div className="atelier-card p-6 text-center text-xs text-slate-500">
              No showcase events in this filter. Click &ldquo;Create Event&rdquo; above to start a
              draft.
            </div>
          ) : (
            filteredEvents.map((ev) => {
              const isSelected = ev.id === selectedEvent?.id;
              const coverThumb =
                ev.coverMedia?.deliveryUrls?.thumbnailUrl ||
                (ev.coverMedia?.secureUrl
                  ? buildCloudinaryImageUrl(ev.coverMedia.secureUrl, {
                      width: 320,
                      height: 200,
                      crop: 'fill',
                    })
                  : '');

              return (
                <button
                  key={ev.id}
                  type="button"
                  onClick={() => selectEventForEditing(ev)}
                  className={cn(
                    'w-full text-left atelier-card p-3.5 flex items-center gap-3.5 transition-all cursor-pointer',
                    isSelected
                      ? 'ring-2 ring-indigo-600 border-indigo-500 bg-indigo-50/20'
                      : 'hover:bg-slate-50',
                  )}
                >
                  <div className="h-16 w-20 shrink-0 rounded-xl bg-slate-100 overflow-hidden border border-slate-200 flex items-center justify-center">
                    {coverThumb ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={coverThumb}
                        alt={ev.title}
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-[10px] font-semibold text-slate-400">No Cover</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={cn(
                          'rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider',
                          ev.status === 'PUBLISHED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : ev.status === 'ARCHIVED'
                              ? 'bg-slate-200 text-slate-700'
                              : 'bg-amber-100 text-amber-800',
                        )}
                      >
                        {ev.status}
                      </span>
                      {ev.eventDate && (
                        <span className="text-[11px] font-mono-code text-slate-400">
                          {formatLocalDate(ev.eventDate)}
                        </span>
                      )}
                    </div>
                    <p className="font-semibold text-sm text-slate-900 truncate mt-1">
                      {ev.title}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {ev.counts?.photos ?? 0} Photos • {ev.counts?.videos ?? 0} Videos
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Right Column: Selected Showcase Event Workspace */}
        <div className="lg:col-span-8 space-y-6">
          {!selectedEvent ? (
            <div className="atelier-card p-10 text-center text-sm text-slate-500">
              Select a showcase event on the left or create a new draft above.
            </div>
          ) : (
            <>
              {/* Action Bar & Status Banner */}
              <div className="atelier-card p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          'rounded-full px-2.5 py-0.5 text-xs font-bold uppercase',
                          selectedEvent.status === 'PUBLISHED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : selectedEvent.status === 'ARCHIVED'
                              ? 'bg-slate-200 text-slate-700'
                              : 'bg-amber-100 text-amber-800',
                        )}
                      >
                        {selectedEvent.status}
                      </span>
                      <span className="font-mono-code text-xs text-slate-500">
                        /portfolio/{selectedEvent.slug}
                      </span>
                    </div>
                    <h2 className="text-lg font-bold text-slate-900 mt-1">
                      {selectedEvent.title}
                    </h2>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPreviewEvent(selectedEvent)}
                      className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      👁 Preview
                    </button>

                    {selectedEvent.status !== 'PUBLISHED' && (
                      <button
                        type="button"
                        disabled={isPending || !hasReadyCoverImage}
                        onClick={handlePublish}
                        title={
                          hasReadyCoverImage
                            ? 'Publish event to public portfolio'
                            : 'Upload at least 1 READY cover image before publishing'
                        }
                        className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-40"
                      >
                        Publish Event ✓
                      </button>
                    )}

                    {selectedEvent.status === 'PUBLISHED' && (
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={handleUnpublish}
                        className="rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2 text-xs font-semibold text-amber-800 hover:bg-amber-100"
                      >
                        Unpublish (Move to Draft)
                      </button>
                    )}

                    {selectedEvent.status !== 'ARCHIVED' && (
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={handleArchive}
                        className="rounded-xl border border-rose-200 bg-white px-3.5 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                      >
                        Archive
                      </button>
                    )}
                  </div>
                </div>

                {!hasReadyCoverImage && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-2.5 text-xs text-amber-900">
                    <strong>Publish Requirement:</strong> Upload and select at least one{' '}
                    <strong>READY cover image</strong> below before publishing this event to the
                    public portfolio.
                  </div>
                )}

                {/* Editable Event Metadata Form */}
                <form onSubmit={handleSaveEventMetadata} className="space-y-3">
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold uppercase text-slate-500 mb-1">
                        Title
                      </label>
                      <input
                        required
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold uppercase text-slate-500 mb-1">
                        Slug
                      </label>
                      <input
                        required
                        value={editSlug}
                        onChange={(e) => setEditSlug(slugifyTitle(e.target.value))}
                        className={`${inputClass} font-mono-code`}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold uppercase text-slate-500 mb-1">
                        Event Date
                      </label>
                      <input
                        type="date"
                        value={editDate}
                        onChange={(e) => setEditDate(e.target.value)}
                        className={`${inputClass} font-mono-code`}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold uppercase text-slate-500 mb-1">
                        Category
                      </label>
                      <select
                        value={editEventTypeId}
                        onChange={(e) => setEditEventTypeId(e.target.value)}
                        className={inputClass}
                      >
                        <option value="">None</option>
                        {eventTypes.map((et) => (
                          <option key={et.id} value={et.id}>
                            {et.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-semibold uppercase text-slate-500 mb-1">
                        Venue / Location
                      </label>
                      <input
                        value={editLocation}
                        onChange={(e) => setEditLocation(e.target.value)}
                        placeholder="Venue or city"
                        className={inputClass}
                      />
                    </div>
                    <div className="sm:col-span-2 lg:col-span-3">
                      <label className="block text-[11px] font-semibold uppercase text-slate-500 mb-1">
                        Description
                      </label>
                      <textarea
                        rows={2}
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        className={inputClass}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isPending}
                      className="rounded-xl bg-slate-900 px-4 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
                    >
                      Save Event Info
                    </button>
                  </div>
                </form>
              </div>

              {/* Direct Browser-to-Cloudinary Drag-and-Drop Uploader */}
              {selectedEvent.status !== 'ARCHIVED' && (
                <div className="atelier-card p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        Upload Photos &amp; Highlight Videos (Direct to Cloudinary)
                      </h3>
                      <p className="text-xs text-slate-500">
                        Select or drag &amp; drop multiple photos and videos. Each file uploads
                        independently—if one fails, completed files stay saved.
                      </p>
                    </div>
                  </div>

                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDraggingOver(true);
                    }}
                    onDragLeave={() => setIsDraggingOver(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDraggingOver(false);
                      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                        enqueueFilesForUpload(e.dataTransfer.files);
                      }
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                      'rounded-2xl border-2 border-dashed p-6 text-center cursor-pointer transition-colors',
                      isDraggingOver
                        ? 'border-indigo-600 bg-indigo-50/70'
                        : 'border-slate-300 bg-slate-50/60 hover:border-indigo-400 hover:bg-slate-50',
                    )}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/jpeg,image/png,image/webp,image/avif,image/heic,video/mp4,video/webm,video/quicktime"
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          enqueueFilesForUpload(e.target.files);
                          e.target.value = '';
                        }
                      }}
                      className="hidden"
                    />
                    <p className="text-sm font-semibold text-slate-800">
                      Drag &amp; drop event photos and highlight videos here, or{' '}
                      <span className="text-indigo-600 underline">browse files</span>
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Supported: JPG, PNG, WebP, AVIF, HEIC (up to 15 MB) • MP4, WebM, MOV (up to
                      100 MB)
                    </p>
                  </div>

                  {/* Per-File Upload Progress, Failure & Retry Queue */}
                  {activeQueue.length > 0 && (
                    <div className="space-y-2 pt-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          Upload Queue ({activeQueue.length})
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setUploadQueues((prev) => ({
                              ...prev,
                              [selectedEvent.id]: (prev[selectedEvent.id] || []).filter(
                                (q) => q.state !== 'DONE',
                              ),
                            }))
                          }
                          className="text-xs text-slate-500 hover:text-slate-800 underline"
                        >
                          Clear completed
                        </button>
                      </div>

                      {activeQueue.map((item) => (
                        <div
                          key={item.localId}
                          className="rounded-xl border border-slate-200 bg-white p-3 space-y-2 text-xs"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="min-w-0 flex items-center gap-2">
                              <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono-code text-[10px] font-bold">
                                {item.resourceType}
                              </span>
                              <span className="font-semibold text-slate-900 truncate">
                                {item.file.name}
                              </span>
                              <span className="text-slate-400 font-mono-code">
                                ({(item.file.size / (1024 * 1024)).toFixed(1)} MB)
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <span
                                className={cn(
                                  'font-semibold',
                                  item.state === 'DONE'
                                    ? 'text-emerald-700'
                                    : item.state === 'FAILED'
                                      ? 'text-rose-700'
                                      : 'text-indigo-700',
                                )}
                              >
                                {item.state === 'DONE'
                                  ? 'READY ✓'
                                  : item.state === 'FAILED'
                                    ? 'FAILED'
                                    : `${item.state} (${item.progress}%)`}
                              </span>

                              {item.state === 'FAILED' && (
                                <button
                                  type="button"
                                  onClick={() => void processSingleUpload(selectedEvent.id, item)}
                                  className="rounded-lg bg-indigo-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-indigo-700"
                                >
                                  Retry Upload
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => removeQueueItem(selectedEvent.id, item.localId)}
                                className="rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-100"
                              >
                                Remove
                              </button>
                            </div>
                          </div>

                          <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className={cn(
                                'h-full transition-all duration-200',
                                item.state === 'FAILED'
                                  ? 'bg-rose-500'
                                  : item.state === 'DONE'
                                    ? 'bg-emerald-500'
                                    : 'bg-indigo-600',
                              )}
                              style={{ width: `${item.progress}%` }}
                            />
                          </div>

                          {item.errorMessage && (
                            <p className="text-rose-600 font-medium">{item.errorMessage}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Curated Gallery & Video Highlights List (Cover Selection, Captions, Alt Text, Reorder, Remove) */}
              <div className="atelier-card p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Event Media Items ({selectedEvent.media?.length ?? 0})
                    </h3>
                    <p className="text-xs text-slate-500">
                      Choose the cover image, write captions &amp; SEO alt text, and reorder or
                      remove items.
                    </p>
                  </div>
                </div>

                {!selectedEvent.media || selectedEvent.media.length === 0 ? (
                  <p className="text-xs text-slate-500 py-8 text-center">
                    No media uploaded to this showcase event yet.
                  </p>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {selectedEvent.media.map((m, idx) => {
                      const isCover = selectedEvent.coverMediaId === m.id;
                      const editState = mediaEdits[m.id] ?? {
                        caption: m.caption || '',
                        altText: m.altText || '',
                      };
                      const thumbUrl =
                        m.resourceType === 'VIDEO'
                          ? m.deliveryUrls?.posterUrl ||
                            buildCloudinaryVideoPosterUrl(m.secureUrl, 480)
                          : m.deliveryUrls?.thumbnailUrl ||
                            buildCloudinaryImageUrl(m.secureUrl, {
                              width: 320,
                              height: 240,
                              crop: 'fill',
                            });

                      return (
                        <div key={m.id} className="py-4 flex flex-col sm:flex-row gap-4">
                          {/* Thumbnail / Poster Preview */}
                          <div className="w-full sm:w-40 h-28 shrink-0 rounded-xl bg-slate-900 overflow-hidden relative border border-slate-200">
                            {thumbUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={thumbUrl}
                                alt={m.altText || m.caption || selectedEvent.title}
                                loading="lazy"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">
                                {m.resourceType}
                              </div>
                            )}
                            <span className="absolute top-2 left-2 rounded-md bg-slate-950/80 px-2 py-0.5 text-[10px] font-mono-code font-bold text-white">
                              #{idx + 1} • {m.resourceType}
                            </span>
                            {isCover && (
                              <span className="absolute bottom-2 left-2 rounded-md bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white shadow">
                                ★ Cover Image
                              </span>
                            )}
                          </div>

                          {/* Metadata & Controls */}
                          <div className="flex-1 space-y-2.5">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex flex-wrap items-center gap-2 text-xs">
                                <span
                                  className={cn(
                                    'rounded-full px-2 py-0.5 text-[10px] font-bold uppercase',
                                    m.status === 'READY'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : m.status === 'FAILED'
                                        ? 'bg-rose-100 text-rose-800'
                                        : 'bg-amber-100 text-amber-800',
                                  )}
                                >
                                  {m.status}
                                </span>
                                <span className="font-mono-code text-slate-500">
                                  {m.format.toUpperCase()}
                                  {m.width && m.height ? ` • ${m.width}×${m.height}` : ''}
                                  {m.durationSeconds ? ` • ${Math.round(m.durationSeconds)}s` : ''}
                                </span>
                              </div>

                              <div className="flex flex-wrap items-center gap-1.5">
                                {m.resourceType === 'IMAGE' && m.status === 'READY' && !isCover && (
                                  <button
                                    type="button"
                                    disabled={isPending}
                                    onClick={() => handleSetCoverImage(m)}
                                    className="rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
                                  >
                                    Set as Cover
                                  </button>
                                )}

                                {m.status === 'FAILED' && (
                                  <button
                                    type="button"
                                    disabled={isPending}
                                    onClick={() => handleRetryFailedStoredMedia(m)}
                                    className="rounded-lg bg-amber-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-amber-700"
                                  >
                                    Retry Processing
                                  </button>
                                )}

                                <button
                                  type="button"
                                  disabled={isPending || idx === 0}
                                  onClick={() => handleMoveMediaOrder(idx, -1)}
                                  className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-35"
                                  title="Move earlier"
                                >
                                  ↑
                                </button>
                                <button
                                  type="button"
                                  disabled={
                                    isPending || idx === (selectedEvent.media?.length ?? 1) - 1
                                  }
                                  onClick={() => handleMoveMediaOrder(idx, 1)}
                                  className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-35"
                                  title="Move later"
                                >
                                  ↓
                                </button>
                                <button
                                  type="button"
                                  disabled={isPending}
                                  onClick={() => handleDeleteMedia(m.id)}
                                  className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                                >
                                  Remove
                                </button>
                              </div>
                            </div>

                            <div className="grid sm:grid-cols-12 gap-2 items-center">
                              <input
                                value={editState.caption}
                                onChange={(e) =>
                                  setMediaEdits((prev) => ({
                                    ...prev,
                                    [m.id]: { ...editState, caption: e.target.value },
                                  }))
                                }
                                placeholder="Caption (shown under photo/video)"
                                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs sm:col-span-5"
                              />
                              <input
                                value={editState.altText}
                                onChange={(e) =>
                                  setMediaEdits((prev) => ({
                                    ...prev,
                                    [m.id]: { ...editState, altText: e.target.value },
                                  }))
                                }
                                placeholder="Image alt text (for accessibility & SEO)"
                                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs sm:col-span-5"
                              />
                              <button
                                type="button"
                                disabled={isPending}
                                onClick={() => handleSaveMediaDetails(m)}
                                className="rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 sm:col-span-2"
                              >
                                Save Text
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Live Preview Modal */}
      {previewEvent && (
        <PortfolioEventDetailModal
          event={previewEvent}
          isPreview
          onClose={() => setPreviewEvent(null)}
        />
      )}
    </div>
  );
}
