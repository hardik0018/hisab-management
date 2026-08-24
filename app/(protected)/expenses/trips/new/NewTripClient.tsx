'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Calendar,
  Users,
  Compass,
  Plus,
  Trash2,
  Check,
  User,
  Sparkles,
  Info,
} from 'lucide-react';
import { toast } from 'sonner';
import { TripCategory } from '@/types/trip';
import { cn } from '@/lib/utils';
import { v4 as uuidv4 } from 'uuid';

interface NewTripClientProps {
  collaborators: { user_id: string; name: string }[];
  currentUserId: string;
  currentUserName: string;
}

const TEMPLATE_SUGGESTIONS = [
  { title: 'Village Visit', emoji: '🛕', category: 'village_visit' as TripCategory },
  { title: 'Weekend Road Trip', emoji: '🚗', category: 'weekend' as TripCategory },
  { title: 'Family Function', emoji: '🎉', category: 'family_function' as TripCategory },
  { title: 'Goa Vacation', emoji: '🏖️', category: 'vacation' as TripCategory },
];

const CATEGORY_OPTIONS: { id: TripCategory; label: string; emoji: string }[] = [
  { id: 'village_visit', label: 'Village Visit', emoji: '🛕' },
  { id: 'weekend', label: 'Weekend Trip', emoji: '🚗' },
  { id: 'vacation', label: 'Vacation', emoji: '🏖️' },
  { id: 'family_function', label: 'Family Function', emoji: '🎉' },
  { id: 'road_trip', label: 'Road Trip', emoji: '🛣️' },
  { id: 'event', label: 'Event / Party', emoji: '🎪' },
  { id: 'other', label: 'Other', emoji: '🌴' },
];

