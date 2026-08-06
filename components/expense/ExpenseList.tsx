'use client';

import React from 'react';
import { Expense, User } from '@/types';
import ExpenseCard from './ExpenseCard';
import EmptyState from '@/components/EmptyState';
import { ShoppingBag } from 'lucide-react';

interface ExpenseListProps {
  expenses: Expense[];
  onEditClick: (expense: Expense) => void;
  onDeleteClick: (expense: Expense) => void;
  collaborators: User[];
  currentUserId: string;
}

function labelDate(dateStr: string): string {
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  if (dateStr === today) return 'Today';
  if (dateStr === yesterday) return 'Yesterday';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function fmtAmt(amt: number) {
  return amt % 1 === 0 ? `₹${amt}` : `₹${amt.toFixed(2)}`;
}

export default function ExpenseList({
  expenses,
  onEditClick,
  onDeleteClick,
  collaborators,
  currentUserId,
}: ExpenseListProps) {
  if (expenses.length === 0) {
    return (
      <EmptyState
        icon={ShoppingBag}
        title="No expenses here"
        hint="Try adjusting the date range or filters."
        color="--violet"
      />
    );
  }

  // Group by date
  const grouped: Record<string, Expense[]> = {};
  for (const exp of expenses) {
    if (!grouped[exp.date]) grouped[exp.date] = [];
    grouped[exp.date].push(exp);
  }
  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  return (
    <div className="flex flex-col gap-4">
      {sortedDates.map((dateStr) => {
        const dayExps = grouped[dateStr];
        const dayTotal = dayExps.reduce((s, e) => s + (e.type === 'income' ? 0 : e.amount), 0);

        return (
          <div key={dateStr} className="flex flex-col gap-2">
            {/* Date group header */}
            <div
              className="flex items-center justify-between px-1 sticky py-1 z-10"
              style={{ top: '68px', background: 'var(--background)' }}
            >
              <span
                className="text-xs font-bold tracking-wide"
                style={{ color: 'var(--foreground)' }}
              >
                {labelDate(dateStr)}
              </span>
              <span
                className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                style={{
                  background: 'var(--accent)',
                  color: 'var(--accent-foreground)',
                }}
              >
                {fmtAmt(dayTotal)}
              </span>
            </div>

            {/* Cards */}
            <div className="card-surface overflow-hidden" style={{ padding: 0 }}>
              <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
                {dayExps.map((exp) => (
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
          </div>
        );
      })}
    </div>
  );
}
