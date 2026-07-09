'use client';

import React from 'react';
import { Expense, User } from '@/types';
import ExpenseCard from './ExpenseCard';
import { formatDisplayDate } from '@/lib/date-utils';
import { ShoppingBag, ChevronRight } from 'lucide-react';

interface ExpenseListProps {
  expenses: Expense[];
  onEditClick: (expense: Expense) => void;
  onDeleteClick: (expense: Expense) => void;
  collaborators: User[];
  currentUserId: string;
}

export default function ExpenseList({
  expenses,
  onEditClick,
  onDeleteClick,
  collaborators,
  currentUserId
}: ExpenseListProps) {
  if (expenses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center gap-3">
        <div className="w-16 h-16 rounded-full bg-muted border border-border flex items-center justify-center text-muted-foreground animate-pulse">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-foreground">No expenses recorded</h3>
          <p className="text-xs text-muted-foreground max-w-[200px]">
            Try adding expenses in the Entry tab or adjusting your active filters.
          </p>
        </div>
      </div>
    );
  }

  // Group expenses by date: "YYYY-MM-DD"
  const grouped: { [date: string]: Expense[] } = {};
  for (const exp of expenses) {
    if (!grouped[exp.date]) {
      grouped[exp.date] = [];
    }
    grouped[exp.date].push(exp);
  }

  // Sort dates: latest date first
  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  const formatAmount = (amt: number) => {
    return amt % 1 === 0 ? `₹${amt}` : `₹${amt.toFixed(2)}`;
  };

  return (
    <div className="space-y-6">
      {sortedDates.map((dateStr) => {
        const dayExpenses = grouped[dateStr];
        const dayTotal = dayExpenses.reduce((sum, e) => sum + e.amount, 0);

        return (
          <div key={dateStr} className="space-y-3">
            {/* Group Header: Date and Daily Total */}
            <div className="flex justify-between items-center px-1 sticky top-[68px] bg-background py-2 z-10 border-b border-border">
              <div className="flex items-center gap-1">
                <ChevronRight className="w-4 h-4 text-primary shrink-0" />
                <span className="text-xs font-black text-foreground tracking-wide">
                  {formatDisplayDate(dateStr)}
                </span>
              </div>
              <span className="text-[10px] font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-lg">
                Total: {formatAmount(dayTotal)}
              </span>
            </div>

            {/* Expenses in this Group */}
            <div className="flex flex-col gap-2.5">
              {dayExpenses.map((exp) => (
                <ExpenseCard
                  key={String(exp._id)}
                  expense={exp}
                  onEditClick={onEditClick}
                  onDeleteClick={onDeleteClick}
                  collaborators={collaborators}
                  currentUserId={currentUserId}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
