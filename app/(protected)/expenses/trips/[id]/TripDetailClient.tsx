'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  Zap,
  Plus,
  Share2,
  Copy,
  Printer,
  Trash2,
  Edit2,
  X,
  Tag,
  Car,
  Utensils,
  Hotel,
  Fuel,
  Coins,
  ShoppingBag,
  Receipt,
} from 'lucide-react';
import { toast } from 'sonner';
import { TripDetailData, TripCategory } from '@/types/trip';
import { cn } from '@/lib/utils';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import StatCard from '@/components/StatCard';
import EmptyState from '@/components/EmptyState';
import TripQuickAddBar from '@/components/TripQuickAddBar';

interface TripDetailClientProps {
  initialData: TripDetailData;
  collaborators: { user_id: string; name: string }[];
  currentUserId: string;
}

const TRIP_EXPENSE_CATEGORIES = [
  { label: 'Fuel, Vehicle & Travel', emoji: '⛽', icon: Fuel },
  { label: 'Snacks, Food & Dining', emoji: '🍽️', icon: Utensils },
  { label: 'Hotel, Stay & Room', emoji: '🏨', icon: Hotel },
  { label: 'Tolls & Parking', emoji: '🛣️', icon: Car },
  { label: 'Village Contribution & Daan', emoji: '🛕', icon: Coins },
  { label: 'Shopping & Local Items', emoji: '🛍️', icon: ShoppingBag },
  { label: 'General & Other', emoji: '📦', icon: Tag },
];

function fmtMoney(n: number) {
  return `₹${Math.round(n).toLocaleString('en-IN')}`;
}

