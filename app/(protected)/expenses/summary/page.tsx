'use client';

import React, { useState, useEffect } from 'react';
import PageWrapper from '@/components/PageWrapper';
import ExpenseTopTabs from '@/components/expense/ExpenseTopTabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { CalendarDays, TrendingDown, Search, ArrowRight, ArrowLeft, X } from 'lucide-react';
import { formatDisplayDate } from '@/lib/date-utils';

interface DailyTotal {
  date: string;
  total: number;
}

export default function SummaryPage() {
  const [month, setMonth] = useState<string>('');
  const [monthlyTotal, setMonthlyTotal] = useState<number>(0);
  const [filteredTotal, setFilteredTotal] = useState<number>(0);
  const [dailyTotals, setDailyTotals] = useState<DailyTotal[]>([]);
  const [todayTotal, setTodayTotal] = useState<number>(0);
  
  const [search, setSearch] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    setMonth(`${yyyy}-${mm}`);
  }, []);

  const fetchSummary = async () => {
    if (!month) return;
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('month', month);
      if (search.trim()) params.append('search', search.trim());

      const res = await fetch(`/api/summary/monthly?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setMonthlyTotal(data.monthlyTotal);
        setFilteredTotal(data.filteredTotal);
        setDailyTotals(data.dailyTotals);
      } else {
        toast.error('Failed to retrieve summary data');
      }

      const today = new Date().toISOString().split('T')[0];
      const todayRes = await fetch(`/api/expenses?date=${today}`);
      if (todayRes.ok) {
        const todayData = await todayRes.json();
        const sum = todayData.expenses.reduce((s: number, e: any) => s + e.amount, 0);
        setTodayTotal(sum);
      }
    } catch (err) {
      console.error(err);
      toast.error('Error connecting to server');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSummary();
    }, 200);

    return () => clearTimeout(timer);
  }, [month, search]);

  const handlePrevMonth = () => {
    const [year, mon] = month.split('-').map(Number);
    let prevYear = year;
    let prevMon = mon - 1;
    if (prevMon === 0) {
      prevMon = 12;
      prevYear = year - 1;
    }
    setMonth(`${prevYear}-${String(prevMon).padStart(2, '0')}`);
  };

  const handleNextMonth = () => {
    const [year, mon] = month.split('-').map(Number);
    let nextYear = year;
    let nextMon = mon + 1;
    if (nextMon === 13) {
      nextMon = 1;
      nextYear = year + 1;
    }
    setMonth(`${nextYear}-${String(nextMon).padStart(2, '0')}`);
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
      <div className="max-w-md mx-auto p-4 space-y-5 pb-32">
        <div className="space-y-1">
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">Analysis & Summary</h2>
          <p className="text-xs text-slate-500 font-medium">Evaluate spending metrics and trends in this space.</p>
        </div>

        {/* Month Selector Carousel Row */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-4 flex items-center justify-between shadow-sm">
          <Button
            type="button"
            variant="ghost"
            onClick={handlePrevMonth}
            className="w-10 h-10 rounded-xl p-0 hover:bg-slate-100 dark:hover:bg-slate-950 text-slate-500 dark:text-slate-400 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>

          <div className="flex flex-col items-center select-none">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Period</span>
            <span className="text-sm font-black text-slate-800 dark:text-white mt-0.5">{getMonthName()}</span>
          </div>

          <Button
            type="button"
            variant="ghost"
            onClick={handleNextMonth}
            className="w-10 h-10 rounded-xl p-0 hover:bg-slate-100 dark:hover:bg-slate-950 text-slate-500 dark:text-slate-400 cursor-pointer"
          >
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Totals Cards Matrix */}
        <div className="grid grid-cols-2 gap-3.5">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-4.5 flex flex-col gap-1 shadow-sm">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Today's Total</span>
            <span className="text-lg font-black text-slate-800 dark:text-white">₹{formatCurrency(todayTotal)}</span>
            <span className="text-[9px] text-slate-400 mt-1 truncate">
              {formatDisplayDate(new Date().toISOString().split('T')[0])}
            </span>
          </div>

          <div className="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100/40 dark:border-indigo-900/30 rounded-3xl p-4.5 flex flex-col gap-1 relative overflow-hidden">
            <div className="absolute right-0 bottom-0 translate-x-1 translate-y-1 opacity-5 text-indigo-400">
              <TrendingDown className="w-20 h-20" />
            </div>
            <span className="text-[10px] font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-wider">Month Total</span>
            <span className="text-lg font-black text-indigo-600 dark:text-indigo-300 font-sans">₹{formatCurrency(monthlyTotal)}</span>
            <span className="text-[9px] text-indigo-400/80 mt-1 truncate">
              Full period aggregates
            </span>
          </div>
        </div>

        {/* Search / Filter inside summary */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Filter summary by item/note..."
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

          {search.trim() && (
            <div className="bg-purple-50/50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/30 rounded-3xl p-4 flex justify-between items-center text-xs">
              <span className="text-slate-600 dark:text-slate-300 font-medium">Filtered Summary Total:</span>
              <span className="font-black text-purple-600 dark:text-purple-400 text-base">
                ₹{formatCurrency(filteredTotal)}
              </span>
            </div>
          )}
        </div>

        {/* Analytics Chart Container */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 space-y-4 shadow-sm">
          <div className="flex items-center gap-2 text-indigo-500 dark:text-indigo-400">
            <CalendarDays className="w-4 h-4" />
            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Outflow Graph (Daily)</h3>
          </div>

          {isLoading ? (
            <div className="h-[180px] flex items-center justify-center text-indigo-500">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500" />
            </div>
          ) : chartData.length === 0 ? (
            <div className="h-[180px] flex items-center justify-center text-slate-400 text-xs font-medium italic">
              No transactions recorded in this period.
            </div>
          ) : (
            <div className="h-[180px] w-full pr-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                  <defs>
                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    stroke="#94A3B8" 
                    fontSize={9}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    stroke="#94A3B8" 
                    fontSize={9}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#FFFFFF', 
                      borderColor: '#E2E8F0',
                      borderRadius: '12px',
                      fontSize: '11px',
                      color: '#1E293B'
                    }}
                    itemStyle={{ color: '#4F46E5' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="amount" 
                    stroke="#4F46E5" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorAmount)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

      </div>
    </PageWrapper>
  );
}
