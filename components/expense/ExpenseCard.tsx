'use client';

import React from 'react';
import { Expense } from '@/types';
import { formatDisplayTime } from '@/lib/date-utils';
import { Edit2, Trash2, Link, Repeat } from 'lucide-react';
import { toast } from 'sonner';

interface ExpenseCardProps {
  expense: Expense;
  onEditClick: (expense: Expense) => void;
  onDeleteClick: (expense: Expense) => void;
}

export default function ExpenseCard({
  expense,
  onEditClick,
  onDeleteClick
}: ExpenseCardProps) {
  // Rule H: Decimal Amount Support & negative values
  const formatAmount = (amt: number) => {
    const isNegative = amt < 0;
    const absAmt = Math.abs(amt);
    const formatted = absAmt % 1 === 0 ? `₹${absAmt}` : `₹${absAmt.toFixed(2)}`;
    return isNegative ? `-${formatted}` : formatted;
  };

  const isLinked = expense.associatedType === 'hisab' || expense.associatedType === 'marriage';

  const handleDisabledActionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const source = expense.associatedType === 'hisab' ? 'Hisab' : 'Marriage';
    toast.info(
      `This expense is linked to a ${source} record. Please edit or delete it on the ${source} page to keep records in sync.`,
      { duration: 5000 }
    );
  };

  return (
    <div className="group bg-card border border-border hover:border-border/80 rounded-2xl px-4 py-2 flex justify-between items-center transition-all duration-300 shadow-sm hover:shadow-md">
      <div className="flex flex-col gap-1 pr-2 min-w-0">
        <div className="flex items-center gap-1 min-w-0 flex-wrap">
          <span className="font-bold text-foreground text-sm truncate">{expense.itemName}</span>
          {expense.amount >= 10000 && (
            <span className="shrink-0 text-[8px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded font-black uppercase tracking-wider">
              Large
            </span>
          )}
          {expense.associatedType === 'hisab' && (
            <span className="shrink-0 text-[8px] bg-primary/5 dark:bg-primary/10 text-primary border border-primary/20 px-1.5 py-0.5 rounded font-black uppercase tracking-wider flex items-center gap-0.5">
              <Link className="w-2 h-2" /> Hisab
            </span>
          )}
          {expense.associatedType === 'marriage' && (
            <span className="shrink-0 text-[8px] bg-destructive/5 dark:bg-destructive/10 text-destructive border border-destructive/25 px-1.5 py-0.5 rounded font-black uppercase tracking-wider flex items-center gap-0.5">
              <Link className="w-2 h-2" /> Marriage
            </span>
          )}
          {expense.associatedType === 'recurring' && (
            <span className="shrink-0 text-[8px] bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20 px-1.5 py-0.5 rounded font-black uppercase tracking-wider flex items-center gap-0.5">
              <Repeat className="w-2 h-2" /> Auto
            </span>
          )}
        </div>

        {expense.note && (
          <span className="text-xs text-muted-foreground font-medium truncate max-w-[220px]">
            {expense.note}
          </span>
        )}

        <span className="text-[10px] text-muted-foreground/80 font-mono font-medium">
          {formatDisplayTime(expense.createdAt)}
        </span>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <span className={`font-black text-base font-sans ${expense.amount < 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground'}`}>
          {formatAmount(expense.amount)}
        </span>

        {/* Edit and Delete Buttons */}
        <div className="flex items-center gap-1">
          {isLinked ? (
            <>
              <button
                onClick={handleDisabledActionClick}
                className="p-2 text-muted-foreground/40 hover:text-muted-foreground/60 rounded-xl cursor-not-allowed transition-all"
                title="Linked record - Edit at source"
              >
                <Edit2 className="w-4 h-4 opacity-55" />
              </button>

              <button
                onClick={handleDisabledActionClick}
                className="p-2 text-muted-foreground/40 hover:text-muted-foreground/60 rounded-xl cursor-not-allowed transition-all"
                title="Linked record - Delete at source"
              >
                <Trash2 className="w-4 h-4 opacity-55" />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => onEditClick(expense)}
                className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl transition-all cursor-pointer"
                title="Edit"
              >
                <Edit2 className="w-4 h-4" />
              </button>

              <button
                onClick={() => onDeleteClick(expense)}
                className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all cursor-pointer"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