export default function TripDetailClient({
  initialData,
  collaborators,
  currentUserId,
}: TripDetailClientProps) {
  const router = useRouter();
  const [data, setData] = useState<TripDetailData>(initialData);
  const { trip } = data;

  const [activeTab, setActiveTab] = useState<'timeline' | 'share'>('timeline');
  const [selectedDay, setSelectedDay] = useState<string>('all');
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isEditTripOpen, setIsEditTripOpen] = useState(false);
  const [deleteExpenseId, setDeleteExpenseId] = useState<string | null>(null);
  const [isSubmittingExpense, setIsSubmittingExpense] = useState(false);

  // Add Expense Form State
  const [itemName, setItemName] = useState('');
  const [amount, setAmount] = useState('');
  const [expenseDate, setExpenseDate] = useState(
    trip.startDate || new Date().toISOString().split('T')[0]
  );
  const [tripCategory, setTripCategory] = useState('Fuel, Vehicle & Travel');
  const [paidByMemberId, setPaidByMemberId] = useState(trip.members?.[0]?.id || '');
  const [expenseNote, setExpenseNote] = useState('');

  // Edit Trip Form State
  const [editTitle, setEditTitle] = useState(trip.title);
  const [editDestination, setEditDestination] = useState(trip.destination);
  const [editCategory, setEditCategory] = useState<TripCategory>(trip.category);
  const [editStartDate, setEditStartDate] = useState(trip.startDate);
  const [editEndDate, setEditEndDate] = useState(trip.endDate);
  const [editBudget, setEditBudget] = useState(String(trip.budget || ''));
  const [editCoverEmoji, setEditCoverEmoji] = useState(trip.coverEmoji || '🌴');
  const [editStatus, setEditStatus] = useState(trip.status);
  const [editNotes, setEditNotes] = useState(trip.notes || '');

  // Filtered Expenses by Day
  const filteredExpenses = useMemo(() => {
    if (selectedDay === 'all') return data.expenses;
    return data.expenses.filter((e) => e.date === selectedDay);
  }, [data.expenses, selectedDay]);

  // Reload trip detail after a change
  const refreshTripData = async () => {
    try {
      const detailRes = await fetch(`/api/trips/${trip.trip_id}`);
      const detailData = await detailRes.json();
      if (detailData.success) setData(detailData.data);
      router.refresh();
    } catch {
      /* ignore */
    }
  };

  // Toggle Active Trip
  const handleToggleActive = async () => {
    try {
      const res = await fetch(`/api/trips/${trip.trip_id}/activate`, {
        method: 'POST',
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.message || 'Failed to toggle active trip');

      toast.success(resData.message);
      setData((prev) => ({
        ...prev,
        trip: {
          ...prev.trip,
          isCurrentActive: resData.isCurrentActive,
        },
      }));

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('active_trip_changed'));
      }
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || 'Failed to toggle active trip');
    }
  };

  // Add Expense Submit
  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim() || !amount || parseFloat(amount) <= 0) {
      toast.error('Valid item name and amount are required');
      return;
    }

    setIsSubmittingExpense(true);
    try {
      const numAmount = parseFloat(amount);
      const members = trip.members || [];

      const res = await fetch(`/api/trips/${trip.trip_id}/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemName: itemName.trim(),
          amount: numAmount,
          date: expenseDate,
          tripCategory,
          paidByMemberId: paidByMemberId || members[0]?.id,
          splitType: 'personal',
          note: expenseNote.trim(),
        }),
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.message || 'Failed to add expense');

      toast.success('Expense added');
      setIsAddExpenseOpen(false);

      setItemName('');
      setAmount('');
      setExpenseNote('');

      const detailRes = await fetch(`/api/trips/${trip.trip_id}`);
      const detailData = await detailRes.json();
      if (detailData.success) {
        setData(detailData.data);
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('expense_added'));
      }
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || 'Failed to add expense');
    } finally {
      setIsSubmittingExpense(false);
    }
  };

  // Delete Expense
  const handleDeleteExpense = async () => {
    if (!deleteExpenseId) return;

    try {
      const res = await fetch(`/api/expenses/${deleteExpenseId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete expense');

      toast.success('Expense deleted');
      setDeleteExpenseId(null);

      const detailRes = await fetch(`/api/trips/${trip.trip_id}`);
      const detailData = await detailRes.json();
      if (detailData.success) {
        setData(detailData.data);
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('expense_added'));
      }
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete expense');
    }
  };

  // Update Trip
  const handleUpdateTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/trips/${trip.trip_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle.trim(),
          destination: editDestination.trim(),
          category: editCategory,
          startDate: editStartDate,
          endDate: editEndDate,
          budget: editBudget ? parseFloat(editBudget) : 0,
          coverEmoji: editCoverEmoji,
          status: editStatus,
          notes: editNotes.trim(),
        }),
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.message || 'Failed to update trip');

      toast.success('Trip updated');
      setIsEditTripOpen(false);

      const detailRes = await fetch(`/api/trips/${trip.trip_id}`);
      const detailData = await detailRes.json();
      if (detailData.success) {
        setData(detailData.data);
      }
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update trip');
    }
  };

  // Generate WhatsApp Message
  const whatsappSummaryText = useMemo(() => {
    const lines = [
      `${trip.coverEmoji || '🏖️'} *${trip.title} - Expense Summary*`,
      `📍 *Destination:* ${trip.destination}`,
      `🗓️ *Dates:* ${trip.startDate} to ${trip.endDate} (${data.daysCount} Days)`,
      `💰 *Total Spend:* ${fmtMoney(data.totalSpent)}${
        trip.budget > 0
          ? ` (Budget: ${fmtMoney(trip.budget)} · ${
              data.budgetRemaining > 0 ? `${fmtMoney(data.budgetRemaining)} Left` : 'Exceeded'
            })`
          : ''
      }`,
      `📈 *Daily Average:* ${fmtMoney(data.dailyAverage)} / day`,
      ``,
      `📊 *Category Breakdown:*`,
    ];

    data.categorySummaries.forEach((c) => {
      lines.push(`• ${c.category}: ${fmtMoney(c.total)} (${c.percentage}%)`);
    });

    lines.push(``);
    lines.push(`Generated via Hisab Tracker`);

    return lines.join('\n');
  }, [trip, data]);

  const handleCopyWhatsApp = () => {
    navigator.clipboard.writeText(whatsappSummaryText);
    toast.success('Summary copied to clipboard');
  };

  const handleOpenWhatsApp = () => {
    const encoded = encodeURIComponent(whatsappSummaryText);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  const hasBudget = trip.budget > 0;
  const budgetProgressColor =
    data.budgetUsedPercentage >= 95
      ? 'bg-rose-500'
      : data.budgetUsedPercentage >= 75
      ? 'bg-amber-500'
      : 'bg-emerald-500';

  return (
    <div className="space-y-4">
      {/* ── Top Bar ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-2 pt-1">
        <Link
          href="/expenses/trips"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>All Trips</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleActive}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 shadow-sm',
              trip.isCurrentActive
                ? 'bg-amber-500 text-white'
                : 'bg-secondary hover:bg-muted text-muted-foreground hover:text-foreground'
            )}
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>{trip.isCurrentActive ? 'Active' : 'Make Active'}</span>
          </button>

          <button
            onClick={() => setIsEditTripOpen(true)}
            className="p-2 rounded-xl bg-secondary hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="Edit Details"
          >
            <Edit2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Hero Card ───────────────────────────────────────────────────── */}
      <div className="card-surface p-4 rounded-3xl border border-border space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="tile w-12 h-12 rounded-2xl text-2xl shrink-0">
              {trip.coverEmoji || '🌴'}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg font-bold text-foreground tracking-tight">
                  {trip.title}
                </h1>
                {trip.isCurrentActive && (
                  <span
                    className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full"
                    style={{ background: 'var(--amber-soft)', color: 'var(--amber)' }}
                  >
                    Active
                  </span>
                )}
                <span
                  className={cn(
                    'text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full',
                    trip.status === 'completed'
                      ? 'bg-slate-500/15 text-slate-600 dark:text-slate-400'
                      : trip.status === 'active'
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                      : 'bg-sky-500/15 text-sky-600 dark:text-sky-400'
                  )}
                >
                  {trip.status}
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5 flex-wrap">
                <span className="flex items-center gap-1 font-medium">
                  <MapPin className="w-3.5 h-3.5" />
                  {trip.destination}
                </span>
                <span>·</span>
                <span>
                  {trip.startDate} to {trip.endDate} ({data.daysCount} days)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Budget Progress Bar */}
        <div className="pt-2 border-t border-border">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-muted-foreground">
              Spent: <strong className="text-foreground">{fmtMoney(data.totalSpent)}</strong>
              {hasBudget && <span> of {fmtMoney(trip.budget)}</span>}
            </span>
            {hasBudget && (
              <span className="text-xs font-semibold text-muted-foreground">
                {data.budgetRemaining > 0
                  ? `${fmtMoney(data.budgetRemaining)} left`
                  : `${fmtMoney(data.totalSpent - trip.budget)} over`}
              </span>
            )}
          </div>

          {hasBudget && (
            <div className="w-full h-2 rounded-full bg-secondary overflow-hidden">
              <div
                className={cn('h-full transition-all duration-300', budgetProgressColor)}
                style={{ width: `${Math.min(100, data.budgetUsedPercentage)}%` }}
              />
            </div>
          )}
        </div>
      </div>

      {/* ── Stat Cards ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          variant="hero"
          label="Total spent"
          amount={data.totalSpent}
          caption={`${data.expenses.length} expenses logged`}
        />
        <StatCard
          variant="surface"
          label="Daily average"
          amount={data.dailyAverage}
          caption={hasBudget ? `${fmtMoney(data.budgetRemaining)} remaining` : 'No budget set'}
        />
      </div>

      {/* ── Tabs ────────────────────────────────────────────────────────── */}
      <div className="flex gap-1.5 p-1 bg-secondary rounded-2xl">
        <button
          onClick={() => setActiveTab('timeline')}
          className={cn(
            'flex-1 py-2 text-xs font-bold rounded-xl transition-all',
            activeTab === 'timeline'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          Expenses ({data.expenses.length})
        </button>

        <button
          onClick={() => setActiveTab('share')}
          className={cn(
            'flex-1 py-2 text-xs font-bold rounded-xl transition-all',
            activeTab === 'share'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          Summary & Share
        </button>
      </div>

      {/* ── Tab 1: Expenses ─────────────────────────────────────────────── */}
      {activeTab === 'timeline' && (
        <div className="space-y-3.5">
          {/* Category Breakdown */}
          {data.categorySummaries.length > 0 && (
            <div className="card-surface p-4 rounded-2xl border border-border space-y-2">
              <div className="text-xs font-bold text-foreground">
                Category Breakdown
              </div>

              <div className="space-y-1.5">
                {data.categorySummaries.map((cat) => (
                  <div key={cat.category} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground font-medium truncate">
                        {cat.category}
                      </span>
                      <span className="font-bold text-foreground shrink-0">
                        {fmtMoney(cat.total)}{' '}
                        <span className="text-[10px] text-muted-foreground font-normal">
                          ({cat.percentage}%)
                        </span>
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-secondary overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${cat.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Smart Input */}
          <TripQuickAddBar
            tripId={trip.trip_id}
            members={trip.members || []}
            date={selectedDay !== 'all' ? selectedDay : expenseDate}
            paidByMemberId={paidByMemberId || trip.members?.[0]?.id || ''}
            onPaidByChange={setPaidByMemberId}
            onSaved={refreshTripData}
          />

          {/* Action Row */}
          <div className="flex items-center justify-between gap-2">
            <div className="overflow-x-auto no-scrollbar -mx-1 px-1 flex-1">
              <div className="flex gap-1.5 w-max">
                <button
                  onClick={() => setSelectedDay('all')}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all',
                    selectedDay === 'all'
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-secondary text-muted-foreground hover:text-foreground'
                  )}
                >
                  All Days
                </button>
                {data.daySummaries.map((ds) => (
                  <button
                    key={ds.date}
                    onClick={() => setSelectedDay(ds.date)}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1',
                      selectedDay === ds.date
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'bg-secondary text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <span>Day {ds.dayNumber}</span>
                    {ds.total > 0 && (
                      <span className="text-[10px] opacity-80">· {fmtMoney(ds.total)}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setIsAddExpenseOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm active:scale-95 transition-all shrink-0"
              style={{ backgroundImage: 'var(--gradient-hero)', color: 'white' }}
            >
              <Plus className="w-4 h-4" />
              <span>Details</span>
            </button>
          </div>

          {/* Expense Items */}
          <div className="space-y-2">
            {filteredExpenses.length === 0 ? (
              <EmptyState
                icon={Receipt}
                title="No expenses logged"
                hint="Type above like 'petrol 500' to add instantly."
                color="--violet"
              />
            ) : (
              filteredExpenses.map((exp) => {
                const memberWhoPaid = trip.members?.find(
                  (m) => m.id === exp.tripMetadata?.paidByMemberId
                );

                return (
                  <div
                    key={exp._id?.toString()}
                    className="card-surface p-3 rounded-2xl border border-border flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="tile w-9 h-9 rounded-xl text-base shrink-0">
                        {exp.category?.includes('Fuel')
                          ? '⛽'
                          : exp.category?.includes('Food') || exp.category?.includes('Snacks')
                          ? '🍽️'
                          : exp.category?.includes('Hotel') || exp.category?.includes('Stay')
                          ? '🏨'
                          : exp.category?.includes('Toll')
                          ? '🛣️'
                          : exp.category?.includes('Daan') || exp.category?.includes('Village')
                          ? '🛕'
                          : '📦'}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-semibold text-xs text-foreground truncate">
                            {exp.itemName}
                          </span>
                          <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-secondary text-muted-foreground">
                            {exp.category}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                          <span>{exp.date}</span>
                          {memberWhoPaid && <span>· Paid by {memberWhoPaid.name}</span>}
                          {exp.note && <span className="truncate max-w-[100px]">· {exp.note}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-bold text-xs amount" style={{ color: 'var(--danger)' }}>
                        {fmtMoney(exp.amount)}
                      </span>
                      <button
                        onClick={() => setDeleteExpenseId(exp._id?.toString() || null)}
                        className="p-1 rounded-lg hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ── Tab 3: Share & Report ───────────────────────────────────────── */}
      {activeTab === 'share' && (
        <div className="space-y-3.5">
          <div className="card-surface p-4 rounded-2xl border border-border space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-foreground">WhatsApp Summary</h3>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleCopyWhatsApp}
                  className="p-2 rounded-xl bg-secondary hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  title="Copy"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <button
                  onClick={handleOpenWhatsApp}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#25D366] text-white shadow-sm active:scale-95 transition-all"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share</span>
                </button>
              </div>
            </div>

            <pre className="p-3 rounded-xl bg-secondary text-foreground font-mono text-[11px] whitespace-pre-wrap leading-relaxed border border-border">
              {whatsappSummaryText}
            </pre>
          </div>

          <div className="card-surface p-4 rounded-2xl border border-border flex items-center justify-between gap-3">
            <div>
              <h4 className="font-bold text-xs text-foreground">Print Summary</h4>
              <p className="text-[11px] text-muted-foreground">
                Print or export to PDF
              </p>
            </div>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-secondary hover:bg-muted text-xs font-semibold text-foreground transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
          </div>
        </div>
      )}

      {/* ── Add Expense Modal ───────────────────────────────────────────── */}
      {isAddExpenseOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
          <div className="card-surface border border-border w-full max-w-md rounded-3xl p-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="font-bold text-sm text-foreground">Add Expense</h3>
              <button
                onClick={() => setIsAddExpenseOpen(false)}
                className="p-1.5 rounded-full hover:bg-secondary text-muted-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddExpense} className="space-y-3 mt-3.5 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-medium text-muted-foreground mb-1">
                    Item *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Petrol"
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-secondary border border-border outline-none focus:border-primary text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-muted-foreground mb-1">
                    Amount (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 1500"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-secondary border border-border outline-none focus:border-primary text-xs font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-medium text-muted-foreground mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-secondary border border-border outline-none focus:border-primary text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-muted-foreground mb-1">
                    Category
                  </label>
                  <select
                    value={tripCategory}
                    onChange={(e) => setTripCategory(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-secondary border border-border outline-none focus:border-primary text-xs cursor-pointer"
                  >
                    {TRIP_EXPENSE_CATEGORIES.map((c) => (
                      <option key={c.label} value={c.label}>
                        {c.emoji} {c.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {trip.members && trip.members.length > 0 && (
                <div>
                  <div>
                    <label className="block text-[11px] font-medium text-muted-foreground mb-1">
                      Who Paid?
                    </label>
                    <select
                      value={paidByMemberId}
                      onChange={(e) => setPaidByMemberId(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-secondary border border-border outline-none focus:border-primary text-xs cursor-pointer"
                    >
                      {trip.members.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} {m.isCurrentUser && '(You)'}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-medium text-muted-foreground mb-1">
                  Note <span className="text-muted-foreground font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Near highway"
                  value={expenseNote}
                  onChange={(e) => setExpenseNote(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-secondary border border-border outline-none focus:border-primary text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsAddExpenseOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold hover:bg-secondary transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingExpense}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold shadow-md active:scale-95 transition-all disabled:opacity-50"
                  style={{ backgroundImage: 'var(--gradient-hero)', color: 'white' }}
                >
                  {isSubmittingExpense ? 'Saving...' : 'Add Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Edit Trip Modal ─────────────────────────────────────────────── */}
      {isEditTripOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
          <div className="card-surface border border-border w-full max-w-md rounded-3xl p-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="font-bold text-sm text-foreground">Edit Trip</h3>
              <button
                onClick={() => setIsEditTripOpen(false)}
                className="p-1.5 rounded-full hover:bg-secondary text-muted-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateTrip} className="space-y-3 mt-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-medium text-muted-foreground mb-1">
                  Trip Name
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-secondary border border-border outline-none focus:border-primary text-xs font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-medium text-muted-foreground mb-1">
                    Budget (₹)
                  </label>
                  <input
                    type="number"
                    value={editBudget}
                    onChange={(e) => setEditBudget(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-secondary border border-border outline-none focus:border-primary text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-muted-foreground mb-1">
                    Status
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl bg-secondary border border-border outline-none focus:border-primary text-xs cursor-pointer"
                  >
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="planned">Planned</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsEditTripOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold hover:bg-secondary transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-bold shadow-md"
                  style={{ backgroundImage: 'var(--gradient-hero)', color: 'white' }}
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Confirm Delete Expense Dialog ───────────────────────────────── */}
      <ConfirmDialog
        open={!!deleteExpenseId}
        onOpenChange={(open) => {
          if (!open) setDeleteExpenseId(null);
        }}
        title="Delete Expense"
        description="Are you sure you want to delete this trip expense?"
        confirmText="Delete"
        onConfirm={handleDeleteExpense}
        variant="destructive"
      />
    </div>
  );
}