export default function NewTripClient({
  collaborators,
  currentUserId,
  currentUserName,
}: NewTripClientProps) {
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [destination, setDestination] = useState('');
  const [budget, setBudget] = useState('');
  const [category, setCategory] = useState<TripCategory>('village_visit');
  const [coverEmoji, setCoverEmoji] = useState('🛕');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [isGroupTrip, setIsGroupTrip] = useState(false);
  const [selectedCollaboratorIds, setSelectedCollaboratorIds] = useState<string[]>([]);
  const [customMembers, setCustomMembers] = useState<string[]>([]);
  const [customMemberInput, setCustomMemberInput] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto detect emoji & category based on title typing
  const handleTitleChange = (val: string) => {
    setTitle(val);
    const lower = val.toLowerCase();
    if (lower.includes('village') || lower.includes('gam') || lower.includes('home')) {
      setCoverEmoji('🛕');
      setCategory('village_visit');
    } else if (lower.includes('goa') || lower.includes('beach') || lower.includes('vacation')) {
      setCoverEmoji('🏖️');
      setCategory('vacation');
    } else if (lower.includes('wedding') || lower.includes('function') || lower.includes('prasang') || lower.includes('party')) {
      setCoverEmoji('🎉');
      setCategory('family_function');
    } else if (lower.includes('road') || lower.includes('drive') || lower.includes('car') || lower.includes('bike')) {
      setCoverEmoji('🚗');
      setCategory('road_trip');
    }
  };

  const handleApplyTemplate = (tmpl: typeof TEMPLATE_SUGGESTIONS[0]) => {
    setTitle(tmpl.title);
    setCoverEmoji(tmpl.emoji);
    setCategory(tmpl.category);
  };

  const handleToggleCollaborator = (userId: string) => {
    setSelectedCollaboratorIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleAddCustomMember = () => {
    if (!customMemberInput.trim()) return;
    setCustomMembers((prev) => [...prev, customMemberInput.trim()]);
    setCustomMemberInput('');
  };

  const handleRemoveCustomMember = (index: number) => {
    setCustomMembers((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCreate = async (startActive: boolean) => {
    if (!title.trim()) {
      toast.error('Please enter a trip name');
      return;
    }

    setIsSubmitting(true);
    try {
      const tripMembers: {
        id: string;
        name: string;
        isCurrentUser?: boolean;
        userId?: string;
      }[] = [
        {
          id: `mem_${uuidv4().slice(0, 8)}`,
          name: currentUserName || 'Me',
          isCurrentUser: true,
          userId: currentUserId,
        },
      ];

      if (isGroupTrip) {
        selectedCollaboratorIds.forEach((cId) => {
          const collab = collaborators.find((c) => c.user_id === cId);
          if (collab && collab.user_id !== currentUserId) {
            tripMembers.push({
              id: `mem_${uuidv4().slice(0, 8)}`,
              name: collab.name,
              userId: collab.user_id,
              isCurrentUser: false,
            });
          }
        });

        customMembers.forEach((name) => {
          tripMembers.push({
            id: `mem_${uuidv4().slice(0, 8)}`,
            name,
            isCurrentUser: false,
          });
        });
      }

      const res = await fetch('/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          destination: destination.trim() || title.trim(),
          category,
          startDate: startDate || new Date().toISOString().split('T')[0],
          endDate: endDate || '',
          budget: budget ? parseFloat(budget) : 0,
          coverEmoji: coverEmoji || '🌴',
          isCurrentActive: startActive,
          status: startActive ? 'active' : 'planned',
          members: tripMembers,
          notes: notes.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to create trip');

      if (startActive) {
        toast.success(`"${title}" created and set as Active Trip! 🚀`);
      } else {
        toast.success(`"${title}" saved as planned trip! 📝`);
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('active_trip_changed'));
      }

      router.push('/expenses/trips');
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create trip');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 max-w-lg mx-auto">
      {/* ── Top Nav / Header ────────────────────────────────────────── */}
      <div className="flex items-center gap-3 pt-1">
        <Link
          href="/expenses/trips"
          className="p-2 rounded-xl bg-secondary text-foreground hover:bg-muted active:scale-95 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Create Trip
          </h1>
          <p className="text-xs text-muted-foreground">
            Start a trip to auto-track all your expenses across the app.
          </p>
        </div>
      </div>

      {/* ── Quick Templates ─────────────────────────────────────────── */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-500" />
          <span>Quick Suggestions</span>
        </label>
        <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {TEMPLATE_SUGGESTIONS.map((t) => (
            <button
              key={t.title}
              type="button"
              onClick={() => handleApplyTemplate(t)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-secondary hover:bg-muted text-xs font-medium text-foreground whitespace-nowrap active:scale-95 transition-all border border-border"
            >
              <span>{t.emoji}</span>
              <span>{t.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Main Form Card ──────────────────────────────────────────── */}
      <div className="card-surface p-4 rounded-2xl border border-border space-y-4">
        {/* Name & Emoji */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-foreground">
            Trip Name <span className="text-rose-500">*</span>
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={coverEmoji}
              onChange={(e) => setCoverEmoji(e.target.value)}
              className="w-12 text-center text-xl py-2 rounded-xl bg-secondary border border-border outline-none focus:border-primary"
              placeholder="🌴"
              maxLength={4}
            />
            <input
              type="text"
              placeholder="e.g. Village Visit, Goa Trip, Ramesh Wedding"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="flex-1 px-3.5 py-2.5 text-sm rounded-xl bg-secondary border border-border outline-none focus:border-primary font-medium placeholder:text-muted-foreground transition-all"
              autoFocus
            />
          </div>
        </div>

        {/* Category Picker */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-foreground">Trip Category</label>
          <div className="grid grid-cols-2 gap-1.5">
            {CATEGORY_OPTIONS.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  setCategory(c.id);
                  setCoverEmoji(c.emoji);
                }}
                className={cn(
                  'flex items-center gap-2 p-2 rounded-xl text-xs font-medium border transition-all text-left',
                  category === c.id
                    ? 'bg-primary/10 border-primary text-primary font-bold shadow-sm'
                    : 'bg-secondary border-border text-foreground hover:bg-muted'
                )}
              >
                <span className="text-base">{c.emoji}</span>
                <span className="truncate">{c.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Destination & Budget */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">Destination</label>
            <input
              type="text"
              placeholder="e.g. Rajkot / Goa"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-secondary border border-border outline-none focus:border-primary placeholder:text-muted-foreground"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">Budget (₹ Optional)</label>
            <input
              type="number"
              placeholder="e.g. 10000"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-secondary border border-border outline-none focus:border-primary placeholder:text-muted-foreground"
            />
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-secondary border border-border outline-none focus:border-primary"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">End Date (Optional)</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-secondary border border-border outline-none focus:border-primary"
            />
          </div>
        </div>

        {/* Trip Type: Solo vs Group */}
        <div className="space-y-2 pt-1 border-t border-border">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-foreground">Trip Members</span>
              <p className="text-[11px] text-muted-foreground">
                Split expenses between friends or track solo.
              </p>
            </div>
            <div className="flex p-0.5 bg-secondary rounded-lg border border-border">
              <button
                type="button"
                onClick={() => setIsGroupTrip(false)}
                className={cn(
                  'px-2.5 py-1 text-xs font-bold rounded-md transition-all',
                  !isGroupTrip
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                Solo
              </button>
              <button
                type="button"
                onClick={() => setIsGroupTrip(true)}
                className={cn(
                  'px-2.5 py-1 text-xs font-bold rounded-md transition-all',
                  isGroupTrip
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                Group
              </button>
            </div>
          </div>

          {isGroupTrip && (
            <div className="space-y-3 pt-2">
              {collaborators.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold text-muted-foreground">
                    Select from Collaborators:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {collaborators.map((c) => {
                      const selected = selectedCollaboratorIds.includes(c.user_id);
                      return (
                        <button
                          key={c.user_id}
                          type="button"
                          onClick={() => handleToggleCollaborator(c.user_id)}
                          className={cn(
                            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold border transition-all',
                            selected
                              ? 'bg-primary text-white border-primary shadow-sm'
                              : 'bg-secondary text-foreground border-border hover:bg-muted'
                          )}
                        >
                          <User className="w-3 h-3" />
                          <span>{c.name}</span>
                          {selected && <Check className="w-3 h-3" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Add Custom Member */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-muted-foreground">
                  Add Custom Member Name:
                </span>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    placeholder="e.g. Ramesh, Priya"
                    value={customMemberInput}
                    onChange={(e) => setCustomMemberInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustomMember();
                      }
                    }}
                    className="flex-1 px-3 py-1.5 text-xs rounded-xl bg-secondary border border-border outline-none focus:border-primary placeholder:text-muted-foreground"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomMember}
                    className="px-3 py-1.5 text-xs font-bold rounded-xl bg-secondary border border-border text-foreground hover:bg-muted active:scale-95 transition-all"
                  >
                    Add
                  </button>
                </div>

                {customMembers.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {customMembers.map((name, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold bg-secondary border border-border text-foreground"
                      >
                        <span>{name}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveCustomMember(idx)}
                          className="text-muted-foreground hover:text-rose-500 ml-0.5"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Notes (Optional) */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-foreground">Notes (Optional)</label>
          <textarea
            rows={2}
            placeholder="Important items to remember, vehicle number, packing list..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl bg-secondary border border-border outline-none focus:border-primary placeholder:text-muted-foreground resize-none"
          />
        </div>
      </div>

      {/* ── Auto-Detect Notice ──────────────────────────────────────── */}
      <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs flex items-start gap-2.5 text-amber-900 dark:text-amber-200">
        <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-[11px] leading-relaxed">
          <strong>Auto-Tagging in Action:</strong> When you start this trip, all expenses you add anywhere in the app (Today page, Hisab, etc.) will automatically tag to this trip until you stop it!
        </div>
      </div>

      {/* ── Action Buttons ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 pt-2">
        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => handleCreate(false)}
          className="py-3 rounded-2xl text-xs font-bold bg-secondary text-foreground border border-border hover:bg-muted active:scale-95 transition-all disabled:opacity-50"
        >
          Save as Planned
        </button>

        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => handleCreate(true)}
          className="py-3 rounded-2xl text-xs font-bold text-white shadow-md active:scale-95 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
          style={{ backgroundImage: 'var(--gradient-hero)' }}
        >
          <Compass className="w-4 h-4" />
          <span>{isSubmitting ? 'Starting...' : 'Create & Start Trip'}</span>
        </button>
      </div>
    </div>
  );
}
