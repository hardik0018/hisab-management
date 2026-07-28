'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Calendar, PenLine, Trash2, ArrowRight, Loader2, ArrowLeftRight } from 'lucide-react';
import PreviewDialog from './PreviewDialog';
import { ParseResult, User } from '@/types';
import { parseExpenses } from '@/lib/expense-parser';
import { queueOfflineExpenses } from '@/lib/offline-queue';

const DRAFT_KEY = 'hisab_expense_draft';

interface DraftData {
  text: string;
  date: string;
  lastEditedAt: number;
}

interface ExpenseEntryBoxProps {
  largeAmountLimit?: number;
  collaborators?: User[];
  currentUserId?: string;
}

export default function ExpenseEntryBox({ largeAmountLimit = 10000, collaborators = [], currentUserId = '' }: ExpenseEntryBoxProps) {
  const [text, setText] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [entryType, setEntryType] = useState<'expense' | 'income' | 'transfer'>('expense');
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);

  // Transfer specific state
  const [transferAmount, setTransferAmount] = useState<string>('');
  const [transferNote, setTransferNote] = useState<string>('');
  const [transferToUser, setTransferToUser] = useState<string>('');

  // Remove otherCollaborators to allow self-transfers
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    try {
      const stored = localStorage.getItem(DRAFT_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as DraftData;
        setText(parsed.text || '');
        setDate(parsed.date || today);
      } else {
        setDate(today);
      }
    } catch (e) {
      setDate(today);
    }
  }, []);

  const saveDraft = (newText: string, newDate: string) => {
    try {
      const draft: DraftData = {
        text: newText,
        date: newDate,
        lastEditedAt: Date.now()
      };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch (e) {
      console.error('Failed to save draft to localStorage', e);
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setText(val);
    saveDraft(val, date);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setDate(val);
    saveDraft(text, val);
  };

  const handleClear = () => {
    if (!text.trim()) return;
    if (confirm('Are you sure you want to clear the entry box?')) {
      setText('');
      saveDraft('', date);
      toast.success('Entry cleared');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (entryType === 'transfer') {
      if (!transferToUser) {
        toast.error('Please select a recipient for the transfer');
        return;
      }
      if (!transferAmount || isNaN(Number(transferAmount)) || Number(transferAmount) <= 0) {
        toast.error('Please enter a valid amount');
        return;
      }
      
      const transferExpense = {
        date,
        itemName: 'Internal Transfer',
        amount: Number(transferAmount),
        note: transferNote,
        type: 'transfer',
        transfer_to_user_id: transferToUser
      };
      
      await saveExpenses([transferExpense], date, []);
      return;
    }

    if (!text.trim()) {
      toast.error('Please enter some expenses first');
      return;
    }

    setIsParsing(true);
    try {
      const result = parseExpenses(text, date, largeAmountLimit);
      setParseResult(result);

      if (result.validExpenses.length === 0) {
        toast.error('No valid expenses parsed. Please correct the lines.');
        setIsParsing(false);
        return;
      }

      if (result.previewRequired) {
        setIsPreviewOpen(true);
      } else {
        await saveExpenses(result.validExpenses, date, result.invalidLines);
      }
    } catch (err) {
      console.error(err);
      toast.error('Connection error. Failed to parse expenses.');
    } finally {
      setIsParsing(false);
    }
  };

  const saveExpenses = async (
    expensesToSave: any[],
    targetDate: string,
    invalidLinesLeft: any[] = []
  ) => {
    setIsSaving(true);
    try {
      const normalizedExpenses = expensesToSave.map(exp => ({
        ...exp,
        date: targetDate,
        type: entryType
      }));

      const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;

      if (isOffline) {
        await queueOfflineExpenses(normalizedExpenses);
        toast.warning(`📴 Offline Mode: Saved ${normalizedExpenses.length} expense(s) to your local queue! They will sync automatically when back online.`, { duration: 6000 });
      } else {
        const res = await fetch('/api/expenses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ expenses: normalizedExpenses })
        });

        if (!res.ok) {
          throw new Error('Failed to save expenses to database');
        }

        const data = await res.json();
        toast.success(`Successfully saved ${data.count} expense records!`);
      }

      if (invalidLinesLeft.length > 0) {
        const remainingText = invalidLinesLeft.map(il => il.line).join('\n');
        setText(remainingText);
        saveDraft(remainingText, targetDate);
        toast.warning(`${invalidLinesLeft.length} invalid lines kept in draft for correction.`);
      } else {
        if (entryType === 'transfer') {
          setTransferAmount('');
          setTransferNote('');
          setTransferToUser('');
        } else {
          setText('');
          saveDraft('', targetDate);
        }
      }

      setIsPreviewOpen(false);
      setParseResult(null);
    } catch (err: any) {
      console.error(err);
      const isNetworkError = err instanceof TypeError || (err?.message && (err.message.includes('fetch') || err.message.includes('network') || err.message.includes('Failed to fetch'))) || (typeof navigator !== 'undefined' && !navigator.onLine);
      if (isNetworkError) {
        try {
          const normalizedExpenses = expensesToSave.map(exp => ({
            ...exp,
            date: targetDate,
            type: entryType
          }));
          await queueOfflineExpenses(normalizedExpenses);
          toast.warning(`📴 Connection lost! Saved ${normalizedExpenses.length} expense(s) to your local offline queue. They will sync automatically when online.`, { duration: 6000 });
          if (invalidLinesLeft.length > 0) {
            const remainingText = invalidLinesLeft.map(il => il.line).join('\n');
            setText(remainingText);
            saveDraft(remainingText, targetDate);
          } else {
            if (entryType === 'transfer') {
              setTransferAmount('');
              setTransferNote('');
              setTransferToUser('');
            } else {
              setText('');
              saveDraft('', targetDate);
            }
          }
          setIsPreviewOpen(false);
          setParseResult(null);
          return;
        } catch (queueErr) {
          console.error('[OFFLINE_QUEUE_FALLBACK_ERROR]', queueErr);
        }
      }
      toast.error('Database connection failed. Your text has been preserved in draft.', {
        duration: 5000
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmPreview = (dateToUse: string) => {
    if (!parseResult) return;
    saveExpenses(parseResult.validExpenses, dateToUse, parseResult.invalidLines);
  };

  return (
    <div className="flex flex-col gap-4 font-sans text-foreground">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Entry Type Toggle */}
        <div className="flex bg-muted p-1 rounded-xl gap-1">
          <Button
            type="button"
            variant="ghost"
            className={`flex-1 rounded-lg h-9 text-xs font-bold ${entryType === 'expense' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            onClick={() => setEntryType('expense')}
          >
            Add Expense
          </Button>
          <Button
            type="button"
            variant="ghost"
            className={`flex-1 rounded-lg h-9 text-xs font-bold ${entryType === 'income' ? 'bg-green-100 text-green-700 shadow-sm hover:bg-green-100 hover:text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'text-muted-foreground hover:text-foreground'}`}
            onClick={() => setEntryType('income')}
          >
            Add Income
          </Button>
          <Button
            type="button"
            variant="ghost"
            className={`flex-1 rounded-lg h-9 text-xs font-bold ${entryType === 'transfer' ? 'bg-blue-100 text-blue-700 shadow-sm hover:bg-blue-100 hover:text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'text-muted-foreground hover:text-foreground'}`}
            onClick={() => setEntryType('transfer')}
          >
            Transfer
          </Button>
        </div>

        {/* Date Selector Row */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-primary">
            <Calendar className="w-4 h-4" />
            <Label htmlFor="date-picker" className="text-xs font-bold text-foreground cursor-pointer">Selected Date</Label>
          </div>
          <Input
            id="date-picker"
            type="date"
            value={date}
            onChange={handleDateChange}
            className="w-40 bg-background border-input text-foreground text-xs rounded-lg focus-visible:ring-primary h-9"
          />
        </div>

        {/* Input Area */}
        {entryType === 'transfer' ? (
          <div className="flex flex-col gap-4 bg-muted/30 p-4 rounded-xl border border-border">
            <div className="flex flex-col gap-2">
              <Label className="text-xs font-bold text-muted-foreground">Transfer To</Label>
              <select
                value={transferToUser}
                onChange={(e) => setTransferToUser(e.target.value)}
                className="w-full h-11 px-3 rounded-lg bg-background border border-input text-sm text-foreground focus-visible:ring-primary outline-none"
              >
                <option value="" disabled>Select collaborator...</option>
                {collaborators.map(c => (
                  <option key={c.user_id} value={c.user_id}>{c.user_id === currentUserId ? 'Self (Me)' : c.name}</option>
                ))}
              </select>
            </div>
            
            <div className="flex flex-col gap-2">
              <Label className="text-xs font-bold text-muted-foreground">Amount</Label>
              <Input
                type="number"
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value)}
                placeholder="Enter amount..."
                className="w-full bg-background border-input text-foreground text-sm rounded-lg focus-visible:ring-primary h-11"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label className="text-xs font-bold text-muted-foreground">Note (Optional)</Label>
              <Input
                type="text"
                value={transferNote}
                onChange={(e) => setTransferNote(e.target.value)}
                placeholder="What was this for?"
                className="w-full bg-background border-input text-foreground text-sm rounded-lg focus-visible:ring-primary h-11"
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center px-1">
              <Label className="text-xs font-bold text-muted-foreground flex items-center gap-1">
                <PenLine className="w-3.5 h-3.5 text-primary" />
                Multiline {entryType === 'income' ? 'Income' : 'Expense'} Text
              </Label>
              <span className="text-[10px] text-muted-foreground font-mono">
                {text.split('\n').filter(Boolean).length} lines
              </span>
            </div>

            <textarea
              value={text}
              onChange={handleTextChange}
              placeholder={`Example:\n\nBhugra-40\nWafer Biscuit-30\nMilk-32.50\nPetrol:200 bike refill\nTea = 10\n27-may-26 (sets date for lines below)`}
              className="w-full min-h-[220px] max-h-[350px] p-4 bg-background border border-input rounded-xl text-sm font-mono text-foreground placeholder-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-y leading-relaxed shadow-sm"
            />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleClear}
            disabled={entryType === 'transfer' ? (!transferAmount && !transferNote && !transferToUser) : !text.trim()}
            className="h-12 bg-background border border-input text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl flex-1 transition-all cursor-pointer font-bold"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Clear
          </Button>

          <Button
            type="submit"
            disabled={isParsing || isSaving || (entryType === 'transfer' ? (!transferToUser || !transferAmount) : !text.trim())}
            className="h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl flex-[2] shadow-sm transition-all border-0 cursor-pointer"
          >
            {isParsing || isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {isParsing ? 'Parsing...' : 'Saving...'}
              </>
            ) : (
              <>
                Process & Save
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </form>

      {/* Preview Interceptor Dialog */}
      <PreviewDialog
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        parseResult={parseResult}
        datePickerDate={date}
        onConfirm={handleConfirmPreview}
      />
    </div>
  );
}
