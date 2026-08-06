'use client';

import React, { useState, useEffect, useRef, useTransition } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import AppShell from '@/components/AppShell';
import ExpenseList from '@/components/expense/ExpenseList';
import ExpenseEditModal from '@/components/expense/ExpenseEditModal';
import { toast } from 'sonner';
import { Expense, User } from '@/types';
import { Search, SlidersHorizontal, X } from 'lucide-react';

interface HistoryClientProps {
  initialExpenses: Expense[];
  searchParams: {
    search?: string;
    date?: string;
    month?: string;
  };
  collaborators: User[];
  currentUserId: string;
}

export default function HistoryClient({ initialExpenses, searchParams, collaborators, currentUserId }: HistoryClientProps) {
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

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialExpenses.length === 50);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loaderRef = useRef<HTMLDivElement>(null);

  // Sync initialExpenses from SSR props
  useEffect(() => {
    setExpenses(initialExpenses);
    setPage(1);
    setHasMore(initialExpenses.length === 50);
  }, [initialExpenses, searchParams]);

  // Clean up debounce timeout on unmount
  useEffect(() => {
    const refreshHandler = () => {
      router.refresh();
    };
    window.addEventListener('expense_added', refreshHandler);

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      window.removeEventListener('expense_added', refreshHandler);
    };
  }, [router]);

  const loadMore = async () => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    try {
      const nextPage = page + 1;
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (dateFilter) params.set('date', dateFilter);
      if (monthFilter) params.set('month', monthFilter);
      params.set('page', nextPage.toString());
      
      const res = await fetch(`/api/expenses?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      
      if (data.expenses) {
        setExpenses(prev => [...prev, ...data.expenses]);
        setPage(nextPage);
        setHasMore(data.expenses.length === 50);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load more expenses');
    } finally {
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
        loadMore();
      }
    }, { threshold: 0.1, rootMargin: '100px' });
    
    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }
    
    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, page, search, dateFilter, monthFilter]);

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
  const filteredTotal = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <AppShell>
      <div className="space-y-4">

        {/* Search Bar & Filter Toggle */}
        <div className="flex gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 card-surface px-3" style={{ height: '44px' }}>
              <Search className="w-4 h-4 shrink-0" style={{ color: 'var(--muted-foreground)' }} />
              <input
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search expenses..."
                className="flex-1 bg-transparent text-sm outline-none"
                style={{ color: 'var(--foreground)', fontSize: '16px' }}
              />
              {search && (
                <button
                  onClick={handleClearSearch}
                  className="shrink-0 active:scale-95 transition-all"
                  style={{ color: 'var(--muted-foreground)' }}
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Filter toggle button */}
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="w-11 h-11 card-surface flex items-center justify-center active:scale-95 transition-all"
            style={{
              color: showFilters ? 'var(--primary)' : 'var(--muted-foreground)',
              background: showFilters ? 'var(--violet-soft)' : undefined,
            }}
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>

        {/* Collapsible Filters Section */}
        {showFilters && (
          <div className="card-surface p-4 space-y-4">
            <h3
              className="text-xs font-bold uppercase tracking-wider"
              style={{ color: 'var(--muted-foreground)' }}
            >
              Advanced Filters
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label
                  className="text-[10px] font-bold uppercase"
                  style={{ color: 'var(--muted-foreground)' }}
                >
                  Specific Date
                </label>
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="card-surface px-3 h-11 rounded-xl text-sm outline-none w-full"
                  style={{ color: 'var(--foreground)' }}
                />
              </div>
              <div className="space-y-1.5">
                <label
                  className="text-[10px] font-bold uppercase"
                  style={{ color: 'var(--muted-foreground)' }}
                >
                  Specific Month
                </label>
                <input
                  type="month"
                  value={monthFilter}
                  onChange={(e) => handleMonthChange(e.target.value)}
                  className="card-surface px-3 h-11 rounded-xl text-sm outline-none w-full"
                  style={{ color: 'var(--foreground)' }}
                />
              </div>
            </div>
            {isFilterActive && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="w-full h-9 rounded-xl text-xs font-semibold border active:scale-95 transition-all"
                style={{
                  color: 'var(--danger)',
                  background: 'var(--danger-soft)',
                  borderColor: 'var(--danger)',
                }}
              >
                Clear All Filters
              </button>
            )}
          </div>
        )}

        {/* Filter Summary Banner */}
        {isFilterActive && (
          <div
            className="card-surface p-4 flex justify-between items-center text-xs"
            style={{ background: 'var(--violet-soft)' }}
          >
            <span className="font-medium" style={{ color: 'var(--muted-foreground)' }}>
              Filtered Outflow:
            </span>
            <span className="font-black text-sm" style={{ color: 'var(--primary)' }}>
              ₹{filteredTotal.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
            </span>
          </div>
        )}

        {/* Grouped list of expenses */}
        {isPending ? (
          <div className="flex justify-center items-center py-20">
            <div
              className="animate-spin rounded-full h-8 w-8 border-b-2"
              style={{ borderColor: 'var(--primary)' }}
            />
          </div>
        ) : (
          <>
            <ExpenseList
              expenses={expenses}
              onEditClick={handleEditClick}
              onDeleteClick={handleDeleteClick}
              collaborators={collaborators}
              currentUserId={currentUserId}
            />

            {/* Infinite Scroll Loader */}
            {hasMore && (
              <div ref={loaderRef} className="flex justify-center items-center py-8">
                {isLoadingMore ? (
                  <div
                    className="flex items-center gap-2 text-sm font-medium"
                    style={{ color: 'var(--muted-foreground)' }}
                  >
                    <div
                      className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin"
                      style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }}
                    />
                    Loading more...
                  </div>
                ) : (
                  <div className="h-4" />
                )}
              </div>
            )}

            {!hasMore && expenses.length > 0 && (
              <div
                className="text-center py-8 text-xs font-bold uppercase tracking-widest"
                style={{ color: 'var(--muted-foreground)' }}
              >
                End of History
              </div>
            )}
          </>
        )}
      </div>

      {/* Edit Modal Dialog */}
      <ExpenseEditModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        expense={editingExpense}
        onUpdate={handleUpdate}
        collaborators={collaborators}
        currentUserId={currentUserId}
      />
    </AppShell>
  );
}
