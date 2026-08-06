'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Expense, User } from '@/types';
import SectionTitle from '@/components/SectionTitle';
import EmptyState from '@/components/EmptyState';
import ExpenseCard from './ExpenseCard';
import { ShoppingBag, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface TodayExpensesSectionProps {
  collaborators: User[];
  currentUserId: string;
}

export default function TodayExpensesSection({
  collaborators,
  currentUserId,
}: TodayExpensesSectionProps) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  const todayStr = new Date().toISOString().split('T')[0];

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/expenses?date=${todayStr}&limit=100`);
      if (!res.ok) return;
      const data = await res.json();
      setExpenses(data.expenses ?? []);
    } catch {
      /* silently fail */
    } finally {
      setLoading(false);
    }
  }, [todayStr]);

  useEffect(() => {
    load();
    // Re-load on window focus (after the user has navigated away and come back)
    // Re-load on window focus (after the user has navigated away and come back)
    const handler = () => load();
    window.addEventListener('focus', handler);
    window.addEventListener('expense_added', handler);
    return () => {
      window.removeEventListener('focus', handler);
      window.removeEventListener('expense_added', handler);
    };
  }, [load]);

  const handleDelete = async (exp: Expense) => {
    if (!exp._id) return;
    const prev = expenses;
    // Optimistic removal
    setExpenses((e) => e.filter((x) => String(x._id) !== String(exp._id)));
    try {
      const res = await fetch(`/api/expenses/${exp._id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      toast.success(`Deleted: ${exp.itemName}`);
    } catch {
      setExpenses(prev);
      toast.error('Failed to delete. Please try again.');
    }
  };

  const handleEdit = (exp: Expense) => {
    // Trigger edit by dispatching a custom event that HistoryClient / parent can listen to
    // For now, this is a no-op placeholder since edit modal is in HistoryClient
    toast.info('Edit: go to History tab to edit past entries.');
  };

  if (loading) {
    return (
      <div
        className="flex items-center justify-center py-10 gap-2"
        style={{ color: 'var(--muted-foreground)' }}
      >
        <RefreshCw className="w-4 h-4 animate-spin" />
        <span className="text-sm">Loading today's entries...</span>
      </div>
    );
  }

  if (expenses.length === 0) {
    return (
      <EmptyState
        icon={ShoppingBag}
        title="Nothing yet — add your first one"
        hint="Type chai 20 above and press Enter. Done."
        color="--violet"
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <SectionTitle>Today's entries</SectionTitle>
      <div
        className="card-surface overflow-hidden"
        style={{ padding: '0' }}
      >
        <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
          {expenses.map((exp) => (
            <ExpenseCard
              key={String(exp._id)}
              expense={exp}
              onEditClick={handleEdit}
              onDeleteClick={handleDelete}
              collaborators={collaborators}
              currentUserId={currentUserId}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
