'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, X, Loader2, HandCoins, Shield, Package, Key, Receipt,
  ChevronRight, CheckCircle2, AlertTriangle, Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { parseUniversal, UniversalParsedItem, UniversalParseResult } from '@/lib/universal-parser';

// ─── Constants ────────────────────────────────────────────────────────────────

const DRAFT_KEY = 'hisab_quick_draft';

interface PrefixChip {
  label: string;
  prefix: string;
  color: string;
  icon: React.ReactNode;
  placeholder: string;
}

const PREFIX_CHIPS: PrefixChip[] = [
  {
    label: 'Expense',
    prefix: '',
    color: 'bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-800',
    icon: <Receipt className="h-3.5 w-3.5" />,
    placeholder: 'Milk 50',
  },
  {
    label: 'Hisab',
    prefix: 'hisab ',
    color: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800',
    icon: <HandCoins className="h-3.5 w-3.5" />,
    placeholder: 'hisab Ramesh gave 500 lunch',
  },
  {
    label: 'Insurance',
    prefix: 'ins ',
    color: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
    icon: <Shield className="h-3.5 w-3.5" />,
    placeholder: 'ins LIC Health 5000 yearly 2027-06',
  },
  {
    label: 'Warranty',
    prefix: 'war ',
    color: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800',
    icon: <Package className="h-3.5 w-3.5" />,
    placeholder: 'war Samsung TV 2024-01 2027-01',
  },
  {
    label: 'Password',
    prefix: 'pass ',
    color: 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800',
    icon: <Key className="h-3.5 w-3.5" />,
    placeholder: 'pass gmail.com user@email myPass123',
  },
];

const KIND_META: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  expense:   { label: 'Expense',   color: 'text-violet-600 dark:text-violet-400', icon: <Receipt   className="h-3.5 w-3.5" /> },
  hisab:     { label: 'Hisab',     color: 'text-amber-600  dark:text-amber-400',  icon: <HandCoins className="h-3.5 w-3.5" /> },
  insurance: { label: 'Insurance', color: 'text-blue-600   dark:text-blue-400',   icon: <Shield    className="h-3.5 w-3.5" /> },
  warranty:  { label: 'Warranty',  color: 'text-green-600  dark:text-green-400',  icon: <Package   className="h-3.5 w-3.5" /> },
  password:  { label: 'Password',  color: 'text-rose-600   dark:text-rose-400',   icon: <Key       className="h-3.5 w-3.5" /> },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function itemLabel(item: UniversalParsedItem): string {
  switch (item.kind) {
    case 'expense':   return `${item.itemName} — ₹${item.amount}`;
    case 'hisab':     return `${item.name} (${item.type === 'debit' ? 'gave' : 'took'} ₹${item.amount})`;
    case 'insurance': return `${item.policyName} — ₹${item.premiumAmount}/${item.premiumFrequency.replace('_', '-')}`;
    case 'warranty':  return `${item.itemName} — exp ${item.expiryDate}`;
    case 'password':  return `${item.title} / ${item.username}`;
    default:          return '?';
  }
}

// ─── Preview row ─────────────────────────────────────────────────────────────

