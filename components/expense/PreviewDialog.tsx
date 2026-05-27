'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertCircle, CalendarRange, ShieldAlert, BadgeAlert, CheckCircle2 } from 'lucide-react';
import { ParseResult } from '@/types';
import { formatDisplayDate } from '@/lib/date-utils';
import { cn } from '@/lib/utils';

interface PreviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  parseResult: ParseResult | null;
  datePickerDate: string;
  onConfirm: (dateToUse: string) => void;
}

export default function PreviewDialog({
  isOpen,
  onClose,
  parseResult,
  datePickerDate,
  onConfirm
}: PreviewDialogProps) {
  const [selectedDateOption, setSelectedDateOption] = useState<string>('');

  useEffect(() => {
    if (parseResult?.dateConflict) {
      setSelectedDateOption(parseResult.dateConflict.textDate);
    } else {
      setSelectedDateOption(datePickerDate);
    }
  }, [parseResult, datePickerDate]);

  if (!parseResult) return null;

  const { validExpenses, invalidLines, hasLargeAmount, dateConflict } = parseResult;

  const handleSave = () => {
    onConfirm(selectedDateOption);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md w-[92%] bg-card border border-border text-foreground rounded-xl p-6 shadow-2xl overflow-y-auto max-h-[85vh] font-sans">
        <DialogHeader className="text-left space-y-1.5">
          <div className="flex items-center gap-2 text-primary">
            <BadgeAlert className="w-5.5 h-5.5 animate-pulse" />
            <DialogTitle className="text-lg font-bold font-sans text-foreground">Entry Review Required</DialogTitle>
          </div>
          <DialogDescription className="text-muted-foreground text-xs font-sans">
            Please review the flags below before savings are committed.
          </DialogDescription>
        </DialogHeader>

        <div className="my-4 space-y-4 text-sm font-sans">
          {/* 1. DATE CONFLICT WARNING */}
          {dateConflict && (
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
                <CalendarRange className="w-4 h-4" />
                <span>Date Conflict Found</span>
              </div>
              <p className="text-xs text-muted-foreground">
                The date written in the text does not match the date picker. Which date should apply to these expenses?
              </p>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setSelectedDateOption(dateConflict.textDate)}
                  className={cn(
                    "p-3 rounded-xl border text-left flex flex-col gap-1 transition-all",
                    selectedDateOption === dateConflict.textDate
                      ? "bg-primary/10 border-primary text-primary"
                      : "bg-background border-input text-muted-foreground hover:border-muted-foreground/30"
                  )}
                >
                  <span className="text-[10px] font-bold opacity-60">Date in Text</span>
                  <span className="text-xs font-bold">{formatDisplayDate(dateConflict.textDate)}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDateOption(dateConflict.selectedDate)}
                  className={cn(
                    "p-3 rounded-xl border text-left flex flex-col gap-1 transition-all",
                    selectedDateOption === dateConflict.selectedDate
                      ? "bg-primary/10 border-primary text-primary"
                      : "bg-background border-input text-muted-foreground hover:border-muted-foreground/30"
                  )}
                >
                  <span className="text-[10px] font-bold opacity-60">Picker Date</span>
                  <span className="text-xs font-bold">{formatDisplayDate(dateConflict.selectedDate)}</span>
                </button>
              </div>
            </div>
          )}

          {/* 2. LARGE AMOUNT WARNING */}
          {hasLargeAmount && (
            <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl flex gap-3 text-amber-600 dark:text-amber-400">
              <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider block">Large Amount Alert</span>
                <p className="text-xs text-muted-foreground">
                  One or more expenses exceed ₹10,000. Please double check the amounts before saving.
                </p>
              </div>
            </div>
          )}

          {/* 3. INVALID LINES DISPLAY */}
          {invalidLines.length > 0 && (
            <div className="p-4 bg-destructive/5 border border-destructive/15 rounded-xl space-y-2 text-destructive">
              <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider">
                <AlertCircle className="w-4 h-4" />
                <span>Invalid Lines Ignored ({invalidLines.length})</span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                These lines failed parsing and will not be saved. They will remain in the text box so you can fix them.
              </p>
              <div className="max-h-24 overflow-y-auto space-y-1.5 pt-1 pr-1 bg-background rounded-lg p-2 border border-input">
                {invalidLines.map((il, idx) => (
                  <div key={idx} className="text-[11px] font-mono leading-relaxed border-b border-border pb-1 last:border-0 last:pb-0">
                    <span className="text-destructive font-bold">Line {idx+1}:</span> <span className="text-foreground">"{il.line}"</span>
                    <span className="block text-[10px] text-muted-foreground italic font-sans">Reason: {il.reason}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. VALID LINES PREVIEW */}
          {validExpenses.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs uppercase tracking-wider">
                <CheckCircle2 className="w-4 h-4" />
                <span>Parsed Expenses ({validExpenses.length})</span>
              </div>
              <div className="max-h-40 overflow-y-auto space-y-2 bg-muted/20 border border-border rounded-xl p-3 pr-2">
                {validExpenses.map((exp, idx) => (
                  <div key={idx} className="flex justify-between items-start text-xs border-b border-border pb-2 last:border-0 last:pb-0">
                    <div className="space-y-0.5">
                      <span className="font-semibold text-foreground block text-xs">{exp.itemName}</span>
                      {exp.note && <span className="text-[10px] text-muted-foreground block max-w-[200px] truncate">({exp.note})</span>}
                      <span className="text-[9px] text-primary">
                        Date: {formatDisplayDate(dateConflict ? selectedDateOption : exp.date)}
                      </span>
                    </div>
                    <div className="text-right shrink-0 flex flex-col items-end gap-1 font-sans">
                      <span className={cn(
                        "font-bold",
                        exp.isLarge ? "text-amber-500" : "text-foreground"
                      )}>
                        ₹{exp.amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                      </span>
                      {exp.isLarge && (
                        <span className="text-[8px] bg-amber-500/10 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded font-bold uppercase">
                          Large
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex-row gap-2 mt-6 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="w-1/2 sm:w-auto border-input bg-background text-muted-foreground hover:text-foreground rounded-xl cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={validExpenses.length === 0}
            onClick={handleSave}
            className="w-1/2 sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl border-0 cursor-pointer"
          >
            Confirm & Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
