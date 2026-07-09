'use client';

import React from 'react';
import { Expense, User } from '@/types';
import { formatDisplayTime } from '@/lib/date-utils';
import { Edit2, Trash2, Link, Repeat } from 'lucide-react';
import { toast } from 'sonner';

interface ExpenseCardProps {
  expense: Expense;
  onEditClick: (expense: Expense) => void;
  onDeleteClick: (expense: Expense) => void;
  collaborators: User[];
  currentUserId: string;
}

export default function ExpenseCard({
  expense,
  onEditClick,
  onDeleteClick,
  collaborators,
  currentUserId
}: ExpenseCardProps) {
  // Rule H: Decimal Amount Support & negative values
  const formatAmount = (amt: number) => {
    const isNegative = amt < 0;
    const absAmt = Math.abs(amt);
    const formatted = absAmt % 1 === 0 ? `₹${absAmt}` : `₹${absAmt.toFixed(2)}`;
    return isNegative ? `-${formatted}` : formatted;
  };

  const isLinked = (expense.associatedType === 'hisab' || expense.associatedType === 'marriage') && expense.type !== 'transfer_out' && expense.type !== 'transfer_in';

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
          {(expense.type === 'transfer_out' || expense.associatedType === 'transfer') && (
            <span className="shrink-0 text-[8px] bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 px-1.5 py-0.5 rounded font-black uppercase tracking-wider flex items-center gap-0.5">
              <Link className="w-2 h-2" /> Transfer
            </span>
          )}
          {expense.associatedType === 'hisab' && expense.type !== 'transfer_out' && expense.type !== 'transfer_in' && (
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
          {expense.type === 'income' && (
            <span className="shrink-0 text-[8px] bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20 px-1.5 py-0.5 rounded font-black uppercase tracking-wider flex items-center gap-0.5">
              Income
            </span>
          )}
        </div>

        {expense.note && (
          <span className="text-xs text-muted-foreground font-medium truncate max-w-[220px]">
            {expense.note}
          </span>
        )}

        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-[10px] text-muted-foreground/80 font-mono font-medium">
            {formatDisplayTime(expense.createdAt)}
          </span>
          {expense.user_id !== currentUserId && (
            <>
              <span className="text-muted-foreground/30 select-none text-[10px]">•</span>
              <span className="text-[10px] font-medium whitespace-nowrap text-muted-foreground/80">
                Paid by: <span className="font-bold text-foreground">{collaborators?.find(c => c.user_id === expense.user_id)?.name || 'Unknown'}</span>
              </span>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <span className={`font-black text-base font-sans ${expense.amount < 0 || expense.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground'}`}>
          {expense.type === 'income' ? '+' : ''}{formatAmount(expense.amount)}
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
