'use client';

import React, { useEffect, useState } from 'react';
import StatCard from '@/components/StatCard';
import { ParsedDraft } from '@/lib/parser';

interface LiveStatCardsProps {
  initialToday: number;
  initialMonthlyIn: number;
  initialMonthlyOut: number;
}

export default function LiveStatCards({
  initialToday,
  initialMonthlyIn,
  initialMonthlyOut,
}: LiveStatCardsProps) {
  const [today, setToday] = useState(initialToday);
  const [monthIn, setMonthIn] = useState(initialMonthlyIn);
  const [monthOut, setMonthOut] = useState(initialMonthlyOut);

  // Sync state if initial props change (e.g. from actual page refresh)
  useEffect(() => {
    setToday(initialToday);
    setMonthIn(initialMonthlyIn);
    setMonthOut(initialMonthlyOut);
  }, [initialToday, initialMonthlyIn, initialMonthlyOut]);

  useEffect(() => {
    const handleExpenseAdded = (e: any) => {
      // Listen for the custom event and optimistically update
      const items: ParsedDraft[] = e.detail?.items;
      if (!items) return;

      let newToday = today;
      let newIn = monthIn;
      let newOut = monthOut;

      for (const item of items) {
        if (item.kind === 'expense') {
          if (item.type === 'expense') {
            newToday += item.amount;
            newOut += item.amount;
          } else if (item.type === 'income') {
            newIn += item.amount;
          }
        } else if (item.kind === 'hisab') {
          // Hisab debit (giving money) is logged as an expense
          if (item.type === 'debit') {
            newToday += item.amount;
            newOut += item.amount;
          }
        }
        // Transfers do not affect the net monthly/today totals for expenses/income
      }

      setToday(newToday);
      setMonthIn(newIn);
      setMonthOut(newOut);
    };

    window.addEventListener('expense_added', handleExpenseAdded);
    return () => window.removeEventListener('expense_added', handleExpenseAdded);
  }, [today, monthIn, monthOut]);

  return (
    <>
      <StatCard
        variant="hero"
        label="Spent today"
        amount={today}
        caption="Tap a chip below or type to add"
      />

      <div className="grid grid-cols-2 gap-3">
        <StatCard
          variant="in"
          label="Money in"
          amount={monthIn}
          caption="This month"
        />
        <StatCard
          variant="out"
          label="Money out"
          amount={monthOut}
          caption="This month"
        />
      </div>
    </>
  );
}
