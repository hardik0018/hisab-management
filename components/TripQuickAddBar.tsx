'use client';

import React, { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import { Plus, AlertTriangle, Check, Zap, Mic, Users } from 'lucide-react';
import { toast } from 'sonner';
import { parseEntries, ParsedExpenseDraft } from '@/lib/parser';
import { cn } from '@/lib/utils';
import { TripMember } from '@/types/trip';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';

interface TripQuickAddBarProps {
  tripId: string;
  members: TripMember[];
  /** Date used for new entries (day filter / trip start) */
  date: string;
  paidByMemberId: string;
  onPaidByChange: (memberId: string) => void;
  onSaved?: () => void;
  className?: string;
}

function fmtMoney(n: number) {
  return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

export default function TripQuickAddBar({
  tripId,
  members,
  date,
  paidByMemberId,
  onPaidByChange,
  onSaved,
  className,
}: TripQuickAddBarProps) {
  const [value, setValue] = useState('');
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    isListening,
    error: speechError,
    isSupported: isSpeechSupported,
    language: voiceLanguage,
    setLanguage: setVoiceLanguage,
    startListening,
    stopListening,
  } = useSpeechRecognition({
    onResult: (normalized) => setValue(normalized),
    onEnd: (final) => {
      if (final) setValue(final);
    },
  });

  useEffect(() => {
    if (speechError) toast.error(speechError);
  }, [speechError]);

  const handleToggleVoice = () => {
    if (isListening) {
      stopListening();
    } else {
      setValue('');
      startListening();
    }
  };

  // Only expense-shaped drafts make sense inside a trip
  const parsed = useMemo(() => {
    if (!value.trim()) return null;
    const result = parseEntries(value, Number.MAX_SAFE_INTEGER, 'expense');
    return {
      items: result.items.filter(
        (i): i is ParsedExpenseDraft => i.kind === 'expense' && i.type === 'expense'
      ),
      invalid: result.invalid,
    };
  }, [value]);

  const save = useCallback(
    async (items: ParsedExpenseDraft[]) => {
      if (items.length === 0) return;
      setSaving(true);
      try {
        for (const item of items) {
          const res = await fetch(`/api/trips/${tripId}/expenses`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              itemName: item.itemName,
              amount: item.amount,
              date,
              tripCategory: item.category,
              paidByMemberId: paidByMemberId || members[0]?.id,
              splitType: 'personal',
              note: item.note || '',
            }),
          });
          if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.message || `Failed to add "${item.itemName}"`);
          }
        }

        setValue('');
        inputRef.current?.focus();

        toast.success(
          items.length === 1
            ? `Added: ${items[0].itemName} · ${fmtMoney(items[0].amount)}`
            : `Added ${items.length} trip expenses`
        );

        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('expense_added'));
        }
        onSaved?.();
      } catch (err: any) {
        toast.error(err?.message ?? 'Failed to save trip expense');
      } finally {
        setSaving(false);
      }
    },
    [tripId, date, paidByMemberId, members, onSaved]
  );

  const handleSubmit = useCallback(async () => {
    if (!value.trim() || saving) return;
    const result = parseEntries(value, Number.MAX_SAFE_INTEGER, 'expense');
    const items = result.items.filter(
      (i): i is ParsedExpenseDraft => i.kind === 'expense' && i.type === 'expense'
    );

    if (items.length === 0) {
      toast.error('Nothing recognised. Try: petrol 500  or  chai 20, toll 80');
      return;
    }
    if (result.invalid.length > 0) {
      toast.warning(`Skipped: ${result.invalid.map((i) => i.source).join(', ')}`, {
        duration: 4000,
      });
    }
    await save(items);
  }, [value, saving, save]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className={cn('card-surface p-3 rounded-2xl border border-border flex flex-col gap-2', className)}>
      {/* Sticky "who paid" selector */}
      {members.length > 0 && (
        <div className="flex items-center gap-2 min-w-0">
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground shrink-0">
            <Users className="w-3.5 h-3.5" />
            Paid by
          </span>
          <div className="overflow-x-auto no-scrollbar flex-1">
            <div className="flex gap-1.5 w-max">
              {members.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => onPaidByChange(m.id)}
                  className={cn(
                    'px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap transition-all active:scale-95',
                    paidByMemberId === m.id
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-secondary text-muted-foreground hover:text-foreground'
                  )}
                >
                  {m.name}
                  {m.isCurrentUser ? ' (You)' : ''}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Voice banner */}
      {isListening && (
        <div className="flex items-center justify-between p-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500" />
            </span>
            <span className="font-semibold text-rose-600 dark:text-rose-400">Listening...</span>
          </div>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => setVoiceLanguage('en-IN')}
              className={cn(
                'px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all',
                voiceLanguage === 'en-IN'
                  ? 'bg-rose-500 text-white'
                  : 'bg-secondary text-muted-foreground'
              )}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setVoiceLanguage('gu-IN')}
              className={cn(
                'px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all',
                voiceLanguage === 'gu-IN'
                  ? 'bg-rose-500 text-white'
                  : 'bg-secondary text-muted-foreground'
              )}
            >
              ગુજરાતી
            </button>
          </div>
        </div>
      )}

      {/* Input row */}
      <div className="flex items-center gap-2">
        <div
          className={cn(
            'flex items-center flex-1 gap-2 px-3 rounded-xl h-12 transition-all',
            isListening && 'ring-2 ring-rose-500/50'
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
            enterKeyHint="done"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isListening ? 'Listening...' : 'petrol 500  or  chai 20, toll 80'}
            aria-label="Quick add trip expense"
            className="flex-1 bg-transparent outline-none placeholder:text-sm"
            style={{ color: 'var(--foreground)', fontSize: '16px' }}
          />
          {isSpeechSupported && (
            <button
              type="button"
              onClick={handleToggleVoice}
              aria-label={isListening ? 'Stop recording voice' : 'Speak trip expense'}
              className={cn(
                'p-2 rounded-xl transition-all shrink-0 active:scale-90',
                isListening
                  ? 'bg-rose-500 text-white shadow-md'
                  : 'text-muted-foreground hover:text-foreground hover:bg-card'
              )}
            >
              <Mic className={cn('w-4 h-4', isListening && 'animate-pulse')} />
            </button>
          )}
        </div>

        <button
          onClick={handleSubmit}
          disabled={saving || !value.trim()}
          aria-label="Save trip expense"
          className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 active:scale-95 transition-all disabled:opacity-40"
          style={{ backgroundImage: 'var(--gradient-hero)', color: 'white' }}
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Live parse chips */}
      {parsed && (parsed.items.length > 0 || parsed.invalid.length > 0) && (
        <div className="flex flex-wrap gap-1.5 px-1">
          {parsed.items.map((item, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
              style={{ background: 'var(--success-soft)', color: 'var(--success)' }}
            >
              <Check className="w-3 h-3" />
              {item.itemName} · {fmtMoney(item.amount)}
              {item.category && item.category !== 'General & Other' ? ` · ${item.category}` : ''}
            </span>
          ))}
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
    </div>
  );
}
