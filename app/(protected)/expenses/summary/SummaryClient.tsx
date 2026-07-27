'use client';

import React, { useState, useEffect, useRef, useTransition } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import PageWrapper from '@/components/PageWrapper';
import ExpenseTopTabs from '@/components/expense/ExpenseTopTabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import dynamic from 'next/dynamic';

const SummaryChart = dynamic(() => import('@/components/expense/SummaryChart'), {
  ssr: false,
  loading: () => (
    <div className="h-[200px] w-full flex items-center justify-center bg-slate-50 dark:bg-slate-900/50 animate-pulse rounded-2xl">
      <div className="flex flex-col items-center gap-2">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
        <span className="text-xs text-muted-foreground font-medium">Loading Outflow Graph...</span>
      </div>
    </div>
  ),
});

const CategoryBreakdownChart = dynamic(() => import('@/components/expense/CategoryBreakdownChart'), {
  ssr: false,
  loading: () => (
    <div className="h-[200px] w-full flex items-center justify-center bg-slate-50 dark:bg-slate-900/50 animate-pulse rounded-2xl">
      <div className="flex flex-col items-center gap-2">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
        <span className="text-xs text-muted-foreground font-medium">Loading Donut Chart...</span>
      </div>
    </div>
  ),
});
import { getCategoryColor, CategoryBreakdownItem } from '@/components/expense/CategoryBreakdownChart';
import { CalendarDays, TrendingDown, Search, ArrowRight, ArrowLeft, X, Users, User, PieChart as PieIcon, Tag, Flame } from 'lucide-react';
import { formatDisplayDate } from '@/lib/date-utils';

interface DailyTotal {
  date: string;
  total: number;
}

interface MemberBalance {
  user_id: string;
  name: string;
  income: number;
  expense: number;
  balance: number;
}

interface SummaryClientProps {
  initialMonth: string;
  initialMonthlyTotal: number;
  initialMonthlyIncome: number;
  initialFilteredTotal: number;
  initialDailyTotals: DailyTotal[];
  initialTodayTotal: number;
  initialMemberBalances?: MemberBalance[];
  initialCategoryBreakdown?: CategoryBreakdownItem[];
  initialTopExpenses?: { _id: string; itemName: string; amount: number; date: string; category: string; note: string }[];
  searchParams: {
    month?: string;
    search?: string;
  };
}

