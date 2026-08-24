'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Calendar,
  MapPin,
  Users,
  Search,
  X,
  Zap,
  ArrowRight,
  Compass,
  Square,
  Play,
  Trash2,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';
import { TripCardItem, Trip } from '@/types/trip';
import { cn } from '@/lib/utils';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import StatCard from '@/components/StatCard';
import EmptyState from '@/components/EmptyState';

interface TripsListClientProps {
  initialTrips: TripCardItem[];
  initialActiveTrip: Trip | null;
  collaborators: { user_id: string; name: string }[];
  currentUserId: string;
  currentUserName: string;
}

function fmtMoney(n: number) {
  return `₹${Math.round(n).toLocaleString('en-IN')}`;
}

export default function TripsListClient({
  initialTrips,
  initialActiveTrip,
  collaborators,
  currentUserId,
  currentUserName,
}: TripsListClientProps) {
  const router = useRouter();
  const [trips, setTrips] = useState<TripCardItem[]>(initialTrips);
  const [activeTrip, setActiveTrip] = useState<Trip | null>(initialActiveTrip);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'planned' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteTripId, setDeleteTripId] = useState<string | null>(null);
  const [togglingTripId, setTogglingTripId] = useState<string | null>(null);

  // Total spent across trips
  const totalSpent = useMemo(() => {
    return trips.reduce((sum, t) => sum + (t.totalSpent || 0), 0);
  }, [trips]);

  const activeCount = useMemo(() => {
    return trips.filter((t) => t.isCurrentActive || t.status === 'active').length;
  }, [trips]);

  // Filtered trips
  const filteredTrips = useMemo(() => {
    return trips.filter((t) => {
      const matchStatus =
        filterStatus === 'all'
          ? true
          : filterStatus === 'active'
          ? t.isCurrentActive || t.status === 'active'
          : t.status === filterStatus;
      const matchSearch =
        searchQuery.trim() === '' ||
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.destination.toLowerCase().includes(searchQuery.toLowerCase());
      return matchStatus && matchSearch;
    });
  }, [trips, filterStatus, searchQuery]);

  // Toggle active / stop trip
  const handleToggleActive = async (tripId: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    setTogglingTripId(tripId);
    try {
      const res = await fetch(`/api/trips/${tripId}/activate`, {
        method: 'POST',
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || 'Failed to update active trip');

      toast.success(data.message);

      setTrips((prev) =>
        prev.map((t) => ({
          ...t,
          isCurrentActive: t.trip_id === tripId ? data.isCurrentActive : false,
        }))
      );

      if (data.isCurrentActive) {
        const found = trips.find((t) => t.trip_id === tripId);
        if (found) {
          setActiveTrip({
            trip_id: found.trip_id,
            space_id: '',
            user_id: '',
            title: found.title,
            destination: found.destination,
            category: found.category,
            startDate: found.startDate,
            endDate: found.endDate,
            budget: found.budget,
            coverEmoji: found.coverEmoji,
            status: 'active',
            isCurrentActive: true,
            members: [],
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
      } else {
        setActiveTrip(null);
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('active_trip_changed'));
      }
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update active trip');
    } finally {
      setTogglingTripId(null);
    }
  };

  // Delete Trip
  const handleDeleteTrip = async () => {
    if (!deleteTripId) return;

    try {
      const res = await fetch(`/api/trips/${deleteTripId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to delete trip');

      toast.success('Trip deleted');
      setTrips((prev) => prev.filter((t) => t.trip_id !== deleteTripId));
      if (activeTrip?.trip_id === deleteTripId) {
        setActiveTrip(null);
      }
      setDeleteTripId(null);

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('active_trip_changed'));
      }
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete trip');
    }
  };

  return (
    <div className="space-y-4">
      {/* ── Page Header ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Trips
          </h1>
          <p className="text-xs text-muted-foreground">
            Create or stop trips. Active trips auto-tag all new expenses.
          </p>
        </div>
        <Link
          href="/expenses/trips/new"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold shadow-sm active:scale-95 transition-all text-white"
          style={{ backgroundImage: 'var(--gradient-hero)' }}
        >
          <Plus className="w-4 h-4" />
          <span>New Trip</span>
        </Link>
      </div>

      {/* ── Active Trip Banner (if any) ────────────────────────────────── */}
      {activeTrip && (
        <div
          className="p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm"
          style={{
            background: 'var(--amber-soft)',
            border: '1px solid var(--border)',
          }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-3xl shrink-0">
              {activeTrip.coverEmoji || '🌴'}
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                  style={{ background: 'var(--amber)', color: 'white' }}
                >
                  Active Trip
                </span>
                <span className="font-bold text-sm text-foreground truncate">
                  {activeTrip.title}
                </span>
              </div>
              <p className="text-xs text-muted-foreground truncate mt-0.5">
                Auto-tagging new expenses & hisab entries across the app
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 pt-1 sm:pt-0">
            <button
              onClick={() => handleToggleActive(activeTrip.trip_id)}
              disabled={togglingTripId === activeTrip.trip_id}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30 hover:bg-rose-500/25 active:scale-95 transition-all"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Stop Trip</span>
            </button>

            <Link
              href={`/expenses/trips/${activeTrip.trip_id}`}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all bg-card border border-border text-foreground hover:bg-secondary active:scale-95"
            >
              <span>View Details</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* ── Stat Cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard variant="hero" label="Total trip spend" amount={totalSpent} />
        <StatCard
          variant="surface"
          label="Active trips"
          amount={activeCount}
          caption={`${trips.length} total recorded`}
        />
      </div>

      {/* ── Search & Filter ────────────────────────────────────────────── */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search trips by name or destination..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-xs rounded-xl bg-secondary border border-border outline-none focus:border-primary transition-all placeholder:text-muted-foreground"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex gap-1.5 p-1 bg-secondary rounded-xl">
          {(['all', 'active', 'planned', 'completed'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={cn(
                'flex-1 py-1.5 text-xs font-semibold rounded-lg capitalize transition-all',
                filterStatus === status
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* ── Trip List ──────────────────────────────────────────────────── */}
      <div className="space-y-2.5">
        {filteredTrips.length === 0 ? (
          <EmptyState
            icon={Compass}
            title="No trips found"
            hint="Tap '+ New Trip' to start tracking your travel or village visit."
            color="--violet"
          />
        ) : (
          filteredTrips.map((t) => {
            const hasBudget = t.budget > 0;
            const progressColor =
              t.budgetPercentage >= 95
                ? 'bg-rose-500'
                : t.budgetPercentage >= 75
                ? 'bg-amber-500'
                : 'bg-emerald-500';

            return (
              <div
                key={t.trip_id}
                className={cn(
                  'card-surface p-4 rounded-2xl border transition-all hover:border-primary/40',
                  t.isCurrentActive ? 'border-amber-500/60 shadow-sm' : 'border-border'
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <Link
                    href={`/expenses/trips/${t.trip_id}`}
                    className="flex items-center gap-3 min-w-0 flex-1"
                  >
                    <div className="tile w-11 h-11 shrink-0 text-2xl font-bold flex items-center justify-center">
                      {t.coverEmoji || '🌴'}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-sm text-foreground truncate hover:underline">
                          {t.title}
                        </span>
                        {t.isCurrentActive && (
                          <span
                            className="text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full"
                            style={{
                              background: 'var(--amber-soft)',
                              color: 'var(--amber)',
                            }}
                          >
                            Active Now
                          </span>
                        )}
                        <span
                          className={cn(
                            'text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full',
                            t.status === 'completed'
                              ? 'bg-slate-500/15 text-slate-600 dark:text-slate-400'
                              : t.status === 'active'
                              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                              : 'bg-sky-500/15 text-sky-600 dark:text-sky-400'
                          )}
                        >
                          {t.status}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                        <span>{t.startDate}</span>
                        {t.destination && t.destination !== t.title && (
                          <>
                            <span>·</span>
                            <span className="truncate">{t.destination}</span>
                          </>
                        )}
                        {t.membersCount > 1 && (
                          <>
                            <span>·</span>
                            <span>{t.membersCount} members</span>
                          </>
                        )}
                      </div>
                    </div>
                  </Link>

                  {/* Start / Stop Toggle Button */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      disabled={togglingTripId === t.trip_id}
                      onClick={(e) => handleToggleActive(t.trip_id, e)}
                      title={t.isCurrentActive ? 'Stop this active trip' : 'Set as Active trip'}
                      className={cn(
                        'inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95',
                        t.isCurrentActive
                          ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30 hover:bg-rose-500/25'
                          : 'bg-secondary text-foreground border border-border hover:bg-muted'
                      )}
                    >
                      {t.isCurrentActive ? (
                        <>
                          <Square className="w-3 h-3 fill-current" />
                          <span>Stop</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3 h-3 fill-current text-primary" />
                          <span>Start</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeleteTripId(t.trip_id)}
                      className="p-1.5 rounded-xl text-muted-foreground hover:text-rose-500 hover:bg-secondary active:scale-95 transition-all"
                      title="Delete trip"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Spend & progress bar */}
                <Link
                  href={`/expenses/trips/${t.trip_id}`}
                  className="block mt-3 pt-2.5 border-t border-border text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">
                      Spent:{' '}
                      <strong className="text-foreground">
                        {fmtMoney(t.totalSpent)}
                      </strong>
                      {hasBudget && <span> / {fmtMoney(t.budget)}</span>}
                    </span>
                    <span className="font-semibold text-muted-foreground text-[11px] flex items-center gap-1">
                      <span>{t.expenseCount} items</span>
                      {hasBudget && <span>({t.budgetPercentage}%)</span>}
                      <ArrowRight className="w-3 h-3 ml-0.5 text-muted-foreground" />
                    </span>
                  </div>

                  {hasBudget && (
                    <div className="w-full h-1.5 rounded-full bg-secondary overflow-hidden mt-1.5">
                      <div
                        className={cn('h-full transition-all duration-300', progressColor)}
                        style={{ width: `${Math.min(100, t.budgetPercentage)}%` }}
                      />
                    </div>
                  )}
                </Link>
              </div>
            );
          })
        )}
      </div>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTripId}
        title="Delete Trip?"
        message="Are you sure you want to delete this trip? Associated expenses will remain in your records, but the trip grouping will be removed."
        confirmText="Delete"
        variant="destructive"
        onConfirm={handleDeleteTrip}
        onCancel={() => setDeleteTripId(null)}
      />
    </div>
  );
}
