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
import { RecurringExpense } from '@/types';
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
}

export default function RecurringClient({ initialTemplates }: RecurringClientProps) {
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
            isActive
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
            isActive
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
            <p className="text-xs text-muted-foreground font-medium">Manage monthly templates like recharges, SIPs, or premiums that log automatically.</p>
          </div>
          <Button 
            onClick={handleOpenAdd}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl cursor-pointer shadow-sm transition-all"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Recurring
          </Button>
        </div>

        {/* Info Box */}
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 flex gap-3 text-primary">
          <Clock className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-xs font-bold uppercase tracking-wider">How it works</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Whenever any family member opens the dashboard or expense logs, the system checks if any active recurring items are due for the current month. If they are, it atomic-safely logs them into the daily expense logs.
            </p>
          </div>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AnimatePresence mode="popLayout">
              {templates.map((t) => (
                <motion.div
                  key={t._id}
                  layout
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`group bg-card border rounded-[2rem] p-5 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between gap-4 ${
                    t.isActive ? 'border-border' : 'border-dashed border-border/60 opacity-70'
                  }`}
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-black text-base text-foreground line-clamp-1">{t.itemName}</h3>
                        <span className="text-[9px] bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full font-bold">
                          {t.category}
                        </span>
                      </div>
                      
                      {t.note && (
                        <p className="text-xs text-muted-foreground font-medium line-clamp-1">{t.note}</p>
                      )}

                      <div className="flex flex-col gap-1 mt-3 text-[11px] text-muted-foreground/80 font-medium">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span>Runs on the <strong className="text-foreground">{t.dayOfMonth}</strong> of every month</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Play className="w-3.5 h-3.5 text-teal-500 shrink-0" />
                          <span>Started: <strong className="text-foreground">{formatMonth(t.startDate)}</strong></span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                          <span>Last generated: <strong className="text-foreground">{formatMonth(t.lastGeneratedMonth)}</strong></span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <span className="font-black text-xl text-foreground">₹{t.amount}</span>
                      
                      {/* Active Status Badge Button */}
                      <button
                        onClick={() => handleToggleActive(t)}
                        className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded border transition-all cursor-pointer ${
                          t.isActive 
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/25'
                            : 'bg-muted text-muted-foreground border-border hover:bg-muted/80'
                        }`}
                        title="Click to toggle status"
                      >
                        {t.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </div>
                  </div>

                  {/* Actions Row */}
                  <div className="border-t border-border/50 pt-3 flex justify-between items-center mt-1">
                    <span className="text-[10px] text-muted-foreground/50 font-mono">
                      Added: {t.createdAt ? new Date(t.createdAt).toLocaleDateString() : 'N/A'}
                    </span>
                    <div className="flex items-center gap-2">
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
