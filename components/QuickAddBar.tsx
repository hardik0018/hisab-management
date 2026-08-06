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
} from 'lucide-react';
import { toast } from 'sonner';
import { parseEntries, ParsedDraft, ParsedExpenseDraft, ParsedHisabDraft } from '@/lib/parser';
import { cn } from '@/lib/utils';

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
  if (item.kind === 'expense') {
    return `${item.itemName} · ${fmtMoney(item.amount)}${item.category && item.category !== 'General & Other' ? ' · ' + item.category : ''}`;
  }
  return `${item.personName} · ${fmtMoney(item.amount)} · ${item.type === 'debit' ? 'you gave' : 'you got'}`;
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function QuickAddBar({
  mode = 'expense',
  largeLimit = 10000,
  onSaved,
  className,
}: QuickAddBarProps) {
  const [value, setValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [frequent, setFrequent] = useState<FrequentItem[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

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
    return parseEntries(value, largeLimit);
  }, [value, largeLimit]);

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

      const expenseItems = items.filter((i): i is ParsedExpenseDraft => i.kind === 'expense');
      const hisabItems = items.filter((i): i is ParsedHisabDraft => i.kind === 'hisab');

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
          window.dispatchEvent(new Event('expense_added'));
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

    const result = parseEntries(value, largeLimit);

    if (result.items.length === 0) {
      toast.error('Nothing recognised. Try: chai 20');
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
  }, [value, largeLimit, saving, save]);

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

  // ── Repeat chip tap ───────────────────────────────────────────────────────

  const handleRepeatTap = useCallback(
    async (item: FrequentItem) => {
      const draft: ParsedExpenseDraft = {
        kind: 'expense',
        itemName: item.itemName,
        amount: item.amount,
        note: '',
        category: item.category,
        type: 'expense',
        isLarge: item.amount >= largeLimit,
        source: `${item.itemName} ${item.amount}`,
      };
      await save([draft], draft.source);
    },
    [save, largeLimit]
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
      {/* ── Input row ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2">
        <div
          className="flex items-center flex-1 gap-2 px-3 rounded-xl h-12"
          style={{
            background: 'var(--secondary)',
            border: '1px solid var(--border)',
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
            placeholder={placeholder}
            aria-label="Quick add entry"
            className="flex-1 bg-transparent text-base outline-none placeholder:text-sm"
            style={{
              color: 'var(--foreground)',
              fontSize: '16px', // prevents iOS zoom
            }}
          />
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
      {mode === 'expense' && frequent.length > 0 && !value.trim() && (
        <div className="overflow-x-auto no-scrollbar -mx-1 px-1">
          <div className="flex gap-2 w-max pb-0.5">
            {frequent.map((item, i) => (
              <button
                key={i}
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
          </div>
        </div>
      )}
    </div>
  );
}
