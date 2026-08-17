'use client';

import React, { useState, useEffect, useRef, useTransition } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import AppShell from '@/components/AppShell';
import StatCard from '@/components/StatCard';
import PageHeader from '@/components/PageHeader';
import SectionTitle from '@/components/SectionTitle';
import EmptyState from '@/components/EmptyState';
import QuickAddBar from '@/components/QuickAddBar';
import dynamic from 'next/dynamic';

const SummaryChart = dynamic(() => import('@/components/expense/SummaryChart'), {
  ssr: false,
  loading: () => (
    <div className="h-[200px] w-full flex items-center justify-center animate-pulse rounded-2xl" style={{ background: 'var(--surface-muted)' }}>
      <div className="flex flex-col items-center gap-2">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2" style={{ borderColor: 'var(--primary)' }} />
        <span className="text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>Loading Outflow Graph...</span>
      </div>
    </div>
  ),
});

const CategoryBreakdownChart = dynamic(() => import('@/components/expense/CategoryBreakdownChart'), {
  ssr: false,
  loading: () => (
    <div className="h-[200px] w-full flex items-center justify-center animate-pulse rounded-2xl" style={{ background: 'var(--surface-muted)' }}>
      <div className="flex flex-col items-center gap-2">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2" style={{ borderColor: 'var(--primary)' }} />
        <span className="text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>Loading Donut Chart...</span>
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
  transfer_in: number;
  transfer_out: number;
  month_balance: number;
  previous_balance: number;
  total_balance: number;
}

interface InvestmentsSummary {
  monthlyInvested: number;
  pureExpenses: number;
  lifetimeInvested: number;
  initialBase: number;
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
  initialCategoryTransactions?: { _id: string; itemName: string; amount: number; date: string; category: string; note: string }[];
  initialTopExpenses?: { _id: string; itemName: string; amount: number; date: string; category: string; note: string }[];
  initialInvestmentsSummary?: InvestmentsSummary;
  searchParams: {
    month?: string;
    search?: string;
    category?: string;
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
  initialCategoryTransactions,
  initialTopExpenses,
  initialInvestmentsSummary,
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
  const [categoryTransactions, setCategoryTransactions] = useState<{ _id: string; itemName: string; amount: number; date: string; category: string; note: string }[]>(initialCategoryTransactions || []);
  const [topExpenses, setTopExpenses] = useState<{ _id: string; itemName: string; amount: number; date: string; category: string; note: string }[]>(initialTopExpenses || []);
  const [investmentsSummary, setInvestmentsSummary] = useState<InvestmentsSummary>(initialInvestmentsSummary || {
    monthlyInvested: 0,
    pureExpenses: initialMonthlyTotal,
    lifetimeInvested: 0,
    initialBase: 0,
  });

  const [search, setSearch] = useState<string>(searchParams.search || '');
  const [category, setCategory] = useState<string>(searchParams.category || '');
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
    if (initialCategoryTransactions) setCategoryTransactions(initialCategoryTransactions);
    if (initialTopExpenses) setTopExpenses(initialTopExpenses);
    if (initialInvestmentsSummary) setInvestmentsSummary(initialInvestmentsSummary);
  }, [
    initialMonth,
    initialMonthlyTotal,
    initialMonthlyIncome,
    initialFilteredTotal,
    initialDailyTotals,
    initialTodayTotal,
    initialMemberBalances,
    initialCategoryBreakdown,
    initialCategoryTransactions,
    initialTopExpenses,
    initialInvestmentsSummary,
  ]);

  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  const updateUrl = (monthVal: string, searchVal: string, categoryVal: string = category) => {
    const params = new URLSearchParams();
    if (monthVal) params.set('month', monthVal);
    if (searchVal.trim()) params.set('search', searchVal.trim());
    if (categoryVal.trim()) params.set('category', categoryVal.trim());

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  const handleCategoryClick = (catName: string) => {
    const newCategory = category === catName ? '' : catName;
    setCategory(newCategory);
    updateUrl(month, search, newCategory);
  };

  const handleSearchChange = (val: string) => {
    setSearch(val);
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    debounceTimeoutRef.current = setTimeout(() => {
      updateUrl(month, val, category);
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
    updateUrl(newMonth, search, category);
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
    updateUrl(newMonth, search, category);
  };

  const handleClearSearch = () => {
    setSearch('');
    updateUrl(month, '', category);
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
    const safeAmt = Number(amt) || 0;
    return safeAmt.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  };

  const getMonthName = () => {
    if (!month) return '';
    const [year, mon] = month.split('-');
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return `${months[parseInt(mon, 10) - 1]} ${year}`;
  };

  const overallTotalBalance = memberBalances.reduce((sum, mb) => sum + mb.total_balance, 0);

  return (
    <AppShell>
      <PageHeader title="Report" subtitle="Monthly breakdown" />
      <div className="max-w-xl mx-auto pb-24 space-y-6">
        {/* Month Selector Carousel Row */}
        <div className="card-surface p-2 flex items-center justify-between">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="w-12 h-12 flex items-center justify-center rounded-xl active:scale-95 transition-all"
            style={{ background: 'var(--surface-muted)', color: 'var(--foreground)' }}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex flex-col items-center select-none">
            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--muted-foreground)' }}>Active Period</span>
            <span className="text-sm font-black mt-0.5" style={{ color: 'var(--foreground)' }}>{getMonthName()}</span>
          </div>

          <button
            type="button"
            onClick={handleNextMonth}
            className="w-12 h-12 flex items-center justify-center rounded-xl active:scale-95 transition-all"
            style={{ background: 'var(--surface-muted)', color: 'var(--foreground)' }}
          >
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        {/* Totals Cards Matrix */}
        <div className="grid grid-cols-2 gap-3.5">
          <StatCard
            label="Total Balance"
            amount={overallTotalBalance}
            caption="Across all collaborators"
            variant="surface"
            className="col-span-2"
          />
          <StatCard
            label="Month Expense"
            amount={monthlyTotal}
            caption="Full period aggregates"
            variant="hero"
          />
          <StatCard
            label="Today's Total"
            amount={todayTotal}
            caption={formatDisplayDate(new Date().toISOString().split('T')[0])}
            variant="surface"
          />
          <StatCard
            label="Month Income"
            amount={monthlyIncome}
            caption="Full period aggregates"
            variant="in"
          />
          <StatCard
            label="Net Savings"
            amount={monthlyIncome - monthlyTotal}
            caption="Income - Expense"
            variant={monthlyIncome - monthlyTotal >= 0 ? 'in' : 'out'}
          />
        </div>

        {/* Investment & Wealth Breakdown (Pure Expenses vs Future Wealth) */}
        {(investmentsSummary.monthlyInvested > 0 || investmentsSummary.lifetimeInvested > 0) && (
          <div className="card-surface p-4 rounded-2xl border border-border space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-base">💎</span>
                <span className="text-xs font-bold text-foreground">
                  Wealth & Investments (રોકાણ)
                </span>
              </div>
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: 'var(--success-soft)', color: 'var(--success)' }}
              >
                Future Wealth
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border">
              <div>
                <p className="text-[10px] text-muted-foreground font-medium">Pure Living Spend</p>
                <p className="text-sm font-bold text-foreground">
                  ₹{formatCurrency(investmentsSummary.pureExpenses)}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground font-medium">Invested This Month</p>
                <p className="text-sm font-bold" style={{ color: 'var(--primary)' }}>
                  ₹{formatCurrency(investmentsSummary.monthlyInvested)}
                </p>
              </div>
            </div>

            {investmentsSummary.lifetimeInvested > 0 && (
              <div className="flex items-center justify-between text-xs pt-2 border-t border-border">
                <span className="text-[11px] text-muted-foreground">
                  Total Accumulated Wealth
                </span>
                <span className="font-bold text-xs" style={{ color: 'var(--success)' }}>
                  ₹{formatCurrency(investmentsSummary.lifetimeInvested)}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Collaborator Balances */}
        {memberBalances.length > 0 && (
          <div className="card-surface p-4 space-y-4">
            <SectionTitle>Collaborator Balances</SectionTitle>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {memberBalances.map((mb) => (
                <div key={mb.user_id} className="rounded-2xl p-4 flex flex-col gap-2" style={{ background: 'var(--surface-muted)' }}>
                  <div className="flex items-center gap-3">
                    <div className="tile w-10 h-10" style={{ background: 'var(--violet-soft)', color: 'var(--violet)' }}>
                      <User className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-sm truncate" style={{ color: 'var(--foreground)' }}>{mb.name}</span>
                  </div>
                  {mb.previous_balance !== 0 && (
                    <div className="flex justify-between items-center text-xs pb-1 mb-1" style={{ borderBottom: '1px solid var(--border)' }}>
                      <span className="font-medium" style={{ color: 'var(--muted-foreground)' }}>Brought Forward:</span>
                      <span className="font-bold" style={{ color: mb.previous_balance >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                        ₹{formatCurrency(mb.previous_balance)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-xs mt-1">
                    <span className="font-medium" style={{ color: 'var(--muted-foreground)' }}>Income:</span>
                    <span className="font-bold" style={{ color: 'var(--success)' }}>₹{formatCurrency(mb.income)}</span>
                  </div>
                  {mb.transfer_in > 0 && (
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-medium" style={{ color: 'var(--muted-foreground)' }}>Transfer In:</span>
                      <span className="font-bold" style={{ color: 'var(--success)' }}>+₹{formatCurrency(mb.transfer_in)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-medium" style={{ color: 'var(--muted-foreground)' }}>Expense:</span>
                    <span className="font-bold" style={{ color: 'var(--danger)' }}>₹{formatCurrency(mb.expense)}</span>
                  </div>
                  {mb.transfer_out > 0 && (
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-medium" style={{ color: 'var(--muted-foreground)' }}>Transfer Out:</span>
                      <span className="font-bold" style={{ color: 'var(--danger)' }}>-₹{formatCurrency(mb.transfer_out)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-xs mt-1">
                    <span className="font-medium" style={{ color: 'var(--muted-foreground)' }}>Month Net:</span>
                    <span className="font-bold" style={{ color: mb.month_balance >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                      ₹{formatCurrency(mb.month_balance)}
                    </span>
                  </div>
                  <div className="pt-2 mt-1 flex justify-between items-center p-2 rounded-lg" style={{ background: 'var(--background)' }}>
                    <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>Total Balance</span>
                    <span className="font-black text-sm" style={{ color: mb.total_balance >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                      ₹{formatCurrency(mb.total_balance)}
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
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--muted-foreground)' }} />
            <input
              type="text"
              placeholder="Filter summary by item/note..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-11 pr-10 card-surface h-12 text-sm focus:outline-none"
              style={{ color: 'var(--foreground)' }}
            />
            {search && (
              <button
                onClick={handleClearSearch}
                className="absolute right-4 top-1/2 -translate-y-1/2 active:scale-95 transition-all"
                style={{ color: 'var(--muted-foreground)' }}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {search.trim() && (
            <div className="rounded-3xl p-4 flex justify-between items-center text-sm" style={{ background: 'var(--amber-soft)', color: 'var(--amber)' }}>
              <span className="font-medium">Filtered Summary Total:</span>
              <span className="font-black text-lg">
                ₹{formatCurrency(filteredTotal)}
              </span>
            </div>
          )}
        </div>

        {/* Analytics Charts Suite */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Left Chart: Daily Outflow Area Chart */}
          <div className="card-surface p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <SectionTitle>Outflow Graph (Daily)</SectionTitle>
            </div>

            {!isMountedState || isPending ? (
              <div className="h-[200px] flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2" style={{ borderColor: 'var(--primary)' }} />
              </div>
            ) : chartData.length === 0 ? (
              <div className="h-[200px] flex items-center justify-center">
                <EmptyState icon={CalendarDays} title="No Data" hint="No transactions recorded." />
              </div>
            ) : (
              <div className="h-[200px] w-full">
                <SummaryChart data={chartData} />
              </div>
            )}
          </div>

          {/* Right Chart: Category Breakdown Donut Chart */}
          <div className="card-surface p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <SectionTitle>Category Distribution</SectionTitle>
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}>
                {categoryBreakdown.length} Categories
              </span>
            </div>

            {!isMountedState || isPending ? (
              <div className="h-[200px] flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2" style={{ borderColor: 'var(--primary)' }} />
              </div>
            ) : categoryBreakdown.length === 0 ? (
              <div className="h-[200px] flex items-center justify-center">
                <EmptyState icon={PieIcon} title="No Data" hint="No expense category data." />
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
          <div className="card-surface p-4 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <SectionTitle>Category Breakdown</SectionTitle>
              <p className="text-[11px]" style={{ color: 'var(--muted-foreground)' }}>Click any category card to filter summary analytics</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {categoryBreakdown.map((cat) => {
                const isSelected = category.toLowerCase() === cat.category.toLowerCase();
                const catColor = getCategoryColor(cat.category);
                return (
                  <div
                    key={cat.category}
                    onClick={() => handleCategoryClick(cat.category)}
                    className="rounded-2xl p-4 flex flex-col justify-between gap-3 cursor-pointer active:scale-95 transition-all select-none border"
                    style={{
                      background: isSelected ? 'color-mix(in srgb, var(--primary) 10%, transparent)' : 'var(--surface-muted)',
                      borderColor: isSelected ? 'var(--primary)' : 'transparent',
                    }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-3 h-3 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: catColor }} />
                        <span className="font-bold text-sm truncate" style={{ color: 'var(--foreground)' }}>{cat.category}</span>
                      </div>
                      <span className="text-[10px] font-black shrink-0 px-2 py-0.5 rounded-full" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>
                        {cat.percentage}%
                      </span>
                    </div>

                    <div className="flex items-baseline justify-between mt-1">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-medium" style={{ color: 'var(--muted-foreground)' }}>Spent</span>
                        <span className="font-black text-base" style={{ color: 'var(--foreground)' }}>₹{formatCurrency(cat.total)}</span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] font-medium" style={{ color: 'var(--muted-foreground)' }}>Transactions</span>
                        <span className="text-xs font-bold" style={{ color: 'var(--muted-foreground)' }}>{cat.count} items</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full rounded-full h-1.5 overflow-hidden mt-1" style={{ background: 'color-mix(in srgb, var(--foreground) 10%, transparent)' }}>
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

        {/* Category Transactions Details */}
        {categoryTransactions.length > 0 && (
          <div className="card-surface p-4 space-y-4">
            <div className="flex items-center justify-between">
              <SectionTitle>${category} Transactions</SectionTitle>
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>{categoryTransactions.length} Items</span>
            </div>

            <div className="flex flex-col gap-2">
              {categoryTransactions.map((exp) => {
                const catColor = getCategoryColor(exp.category);
                return (
                  <div key={exp._id} className="p-3 rounded-2xl flex items-center justify-between gap-3" style={{ background: 'var(--surface-muted)' }}>
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="tile w-10 h-10 shrink-0 shadow-sm text-white text-xs font-bold"
                        style={{ backgroundColor: catColor }}
                      >
                        {exp.category.substring(0, 1).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm truncate" style={{ color: 'var(--foreground)' }}>{exp.itemName}</span>
                        </div>
                        {exp.note ? (
                          <span className="text-xs truncate" style={{ color: 'var(--muted-foreground)' }}>{exp.note}</span>
                        ) : (
                          <span className="text-[11px] italic" style={{ color: 'var(--muted-foreground)', opacity: 0.6 }}>No note</span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end shrink-0">
                      <span className="font-black text-sm" style={{ color: 'var(--foreground)' }}>₹{formatCurrency(exp.amount)}</span>
                      <span className="text-[10px]" style={{ color: 'var(--muted-foreground)' }}>{formatDisplayDate(exp.date)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Highest Spends This Month */}
        {topExpenses.length > 0 && (
          <div className="card-surface p-4 space-y-4">
            <div className="flex items-center justify-between">
              <SectionTitle>Highest Spends This Month</SectionTitle>
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>Top {topExpenses.length}</span>
            </div>

            <div className="flex flex-col gap-2">
              {topExpenses.map((exp) => {
                const catColor = getCategoryColor(exp.category);
                return (
                  <div key={exp._id} className="p-3 rounded-2xl flex items-center justify-between gap-3" style={{ background: 'var(--surface-muted)' }}>
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="tile w-10 h-10 shrink-0 shadow-sm text-white text-xs font-bold"
                        style={{ backgroundColor: catColor }}
                      >
                        {exp.category.substring(0, 1).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm truncate" style={{ color: 'var(--foreground)' }}>{exp.itemName}</span>
                          <span
                            onClick={() => handleSearchChange(exp.category)}
                            className="text-[10px] font-medium px-2 py-0.5 rounded-md cursor-pointer shrink-0 active:scale-95 transition-all"
                            style={{ background: 'color-mix(in srgb, var(--foreground) 10%, transparent)', color: 'var(--foreground)' }}
                          >
                            {exp.category}
                          </span>
                        </div>
                        {exp.note ? (
                          <span className="text-xs truncate" style={{ color: 'var(--muted-foreground)' }}>{exp.note}</span>
                        ) : (
                          <span className="text-[11px] italic" style={{ color: 'var(--muted-foreground)', opacity: 0.6 }}>No note</span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end shrink-0">
                      <span className="font-black text-sm" style={{ color: 'var(--foreground)' }}>₹{formatCurrency(exp.amount)}</span>
                      <span className="text-[10px]" style={{ color: 'var(--muted-foreground)' }}>{formatDisplayDate(exp.date)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <QuickAddBar mode="expense" />
    </AppShell>
  );
}
