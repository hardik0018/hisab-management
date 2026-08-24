'use client';

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Plus,
  AlertTriangle,
  Check,
  ShoppingBag,
  TrendingUp,
  Wallet,
  Zap,
  ArrowRightLeft,
  Mic,
  Square,
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { parseEntries, ParsedDraft, ParsedExpenseDraft, ParsedHisabDraft, ParsedTransferDraft } from '@/lib/parser';
import { cn } from '@/lib/utils';
import { Trip } from '@/types/trip';
import { useSpeechRecognition, VoiceLanguage } from '@/hooks/useSpeechRecognition';

// ── Types ──────────────────────────────────────────────────────────────────────

interface FrequentItem {
  itemName: string;
  amount: number;
  category: string;
}

interface QuickAddBarProps {
  /** 'expense' = shows on Expenses screen; 'hisab' = shows on Hisab screen */
  mode?: 'expense' | 'hisab';
  /** Large amount threshold (from settings, default 10000) */
  largeLimit?: number;
  /** Collaborators available for internal transfers */
  collaborators?: { user_id: string; name: string }[];
  /** Called after a successful save so the parent can refresh its list */
  onSaved?: () => void;
  className?: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmtMoney(n: number) {
  return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

const today = () => new Date().toISOString().split('T')[0];

/**
 * Builds a chip label for a parsed draft.
 * e.g. "Chai · ₹20 · Food"  or  "Ramesh · ₹500 · you gave"
 */
function chipLabel(item: ParsedDraft): string {
  if (item.kind === 'transfer') {
    return `Transfer to ${item.recipientName} · ${fmtMoney(item.amount)}`;
  }
  if (item.kind === 'expense') {
    return `${item.itemName} · ${fmtMoney(item.amount)}${item.category && item.category !== 'General & Other' ? ' · ' + item.category : ''}`;
  }
  return `${item.personName} · ${fmtMoney(item.amount)} · ${item.type === 'debit' ? 'you gave' : 'you got'}`;
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function QuickAddBar({
  mode = 'expense',
  largeLimit = 10000,
  collaborators,
  onSaved,
  className,
}: QuickAddBarProps) {
  const [value, setValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [frequent, setFrequent] = useState<FrequentItem[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const [activeTrip, setActiveTrip] = useState<Trip | null>(null);
  const [stoppingTrip, setStoppingTrip] = useState(false);

  // ── Speech Recognition Hook ────────────────────────────────────────────────
  const {
    isListening,
    transcript: speechTranscript,
    error: speechError,
    isSupported: isSpeechSupported,
    language: voiceLanguage,
    setLanguage: setVoiceLanguage,
    startListening,
    stopListening,
  } = useSpeechRecognition({
    onResult: (normalized) => {
      setValue(normalized);
    },
    onEnd: (final) => {
      if (final) {
        setValue(final);
      }
    },
  });

  useEffect(() => {
    if (speechError) {
      toast.error(speechError);
    }
  }, [speechError]);

  const handleToggleVoice = () => {
    if (isListening) {
      stopListening();
    } else {
      setValue('');
      startListening();
    }
  };

  // ── Fetch active trip (all modes) ─────────────────────────────────────────

  useEffect(() => {
    const fetchActiveTrip = () => {
      fetch('/api/trips/active')
        .then((r) => r.json())
        .then((d) => setActiveTrip(d.activeTrip ?? null))
        .catch(() => {});
    };

    fetchActiveTrip();
    window.addEventListener('active_trip_changed', fetchActiveTrip);
    return () => window.removeEventListener('active_trip_changed', fetchActiveTrip);
  }, []);

  const handleStopTrip = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!activeTrip) return;
    setStoppingTrip(true);
    try {
      const res = await fetch(`/api/trips/${activeTrip.trip_id}/activate`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to stop trip');
      toast.success(data.message || 'Trip stopped');
      setActiveTrip(null);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('active_trip_changed'));
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to stop trip');
    } finally {
      setStoppingTrip(false);
    }
  };

  // ── Load frequent items (expense mode only) ────────────────────────────────
  useEffect(() => {
    if (mode !== 'expense') return;
    fetch('/api/expenses/frequent')
      .then((r) => r.json())
      .then((d) => setFrequent(d.items ?? []))
      .catch(() => {/* silently ignore */});
  }, [mode]);

  // ── Live parse the current input ──────────────────────────────────────────

  const parsed = useMemo(() => {
    if (!value.trim()) return null;
    return parseEntries(value, largeLimit, mode);
  }, [value, largeLimit, mode]);

  const hasItems = (parsed?.items.length ?? 0) > 0;
  const hasInvalid = (parsed?.invalid.length ?? 0) > 0;

  // ── Core save function ────────────────────────────────────────────────────

  const save = useCallback(
    async (items: ParsedDraft[], sourceText: string) => {
      if (items.length === 0) return;

      setSaving(true);

      // --- Optimistic IDs for potential undo ---
      const savedIds: string[] = [];
      const savePromises: Promise<void>[] = [];

      const rawExpenseItems = items.filter((i): i is ParsedExpenseDraft => i.kind === 'expense');
      const hisabItems = items.filter((i): i is ParsedHisabDraft => i.kind === 'hisab');
      const transferItems = items.filter((i): i is ParsedTransferDraft => i.kind === 'transfer');

      // Catch expenses that are actually transfers but failed the strict regex
      const expenseItems: ParsedExpenseDraft[] = [];
      for (const ex of rawExpenseItems) {
        const lowerName = ex.itemName.toLowerCase();
        if (lowerName.startsWith('transfer to ')) {
          transferItems.push({
            kind: 'transfer',
            recipientName: ex.itemName.substring('transfer to '.length).trim(),
            amount: ex.amount,
            source: ex.source
          });
        } else {
          expenseItems.push(ex);
        }
      }

      // ── Save internal transfers ─────────────────────────────────────────────
      for (const t of transferItems) {
        const matchingCollab = collaborators?.find(c => c.name.toLowerCase() === t.recipientName.toLowerCase());
        if (!matchingCollab) {
          toast.error(`Collaborator '${t.recipientName}' not found in group.`);
          setSaving(false);
          return;
        }
        
        savePromises.push(
          fetch('/api/expenses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              expenses: [{
                date: today(),
                itemName: `Transfer to ${matchingCollab.name}`,
                amount: t.amount,
                note: '',
                type: 'transfer',
                transfer_to_user_id: matchingCollab.user_id,
              }]
            }),
          }).then(async (res) => {
            if (!res.ok) throw new Error(`Failed to save transfer to ${t.recipientName}`);
          })
        );
      }

