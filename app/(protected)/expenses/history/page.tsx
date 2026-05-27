'use client';

import React, { useState, useEffect, useRef } from 'react';
import PageWrapper from '@/components/PageWrapper';
import ExpenseTopTabs from '@/components/expense/ExpenseTopTabs';
import ExpenseList from '@/components/expense/ExpenseList';
import ExpenseEditModal from '@/components/expense/ExpenseEditModal';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Expense } from '@/types';
import { Search, SlidersHorizontal, X, ArrowUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function HistoryPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Search & Filter State
  const [search, setSearch] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [monthFilter, setMonthFilter] = useState<string>('');
  const [showFilters, setShowFilters] = useState<boolean>(false);

  // Edit Modal State
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [isEditOpen, setIsEditOpen] = useState<boolean>(false);

  // Refs for tracking undo operations
  const pendingDeletesRef = useRef<{ [id: string]: NodeJS.Timeout }>({});

  const fetchExpenses = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.append('search', search.trim());
      if (dateFilter) params.append('date', dateFilter);
      if (monthFilter) params.append('month', monthFilter);

      const res = await fetch(`/api/expenses?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setExpenses(data.expenses);
      } else {
        toast.error('Failed to load expenses');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error connecting to server');
    } finally {
      setIsLoading(false);
    }
  };

  // Re-fetch when search or filter values change
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchExpenses();
    }, 300); // Debounce typing slightly

    return () => clearTimeout(handler);
  }, [search, dateFilter, monthFilter]);

  const handleEditClick = (expense: Expense) => {
    setEditingExpense(expense);
    setIsEditOpen(true);
  };

  const handleUpdate = (updated: Expense) => {
    setExpenses((prev) =>
      prev.map((e) => (e._id === updated._id ? updated : e))
    );
  };

  // Delete Expense with 5-second Undo logic
  const handleDeleteClick = (expense: Expense) => {
    const id = String(expense._id);
    if (!id) return;

    // 1. Immediately remove from local state list
    setExpenses((prev) => prev.filter((e) => e._id !== expense._id));

    let undone = false;

    // 2. Schedule the permanent API deletion in 5 seconds
    const timer = setTimeout(async () => {
      delete pendingDeletesRef.current[id];
      if (!undone) {
        try {
          const res = await fetch(`/api/expenses/${id}`, {
            method: 'DELETE'
          });
          if (!res.ok) {
            throw new Error('Failed to delete');
          }
        } catch (err) {
          console.error('Delete failed:', err);
          toast.error(`Could not delete "${expense.itemName}" from server.`);
          // Restore it if database call failed
          setExpenses((prev) => [expense, ...prev].sort((a, b) => b.date.localeCompare(a.date)));
        }
      }
    }, 5000);

    // Track active timeout
    pendingDeletesRef.current[id] = timer;

    // 3. Show Sonner toast with Undo action
    toast(`Deleted "${expense.itemName}"`, {
      duration: 5000,
      description: `Amount: ₹${expense.amount}`,
      action: {
        label: 'Undo',
        onClick: () => {
          undone = true;
          // Cancel the timeout
          if (pendingDeletesRef.current[id]) {
            clearTimeout(pendingDeletesRef.current[id]);
            delete pendingDeletesRef.current[id];
          }
          // Restore to local state list
          setExpenses((prev) => [expense, ...prev].sort((a, b) => {
            const dateCompare = b.date.localeCompare(a.date);
            if (dateCompare !== 0) return dateCompare;
            
            const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt).getTime();
            const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt).getTime();
            return bTime - aTime;
          }));
          toast.success(`Restored "${expense.itemName}"`);
        }
      }
    });
  };

  const handleClearFilters = () => {
    setSearch('');
    setDateFilter('');
    setMonthFilter('');
    toast.success('Filters cleared');
  };

  const isFilterActive = search || dateFilter || monthFilter;
  const filteredTotal = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <PageWrapper>
      <ExpenseTopTabs />
      <div className="max-w-md mx-auto p-4 space-y-4 pb-32">
        <div className="space-y-1">
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">Expense History</h2>
          <p className="text-xs text-slate-500 font-medium">View and manage collaborative outflows in this space.</p>
        </div>

        {/* Search Bar & Toggle */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search items or notes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 text-xs rounded-2xl h-11"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "w-11 h-11 border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 transition-all p-0 flex items-center justify-center cursor-pointer",
              showFilters ? "text-indigo-600 dark:text-indigo-400 border-indigo-500/20 bg-indigo-50/20" : "text-slate-500"
            )}
          >
            <SlidersHorizontal className="w-4 h-4" />
          </Button>
        </div>

        {/* Collapsible Filters Section */}
        {showFilters && (
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-4 space-y-4 shadow-sm">
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Advanced Filters</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Specific Date</label>
                <Input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-850 text-slate-800 dark:text-slate-200 text-xs rounded-xl h-9"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Specific Month</label>
                <Input
                  type="month"
                  value={monthFilter}
                  onChange={(e) => setMonthFilter(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-850 text-slate-800 dark:text-slate-200 text-xs rounded-xl h-9"
                />
              </div>
            </div>
            {isFilterActive && (
              <Button
                type="button"
                variant="ghost"
                onClick={handleClearFilters}
                className="w-full text-xs text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl h-9 border border-rose-500/10 cursor-pointer"
              >
                Clear All Filters
              </Button>
            )}
          </div>
        )}

        {/* Filter Summary Banner */}
        {isFilterActive && (
          <div className="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 rounded-2xl p-4 flex justify-between items-center text-xs">
            <span className="text-slate-600 dark:text-slate-300 font-medium">Filtered Outflow:</span>
            <span className="font-black text-indigo-600 dark:text-indigo-400 text-sm">
              ₹{filteredTotal.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
            </span>
          </div>
        )}

        {/* Grouped list of expenses */}
        {isLoading ? (
          <div className="flex justify-center items-center py-20 text-indigo-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
          </div>
        ) : (
          <ExpenseList
            expenses={expenses}
            onEditClick={handleEditClick}
            onDeleteClick={handleDeleteClick}
          />
        )}
      </div>

      {/* Edit Modal Dialog */}
      <ExpenseEditModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        expense={editingExpense}
        onUpdate={handleUpdate}
      />
    </PageWrapper>
  );
}
