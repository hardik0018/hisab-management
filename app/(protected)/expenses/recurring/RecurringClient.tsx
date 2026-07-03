'use client';

import React, { useState } from 'react';
import PageWrapper from '@/components/PageWrapper';
import ExpenseTopTabs from '@/components/expense/ExpenseTopTabs';
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
        toast.success(`Recurring template is now ${!previousState ? 'Active' : 'Inactive'}`);
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
          toast.success('Recurring expense template added successfully!');
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
          toast.success('Recurring expense template updated successfully!');
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
    <PageWrapper>
      <ExpenseTopTabs />
      <div className="max-w-7xl mx-auto p-4 space-y-5 font-sans pb-24">
        {/* Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-2xl font-black text-foreground">Recurring Expenses</h2>
          </div>
          <Button
            onClick={handleOpenAdd}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl cursor-pointer shadow-sm transition-all"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Recurring
          </Button>
        </div>

        {/* Templates List */}
        {templates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center gap-4 bg-card border border-border rounded-[2rem] shadow-sm">
            <div className="w-16 h-16 rounded-full bg-muted border border-border flex items-center justify-center text-muted-foreground">
              <Repeat className="w-8 h-8 animate-pulse text-primary" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-foreground">No recurring expenses configured</h3>
              <p className="text-xs text-muted-foreground max-w-sm">
                Set up recurring templates to automate items like Netflix, SIP Mutual Funds, or LIC payments.
              </p>
            </div>
            <Button onClick={handleOpenAdd} variant="outline" className="rounded-xl font-bold cursor-pointer">
              Create First Template
            </Button>
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
                  className={`group bg-card border rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-300 flex justify-between items-center gap-3 ${t.isActive ? 'border-border' : 'border-dashed border-border/60 opacity-70'
                    }`}
                >
                  <div className="flex flex-col gap-1 min-w-0 pr-2 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-foreground text-sm truncate">{t.itemName}</span>
                      <span className="shrink-0 text-[8px] bg-primary/10 text-primary border border-primary/20 px-1.5 py-0.5 rounded font-black uppercase tracking-wider">
                        {t.category}
                      </span>
                      {/* Active Status Badge Button */}
                      <button
                        onClick={() => handleToggleActive(t)}
                        className={`shrink-0 text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border transition-all cursor-pointer ${t.isActive
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/25'
                            : 'bg-muted text-muted-foreground border-border hover:bg-muted/80'
                          }`}
                        title="Click to toggle status"
                      >
                        {t.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </div>

                    {t.note && (
                      <span className="text-xs text-muted-foreground font-medium truncate max-w-[240px]">
                        {t.note}
                      </span>
                    )}

                    {/* Schedule Info Horizontal Badges */}
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1.5 text-[10px] text-muted-foreground/80 font-medium">
                      <span className="flex items-center gap-0.5 whitespace-nowrap">
                        <Calendar className="w-3 h-3 text-primary shrink-0" />
                        Day {t.dayOfMonth}
                      </span>
                      <span className="text-muted-foreground/30 select-none">•</span>
                      <span className="flex items-center gap-0.5 whitespace-nowrap">
                        <Play className="w-3 h-3 text-teal-500 shrink-0" />
                        {formatMonth(t.startDate)}
                      </span>
                      {t.lastGeneratedMonth && (
                        <>
                          <span className="text-muted-foreground/30 select-none">•</span>
                          <span className="flex items-center gap-0.5 whitespace-nowrap">
                            <CheckCircle2 className="w-3 h-3 text-indigo-500 shrink-0" />
                            Last: {formatMonth(t.lastGeneratedMonth)}
                          </span>
                        </>
                      )}
                      <span className="text-muted-foreground/30 select-none">•</span>
                      <span className="text-[9px] opacity-70 whitespace-nowrap font-mono">
                        {t.createdAt ? new Date(t.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'N/A'}
                      </span>
                      {t.user_id !== currentUserId && (
                        <>
                          <span className="text-muted-foreground/30 select-none">•</span>
                          <span className="text-[10px] font-medium whitespace-nowrap">
                            Paid by: <span className="font-bold">{collaborators.find(c => c.user_id === t.user_id)?.name || 'Unknown'}</span>
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-black text-base font-sans text-foreground">
                      ₹{t.amount}
                    </span>

                    <div className="flex items-center">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleOpenEdit(t)}
                        className="h-8 w-8 hover:bg-primary/10 text-muted-foreground hover:text-primary rounded-lg cursor-pointer"
                        title="Edit Template"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleOpenDelete(t)}
                        className="h-8 w-8 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-lg cursor-pointer"
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
          <DialogContent className="max-w-md w-[92%] bg-card border border-border text-card-foreground rounded-3xl p-6 shadow-2xl">
            <DialogHeader className="text-left space-y-1">
              <DialogTitle className="text-lg font-bold text-foreground font-sans">
                {modalMode === 'add' ? 'Add Recurring Expense' : 'Edit Recurring Template'}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground text-xs">
                Set up a template to automatically insert a monthly record.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 mt-3">
              {/* Item Name */}
              <div className="space-y-1.5">
                <Label htmlFor="item-name" className="text-xs font-semibold text-muted-foreground">Item Name</Label>
                <Input
                  id="item-name"
                  type="text"
                  placeholder="e.g. LIC Premium, SIP, Gas Bill"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  className="bg-background border-input text-foreground text-sm rounded-xl h-11"
                  required
                />
              </div>

              {/* Amount & Day Of Month Row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="amount" className="text-xs font-semibold text-muted-foreground">Amount (INR)</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="any"
                    placeholder="5000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="bg-background border-input text-foreground text-sm rounded-xl h-11"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="day" className="text-xs font-semibold text-muted-foreground">Day of Month</Label>
                  <Input
                    id="day"
                    type="number"
                    min="1"
                    max="31"
                    placeholder="5"
                    value={dayOfMonth}
                    onChange={(e) => setDayOfMonth(e.target.value)}
                    className="bg-background border-input text-foreground text-sm rounded-xl h-11"
                    required
                  />
                </div>
              </div>

              {/* Start Month & Category Row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="start-month" className="text-xs font-semibold text-muted-foreground">Start Month</Label>
                  <Input
                    id="start-month"
                    type="month"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="bg-background border-input text-foreground text-sm rounded-xl h-11"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="category" className="text-xs font-semibold text-muted-foreground">Category</Label>
                  <Input
                    id="category"
                    type="text"
                    placeholder="Investment"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="bg-background border-input text-foreground text-sm rounded-xl h-11"
                  />
                </div>
              </div>

              {/* Note */}
              <div className="space-y-1.5">
                <Label htmlFor="note" className="text-xs font-semibold text-muted-foreground">Note (Optional)</Label>
                <Input
                  id="note"
                  type="text"
                  placeholder="e.g. direct debit, online payment"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="bg-background border-input text-foreground text-sm rounded-xl h-11"
                />
              </div>

              {/* Paid By */}
              {collaborators.length > 0 && (
                <div className="space-y-1.5">
                  <Label htmlFor="paid-by" className="text-xs font-semibold text-muted-foreground">Paid By</Label>
                  <select
                    id="paid-by"
                    value={paidByUserId}
                    onChange={(e) => setPaidByUserId(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl bg-background border border-input text-sm text-foreground focus-visible:ring-primary outline-none"
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
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-xl border border-border mt-2">
                <div className="flex flex-col gap-0.5">
                  <Label htmlFor="active-toggle" className="text-xs font-bold cursor-pointer">Template Active</Label>
                  <span className="text-[10px] text-muted-foreground">Inactive templates do not generate new logs.</span>
                </div>
                <input
                  type="checkbox"
                  id="active-toggle"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 text-primary accent-primary cursor-pointer"
                />
              </div>

              <DialogFooter className="flex-row gap-2 mt-6 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  className="w-1/2 bg-background border border-border text-muted-foreground hover:text-foreground rounded-xl cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-1/2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl border-0 cursor-pointer"
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
          <DialogContent className="max-w-sm w-[92%] bg-card border border-border text-card-foreground rounded-3xl p-6 shadow-2xl">
            <DialogHeader className="text-left space-y-1">
              <div className="w-10 h-10 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mb-3">
                <AlertCircle className="w-5 h-5" />
              </div>
              <DialogTitle className="text-base font-bold text-foreground font-sans">Delete Recurring Template</DialogTitle>
              <DialogDescription className="text-muted-foreground text-xs leading-relaxed">
                Are you sure you want to delete <strong className="text-foreground">"{templateToDelete?.itemName}"</strong>?
                This only stops future auto-generations. Already generated expenses in daily hisab history will not be deleted.
              </DialogDescription>
            </DialogHeader>

            <DialogFooter className="flex-row gap-2 mt-6 pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDeleteConfirmOpen(false)}
                className="w-1/2 bg-background border border-border text-muted-foreground hover:text-foreground rounded-xl cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleDeleteConfirm}
                disabled={isSubmitting}
                className="w-1/2 bg-destructive hover:bg-destructive/90 text-destructive-foreground font-bold rounded-xl border-0 cursor-pointer"
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
    </PageWrapper>
  );
}