export default function SummaryClient({
  initialMonth,
  initialMonthlyTotal,
  initialMonthlyIncome,
  initialFilteredTotal,
  initialDailyTotals,
  initialTodayTotal,
  initialMemberBalances,
  initialCategoryBreakdown,
  initialTopExpenses,
  searchParams
}: SummaryClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const [month, setMonth] = useState<string>(initialMonth);
  const [monthlyTotal, setMonthlyTotal] = useState<number>(initialMonthlyTotal);
  const [monthlyIncome, setMonthlyIncome] = useState<number>(initialMonthlyIncome);
  const [filteredTotal, setFilteredTotal] = useState<number>(initialFilteredTotal);
  const [dailyTotals, setDailyTotals] = useState<DailyTotal[]>(initialDailyTotals);
  const [todayTotal, setTodayTotal] = useState<number>(initialTodayTotal);
  const [memberBalances, setMemberBalances] = useState<MemberBalance[]>(initialMemberBalances || []);
  const [categoryBreakdown, setCategoryBreakdown] = useState<CategoryBreakdownItem[]>(initialCategoryBreakdown || []);
  const [topExpenses, setTopExpenses] = useState<{ _id: string; itemName: string; amount: number; date: string; category: string; note: string }[]>(initialTopExpenses || []);

  const [search, setSearch] = useState<string>(searchParams.search || '');
  const [isMountedState, setIsMountedState] = useState(false);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setIsMountedState(true);
  }, []);

  // Sync state from SSR props
  useEffect(() => {
    setMonth(initialMonth);
    setMonthlyTotal(initialMonthlyTotal);
    setMonthlyIncome(initialMonthlyIncome);
    setFilteredTotal(initialFilteredTotal);
    setDailyTotals(initialDailyTotals);
    setTodayTotal(initialTodayTotal);
    if (initialMemberBalances) setMemberBalances(initialMemberBalances);
    if (initialCategoryBreakdown) setCategoryBreakdown(initialCategoryBreakdown);
    if (initialTopExpenses) setTopExpenses(initialTopExpenses);
  }, [initialMonth, initialMonthlyTotal, initialMonthlyIncome, initialFilteredTotal, initialDailyTotals, initialTodayTotal, initialMemberBalances, initialCategoryBreakdown, initialTopExpenses]);

  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  const updateUrl = (monthVal: string, searchVal: string) => {
    const params = new URLSearchParams();
    if (monthVal) params.set('month', monthVal);
    if (searchVal.trim()) params.set('search', searchVal.trim());

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
      updateUrl(month, val);
    }, 400); // 400ms debounce
  };

  const handlePrevMonth = () => {
    const [year, mon] = month.split('-').map(Number);
    let prevYear = year;
    let prevMon = mon - 1;
    if (prevMon === 0) {
      prevMon = 12;
      prevYear = year - 1;
    }
    const newMonth = `${prevYear}-${String(prevMon).padStart(2, '0')}`;
    setMonth(newMonth);
    updateUrl(newMonth, search);
  };

  const handleNextMonth = () => {
    const [year, mon] = month.split('-').map(Number);
    let nextYear = year;
    let nextMon = mon + 1;
    if (nextMon === 13) {
      nextMon = 1;
      nextYear = year + 1;
    }
    const newMonth = `${nextYear}-${String(nextMon).padStart(2, '0')}`;
    setMonth(newMonth);
    updateUrl(newMonth, search);
  };

  const handleClearSearch = () => {
    setSearch('');
    updateUrl(month, '');
  };

  const chartData = dailyTotals.map((dt) => {
    const day = dt.date.split('-')[2];
    const monthIndex = parseInt(dt.date.split('-')[1], 10) - 1;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const label = `${day} ${months[monthIndex]}`;
    return {
      name: label,
      amount: dt.total
    };
  });

  const formatCurrency = (amt: number) => {
    return amt.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  };

  const getMonthName = () => {
    if (!month) return '';
    const [year, mon] = month.split('-');
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return `${months[parseInt(mon, 10) - 1]} ${year}`;
  };

  return (
    <PageWrapper>
      <ExpenseTopTabs />
      <div className="max-w-7xl mx-auto p-4 space-y-5">
        <div className="space-y-1">
          <h2 className="text-2xl font-black text-foreground">Analysis & Summary</h2>
          <p className="text-xs text-muted-foreground font-medium">Evaluate spending metrics and trends in this space.</p>
        </div>

        {/* Month Selector Carousel Row */}
        <div className="bg-card border border-border rounded-3xl p-4 flex items-center justify-between shadow-sm">
          <Button
            type="button"
            variant="ghost"
            onClick={handlePrevMonth}
            className="w-10 h-10 rounded-xl p-0 hover:bg-muted text-muted-foreground cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>

          <div className="flex flex-col items-center select-none">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Active Period</span>
            <span className="text-sm font-black text-foreground mt-0.5">{getMonthName()}</span>
          </div>

          <Button
            type="button"
            variant="ghost"
            onClick={handleNextMonth}
            className="w-10 h-10 rounded-xl p-0 hover:bg-muted text-muted-foreground cursor-pointer"
          >
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Totals Cards Matrix */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="bg-card border border-border rounded-3xl p-5 flex flex-col gap-1 shadow-sm">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Today's Total</span>
            <span className="text-lg font-black text-foreground">₹{formatCurrency(todayTotal)}</span>
            <span className="text-[9px] text-muted-foreground mt-1 truncate">
              {formatDisplayDate(new Date().toISOString().split('T')[0])}
            </span>
          </div>

          <div className="bg-primary/5 dark:bg-primary/10 border border-primary/20 rounded-3xl p-5 flex flex-col gap-1 relative overflow-hidden">
            <div className="absolute right-0 bottom-0 translate-x-1 translate-y-1 opacity-5 text-primary">
              <TrendingDown className="w-20 h-20" />
            </div>
            <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Month Expense</span>
            <span className="text-lg font-black text-primary font-sans">₹{formatCurrency(monthlyTotal)}</span>
            <span className="text-[9px] text-primary/80 mt-1 truncate">
              Full period aggregates
            </span>
          </div>

          <div className="bg-green-500/5 dark:bg-green-500/10 border border-green-500/20 rounded-3xl p-5 flex flex-col gap-1 relative overflow-hidden">
            <span className="text-[10px] font-bold text-green-600 dark:text-green-400 uppercase tracking-wider">Month Income</span>
            <span className="text-lg font-black text-green-600 dark:text-green-400 font-sans">₹{formatCurrency(monthlyIncome)}</span>
            <span className="text-[9px] text-green-600/80 mt-1 truncate">
              Full period aggregates
            </span>
          </div>

          <div className="bg-card border border-border rounded-3xl p-5 flex flex-col gap-1 shadow-sm">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Net Savings</span>
            <span className={`text-lg font-black font-sans ${monthlyIncome - monthlyTotal >= 0 ? 'text-emerald-600' : 'text-destructive'}`}>
              ₹{formatCurrency(monthlyIncome - monthlyTotal)}
            </span>
            <span className="text-[9px] text-muted-foreground mt-1 truncate">
              Income - Expense
            </span>
          </div>
        </div>

        {/* Collaborator Balances */}
        {memberBalances.length > 0 && (
          <div className="bg-card border border-border rounded-3xl p-5 space-y-4 shadow-sm">
            <div className="flex items-center gap-2 text-primary">
              <Users className="w-4 h-4" />
              <h3 className="text-xs font-bold text-card-foreground uppercase tracking-wider">Collaborator Balances</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {memberBalances.map((mb) => (
                <div key={mb.user_id} className="bg-muted/30 border border-border rounded-2xl p-4 flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <div className="bg-primary/10 p-1.5 rounded-full text-primary">
                      <User className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-sm text-foreground truncate">{mb.name}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs mt-1">
                    <span className="text-muted-foreground font-medium">Income:</span>
                    <span className="font-bold text-green-600 dark:text-green-400">₹{formatCurrency(mb.income)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground font-medium">Expense:</span>
                    <span className="font-bold text-destructive">₹{formatCurrency(mb.expense)}</span>
                  </div>
                  <div className="pt-2 mt-1 border-t border-border flex justify-between items-center">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Net Balance</span>
                    <span className={`font-black text-sm ${mb.balance >= 0 ? 'text-emerald-600' : 'text-destructive'}`}>
                      ₹{formatCurrency(mb.balance)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search / Filter inside summary */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/80" />
            <Input
              type="text"
              placeholder="Filter summary by item/note..."
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

          {search.trim() && (
            <div className="bg-accent/50 border border-accent/80 rounded-3xl p-4 flex justify-between items-center text-xs">
              <span className="text-muted-foreground font-medium">Filtered Summary Total:</span>
              <span className="font-black text-foreground text-base">
                ₹{formatCurrency(filteredTotal)}
              </span>
            </div>
          )}
        </div>

        {/* Analytics Charts Suite */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Left Chart: Daily Outflow Area Chart */}
          <div className="bg-card border border-border rounded-3xl p-5 space-y-4 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-primary">
                <CalendarDays className="w-4 h-4" />
                <h3 className="text-xs font-bold text-card-foreground uppercase tracking-wider">Outflow Graph (Daily)</h3>
              </div>
              <span className="text-[10px] font-bold bg-primary/10 text-primary px-2.5 py-1 rounded-full">Trend</span>
            </div>

            {!isMountedState || isPending ? (
              <div className="h-[200px] flex items-center justify-center text-primary">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
              </div>
            ) : chartData.length === 0 ? (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground text-xs font-medium italic">
                No transactions recorded in this period.
              </div>
            ) : (
              <div className="h-[200px] w-full pr-2">
                <SummaryChart data={chartData} />
              </div>
            )}
          </div>

          {/* Right Chart: Category Breakdown Donut Chart */}
          <div className="bg-card border border-border rounded-3xl p-5 space-y-4 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-primary">
                <PieIcon className="w-4 h-4" />
                <h3 className="text-xs font-bold text-card-foreground uppercase tracking-wider">Category Distribution</h3>
              </div>
              <span className="text-[10px] font-bold bg-primary/10 text-primary px-2.5 py-1 rounded-full">
                {categoryBreakdown.length} Categories
              </span>
            </div>

            {!isMountedState || isPending ? (
              <div className="h-[200px] flex items-center justify-center text-primary">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
              </div>
            ) : categoryBreakdown.length === 0 ? (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground text-xs font-medium italic">
                No expense category data recorded.
              </div>
            ) : (
              <div className="h-[200px] w-full">
                <CategoryBreakdownChart data={categoryBreakdown} />
              </div>
            )}
          </div>
        </div>

        {/* Category Breakdown Matrix */}
        {categoryBreakdown.length > 0 && (
          <div className="bg-card border border-border rounded-3xl p-5 space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-primary">
                <Tag className="w-4 h-4" />
                <h3 className="text-xs font-bold text-card-foreground uppercase tracking-wider">Category Breakdown</h3>
              </div>
              <p className="text-[11px] text-muted-foreground">Click any category card to filter summary analytics</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {categoryBreakdown.map((cat) => {
                const isSelected = search.toLowerCase() === cat.category.toLowerCase();
                const catColor = getCategoryColor(cat.category);
                return (
                  <div
                    key={cat.category}
                    onClick={() => {
                      if (isSelected) {
                        handleClearSearch();
                      } else {
                        handleSearchChange(cat.category);
                      }
                    }}
                    className={`border rounded-2xl p-4 flex flex-col justify-between gap-3 cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 select-none ${
                      isSelected
                        ? 'bg-primary/10 border-primary ring-2 ring-primary/20'
                        : 'bg-muted/20 border-border hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-3 h-3 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: catColor }} />
                        <span className="font-bold text-sm text-foreground truncate">{cat.category}</span>
                      </div>
                      <span className="text-[10px] font-black shrink-0 px-2 py-0.5 rounded-full bg-background border border-border text-foreground">
                        {cat.percentage}%
                      </span>
                    </div>

                    <div className="flex items-baseline justify-between mt-1">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-muted-foreground font-medium">Spent</span>
                        <span className="font-black text-base text-foreground">₹{formatCurrency(cat.total)}</span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] text-muted-foreground font-medium">Transactions</span>
                        <span className="text-xs font-bold text-muted-foreground">{cat.count} items</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-muted/60 rounded-full h-1.5 overflow-hidden mt-1">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, Math.max(2, cat.percentage))}%`, backgroundColor: catColor }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Highest Spends This Month */}
        {topExpenses.length > 0 && (
          <div className="bg-card border border-border rounded-3xl p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-rose-500">
                <Flame className="w-4 h-4" />
                <h3 className="text-xs font-bold text-card-foreground uppercase tracking-wider">Highest Spends This Month</h3>
              </div>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Top {topExpenses.length} Transactions</span>
            </div>

            <div className="divide-y divide-border border border-border rounded-2xl overflow-hidden">
              {topExpenses.map((exp) => {
                const catColor = getCategoryColor(exp.category);
                return (
                  <div key={exp._id} className="p-3.5 bg-background/50 hover:bg-muted/30 transition-colors flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm text-white text-xs font-bold"
                        style={{ backgroundColor: catColor }}
                      >
                        {exp.category.substring(0, 1).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-foreground truncate">{exp.itemName}</span>
                          <span
                            onClick={() => handleSearchChange(exp.category)}
                            className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary cursor-pointer shrink-0 transition-colors"
                          >
                            {exp.category}
                          </span>
                        </div>
                        {exp.note ? (
                          <span className="text-xs text-muted-foreground truncate">{exp.note}</span>
                        ) : (
                          <span className="text-[11px] text-muted-foreground/60 italic">No note</span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end shrink-0">
                      <span className="font-black text-sm text-foreground">₹{formatCurrency(exp.amount)}</span>
                      <span className="text-[10px] text-muted-foreground">{formatDisplayDate(exp.date)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
