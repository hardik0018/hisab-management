"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  User,
} from "lucide-react";
import { toast } from "sonner";
import { TripCardItem, Trip, TripCategory } from "@/types/trip";
import { cn } from "@/lib/utils";
import { v4 as uuidv4 } from "uuid";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import StatCard from "@/components/StatCard";
import EmptyState from "@/components/EmptyState";

interface TripsListClientProps {
  initialTrips: TripCardItem[];
  initialActiveTrip: Trip | null;
  collaborators: { user_id: string; name: string }[];
  currentUserId: string;
  currentUserName: string;
}

const TEMPLATE_SUGGESTIONS = [
  {
    title: "Village Visit",
    emoji: "🛕",
    category: "village_visit" as TripCategory,
  },
  {
    title: "Weekend Road Trip",
    emoji: "🚗",
    category: "weekend" as TripCategory,
  },
  {
    title: "Family Function",
    emoji: "🎉",
    category: "family_function" as TripCategory,
  },
];

function fmtMoney(n: number) {
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
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
  const [filterStatus, setFilterStatus] = useState<
    "all" | "active" | "planned" | "completed"
  >("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteTripId, setDeleteTripId] = useState<string | null>(null);

  // Minimal Fast Form State
  const [title, setTitle] = useState("");
  const [budget, setBudget] = useState("");
  const [isGroupTrip, setIsGroupTrip] = useState(false);
  const [selectedCollaboratorIds, setSelectedCollaboratorIds] = useState<
    string[]
  >([]);
  const [customMembers, setCustomMembers] = useState<string[]>([]);
  const [customMemberInput, setCustomMemberInput] = useState("");

  // Total spent across trips
  const totalSpent = useMemo(() => {
    return trips.reduce((sum, t) => sum + (t.totalSpent || 0), 0);
  }, [trips]);

  const activeCount = useMemo(() => {
    return trips.filter((t) => t.status === "active").length;
  }, [trips]);

  // Filtered trips
  const filteredTrips = useMemo(() => {
    return trips.filter((t) => {
      const matchStatus =
        filterStatus === "all" ? true : t.status === filterStatus;
      const matchSearch =
        searchQuery.trim() === "" ||
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.destination.toLowerCase().includes(searchQuery.toLowerCase());
      return matchStatus && matchSearch;
    });
  }, [trips, filterStatus, searchQuery]);

  // Toggle active trip
  const handleToggleActive = async (tripId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      const res = await fetch(`/api/trips/${tripId}/activate`, {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok)
        throw new Error(data.message || "Failed to toggle active trip");

      toast.success(data.message);

      setTrips((prev) =>
        prev.map((t) => ({
          ...t,
          isCurrentActive: t.trip_id === tripId ? data.isCurrentActive : false,
          status:
            t.trip_id === tripId && data.isCurrentActive ? "active" : t.status,
        })),
      );

      if (data.isCurrentActive) {
        const found = trips.find((t) => t.trip_id === tripId);
        if (found) {
          setActiveTrip({
            trip_id: found.trip_id,
            space_id: "",
            user_id: "",
            title: found.title,
            destination: found.destination,
            category: found.category,
            startDate: found.startDate,
            endDate: found.endDate,
            budget: found.budget,
            coverEmoji: found.coverEmoji,
            status: "active",
            isCurrentActive: true,
            members: [],
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
      } else {
        setActiveTrip(null);
      }

      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("active_trip_changed"));
      }
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to update active trip");
    }
  };

  // Toggle Collaborator in Group Mode
  const handleToggleCollaborator = (userId: string) => {
    setSelectedCollaboratorIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  };

  const handleAddCustomMember = () => {
    if (!customMemberInput.trim()) return;
    setCustomMembers((prev) => [...prev, customMemberInput.trim()]);
    setCustomMemberInput("");
  };

  const handleRemoveCustomMember = (index: number) => {
    setCustomMembers((prev) => prev.filter((_, i) => i !== index));
  };

  // Create Trip Fast Submit
  const handleCreateTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Trip name is required");
      return;
    }

    setIsSubmitting(true);
    try {
      const lowerTitle = title.toLowerCase();
      let autoEmoji = "🌴";
      let autoCategory: TripCategory = "weekend";

      if (
        lowerTitle.includes("village") ||
        lowerTitle.includes("gam") ||
        lowerTitle.includes("home")
      ) {
        autoEmoji = "🛕";
        autoCategory = "village_visit";
      } else if (
        lowerTitle.includes("goa") ||
        lowerTitle.includes("beach") ||
        lowerTitle.includes("vacation")
      ) {
        autoEmoji = "🏖️";
        autoCategory = "vacation";
      } else if (
        lowerTitle.includes("wedding") ||
        lowerTitle.includes("function") ||
        lowerTitle.includes("prasang")
      ) {
        autoEmoji = "🎉";
        autoCategory = "family_function";
      } else if (
        lowerTitle.includes("road") ||
        lowerTitle.includes("drive") ||
        lowerTitle.includes("car")
      ) {
        autoEmoji = "🚗";
        autoCategory = "road_trip";
      }

      // Build member list based on Solo vs Group selection
      const tripMembers: {
        id: string;
        name: string;
        isCurrentUser?: boolean;
        userId?: string;
      }[] = [
        {
          id: `mem_${uuidv4().slice(0, 8)}`,
          name: currentUserName || "Me",
          isCurrentUser: true,
          userId: currentUserId,
        },
      ];

      if (isGroupTrip) {
        // Add selected collaborators
        selectedCollaboratorIds.forEach((cId) => {
          const collab = collaborators.find((c) => c.user_id === cId);
          if (collab && collab.user_id !== currentUserId) {
            tripMembers.push({
              id: `mem_${uuidv4().slice(0, 8)}`,
              name: collab.name,
              userId: collab.user_id,
              isCurrentUser: false,
            });
          }
        });

        // Add custom member names
        customMembers.forEach((name) => {
          tripMembers.push({
            id: `mem_${uuidv4().slice(0, 8)}`,
            name,
            isCurrentUser: false,
          });
        });
      }

      const todayStr = new Date().toISOString().split("T")[0];

      const res = await fetch("/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          destination: title.trim(),
          category: autoCategory,
          startDate: todayStr,
          endDate: "",
          budget: budget ? parseFloat(budget) : 0,
          coverEmoji: autoEmoji,
          isCurrentActive: true,
          status: "active",
          members: tripMembers,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to create trip");

      toast.success(`"${title}" created and active! 🚀`);
      setIsCreateOpen(false);

      // Reset
      setTitle("");
      setBudget("");
      setIsGroupTrip(false);
      setSelectedCollaboratorIds([]);
      setCustomMembers([]);

      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("active_trip_changed"));
      }
      router.refresh();
      window.location.reload();
    } catch (err: any) {
      toast.error(err.message || "Failed to create trip");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Trip
  const handleDeleteTrip = async () => {
    if (!deleteTripId) return;

    try {
      const res = await fetch(`/api/trips/${deleteTripId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to delete trip");

      toast.success("Trip deleted");
      setTrips((prev) => prev.filter((t) => t.trip_id !== deleteTripId));
      if (activeTrip?.trip_id === deleteTripId) {
        setActiveTrip(null);
      }
      setDeleteTripId(null);

      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("active_trip_changed"));
      }
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete trip");
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
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold shadow-sm active:scale-95 transition-all"
          style={{ backgroundImage: "var(--gradient-hero)", color: "white" }}
        >
          <Plus className="w-4 h-4" />
          <span>New Trip</span>
        </button>
      </div>

      {/* ── Active Trip Banner (if any) ────────────────────────────────── */}
      {activeTrip && (
        <div
          className="p-3.5 rounded-2xl flex items-center justify-between gap-3"
          style={{
            background: "var(--amber-soft)",
            border: "1px solid var(--border)",
          }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-2xl shrink-0">
              {activeTrip.coverEmoji || "🌴"}
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded-full"
                  style={{ background: "var(--amber)", color: "white" }}
                >
                  Active Trip
                </span>
                <span className="font-bold text-sm text-foreground truncate">
                  {activeTrip.title}
                </span>
              </div>
              <p className="text-xs text-muted-foreground truncate mt-0.5">
                Auto-tagging new expenses
              </p>
            </div>
          </div>

          <Link
            href={`/expenses/trips/${activeTrip.trip_id}`}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0"
            style={{
              background: "var(--card)",
              color: "var(--foreground)",
              border: "1px solid var(--border)",
            }}
          >
            <span>View</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
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
            placeholder="Search trips..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-secondary border border-border outline-none focus:border-primary transition-all placeholder:text-muted-foreground"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex gap-1.5 p-1 bg-secondary rounded-xl">
          {(["all", "active", "planned", "completed"] as const).map(
            (status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={cn(
                  "flex-1 py-1.5 text-xs font-semibold rounded-lg capitalize transition-all",
                  filterStatus === status
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {status}
              </button>
            ),
          )}
        </div>
      </div>

      {/* ── Trip List ──────────────────────────────────────────────────── */}
      <div className="space-y-2.5">
        {filteredTrips.length === 0 ? (
          <EmptyState
            icon={Compass}
            title="No trips found"
            hint="Tap + New Trip to start a trip or village visit."
            color="--violet"
          />
        ) : (
          filteredTrips.map((t) => {
            const hasBudget = t.budget > 0;
            const progressColor =
              t.budgetPercentage >= 95
                ? "bg-rose-500"
                : t.budgetPercentage >= 75
                  ? "bg-amber-500"
                  : "bg-emerald-500";

            return (
              <Link
                key={t.trip_id}
                href={`/expenses/trips/${t.trip_id}`}
                className={cn(
                  "block card-surface p-4 rounded-2xl border transition-all active:scale-[0.99] hover:border-primary/40",
                  t.isCurrentActive ? "border-amber-500/50" : "border-border",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="tile w-10 h-10 shrink-0 text-xl font-bold">
                      {t.coverEmoji || "🌴"}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold text-sm text-foreground truncate">
                          {t.title}
                        </span>
                        {t.isCurrentActive && (
                          <span
                            className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full"
                            style={{
                              background: "var(--amber-soft)",
                              color: "var(--amber)",
                            }}
                          >
                            Active
                          </span>
                        )}
                        <span
                          className={cn(
                            "text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full",
                            t.status === "completed"
                              ? "bg-slate-500/15 text-slate-600 dark:text-slate-400"
                              : t.status === "active"
                                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                                : "bg-sky-500/15 text-sky-600 dark:text-sky-400",
                          )}
                        >
                          {t.status}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                        <span>{t.startDate}</span>
                        {t.membersCount > 1 && (
                          <>
                            <span>·</span>
                            <span>{t.membersCount} members</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={(e) => handleToggleActive(t.trip_id, e)}
                    title={t.isCurrentActive ? "Active trip" : "Make active"}
                    className={cn(
                      "p-2 rounded-xl transition-all active:scale-95 shrink-0",
                      t.isCurrentActive
                        ? "bg-amber-500 text-white"
                        : "bg-secondary text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <Zap className="w-4 h-4 fill-current" />
                  </button>
                </div>

                <div className="mt-3 pt-2.5 border-t border-border flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    Spent:{" "}
                    <strong className="text-foreground">
                      {fmtMoney(t.totalSpent)}
                    </strong>
                    {hasBudget && <span> / {fmtMoney(t.budget)}</span>}
                  </span>
                  <span className="font-semibold text-muted-foreground text-[11px]">
                    {t.expenseCount} items{" "}
                    {hasBudget && `(${t.budgetPercentage}%)`}
                  </span>
                </div>

                {hasBudget && (
                  <div className="w-full h-1.5 rounded-full bg-secondary overflow-hidden mt-1.5">
                    <div
                      className={cn(
                        "h-full transition-all duration-300",
                        progressColor,
                      )}
                      style={{ width: `${Math.min(100, t.budgetPercentage)}%` }}
                    />
                  </div>
                )}
              </Link>
            );
          })
        )}
      </div>

      {/* ── Instant Trip Creation Modal ─────────────────────────────────── */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
          <div className="card-surface border border-border w-full max-w-sm rounded-3xl p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="font-bold text-sm text-foreground">New Trip</h3>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="p-1.5 rounded-full hover:bg-secondary text-muted-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={handleCreateTrip}
              className="space-y-3.5 mt-3.5 text-xs"
            >
              {/* Quick Suggestion Pills */}
              <div className="flex flex-wrap gap-1.5">
                {TEMPLATE_SUGGESTIONS.map((temp) => (
                  <button
                    key={temp.title}
                    type="button"
                    onClick={() => setTitle(temp.title)}
                    className="px-2.5 py-1 rounded-full bg-secondary hover:bg-muted text-muted-foreground hover:text-foreground font-medium text-[11px] transition-all flex items-center gap-1"
                  >
                    <span>{temp.emoji}</span>
                    <span>{temp.title}</span>
                  </button>
                ))}
              </div>

              {/* Trip Title */}
              <div>
                <label className="block text-[11px] font-medium text-muted-foreground mb-1">
                  Trip Name *
                </label>
                <input
                  type="text"
                  autoFocus
                  required
                  placeholder="e.g. Village Visit / Goa"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-secondary border border-border outline-none focus:border-primary text-xs font-semibold"
                />
              </div>

              {/* Budget (Optional) */}
              <div>
                <label className="block text-[11px] font-medium text-muted-foreground mb-1">
                  Budget (₹){" "}
                  <span className="text-muted-foreground font-normal">
                    (Optional)
                  </span>
                </label>
                <input
                  type="number"
                  placeholder="e.g. 5000"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-secondary border border-border outline-none focus:border-primary text-xs font-semibold"
                />
              </div>

              {/* Mode: Solo or Group */}
              <div>
                <label className="block text-[11px] font-medium text-muted-foreground mb-1.5">
                  Who is going?
                </label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-secondary rounded-xl">
                  <button
                    type="button"
                    onClick={() => setIsGroupTrip(false)}
                    className={cn(
                      "py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5",
                      !isGroupTrip
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>Solo (Just Me)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsGroupTrip(true)}
                    className={cn(
                      "py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5",
                      isGroupTrip
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Family / Friends</span>
                  </button>
                </div>

                {/* If Group trip selected, show simple collaborator pills */}
                {isGroupTrip && (
                  <div className="mt-2.5 p-3 rounded-2xl bg-secondary/70 border border-border space-y-2">
                    <p className="text-[11px] text-muted-foreground font-medium">
                      Select who is joining you:
                    </p>

                    {collaborators.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {collaborators.map((c) => {
                          const isSelected = selectedCollaboratorIds.includes(
                            c.user_id,
                          );
                          return (
                            <button
                              key={c.user_id}
                              type="button"
                              onClick={() =>
                                handleToggleCollaborator(c.user_id)
                              }
                              className={cn(
                                "px-2.5 py-1 rounded-full text-xs font-semibold transition-all flex items-center gap-1",
                                isSelected
                                  ? "bg-primary text-primary-foreground shadow-sm"
                                  : "bg-background border border-border text-muted-foreground hover:text-foreground",
                              )}
                            >
                              <span>{isSelected ? "✓" : "+"}</span>
                              <span>{c.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Add Custom Person Name */}
                    <div className="flex gap-1.5 pt-1">
                      <input
                        type="text"
                        placeholder="Add friend/cousin..."
                        value={customMemberInput}
                        onChange={(e) => setCustomMemberInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddCustomMember();
                          }
                        }}
                        className="flex-1 p-2 rounded-xl bg-background border border-border outline-none text-xs"
                      />
                      <button
                        type="button"
                        onClick={handleAddCustomMember}
                        className="px-2.5 py-2 rounded-xl bg-secondary hover:bg-muted font-semibold text-xs"
                      >
                        + Add
                      </button>
                    </div>

                    {customMembers.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {customMembers.map((m, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[11px]"
                          >
                            <span>{m}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveCustomMember(i)}
                              className="hover:text-rose-500"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold hover:bg-secondary transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl text-xs font-bold shadow-md active:scale-95 transition-all disabled:opacity-50"
                  style={{
                    backgroundImage: "var(--gradient-hero)",
                    color: "white",
                  }}
                >
                  {isSubmitting ? "Creating..." : "Start Trip"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Confirm Delete Dialog ───────────────────────────────────────── */}
      <ConfirmDialog
        open={!!deleteTripId}
        onOpenChange={(open) => {
          if (!open) setDeleteTripId(null);
        }}
        title="Delete Trip"
        description="Are you sure you want to delete this trip? Existing expenses will remain in your general expense history."
        confirmText="Delete Trip"
        onConfirm={handleDeleteTrip}
        variant="destructive"
      />
    </div>
  );
}
