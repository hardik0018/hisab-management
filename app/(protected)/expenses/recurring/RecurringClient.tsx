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
  Loader2,
  Calendar,
  Repeat,
  Play,
  CheckCircle2,
  AlertCircle,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import EmptyState from '@/components/EmptyState';

interface RecurringClientProps {
  initialTemplates: RecurringExpense[];
  collaborators: User[];
  currentUserId: string;
}

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
  const [dayOfMonth, setDayOfMonth] = useState('5');
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  });
  const [category, setCategory] = useState('Uncategorized');
  const [note, setNote] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [paidByUserId, setPaidByUserId] = useState(currentUserId);

  // Helper: format month string (e.g. "2026-06" -> "June 2026")
  const formatMonth = (monthStr: string) => {
    if (!monthStr) return 'N/A';
    const [year, month] = monthStr.split('-');
    const date = new Date(Number(year), Number(month) - 1, 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const handleOpenAdd = () => {
    setModalMode('add');
    setEditingId(null);
    setItemName('');
    setAmount('');
    setDayOfMonth('5');
    setStartDate(() => {
      const today = new Date();
      return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    });
    setCategory('Uncategorized');
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
    setDayOfMonth(String(t.dayOfMonth));
    setStartDate(t.startDate);
    setCategory(t.category || 'Uncategorized');
    setNote(t.note || '');
    setIsActive(t.isActive);
    setPaidByUserId(t.user_id || currentUserId);
    setIsModalOpen(true);
  };

  const handleToggleActive = async (t: RecurringExpense) => {
    const previousState = t.isActive;
    // Optimistic update
    setTemplates(prev => prev.map(item => item._id === t._id ? { ...item, isActive: !item.isActive } : item));

    try {
      const res = await secureFetch(`/api/expenses/recurring/${t._id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !previousState })
      });

      if (res && res.success) {
        toast.success(`Auto template is now ${!previousState ? 'Active' : 'Inactive'}`);
      } else {
        throw new Error('Toggle failed');
      }
    } catch (err) {
      // Revert state
      setTemplates(prev => prev.map(item => item._id === t._id ? { ...item, isActive: previousState } : item));
      toast.error('Failed to toggle active status');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    const dom = parseInt(dayOfMonth);

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

    setIsSubmitting(true);
    try {
      if (modalMode === 'add') {
        const res = await secureFetch('/api/expenses/recurring', {
          method: 'POST',
          body: JSON.stringify({
            itemName: itemName.trim(),
            amount: amt,
            dayOfMonth: dom,
            startDate,
            category: category.trim(),
            note: note.trim(),
            isActive,
            user_id: paidByUserId
          })
        });

        if (res && res.success) {
          toast.success('Auto expense template added successfully!');
          setTemplates(prev => [res.template, ...prev]);
          setIsModalOpen(false);
        }
      } else {
        const res = await secureFetch(`/api/expenses/recurring/${editingId}`, {
          method: 'PATCH',
          body: JSON.stringify({
            itemName: itemName.trim(),
            amount: amt,
            dayOfMonth: dom,
            startDate,
            category: category.trim(),
            note: note.trim(),
            isActive,
            user_id: paidByUserId
          })
        });

        if (res && res.success) {
          toast.success('Auto expense template updated successfully!');
          setTemplates(prev => prev.map(item => item._id === editingId ? res.template : item));
          setIsModalOpen(false);
        }
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Action failed');
    } finally {
      setIsSubmitting(false);
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
        toast.success('Template deleted successfully');
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

  return (
    <AppShell>
      <div className="space-y-5 font-sans">
        {/* Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-2xl font-black" style={{ color: 'var(--foreground)' }}>Auto Expenses</h2>
          </div>
          <Button
            onClick={handleOpenAdd}
            className="font-bold rounded-xl cursor-pointer shadow-sm active:scale-95 transition-all border-0"
            style={{ backgroundImage: 'var(--gradient-hero)', color: 'white' }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Auto
          </Button>
        </div>

        {/* Templates List */}
        {templates.length === 0 ? (
          <div className="space-y-4">
            <EmptyState
              icon={Repeat}
              title="No recurring expenses configured"
              hint="Set up recurring templates to automate items like Netflix, SIP Mutual Funds, or LIC payments."
              color="--violet"
            />
            <div className="flex justify-center">
              <Button onClick={handleOpenAdd} variant="outline" className="rounded-xl font-bold cursor-pointer bg-transparent" style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}>
                Create First Template
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <AnimatePresence mode="popLayout">
              {templates.map((t) => (
                <motion.div
                  key={t._id}
                  layout
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`group card-surface p-4 flex justify-between items-center gap-3 transition-all duration-300 ${t.isActive ? '' : 'opacity-70'}`}
                  style={!t.isActive ? { borderStyle: 'dashed', borderColor: 'var(--border)' } : undefined}
                >
                  <div className="flex flex-col gap-1 min-w-0 pr-2 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap mb-1">
                      <span className="font-bold text-sm truncate" style={{ color: 'var(--foreground)' }}>{t.itemName}</span>
                      <span className="shrink-0 text-[9px] px-1.5 py-0.5 rounded font-black uppercase tracking-wider" style={{ background: 'var(--violet-soft)', color: 'var(--violet)' }}>
                        {t.category}
                      </span>
                      {/* Active Status Badge Button */}
                      <button
                        onClick={() => handleToggleActive(t)}
                        className="shrink-0 text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded transition-all cursor-pointer border"
                        style={t.isActive ? { background: 'var(--success-soft)', color: 'var(--success)', borderColor: 'var(--success-soft)' } : { background: 'var(--danger-soft)', color: 'var(--danger)', borderColor: 'var(--danger-soft)' }}
                        title="Click to toggle status"
                      >
                        {t.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </div>

                    {t.note && (
                      <span className="text-xs font-medium truncate max-w-[240px]" style={{ color: 'var(--muted-foreground)' }}>
                        {t.note}
                      </span>
                    )}

                    {/* Schedule Info Horizontal Badges */}
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1.5 text-[10px] font-medium" style={{ color: 'var(--muted-foreground)' }}>
                      <span className="flex items-center gap-0.5 whitespace-nowrap">
                        <Calendar className="w-3 h-3 shrink-0" style={{ color: 'var(--primary)' }} />
                        Day {t.dayOfMonth}
                      </span>
                      <span className="select-none opacity-30">•</span>
                      <span className="flex items-center gap-0.5 whitespace-nowrap">
                        <Play className="w-3 h-3 shrink-0" style={{ color: 'var(--teal)' }} />
                        {formatMonth(t.startDate)}
                      </span>
                      {t.lastGeneratedMonth && (
                        <>
                          <span className="select-none opacity-30">•</span>
                          <span className="flex items-center gap-0.5 whitespace-nowrap">
                            <CheckCircle2 className="w-3 h-3 shrink-0" style={{ color: 'var(--sky)' }} />
                            Last: {formatMonth(t.lastGeneratedMonth)}
                          </span>
                        </>
                      )}
                      <span className="select-none opacity-30">•</span>
                      <span className="text-[9px] opacity-70 whitespace-nowrap font-mono">
                        {t.createdAt ? new Date(t.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'N/A'}
                      </span>
                      {t.user_id !== currentUserId && (
                        <>
                          <span className="select-none opacity-30">•</span>
                          <span className="text-[10px] font-medium whitespace-nowrap">
                            Paid by: <span className="font-bold">{collaborators.find(c => c.user_id === t.user_id)?.name || 'Unknown'}</span>
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-black text-base font-sans amount" style={{ color: 'var(--foreground)' }}>
                      ₹{t.amount}
                    </span>

                    <div className="flex items-center">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleOpenEdit(t)}
                        className="h-8 w-8 rounded-lg cursor-pointer transition-colors active:scale-95"
                        style={{ color: 'var(--muted-foreground)' }}
                        title="Edit Template"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleOpenDelete(t)}
                        className="h-8 w-8 rounded-lg cursor-pointer transition-colors active:scale-95"
                        style={{ color: 'var(--muted-foreground)' }}
                        title="Delete Template"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Add/Edit Modal */}
        <Dialog open={isModalOpen} onOpenChange={(open) => !open && setIsModalOpen(false)}>
          <DialogContent className="max-w-md w-[92%] card-surface p-6 rounded-3xl border-0 shadow-2xl">
            <DialogHeader className="text-left space-y-1">
              <DialogTitle className="text-lg font-bold font-sans" style={{ color: 'var(--foreground)' }}>
                {modalMode === 'add' ? 'Add Auto Expense' : 'Edit Auto Template'}
              </DialogTitle>
              <DialogDescription className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                Set up a template to automatically insert a monthly record.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 mt-3">
              {/* Item Name */}
              <div className="space-y-1.5">
                <Label htmlFor="item-name" className="text-xs font-semibold" style={{ color: 'var(--muted-foreground)' }}>Item Name</Label>
                <Input
                  id="item-name"
                  type="text"
                  placeholder="e.g. LIC Premium, SIP, Gas Bill"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  className="text-sm rounded-xl h-11 border-0 focus-visible:ring-1"
                  style={{ background: 'var(--surface-muted)', color: 'var(--foreground)' }}
                  required
                />
              </div>

              {/* Amount & Day Of Month Row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="amount" className="text-xs font-semibold" style={{ color: 'var(--muted-foreground)' }}>Amount (INR)</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="any"
                    placeholder="5000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="text-sm rounded-xl h-11 border-0 focus-visible:ring-1"
                    style={{ background: 'var(--surface-muted)', color: 'var(--foreground)' }}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="day" className="text-xs font-semibold" style={{ color: 'var(--muted-foreground)' }}>Day of Month</Label>
                  <Input
                    id="day"
                    type="number"
                    min="1"
                    max="31"
                    placeholder="5"
                    value={dayOfMonth}
                    onChange={(e) => setDayOfMonth(e.target.value)}
                    className="text-sm rounded-xl h-11 border-0 focus-visible:ring-1"
                    style={{ background: 'var(--surface-muted)', color: 'var(--foreground)' }}
                    required
                  />
                </div>
              </div>

              {/* Start Month & Category Row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="start-month" className="text-xs font-semibold" style={{ color: 'var(--muted-foreground)' }}>Start Month</Label>
                  <Input
                    id="start-month"
                    type="month"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="text-sm rounded-xl h-11 border-0 focus-visible:ring-1"
                    style={{ background: 'var(--surface-muted)', color: 'var(--foreground)' }}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="category" className="text-xs font-semibold" style={{ color: 'var(--muted-foreground)' }}>Category</Label>
                  <Input
                    id="category"
                    type="text"
                    placeholder="Investment"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="text-sm rounded-xl h-11 border-0 focus-visible:ring-1"
                    style={{ background: 'var(--surface-muted)', color: 'var(--foreground)' }}
                  />
                </div>
              </div>

              {/* Note */}
              <div className="space-y-1.5">
                <Label htmlFor="note" className="text-xs font-semibold" style={{ color: 'var(--muted-foreground)' }}>Note (Optional)</Label>
                <Input
                  id="note"
                  type="text"
                  placeholder="e.g. direct debit, online payment"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="text-sm rounded-xl h-11 border-0 focus-visible:ring-1"
                  style={{ background: 'var(--surface-muted)', color: 'var(--foreground)' }}
                />
              </div>

              {/* Paid By */}
              {collaborators.length > 0 && (
                <div className="space-y-1.5">
                  <Label htmlFor="paid-by" className="text-xs font-semibold" style={{ color: 'var(--muted-foreground)' }}>Paid By</Label>
                  <select
                    id="paid-by"
                    value={paidByUserId}
                    onChange={(e) => setPaidByUserId(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl border-0 text-sm focus-visible:ring-1 outline-none"
                    style={{ background: 'var(--surface-muted)', color: 'var(--foreground)' }}
                  >
                    {collaborators.map((c) => (
                      <option key={c.user_id} value={c.user_id}>
                        {c.name} {c.user_id === currentUserId && '(You)'}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Active Toggle Switch */}
              <div className="flex items-center justify-between p-3 rounded-xl mt-2" style={{ background: 'var(--surface-muted)' }}>
                <div className="flex flex-col gap-0.5">
                  <Label htmlFor="active-toggle" className="text-xs font-bold cursor-pointer" style={{ color: 'var(--foreground)' }}>Template Active</Label>
                  <span className="text-[10px]" style={{ color: 'var(--muted-foreground)' }}>Inactive templates do not generate new logs.</span>
                </div>
                <input
                  type="checkbox"
                  id="active-toggle"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 cursor-pointer"
                  style={{ accentColor: 'var(--primary)' }}
                />
              </div>

              <DialogFooter className="flex-row gap-2 mt-6 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  className="w-1/2 rounded-xl cursor-pointer bg-transparent"
                  style={{ border: '1px solid var(--border)', color: 'var(--foreground)' }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-1/2 font-bold rounded-xl border-0 cursor-pointer"
                  style={{ background: 'var(--primary)', color: 'white' }}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Template'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteConfirmOpen} onOpenChange={(open) => !open && setIsDeleteConfirmOpen(false)}>
          <DialogContent className="max-w-sm w-[92%] card-surface rounded-3xl p-6 shadow-2xl border-0">
            <DialogHeader className="text-left space-y-1">
              <div className="tile w-10 h-10 mb-3" style={{ background: 'var(--danger-soft)', color: 'var(--danger)' }}>
                <AlertCircle className="w-5 h-5" />
              </div>
              <DialogTitle className="text-base font-bold font-sans" style={{ color: 'var(--foreground)' }}>Delete Auto Template</DialogTitle>
              <DialogDescription className="text-xs leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
                Are you sure you want to delete <strong style={{ color: 'var(--foreground)' }}>"{templateToDelete?.itemName}"</strong>?
                This only stops future auto-generations. Already generated expenses in daily hisab history will not be deleted.
              </DialogDescription>
            </DialogHeader>

            <DialogFooter className="flex-row gap-2 mt-6 pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDeleteConfirmOpen(false)}
                className="w-1/2 rounded-xl cursor-pointer bg-transparent"
                style={{ border: '1px solid var(--border)', color: 'var(--foreground)' }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleDeleteConfirm}
                disabled={isSubmitting}
                className="w-1/2 font-bold rounded-xl border-0 cursor-pointer"
                style={{ background: 'var(--danger)', color: 'white' }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}