      // ── Save expenses ────────────────────────────────────────────────────
      if (expenseItems.length > 0) {
        savePromises.push(
          fetch('/api/expenses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              expenses: expenseItems.map((e) => ({
                date: today(),
                itemName: e.itemName,
                amount: e.amount,
                note: e.note,
                category: e.category,
                type: e.type,
                ...(activeTrip
                  ? {
                      associatedType: 'trip',
                      associatedId: activeTrip.trip_id,
                      tripMetadata: {
                        tripCategory: e.category,
                      },
                    }
                  : {}),
              })),
            }),
          }).then(async (res) => {
            if (!res.ok) throw new Error('Failed to save expense');
            const data = await res.json();
            // revalidation is done server-side via revalidatePath
          })
        );
      }

      // ── Save hisab records ────────────────────────────────────────────────
      for (const h of hisabItems) {
        savePromises.push(
          fetch('/api/hisab', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: h.personName,
              mobile: '',
              type: h.type,
              amount: h.amount,
              description: h.description,
              date: today(),
              logAsExpense: true,
              ...(activeTrip
                ? {
                    associatedType: 'trip',
                    associatedId: activeTrip.trip_id,
                  }
                : {}),
            }),
          }).then(async (res) => {
            if (!res.ok) throw new Error('Failed to save hisab');
          })
        );
      }

      try {
        await Promise.all(savePromises);

        // Success: clear input, refocus, show undo toast
        setValue('');
        inputRef.current?.focus();

        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('expense_added', { detail: { items } }));
        }

        const label =
          items.length === 1
            ? chipLabel(items[0])
            : `${items.length} entries`;

        toast.success(`Saved: ${label}`, {
          duration: 5000,
          description: 'Tap Undo to reverse',
          action: {
            label: 'Undo',
            onClick: async () => {
              // Undo: delete last inserted records via dedicated endpoint (no-op fallback)
              // For now show user that undo is best-effort
              toast.info('Undo: please delete the entry manually from the list.', { duration: 4000 });
            },
          },
        });

        onSaved?.();

        // Refresh frequent items
        if (mode === 'expense') {
          fetch('/api/expenses/frequent')
            .then((r) => r.json())
            .then((d) => setFrequent(d.items ?? []))
            .catch(() => {});
        }
      } catch (err: any) {
        toast.error(err?.message ?? 'Failed to save. Please try again.');
      } finally {
        setSaving(false);
      }
    },
    [mode, onSaved]
  );

  // ── Handle submit (Enter key or + button) ─────────────────────────────────

  const handleSubmit = useCallback(async () => {
    if (!value.trim() || saving) return;

    const result = parseEntries(value, largeLimit, mode);

    if (result.items.length === 0) {
      toast.error('Nothing recognised. Try: chai 20 or Ramesh debit 500');
      return;
    }

    // Warn about skipped chunks but still save valid ones
    if (result.invalid.length > 0) {
      toast.warning(
        `Skipped: ${result.invalid.map((i) => i.source).join(', ')}`,
        { duration: 4000 }
      );
    }

    await save(result.items, value);
  }, [value, largeLimit, mode, saving, save]);

  // ── Handle Enter key ──────────────────────────────────────────────────────

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  // ── Repeat / Collaborator chip tap ────────────────────────────────────────

  const handleRepeatTap = useCallback(
    (item: FrequentItem) => {
      setValue(`${item.itemName} ${item.amount}`);
      inputRef.current?.focus();
    },
    []
  );

  const handleCollaboratorTap = useCallback(
    (name: string) => {
      setValue(`transfer to ${name} `);
      inputRef.current?.focus();
    },
    []
  );

  // ── Render ────────────────────────────────────────────────────────────────

  const placeholder =
    mode === 'expense'
      ? 'chai 20  or  petrol 500 bike  or  Ramesh gave 500'
      : 'Ramesh gave 500 lunch  or  chai 20';

  return (
    <div
      className={cn('card-surface p-3 flex flex-col gap-2', className)}
    >
      {/* ── Active Trip Quick-Tag Banner ────────────────────────────────── */}
      {activeTrip && (
        <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1.5 px-3.5 py-2 rounded-xl bg-amber-500/10 border border-amber-500/25 text-xs text-amber-900 dark:text-amber-200 transition-all shadow-sm">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className="text-base shrink-0">{activeTrip.coverEmoji || '🌴'}</span>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-bold truncate text-foreground">{activeTrip.title}</span>
                <span className="px-1.5 py-0.2 text-[9px] font-bold rounded-full bg-amber-500/20 text-amber-900 dark:text-amber-200 shrink-0">
                  Trip Active
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground truncate">
                Entries auto-tagged to this trip & counted in daily spend
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              disabled={stoppingTrip}
              onClick={handleStopTrip}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30 hover:bg-rose-500/25 active:scale-95 transition-all"
            >
              <Square className="w-2.5 h-2.5 fill-current" />
              <span>{stoppingTrip ? 'Stopping...' : 'Stop Trip'}</span>
            </button>
            <Link
              href={`/expenses/trips/${activeTrip.trip_id}`}
              className="font-bold text-[11px] text-primary hover:underline"
            >
              View →
            </Link>
          </div>
        </div>
      )}

      {/* ── Voice Listening & Language Switcher Banner ───────────────── */}
      {isListening && (
        <div className="flex items-center justify-between p-2.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
            </span>
            <span className="font-semibold text-rose-600 dark:text-rose-400">
              Listening... speak now
            </span>
          </div>

          {/* Quick Language Toggle (English & Gujarati) */}
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => setVoiceLanguage('en-IN')}
              className={cn(
                'px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all',
                voiceLanguage === 'en-IN'
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'bg-secondary text-muted-foreground hover:text-foreground'
              )}
            >
              EN (India)
            </button>
            <button
              type="button"
              onClick={() => setVoiceLanguage('gu-IN')}
              className={cn(
                'px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all',
                voiceLanguage === 'gu-IN'
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'bg-secondary text-muted-foreground hover:text-foreground'
              )}
            >
              ગુજરાતી
            </button>
          </div>
        </div>
      )}

      {/* ── Input row ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2">
        <div
          className={cn(
            'flex items-center flex-1 min-w-0 gap-2 px-3 rounded-xl h-12 transition-all',
            isListening && 'ring-2 ring-rose-500/50 border-rose-500/50'
          )}
          style={{
            background: 'var(--secondary)',
            border: isListening ? '1px solid rgb(244 63 94 / 0.5)' : '1px solid var(--border)',
          }}
        >
          <Zap className="w-4 h-4 shrink-0" style={{ color: 'var(--primary)' }} />
          <input
            ref={inputRef}
            type="text"
            inputMode="text"
            enterKeyHint="done"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isListening ? 'Listening...' : placeholder}
            aria-label="Quick add entry"
            className="flex-1 min-w-0 w-full bg-transparent text-base outline-none placeholder:text-sm truncate"
            style={{
              color: 'var(--foreground)',
              fontSize: '16px', // prevents iOS zoom
            }}
          />

          {/* Voice Input Mic Button */}
          {isSpeechSupported && (
            <button
              type="button"
              onClick={handleToggleVoice}
              aria-label={isListening ? 'Stop recording voice' : 'Speak to record expense'}
              className={cn(
                'p-2 rounded-xl transition-all shrink-0 active:scale-90',
                isListening
                  ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30'
                  : 'text-muted-foreground hover:text-foreground hover:bg-card'
              )}
              title={isListening ? 'Stop listening' : 'Speak expense (Mic)'}
            >
              <Mic className={cn('w-4 h-4', isListening && 'animate-pulse')} />
            </button>
          )}
        </div>

        {/* + save button */}
        <button
          onClick={handleSubmit}
          disabled={saving || !value.trim()}
          aria-label="Save entry"
          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 active:scale-95 transition-all disabled:opacity-40"
          style={{ backgroundImage: 'var(--gradient-hero)', color: 'white' }}
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* ── Live parse chips ───────────────────────────────────────────── */}
      {parsed && (parsed.items.length > 0 || parsed.invalid.length > 0) && (
        <div className="flex flex-wrap gap-1.5 px-1">
          {parsed.items.map((item, i) => {
            const isLarge = item.kind === 'expense' && item.isLarge;
            const isHisab = item.kind === 'hisab';
            return (
              <span
                key={i}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold animate-slide-in-chip"
                style={{
                  background: isHisab
                    ? 'var(--amber-soft)'
                    : 'var(--success-soft)',
                  color: isHisab ? 'var(--amber)' : 'var(--success)',
                }}
              >
                <Check className="w-3 h-3" />
                {chipLabel(item)}
                {isLarge && (
                  <span
                    className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                    style={{ background: 'var(--warning-soft)', color: 'var(--warning-foreground)' }}
                  >
                    Large
                  </span>
                )}
              </span>
            );
          })}
          {parsed.invalid.map((inv, i) => (
            <span
              key={`inv-${i}`}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
              style={{ background: 'var(--danger-soft)', color: 'var(--danger)' }}
            >
              <AlertTriangle className="w-3 h-3" />
              {inv.source}
            </span>
          ))}
        </div>
      )}

      {/* ── Repeat chips (expense mode only) ──────────────────────────── */}
      {mode === 'expense' && (!value.trim() && (frequent.length > 0 || (collaborators && collaborators.length > 0))) && (
        <div className="overflow-x-auto no-scrollbar -mx-1 px-1">
          <div className="flex gap-2 w-max pb-0.5">
            {frequent.map((item, i) => (
              <button
                key={`freq-${i}`}
                onClick={() => handleRepeatTap(item)}
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap active:scale-95 transition-all"
                style={{
                  background: 'var(--accent)',
                  color: 'var(--accent-foreground)',
                  border: '1px solid var(--border)',
                }}
              >
                <ShoppingBag className="w-3 h-3" />
                {item.itemName} · {fmtMoney(item.amount)}
              </button>
            ))}
            {collaborators?.map((c, i) => (
              <button
                key={`collab-${i}`}
                onClick={() => handleCollaboratorTap(c.name)}
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap active:scale-95 transition-all"
                style={{
                  background: 'rgba(59, 130, 246, 0.15)', // Light blue tint
                  color: 'rgb(37, 99, 235)',
                  border: '1px solid var(--border)',
                }}
              >
                <ArrowRightLeft className="w-3 h-3" />
                Transfer to {c.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
