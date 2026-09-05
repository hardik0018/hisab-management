'use client';

import React, { useState } from 'react';
import AppShell from '@/components/AppShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { secureFetch } from '@/lib/api-utils';
import { RecurringExpense, User } from '@/types';
import {
  Plus,
  Trash2,
  Edit2,
  Repeat,
  AlertCircle,
  Coins,
  Check,
} from 'lucide-react';
import EmptyState from '@/components/EmptyState';
import { cn } from '@/lib/utils';

interface RecurringClientProps {
  initialTemplates: RecurringExpense[];
  collaborators: User[];
  currentUserId: string;
}

const FREQUENCY_PRESETS = [
  { label: 'Every Month', value: 'monthly', interval: 1 },
  { label: 'Every 3 Months (LIC)', value: 'quarterly', interval: 3 },
  { label: 'Every 6 Months', value: 'half_yearly', interval: 6 },
  { label: 'Yearly (12 Mo)', value: 'yearly', interval: 12 },
  { label: 'Custom Months', value: 'custom', interval: 0 },
] as const;

export default function RecurringClient({ initialTemplates, collaborators, currentUserId }: RecurringClientProps) {
  const [templates, setTemplates] = useState<RecurringExpense[]>(initialTemplates);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<RecurringExpense | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [itemName, setItemName] = useState('');
  const [amount, setAmount] = useState('');
  const [templateType, setTemplateType] = useState<'expense' | 'income'>('expense');
  const [frequency, setFrequency] = useState<'monthly' | 'quarterly' | 'half_yearly' | 'yearly' | 'custom'>('monthly');
  const [frequencyIntervalMonths, setFrequencyIntervalMonths] = useState('1');
  const [dayOfMonth, setDayOfMonth] = useState('5');
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  });
  const [category, setCategory] = useState('Uncategorized');
  const [initialInvestedAmount, setInitialInvestedAmount] = useState('');
  const [note, setNote] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [paidByUserId, setPaidByUserId] = useState(currentUserId);

  // Quick Rent/Income collection dialog
  const [collectTemplate, setCollectTemplate] = useState<RecurringExpense | null>(null);
  const [collectDate, setCollectDate] = useState('');
  const [collectAmount, setCollectAmount] = useState('');
  const [isCollecting, setIsCollecting] = useState(false);

  // Always get today in IST so the default date in dialogs is never wrong
  // (new Date().toISOString() gives UTC which is 5:30 hrs behind IST)
  const getTodayIST = (): string => {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(new Date());
    const y = parts.find(p => p.type === 'year')?.value;
    const m = parts.find(p => p.type === 'month')?.value;
    const d = parts.find(p => p.type === 'day')?.value;
    return `${y}-${m}-${d}`;
  };

  const handleOpenAdd = () => {
    setModalMode('add');
    setEditingId(null);
    setItemName('');
    setAmount('');
    setTemplateType('expense');
    setFrequency('monthly');
    setFrequencyIntervalMonths('1');
    setDayOfMonth('5');
    setStartDate(() => {
      const today = new Date();
      return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    });
    setCategory('Uncategorized');
    setInitialInvestedAmount('');
    setNote('');
    setIsActive(true);
    setPaidByUserId(currentUserId);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (t: RecurringExpense) => {
    setModalMode('edit');
    setEditingId(t._id || null);
    setItemName(t.itemName);
    setAmount(String(t.amount));
    setTemplateType(t.type || 'expense');
    const interval = t.frequencyIntervalMonths || (t.frequency === 'quarterly' ? 3 : t.frequency === 'half_yearly' ? 6 : t.frequency === 'yearly' ? 12 : 1);
    setFrequencyIntervalMonths(String(interval));
    if (interval === 1) setFrequency('monthly');
    else if (interval === 3) setFrequency('quarterly');
    else if (interval === 6) setFrequency('half_yearly');
    else if (interval === 12) setFrequency('yearly');
    else setFrequency('custom');

    setDayOfMonth(String(t.dayOfMonth));
    setStartDate(t.startDate);
    setCategory(t.category || 'Uncategorized');
    setInitialInvestedAmount(t.initialInvestedAmount ? String(t.initialInvestedAmount) : '');
    setNote(t.note || '');
    setIsActive(t.isActive);
    setPaidByUserId(t.user_id || currentUserId);
    setIsModalOpen(true);
  };

  const handleFrequencyPresetChange = (val: 'monthly' | 'quarterly' | 'half_yearly' | 'yearly' | 'custom') => {
    setFrequency(val);
    if (val === 'monthly') setFrequencyIntervalMonths('1');
    else if (val === 'quarterly') setFrequencyIntervalMonths('3');
    else if (val === 'half_yearly') setFrequencyIntervalMonths('6');
    else if (val === 'yearly') setFrequencyIntervalMonths('12');
  };

  const handleToggleActive = async (t: RecurringExpense) => {
    const previousState = t.isActive;
    setTemplates(prev => prev.map(item => item._id === t._id ? { ...item, isActive: !item.isActive } : item));

    try {
      const res = await secureFetch(`/api/expenses/recurring/${t._id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !previousState })
      });

      if (res && res.success) {
        toast.success(`Template is now ${!previousState ? 'Active' : 'Paused'}`);
      } else {
        throw new Error('Toggle failed');
      }
    } catch (err) {
      setTemplates(prev => prev.map(item => item._id === t._id ? { ...item, isActive: previousState } : item));
      toast.error('Failed to update status');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    const dom = parseInt(dayOfMonth);
    const intervalMonths = parseInt(frequencyIntervalMonths) || 1;

    if (!itemName.trim() || itemName.trim().length < 2) {
      toast.error('Item name must be at least 2 characters');
      return;
    }
    if (isNaN(amt) || amt <= 0) {
      toast.error('Amount must be greater than 0');
      return;
    }
    if (isNaN(dom) || dom < 1 || dom > 31) {
      toast.error('Day of month must be between 1 and 31');
      return;
    }
    if (!startDate) {
      toast.error('Start month is required');
      return;
    }
    if (intervalMonths < 1) {
      toast.error('Interval must be at least 1 month');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        itemName: itemName.trim(),
        amount: amt,
        type: templateType,
        frequency,
        frequencyIntervalMonths: intervalMonths,
        dayOfMonth: dom,
        startDate,
        category: category.trim(),
        initialInvestedAmount: initialInvestedAmount ? parseFloat(initialInvestedAmount) : 0,
        note: note.trim(),
        isActive,
        user_id: paidByUserId,
      };

      if (modalMode === 'add') {
        const res = await secureFetch('/api/expenses/recurring', {
          method: 'POST',
          body: JSON.stringify(payload)
        });

        if (res && res.success) {
          toast.success('Auto template added successfully!');
          setTemplates(prev => [res.template, ...prev]);
          setIsModalOpen(false);
        }
      } else {
        const res = await secureFetch(`/api/expenses/recurring/${editingId}`, {
          method: 'PATCH',
          body: JSON.stringify(payload)
        });

        if (res && res.success) {
          toast.success('Auto template updated successfully!');
          setTemplates(prev => prev.map(item => item._id === editingId ? res.template : item));
          setIsModalOpen(false);
        }
      }
    } catch (err: any) {
      toast.error(err.message || 'Action failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick Rent/Income Collection Submit
  const handleCollectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!collectTemplate) return;

    const amt = parseFloat(collectAmount);
    if (isNaN(amt) || amt <= 0) {
      toast.error('Valid amount is required');
      return;
    }

    setIsCollecting(true);
    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expenses: [
            {
              itemName: collectTemplate.itemName,
              amount: amt,
              date: collectDate,
              category: collectTemplate.category || 'Salary & Income',
              type: 'income',
              note: `Received for ${collectTemplate.itemName}`,
              associatedId: collectTemplate._id,
              associatedType: 'recurring',
            },
          ],
        }),
      });

      if (!res.ok) throw new Error('Failed to record income');

      toast.success(`+₹${amt} recorded as received!`);
      setTemplates((prev) =>
        prev.map((item) =>
          item._id === collectTemplate._id
            ? { ...item, currentMonthStatus: { received: true, date: collectDate, amount: amt } }
            : item
        )
      );
      setCollectTemplate(null);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('expense_added'));
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to record income');
    } finally {
      setIsCollecting(false);
    }
  };

  const handleOpenDelete = (t: RecurringExpense) => {
    setTemplateToDelete(t);
    setIsDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!templateToDelete) return;

    setIsSubmitting(true);
    try {
      const res = await secureFetch(`/api/expenses/recurring/${templateToDelete._id}`, {
        method: 'DELETE'
      });

      if (res && res.success) {
        toast.success('Template deleted');
        setTemplates(prev => prev.filter(item => item._id !== templateToDelete._id));
        setIsDeleteConfirmOpen(false);
        setTemplateToDelete(null);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete template');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isInvestmentItem = (name: string, cat?: string) => {
    return /sip|invest|mutual|share|stock|gold|ppf|lic|nifty/i.test(`${name} ${cat || ''}`);
  };

  const getFrequencyLabel = (t: RecurringExpense) => {
    const interval = t.frequencyIntervalMonths || (t.frequency === 'quarterly' ? 3 : t.frequency === 'half_yearly' ? 6 : t.frequency === 'yearly' ? 12 : 1);
    if (interval === 1) return `Every month (${t.dayOfMonth}th)`;
    if (interval === 3) return `Every 3 months (${t.dayOfMonth}th)`;
    if (interval === 6) return `Every 6 months (${t.dayOfMonth}th)`;
    if (interval === 12) return `Every year (${t.dayOfMonth}th)`;
    return `Every ${interval} months (${t.dayOfMonth}th)`;
  };

  return (
    <AppShell>
      <div className="max-w-xl mx-auto space-y-4 pb-24 font-sans">
        {/* Header Row */}
        <div className="flex items-center justify-between pt-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Auto Schedules</h1>
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-sm active:scale-95 transition-all cursor-pointer border-0"
            style={{ backgroundImage: 'var(--gradient-hero)' }}
          >
            <Plus className="w-4 h-4" />
            <span>Add Auto</span>
          </button>
        </div>

        {/* Templates List */}
        {templates.length === 0 ? (
          <div className="space-y-4">
            <EmptyState
              icon={Repeat}
              title="No recurring templates"
              hint="Set up recurring templates for SIPs, LIC premiums, House Rent, or bills."
              color="--violet"
            />
            <div className="flex justify-center">
              <Button onClick={handleOpenAdd} variant="outline" className="rounded-xl font-bold cursor-pointer bg-transparent" style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}>
                Create First Template
              </Button>
            </div>
          </div>
        ) : (
          <div className="card-surface overflow-hidden divide-y divide-border/60">
            {templates.map((t) => {
              const isIncome = t.type === 'income';
              const isInvest = isInvestmentItem(t.itemName, t.category);

              return (
                <div
                  key={t._id}
                  className={cn(
                    'p-3.5 space-y-2.5 transition-all',
                    !t.isActive && 'opacity-60'
                  )}
                >
                  <div className="flex items-center gap-3">
                    {/* Icon tile matching ExpenseCard */}
                    <div
                      className="tile w-10 h-10 shrink-0 text-base font-bold rounded-xl"
                      style={{
                        background: isIncome ? 'var(--success-soft)' : isInvest ? 'var(--primary-soft)' : 'var(--surface-muted)',
                        color: isIncome ? 'var(--success)' : isInvest ? 'var(--primary)' : 'var(--foreground)',
                      }}
                    >
                      {isIncome ? '🏠' : isInvest ? '💎' : '⚡'}
                    </div>

                    {/* Title & Subtitle */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-sm text-foreground truncate">
                          {t.itemName}
                        </span>
                        <span
                          className={cn(
                            'text-[9px] font-black uppercase tracking-wide px-1.5 py-0.5 rounded-full',
                            isIncome
                              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                              : isInvest
                              ? 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400'
                              : 'bg-secondary text-muted-foreground'
                          )}
                        >
                          {isIncome ? 'INCOME' : isInvest ? 'INVESTMENT' : 'AUTO'}
                        </span>
                      </div>

                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {getFrequencyLabel(t)} {t.category ? `· ${t.category}` : ''}
                      </p>
                    </div>

                    {/* Amount */}
                    <div className="text-right shrink-0">
                      <span
                        className="font-bold text-sm"
                        style={{ color: isIncome ? 'var(--success)' : 'var(--foreground)' }}
                      >
                        {isIncome ? '+' : ''}₹{t.amount.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  {/* Past investment note (if configured) */}
                  {Boolean(t.initialInvestedAmount && t.initialInvestedAmount > 0) && (
                    <div className="flex items-center justify-between text-[11px] px-2.5 py-1.5 rounded-lg bg-surface-muted text-muted-foreground">
                      <span>Past Invested Base:</span>
                      <strong className="text-foreground">₹{t.initialInvestedAmount?.toLocaleString('en-IN')}</strong>
                    </div>
                  )}

                  {/* Footer Actions Row */}
                  <div className="flex items-center justify-between pt-1 text-xs">
                    <div>
                      {isIncome && (
                        t.currentMonthStatus?.received ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 cursor-default select-none">
                            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                            <span>Received ({(() => {
                              // Parse YYYY-MM-DD string directly to avoid UTC-to-IST offset shifting the date
                              const rawDate = t.currentMonthStatus?.date;
                              if (!rawDate) return new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
                              const [, , dd] = rawDate.split('-').map(Number);
                              const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
                              const monthIdx = parseInt(rawDate.split('-')[1], 10) - 1;
                              return `${dd} ${monthNames[monthIdx]}`;
                            })()})</span>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setCollectTemplate(t);
                              setCollectAmount(String(t.amount));
                              setCollectDate(getTodayIST());
                            }}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 active:scale-95 transition-all cursor-pointer border-0"
                          >
                            <Coins className="w-3.5 h-3.5" />
                            <span>Receive Rent</span>
                          </button>
                        )
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(t)}
                        className={cn(
                          'text-xs font-medium transition-all px-2 py-0.5 rounded-md hover:bg-surface-muted cursor-pointer',
                          t.isActive ? 'text-muted-foreground hover:text-foreground' : 'text-primary font-bold'
                        )}
                      >
                        {t.isActive ? 'Pause' : 'Activate'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(t)}
                        className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-surface-muted transition-all cursor-pointer"
                        title="Edit Template"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenDelete(t)}
                        className="p-1 rounded-md text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-all cursor-pointer"
                        title="Delete Template"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Add/Edit Template Dialog ─────────────────────────────────── */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-md w-[92%] card-surface rounded-3xl p-6 shadow-2xl border-0">
            <DialogHeader className="text-left space-y-1">
              <DialogTitle className="text-base font-bold text-foreground">
                {modalMode === 'add' ? 'New Auto Template' : 'Edit Auto Template'}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Automate monthly SIPs, LIC premiums, house rent, or custom schedules.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-3 mt-2 text-xs">
              {/* Type Switcher: Expense vs Income */}
              <div>
                <Label className="text-[11px] text-muted-foreground font-semibold mb-1 block">Type</Label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-secondary rounded-xl">
                  <button
                    type="button"
                    onClick={() => setTemplateType('expense')}
                    className={cn(
                      'py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1',
                      templateType === 'expense'
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <span>Outflow (SIP / LIC / Bill)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTemplateType('income')}
                    className={cn(
                      'py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1',
                      templateType === 'income'
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <span>Income (House Rent)</span>
                  </button>
                </div>
              </div>

              {/* Item Name */}
              <div className="space-y-1">
                <Label htmlFor="item-name" className="text-[11px] text-muted-foreground font-semibold">
                  {templateType === 'income' ? 'Income Title (e.g. House Rent)' : 'Title (e.g. LIC Policy / SIP 7000)'} *
                </Label>
                <Input
                  id="item-name"
                  type="text"
                  required
                  placeholder={templateType === 'income' ? 'House Rent' : 'LIC Policy Premium'}
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  className="rounded-xl h-10 text-xs font-semibold"
                />
              </div>

              {/* Amount & Day of Month */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="amount" className="text-[11px] text-muted-foreground font-semibold">Amount (₹) *</Label>
                  <Input
                    id="amount"
                    type="number"
                    required
                    placeholder="7000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="rounded-xl h-10 text-xs font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="day" className="text-[11px] text-muted-foreground font-semibold">Day of Month</Label>
                  <Input
                    id="day"
                    type="number"
                    min="1"
                    max="31"
                    placeholder="5"
                    value={dayOfMonth}
                    onChange={(e) => setDayOfMonth(e.target.value)}
                    className="rounded-xl h-10 text-xs"
                    required
                  />
                </div>
              </div>

              {/* Frequency Selector */}
              <div className="space-y-1.5">
                <Label className="text-[11px] text-muted-foreground font-semibold block">
                  Frequency (ક્યારે ક્યારે)
                </Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {FREQUENCY_PRESETS.map((p) => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => handleFrequencyPresetChange(p.value)}
                      className={cn(
                        'py-1.5 px-2 rounded-xl text-[11px] font-semibold border transition-all text-center cursor-pointer',
                        frequency === p.value
                          ? 'border-primary bg-primary/10 text-primary font-bold shadow-xs'
                          : 'border-border bg-secondary/50 text-muted-foreground hover:text-foreground'
                      )}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                {/* Custom Month Interval Input */}
                {frequency === 'custom' && (
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-secondary/80 mt-1.5">
                    <span className="text-[11px] text-muted-foreground font-medium">Every</span>
                    <Input
                      type="number"
                      min="1"
                      max="60"
                      value={frequencyIntervalMonths}
                      onChange={(e) => setFrequencyIntervalMonths(e.target.value)}
                      className="w-20 h-8 rounded-lg text-xs font-bold text-center bg-background"
                    />
                    <span className="text-[11px] text-muted-foreground font-medium">Months</span>
                  </div>
                )}
              </div>

              {/* Initial / Past Invested Amount (for SIPs and Investments) */}
              {(templateType === 'expense' && isInvestmentItem(itemName, category)) && (
                <div className="p-3 rounded-2xl bg-secondary/80 border border-border space-y-1">
                  <Label htmlFor="past-invest" className="text-[11px] text-foreground font-bold">
                    Past Invested Base (₹) (Optional)
                  </Label>
                  <Input
                    id="past-invest"
                    type="number"
                    placeholder="e.g. 84000 (Invested before using this app)"
                    value={initialInvestedAmount}
                    onChange={(e) => setInitialInvestedAmount(e.target.value)}
                    className="rounded-xl h-10 text-xs font-semibold bg-background"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Calculates your total lifetime wealth accurately without creating cluttering old transactions.
                  </p>
                </div>
              )}

              {/* Note */}
              <div className="space-y-1">
                <Label htmlFor="note" className="text-[11px] text-muted-foreground font-semibold">Note (Optional)</Label>
                <Input
                  id="note"
                  type="text"
                  placeholder="e.g. LIC Policy #123456789"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="rounded-xl h-10 text-xs"
                />
              </div>

              <DialogFooter className="flex-row gap-2 pt-2 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  className="w-1/2 rounded-xl text-xs cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-1/2 font-bold rounded-xl text-xs text-white cursor-pointer"
                  style={{ backgroundImage: 'var(--gradient-hero)' }}
                >
                  {isSubmitting ? 'Saving...' : 'Save Template'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* ── Quick Receive Rent Modal ─────────────────────────────────── */}
        {collectTemplate && (
          <Dialog open={!!collectTemplate} onOpenChange={(open) => !open && setCollectTemplate(null)}>
            <DialogContent className="max-w-sm w-[92%] card-surface rounded-3xl p-5 shadow-2xl border-0">
              <DialogHeader className="text-left space-y-1">
                <DialogTitle className="text-sm font-bold text-foreground">
                  Receive {collectTemplate.itemName}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Record rent income on the exact date received.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleCollectSubmit} className="space-y-3 mt-2 text-xs">
                <div>
                  <Label className="text-[11px] text-muted-foreground font-semibold mb-1 block">Date Received</Label>
                  <Input
                    type="date"
                    required
                    value={collectDate}
                    onChange={(e) => setCollectDate(e.target.value)}
                    className="rounded-xl h-10 text-xs"
                  />
                </div>

                <div>
                  <Label className="text-[11px] text-muted-foreground font-semibold mb-1 block">Amount (₹)</Label>
                  <Input
                    type="number"
                    required
                    value={collectAmount}
                    onChange={(e) => setCollectAmount(e.target.value)}
                    className="rounded-xl h-10 text-xs font-bold"
                  />
                </div>

                <DialogFooter className="flex-row gap-2 pt-2 border-t border-border">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCollectTemplate(null)}
                    className="w-1/2 rounded-xl text-xs cursor-pointer"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isCollecting}
                    className="w-1/2 font-bold rounded-xl text-xs text-white cursor-pointer"
                    style={{ backgroundImage: 'var(--gradient-hero)' }}
                  >
                    {isCollecting ? 'Saving...' : 'Confirm Received'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteConfirmOpen} onOpenChange={(open) => !open && setIsDeleteConfirmOpen(false)}>
          <DialogContent className="max-w-sm w-[92%] card-surface rounded-3xl p-6 shadow-2xl border-0">
            <DialogHeader className="text-left space-y-1">
              <div className="tile w-10 h-10 mb-3" style={{ background: 'var(--danger-soft)', color: 'var(--danger)' }}>
                <AlertCircle className="w-5 h-5" />
              </div>
              <DialogTitle className="text-base font-bold text-foreground">Delete Template</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Delete "{templateToDelete?.itemName}"? This only stops future automatic schedules.
              </DialogDescription>
            </DialogHeader>

            <DialogFooter className="flex-row gap-2 mt-4 pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDeleteConfirmOpen(false)}
                className="w-1/2 rounded-xl text-xs cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleDeleteConfirm}
                disabled={isSubmitting}
                className="w-1/2 font-bold rounded-xl text-xs cursor-pointer"
              >
                {isSubmitting ? 'Deleting...' : 'Delete'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}
