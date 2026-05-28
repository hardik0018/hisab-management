'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Expense } from '@/types';
import { Loader2 } from 'lucide-react';

interface ExpenseEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  expense: Expense | null;
  onUpdate: (updatedExpense: Expense) => void;
}

export default function ExpenseEditModal({
  isOpen,
  onClose,
  expense,
  onUpdate
}: ExpenseEditModalProps) {
  const [itemName, setItemName] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (expense) {
      setItemName(expense.itemName);
      setAmount(String(expense.amount));
      setNote(expense.note || '');
      setDate(expense.date);
    }
  }, [expense]);

  if (!expense) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const amt = parseFloat(amount);
    if (!itemName || itemName.trim().length < 2) {
      toast.error('Item name must be at least 2 characters');
      return;
    }
    if (isNaN(amt) || amt <= 0) {
      toast.error('Amount must be greater than 0');
      return;
    }
    if (!date) {
      toast.error('Date is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/expenses/${expense._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemName: itemName.trim(),
          amount: amt,
          note: note.trim(),
          date
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to update expense');
      }

      const data = await res.json();
      toast.success('Expense updated successfully!');
      onUpdate(data.expense);
      onClose();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to save changes');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md w-[92%] bg-card border border-border text-card-foreground rounded-3xl p-6 shadow-2xl">
        <DialogHeader className="text-left space-y-1">
          <DialogTitle className="text-lg font-bold text-foreground font-sans">Edit Expense</DialogTitle>
          <DialogDescription className="text-muted-foreground text-xs">
            Modify details for this expense record below.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-3">
          {/* Item Name */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-item-name" className="text-xs font-semibold text-muted-foreground">Item Name</Label>
            <Input
              id="edit-item-name"
              type="text"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              className="bg-background border-input text-foreground text-sm rounded-xl h-11"
              required
            />
          </div>

          {/* Amount */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-amount" className="text-xs font-semibold text-muted-foreground">Amount (INR)</Label>
            <Input
              id="edit-amount"
              type="number"
              step="any"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="bg-background border-input text-foreground text-sm rounded-xl h-11"
              required
            />
          </div>

          {/* Date */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-date" className="text-xs font-semibold text-muted-foreground">Date</Label>
            <Input
              id="edit-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-background border-input text-foreground text-sm rounded-xl h-11"
              required
            />
          </div>

          {/* Note */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-note" className="text-xs font-semibold text-muted-foreground">Note (Optional)</Label>
            <Input
              id="edit-note"
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. at market, for party"
              className="bg-background border-input text-foreground text-sm rounded-xl h-11"
            />
          </div>

          <DialogFooter className="flex-row gap-2 mt-6 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
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
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