function PreviewRow({ item }: { item: UniversalParsedItem }) {
  const meta = KIND_META[item.kind] ?? KIND_META.expense;
  return (
    <div className="flex items-start gap-2 py-1.5 border-b border-border/40 last:border-0">
      <div className={`mt-0.5 shrink-0 ${meta.color}`}>{meta.icon}</div>
      <div className="flex-1 min-w-0">
        <span className={`text-[10px] font-bold uppercase tracking-wider ${meta.color}`}>{meta.label}</span>
        <p className="text-xs text-foreground truncate">{itemLabel(item)}</p>
      </div>
      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function QuickAddSheet() {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [parseResult, setParseResult] = useState<UniversalParseResult | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const today = new Date().toISOString().split('T')[0];

  // Restore draft
  useEffect(() => {
    try {
      const stored = localStorage.getItem(DRAFT_KEY);
      if (stored) setText(stored);
    } catch { /* noop */ }
  }, []);

  // Live parse as user types
  useEffect(() => {
    if (!text.trim()) { setParseResult(null); return; }
    const result = parseUniversal(text, today, 10000);
    setParseResult(result);
    try { localStorage.setItem(DRAFT_KEY, text); } catch { /* noop */ }
  }, [text, today]);

  // Focus textarea when sheet opens
  useEffect(() => {
    if (open) {
      setTimeout(() => textareaRef.current?.focus(), 150);
    }
  }, [open]);

  // Keyboard shortcut: Escape to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
  }, []);

  /** Insert prefix at cursor (or end of line) in textarea */
  const insertPrefix = useCallback((prefix: string, placeholder: string) => {
    const ta = textareaRef.current;
    if (!ta) {
      // If textarea not focused yet, just append a new line with the placeholder
      setText(prev => {
        const base = prev.trimEnd();
        return base ? `${base}\n${placeholder}` : placeholder;
      });
      setTimeout(() => textareaRef.current?.focus(), 50);
      return;
    }

    const start = ta.selectionStart;
    const end   = ta.selectionEnd;
    const val   = ta.value;

    // Find the start of the current line
    const lineStart = val.lastIndexOf('\n', start - 1) + 1;
    const lineEnd   = val.indexOf('\n', end);
    const currentLine = val.slice(lineStart, lineEnd === -1 ? val.length : lineEnd).trim();

    let newText: string;
    let cursorPos: number;

    if (currentLine === '') {
      // Current line is empty — insert placeholder here
      newText = val.slice(0, lineStart) + prefix + val.slice(lineStart);
      cursorPos = lineStart + prefix.length;
    } else {
      // Move to new line after current line end
      const insertAt = lineEnd === -1 ? val.length : lineEnd;
      newText = val.slice(0, insertAt) + '\n' + prefix + val.slice(insertAt);
      cursorPos = insertAt + 1 + prefix.length;
    }

    setText(newText);
    // Restore cursor
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(cursorPos, cursorPos);
    });
  }, []);

  const handleSave = async () => {
    if (!parseResult || parseResult.items.length === 0) {
      toast.error('Nothing valid to save. Check the preview below.');
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch('/api/universal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: parseResult.items }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? 'Save failed');
      }

      const data = await res.json();
      if (data.failed > 0) {
        toast.warning(`Saved ${data.succeeded} items. ${data.failed} failed.`);
      } else {
        toast.success(`✅ Saved ${data.succeeded} item${data.succeeded > 1 ? 's' : ''} across ${
          [...new Set(data.results.map((r: any) => r.kind))].join(', ')
        }`);
      }

      setText('');
      setParseResult(null);
      try { localStorage.removeItem(DRAFT_KEY); } catch { /* noop */ }
      setOpen(false);
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  const validCount   = parseResult?.items.length ?? 0;
  const invalidCount = parseResult?.invalidLines.length ?? 0;

  return (
    <>
      {/* ── FAB ─────────────────────────────────────────────────────────── */}
      <motion.button
        onClick={() => setOpen(true)}
        aria-label="Quick add"
        id="quick-add-fab"
        className="fixed bottom-[100px] right-4 z-[200] w-14 h-14 rounded-2xl bg-primary text-primary-foreground shadow-[0_8px_32px_rgba(0,0,0,0.25)] flex items-center justify-center hover:bg-primary/90 active:scale-95 transition-all md:bottom-8 md:right-8"
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.93 }}
      >
        <motion.div animate={{ rotate: open ? 45 : 0 }} transition={{ type: 'spring', stiffness: 350, damping: 25 }}>
          <Plus className="h-6 w-6" />
        </motion.div>
      </motion.button>

      {/* ── Sheet ───────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[190] bg-black/50 backdrop-blur-sm"
              onClick={handleClose}
            />

            {/* Panel */}
            <motion.div
              key="sheet"
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', stiffness: 340, damping: 32 }}
              className="fixed bottom-0 left-0 right-0 z-[200] max-w-2xl mx-auto bg-background border border-border rounded-t-3xl shadow-2xl flex flex-col max-h-[88vh]"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 pt-5 pb-3 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Zap className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-foreground">Quick Add</h2>
                    <p className="text-[10px] text-muted-foreground">One box for all modules</p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Prefix chip buttons */}
              <div className="px-4 pb-3 shrink-0">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Tap to insert prefix →
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {PREFIX_CHIPS.map((chip) => (
                    <button
                      key={chip.label}
                      type="button"
                      id={`quick-add-prefix-${chip.label.toLowerCase()}`}
                      onClick={() => insertPrefix(chip.prefix, chip.placeholder)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all active:scale-95 hover:shadow-sm ${chip.color}`}
                    >
                      {chip.icon}
                      {chip.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Textarea */}
              <div className="px-4 shrink-0">
                <textarea
                  ref={textareaRef}
                  value={text}
                  onChange={e => setText(e.target.value)}
                  placeholder={
                    'Milk 50\nTea 20\nhisab Ramesh gave 500 lunch\nins LIC Health 5000 yearly 2027-06\nwar Samsung TV 2024-01 2027-01\npass gmail.com user@email myPass123'
                  }
                  rows={6}
                  className="w-full p-3.5 bg-muted/40 border border-border rounded-xl text-sm font-mono text-foreground placeholder-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none leading-relaxed"
                />
              </div>

              {/* Live Preview */}
              {parseResult && (parseResult.items.length > 0 || parseResult.invalidLines.length > 0) && (
                <div className="mx-4 mt-3 rounded-xl border border-border bg-muted/20 overflow-hidden shrink-0">
                  <div className="px-3 py-2 border-b border-border/60 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Preview</span>
                    <div className="flex gap-2">
                      {validCount > 0 && (
                        <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                          {validCount} valid
                        </span>
                      )}
                      {invalidCount > 0 && (
                        <span className="text-[10px] font-semibold text-rose-600 dark:text-rose-400">
                          {invalidCount} error{invalidCount > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="px-3 py-2 max-h-[180px] overflow-y-auto space-y-0">
                    {parseResult.items.map((item, i) => (
                      <PreviewRow key={i} item={item} />
                    ))}
                    {parseResult.invalidLines.map((inv, i) => (
                      <div key={`inv-${i}`} className="flex items-start gap-2 py-1.5 border-b border-border/40 last:border-0">
                        <AlertTriangle className="h-3.5 w-3.5 text-rose-500 shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-mono text-rose-600 dark:text-rose-400 truncate">{inv.line}</p>
                          <p className="text-[10px] text-muted-foreground">{inv.reason}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Syntax hint */}
              <div className="px-4 mt-2 shrink-0">
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  <span className="font-mono font-semibold text-violet-600 dark:text-violet-400">Milk 50</span>
                  {' · '}
                  <span className="font-mono font-semibold text-amber-600 dark:text-amber-400">hisab Ram gave 500</span>
                  {' · '}
                  <span className="font-mono font-semibold text-blue-600 dark:text-blue-400">ins LIC 5000 yearly 2027-06</span>
                  {' · '}
                  <span className="font-mono font-semibold text-green-600 dark:text-green-400">war TV 2024-01 2027-01</span>
                  {' · '}
                  <span className="font-mono font-semibold text-rose-600 dark:text-rose-400">pass site user pass</span>
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shrink-0">
                <Button
                  variant="outline"
                  onClick={() => { setText(''); setParseResult(null); try { localStorage.removeItem(DRAFT_KEY); } catch { /* noop */ } }}
                  disabled={!text.trim() || isSaving}
                  className="flex-1 h-12 rounded-xl font-semibold text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                >
                  Clear
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isSaving || validCount === 0}
                  className="flex-[2] h-12 rounded-xl font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
                  id="quick-add-save-btn"
                >
                  {isSaving ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</>
                  ) : (
                    <>{validCount > 0 ? `Save ${validCount} item${validCount > 1 ? 's' : ''}` : 'Save'}<ChevronRight className="h-4 w-4 ml-1" /></>
                  )}
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
