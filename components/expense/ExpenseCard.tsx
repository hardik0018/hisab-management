'use client';

import React from 'react';
import { Expense } from '@/types';
import { formatDisplayTime } from '@/lib/date-utils';
import { Edit2, Trash2 } from 'lucide-react';

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
  // Rule H: Decimal Amount Support
  const formatAmount = (amt: number) => {
    return amt % 1 === 0 ? `₹${amt}` : `₹${amt.toFixed(2)}`;
  };

  return (
    <div className="group bg-white dark:bg-slate-900/60 border border-slate-100 dark:border-slate-900 hover:border-slate-200 dark:hover:border-slate-850 rounded-2xl p-4 flex justify-between items-center transition-all duration-300 shadow-sm hover:shadow-md">
      <div className="flex flex-col gap-1 pr-2 min-w-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="font-bold text-slate-800 dark:text-slate-100 text-sm truncate">{expense.itemName}</span>
          {expense.amount >= 10000 && (
            <span className="shrink-0 text-[8px] bg-amber-150 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/10 px-1.5 py-0.5 rounded font-black uppercase tracking-wider">
              Large
            </span>
          )}
        </div>
        
        {expense.note && (
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate max-w-[220px]">
            {expense.note}
          </span>
        )}

        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono font-medium">
          {formatDisplayTime(expense.createdAt)}
        </span>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <span className="font-black text-slate-900 dark:text-slate-100 text-base font-sans">
          {formatAmount(expense.amount)}
        </span>

        {/* Edit and Delete Buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onEditClick(expense)}
            className="p-2 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-xl transition-all cursor-pointer"
            title="Edit"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => onDeleteClick(expense)}
            className="p-2 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-all cursor-pointer"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
