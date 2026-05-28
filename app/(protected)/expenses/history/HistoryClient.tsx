'use client';

import React, { useState, useEffect, useRef, useTransition } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import PageWrapper from '@/components/PageWrapper';
import ExpenseTopTabs from '@/components/expense/ExpenseTopTabs';
import ExpenseList from '@/components/expense/ExpenseList';
import ExpenseEditModal from '@/components/expense/ExpenseEditModal';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Expense } from '@/types';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HistoryClientProps {
  initialExpenses: Expense[];
  searchParams: {
    search?: string;
    date?: string;
    month?: string;
  };
}

export default function HistoryClient({ initialExpenses, searchParams }: HistoryClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);

  // Search & Filter State
  const [search, setSearch] = useState<string>(searchParams.search || '');
  const [dateFilter, setDateFilter] = useState<string>(searchParams.date || '');
  const [monthFilter, setMonthFilter] = useState<string>(searchParams.month || '');
  const [showFilters, setShowFilters] = useState<boolean>(
    Boolean(searchParams.date || searchParams.month)
  );

  // Edit Modal State
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [isEditOpen, setIsEditOpen] = useState<boolean>(false);

  // Refs for tracking undo operations and debouncing
  const pendingDeletesRef = useRef<{ [id: string]: NodeJS.Timeout }>({});
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync initialExpenses from SSR props
  useEffect(() => {
    setExpenses(initialExpenses);
  }, [initialExpenses]);

  // Clean up debounce timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  const updateUrl = (searchVal: string, dateVal: string, monthVal: string) => {
    const params = new URLSearchParams();
    if (searchVal.trim()) params.set('search', searchVal.trim());
    if (dateVal) params.set('date', dateVal);
    if (monthVal) params.set('month', monthVal);

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  const handleSearchChange = (val: string) => {
    setSearch(val);

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      updateUrl(val, dateFilter, monthFilter);
    }, 400); // 400ms debounce to avoid overwhelming the server while typing
  };

  const handleDateChange = (val: string) => {
    setDateFilter(val);
    updateUrl(search, val, monthFilter);
  };

  const handleMonthChange = (val: string) => {
    setMonthFilter(val);
    updateUrl(search, dateFilter, val);
  };

  const handleClearSearch = () => {
    setSearch('');
    updateUrl('', dateFilter, monthFilter);
  };

  const handleClearFilters = () => {
    setSearch('');
    setDateFilter('');
    setMonthFilter('');
    updateUrl('', '', '');
    toast.success('Filters cleared');
  };

  const handleEditClick = (expense: Expense) => {
    setEditingExpense(expense);
    setIsEditOpen(true);
  };

  const handleUpdate = (updated: Expense) => {
    setExpenses((prev) =>
      prev.map((e) => (e._id === updated._id ? updated : e))
    );
    router.refresh();
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
          router.refresh();
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

  const isFilterActive = search || dateFilter || monthFilter;
  const filteredTotal = expenses.reduce((sum, e) => sum + e.amount, 0); return (
    <PageWrapper>
      <ExpenseTopTabs />
      <div className="max-w-7xl mx-auto p-4 space-y-4 ">
        <div className="space-y-1">
          <h2 className="text-2xl font-black text-foreground">Expense History</h2>
          <p className="text-xs text-muted-foreground font-medium">View and manage collaborative outflows in this space.</p>
        </div>

        {/* Search Bar & Toggle */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/85" />
            <Input
              type="text"
              placeholder="Search items or notes..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10 bg-background border-input text-foreground text-xs rounded-2xl h-11 focus-visible:ring-ring"
            />
            {search && (
              <button
                onClick={handleClearSearch}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
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
              "w-11 h-11 border-input rounded-2xl bg-background transition-all p-0 flex items-center justify-center cursor-pointer",
              showFilters ? "text-primary border-primary/20 bg-primary/10" : "text-muted-foreground"
            )}
          >
            <SlidersHorizontal className="w-4 h-4" />
          </Button>
        </div>

        {/* Collapsible Filters Section */}
        {showFilters && (
          <div className="bg-card border border-border rounded-3xl p-4 space-y-4 shadow-sm">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Advanced Filters</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Specific Date</label>
                <Input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="bg-background border-input text-foreground text-xs rounded-xl h-9"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Specific Month</label>
                <Input
                  type="month"
                  value={monthFilter}
                  onChange={(e) => handleMonthChange(e.target.value)}
                  className="bg-background border-input text-foreground text-xs rounded-xl h-9"
                />
              </div>
            </div>
            {isFilterActive && (
              <Button
                type="button"
                variant="ghost"
                onClick={handleClearFilters}
                className="w-full text-xs text-destructive hover:text-destructive hover:bg-destructive/10 rounded-xl h-9 border border-destructive/10 cursor-pointer"
              >
                Clear All Filters
              </Button>
            )}
          </div>
        )}

        {/* Filter Summary Banner */}
        {isFilterActive && (
          <div className="bg-primary/5 dark:bg-primary/10 border border-primary/10 rounded-2xl p-4 flex justify-between items-center text-xs">
            <span className="text-muted-foreground font-medium">Filtered Outflow:</span>
            <span className="font-black text-primary text-sm">
              ₹{filteredTotal.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
            </span>
          </div>
        )}

        {/* Grouped list of expenses */}
        {isPending ? (
          <div className="flex justify-center items-center py-20 text-primary">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
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
