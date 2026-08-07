"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Plus,
  Search,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowLeft,
  Trash2,
  Users,
  AlertCircle,
  MoreVertical,
  HandCoins,
  Phone,
  CheckCircle2,
  Calendar,
  Info,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import PageHeader from "@/components/PageHeader";
import AppShell from "@/components/AppShell";
import StatCard from "@/components/StatCard";
import QuickAddBar from "@/components/QuickAddBar";
import SectionTitle from "@/components/SectionTitle";
import EmptyState from "@/components/EmptyState";
import { motion, AnimatePresence } from "framer-motion";
import { secureFetch } from "@/lib/api-utils";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { HisabRecord, TransactionType } from "@/types";
import Link from "next/link";

interface HisabClientProps {
  initialPeople: PersonSummary[];
  initialTotalDebit: number;
  initialTotalCredit: number;
  initialNetBalance: number;
  initialHasMore: boolean;
}

interface FormData {
  name: string;
  mobile: string;
  type: TransactionType;
  amount: string;
  description: string;
  date: string;
  logAsExpense: boolean;
}

interface PersonSummary {
  name: string;
  mobile: string;
  debit: number; // money given / lent
  credit: number; // money taken / borrowed
  latest: string | Date;
  ignored?: boolean;
}

export default function HisabClient({
  initialPeople,
  initialTotalDebit,
  initialTotalCredit,
  initialNetBalance,
  initialHasMore,
}: HisabClientProps) {
  const router = useRouter();

  const [people, setPeople] = useState<PersonSummary[]>(initialPeople);
  const [totalDebit, setTotalDebit] = useState(initialTotalDebit);
  const [totalCredit, setTotalCredit] = useState(initialTotalCredit);
  const [netBalance, setNetBalance] = useState(initialNetBalance);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const [search, setSearch] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);

  const [selectedPerson, setSelectedPerson] = useState<{
    name: string;
    mobile: string;
  } | null>(null);
  const [showLedgerModal, setShowLedgerModal] = useState(false);
  const [personRecords, setPersonRecords] = useState<HisabRecord[]>([]);
  const [isLoadingLedger, setIsLoadingLedger] = useState(false);

  const [showSettled, setShowSettled] = useState(false);
  const [showIgnored, setShowIgnored] = useState(false);
  const [quickEntryPerson, setQuickEntryPerson] = useState<{
    person: PersonSummary;
    type: "debit" | "credit";
  } | null>(null);
  const [quickAmount, setQuickAmount] = useState("");

  const [formData, setFormData] = useState<FormData>({
    name: "",
    mobile: "",
    type: "debit",
    amount: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
    logAsExpense: true,
  });

  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setPeople(initialPeople);
    setTotalDebit(initialTotalDebit);
    setTotalCredit(initialTotalCredit);
    setNetBalance(initialNetBalance);
    setHasMore(initialHasMore);
    setPage(1);
  }, [
    initialPeople,
    initialTotalDebit,
    initialTotalCredit,
    initialNetBalance,
    initialHasMore,
  ]);

  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    const nextPage = page + 1;
    try {
      const data = await secureFetch<{
        people: PersonSummary[];
        totalDebit: number;
        totalCredit: number;
        netBalance: number;
        hasMore: boolean;
      }>(
        `/api/hisab?page=${nextPage}&limit=50&search=${encodeURIComponent(search)}`,
      );

      setPeople((prev) => [...prev, ...data.people]);
      setTotalDebit(data.totalDebit);
      setTotalCredit(data.totalCredit);
      setNetBalance(data.netBalance);
      setHasMore(data.hasMore);
      setPage(nextPage);
    } catch (err) {
      toast.error("Failed to load more");
    } finally {
      setIsLoadingMore(false);
    }
  }, [page, hasMore, isLoadingMore, search]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { threshold: 0.1 },
    );
    if (observerTarget.current) observer.observe(observerTarget.current);
    return () => observer.disconnect();
  }, [loadMore]);

  const openLedger = async (person: { name: string; mobile: string }) => {
    setSelectedPerson(person);
    setShowLedgerModal(true);
    setIsLoadingLedger(true);
    try {
      const res = await secureFetch<{ records: HisabRecord[] }>(
        `/api/hisab/person?name=${encodeURIComponent(person.name)}&mobile=${encodeURIComponent(person.mobile)}`,
      );
      setPersonRecords(res.records || []);
    } catch (err) {
      toast.error("Failed to load ledger");
    } finally {
      setIsLoadingLedger(false);
    }
  };

  const refreshData = async () => {
    router.refresh();
    // If ledger modal is open, re-fetch person ledger
    if (showLedgerModal && selectedPerson) {
      openLedger(selectedPerson);
    }
  };

  const submitQuickEntry = async () => {
    if (!quickEntryPerson || !quickAmount || isNaN(Number(quickAmount))) return;
    try {
      await secureFetch<{ record: HisabRecord }>("/api/hisab", {
        method: "POST",
        body: JSON.stringify({
          name: quickEntryPerson.person.name,
          mobile: quickEntryPerson.person.mobile,
          type: quickEntryPerson.type,
          amount: parseFloat(quickAmount),
          description: "",
          date: new Date().toISOString().split("T")[0],
          logAsExpense: true,
        }),
      });
      toast.success("Recorded successfully");
      setQuickEntryPerson(null);
      setQuickAmount("");
      refreshData();
    } catch (err) {
      toast.error("Failed to record transaction");
    }
  };

  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editId) {
        await secureFetch<{ record: HisabRecord }>(`/api/hisab/${editId}`, {
          method: "PUT",
          body: JSON.stringify({
            ...formData,
            amount: parseFloat(formData.amount),
          }),
        });
        toast.success("Updated successfully");
      } else {
        await secureFetch<{ record: HisabRecord }>("/api/hisab", {
          method: "POST",
          body: JSON.stringify({
            ...formData,
            amount: parseFloat(formData.amount),
          }),
        });
        toast.success("Recorded successfully");
      }
      setFormData({
        name: selectedPerson?.name || "",
        mobile: selectedPerson?.mobile || "",
        type: "debit",
        amount: "",
        description: "",
        date: new Date().toISOString().split("T")[0],
        logAsExpense: true,
      });
      setEditId(null);
      setShowAddDialog(false);
      refreshData();
    } catch (err) {
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await secureFetch(`/api/hisab/${deleteConfirm}`, { method: "DELETE" });
      toast.success("Deleted successfully");
      refreshData();
    } catch (err) {
    } finally {
      setDeleteConfirm(null);
    }
  };

  // Filter records matching general search or selected person ledger
  let runningBal = 0;
  const recordsWithBalance = [...personRecords]
    .sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      if (dateA !== dateB) return dateA - dateB;
      return (
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
    })
    .map((r) => {
      if (r.type === "credit") runningBal += r.amount;
      else runningBal -= r.amount;
      return { ...r, balance: runningBal };
    })
    .reverse();

  const recordsByDate = recordsWithBalance.reduce(
    (acc: Record<string, typeof recordsWithBalance>, r) => {
      const date = new Date(r.date).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
      if (!acc[date]) acc[date] = [];
      acc[date].push(r);
      return acc;
    },
    {},
  );

  const searchedPeople = people.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.mobile && String(p.mobile).includes(search)),
  );

  const youWillGet = people.reduce((sum, p) => {
    if (p.ignored) return sum;
    const diff = p.debit - p.credit;
    return diff > 0 ? sum + diff : sum;
  }, 0);

  const youWillGive = people.reduce((sum, p) => {
    if (p.ignored) return sum;
    const diff = p.credit - p.debit;
    return diff > 0 ? sum + diff : sum;
  }, 0);

  const overallNet = netBalance;

  const activePeople = searchedPeople.filter(
    (p) => p.debit !== p.credit && !p.ignored,
  );
  const settledPeople = searchedPeople.filter(
    (p) => p.debit === p.credit && !p.ignored,
  );
  const ignoredPeople = searchedPeople.filter((p) => p.ignored);

  const isPersonIgnored = selectedPerson
    ? !!people.find(
        (p) =>
          p.name === selectedPerson.name && p.mobile === selectedPerson.mobile,
      )?.ignored
    : false;

  const selectedPersonStats = selectedPerson
    ? people.find(
        (p) =>
          p.name === selectedPerson.name && p.mobile === selectedPerson.mobile,
      )
    : null;

  const personNetBalance = selectedPersonStats
    ? selectedPersonStats.debit - selectedPersonStats.credit
    : 0;

  return (
    <AppShell>
      <PageHeader title="Hisab" subtitle="Your personal ledger" />
      <div className="space-y-6">
        <StatCard
          variant="hero"
          label="Where you stand"
          amount={overallNet}
          caption={
            overallNet > 0
              ? "Others owe you"
              : overallNet < 0
                ? "You owe others"
                : "All settled up"
          }
        />
        <div className="grid grid-cols-2 gap-3">
          <StatCard variant="in" label="You will get" amount={youWillGet} />
          <StatCard variant="out" label="You will give" amount={youWillGive} />
        </div>

        <QuickAddBar mode="hisab" onSaved={refreshData} />

        <div className="space-y-6">
          {/* Search Bar */}
          <div className="relative group shrink-0">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 transition-colors"
              style={{ color: "var(--muted-foreground)" }}
            />
            <input
              placeholder="Search person..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                background: "var(--secondary)",
                border: "1px solid var(--border)",
                color: "var(--foreground)",
              }}
              className="w-full h-11 pl-12 pr-4 rounded-xl text-sm outline-none"
            />
          </div>

          {/* Active Accounts Grid */}
          <div className="space-y-4">
            <SectionTitle>Active Balances ({activePeople.length})</SectionTitle>
            {activePeople.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No active outstanding balances"
                hint="Add a transaction to get started, or check settled accounts below."
              />
            ) : (
              <div
                className="card-surface p-0 flex flex-col gap-0 divide-y overflow-hidden"
                style={{ borderColor: "var(--border)" }}
              >
                {activePeople.map((p, idx) => {
                  const bal = p.debit - p.credit; // positive = they owe us, negative = we owe them
                  const isReceivable = bal > 0;
                  const absBal = Math.abs(bal);

                  return (
                    <div
                      key={idx}
                      onClick={() => {
                        openLedger({ name: p.name, mobile: p.mobile });
                      }}
                      className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-black/5 transition-colors"
                    >
                      <div
                        className="tile w-9 h-9 text-sm shrink-0"
                        style={{
                          background: isReceivable
                            ? "var(--success-soft)"
                            : "var(--danger-soft)",
                          color: isReceivable
                            ? "var(--success)"
                            : "var(--danger)",
                        }}
                      >
                        {p.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className="font-bold text-sm truncate"
                          style={{ color: "var(--foreground)" }}
                        >
                          {p.name}
                        </p>
                        <p
                          className="text-xs truncate"
                          style={{ color: "var(--muted-foreground)" }}
                        >
                          {p.mobile || "No mobile"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setQuickEntryPerson({ person: p, type: "credit" });
                          }}
                          className="w-8 h-8 sm:w-auto sm:px-3 sm:h-8 rounded-full text-xs font-bold active:scale-95 transition-all flex items-center justify-center gap-1 shrink-0"
                          style={{
                            background: "var(--success-soft)",
                            color: "var(--success)",
                          }}
                        >
                          <Plus className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                          <span className="hidden sm:inline">Got</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setQuickEntryPerson({ person: p, type: "debit" });
                          }}
                          className="w-8 h-8 sm:w-auto sm:px-3 sm:h-8 rounded-full text-xs font-bold active:scale-95 transition-all flex items-center justify-center gap-1 shrink-0"
                          style={{
                            background: "var(--danger-soft)",
                            color: "var(--danger)",
                          }}
                        >
                          <Plus className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                          <span className="hidden sm:inline">Gave</span>
                        </button>
                        <div className="text-right ml-2 min-w-[3rem]">
                          <p
                            className="font-bold text-sm leading-none mb-1"
                            style={{
                              color: isReceivable
                                ? "var(--success)"
                                : "var(--danger)",
                            }}
                          >
                            ₹{absBal.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Collapsible Settled Accounts Section */}
          {settledPeople.length > 0 && (
            <div className="pt-2">
              <button
                onClick={() => setShowSettled(!showSettled)}
                className="flex items-center justify-between w-full px-4 py-3 card-surface transition-all"
              >
                <span
                  className="text-sm font-bold flex items-center gap-2"
                  style={{ color: "var(--foreground)" }}
                >
                  <CheckCircle2
                    className="h-4 w-4"
                    style={{ color: "var(--success)" }}
                  />
                  Settled Accounts ({settledPeople.length})
                </span>
                {showSettled ? (
                  <ChevronUp
                    className="h-4 w-4"
                    style={{ color: "var(--muted-foreground)" }}
                  />
                ) : (
                  <ChevronDown
                    className="h-4 w-4"
                    style={{ color: "var(--muted-foreground)" }}
                  />
                )}
              </button>

              <AnimatePresence initial={false}>
                {showSettled && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div
                      className="card-surface p-0 flex flex-col gap-0 divide-y mt-2 overflow-hidden"
                      style={{ borderColor: "var(--border)" }}
                    >
                      {settledPeople.map((p, idx) => (
                        <div
                          key={idx}
                          onClick={() => {
                            openLedger({ name: p.name, mobile: p.mobile });
                          }}
                          className="flex items-center gap-3 px-4 py-3 cursor-pointer opacity-70 hover:opacity-100 transition-colors"
                        >
                          <div
                            className="tile w-9 h-9 text-sm shrink-0"
                            style={{
                              background: "var(--secondary)",
                              color: "var(--muted-foreground)",
                            }}
                          >
                            {p.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p
                              className="font-bold text-sm truncate"
                              style={{ color: "var(--foreground)" }}
                            >
                              {p.name}
                            </p>
                            <p
                              className="text-xs truncate"
                              style={{ color: "var(--muted-foreground)" }}
                            >
                              {p.mobile || "No mobile"}
                            </p>
                          </div>
                          <div className="text-right">
                            <p
                              className="font-bold text-sm"
                              style={{ color: "var(--muted-foreground)" }}
                            >
                              ₹0
                            </p>
                            <span
                              className="text-[9px] font-black uppercase tracking-widest"
                              style={{ color: "var(--muted-foreground)" }}
                            >
                              Settled
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Collapsible Ignored Accounts Section */}
          {ignoredPeople.length > 0 && (
            <div className="pt-2">
              <button
                onClick={() => setShowIgnored(!showIgnored)}
                className="flex items-center justify-between w-full px-4 py-3 card-surface transition-all"
              >
                <span
                  className="text-sm font-bold flex items-center gap-2"
                  style={{ color: "var(--foreground)" }}
                >
                  <AlertCircle
                    className="h-4 w-4"
                    style={{ color: "var(--warning)" }}
                  />
                  Ignored Accounts ({ignoredPeople.length})
                </span>
                {showIgnored ? (
                  <ChevronUp
                    className="h-4 w-4"
                    style={{ color: "var(--muted-foreground)" }}
                  />
                ) : (
                  <ChevronDown
                    className="h-4 w-4"
                    style={{ color: "var(--muted-foreground)" }}
                  />
                )}
              </button>

              <AnimatePresence initial={false}>
                {showIgnored && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div
                      className="card-surface p-0 flex flex-col gap-0 divide-y mt-2 overflow-hidden"
                      style={{ borderColor: "var(--border)" }}
                    >
                      {ignoredPeople.map((p, idx) => {
                        const bal = p.debit - p.credit;
                        const absBal = Math.abs(bal);
                        return (
                          <div
                            key={idx}
                            onClick={() => {
                              openLedger({ name: p.name, mobile: p.mobile });
                            }}
                            className="flex items-center gap-3 px-4 py-3 cursor-pointer opacity-70 hover:opacity-100 transition-colors"
                          >
                            <div
                              className="tile w-9 h-9 text-sm shrink-0"
                              style={{
                                background: "var(--warning-soft)",
                                color: "var(--warning)",
                              }}
                            >
                              {p.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p
                                className="font-bold text-sm truncate"
                                style={{ color: "var(--foreground)" }}
                              >
                                {p.name}
                              </p>
                              <p
                                className="text-xs truncate"
                                style={{ color: "var(--muted-foreground)" }}
                              >
                                {p.mobile || "No mobile"}
                              </p>
                            </div>
                            <div className="text-right">
                              <p
                                className="font-bold text-sm"
                                style={{ color: "var(--muted-foreground)" }}
                              >
                                ₹{absBal.toLocaleString()}
                              </p>
                              <span
                                className="text-[9px] font-black uppercase tracking-widest"
                                style={{ color: "var(--warning)" }}
                              >
                                Ignored
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {quickEntryPerson && (
          <div
            className="fixed inset-0 z-50 flex items-end justify-center"
            style={{ background: "oklch(0.19 0.03 268 / 0.5)" }}
          >
            <div className="card-surface w-full max-w-xl p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] flex flex-col gap-4 rounded-t-3xl m-0 border-b-0 border-x-0">
              <p
                className="text-lg font-bold"
                style={{ color: "var(--foreground)" }}
              >
                {quickEntryPerson.type === "credit"
                  ? `${quickEntryPerson.person.name} gave you`
                  : `You gave ${quickEntryPerson.person.name}`}
              </p>
              <input
                type="number"
                inputMode="decimal"
                value={quickAmount}
                onChange={(e) => setQuickAmount(e.target.value)}
                autoFocus
                placeholder="0"
                className="text-4xl font-extrabold text-center bg-transparent outline-none w-full amount"
                style={{ color: "var(--foreground)" }}
              />
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setQuickEntryPerson(null);
                    setQuickAmount("");
                  }}
                  className="flex-1 h-12 rounded-xl font-semibold"
                  style={{
                    background: "var(--secondary)",
                    color: "var(--muted-foreground)",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => submitQuickEntry()}
                  disabled={!quickAmount || isNaN(Number(quickAmount))}
                  className="flex-[2] h-12 rounded-xl font-bold active:scale-95"
                  style={{
                    backgroundImage: "var(--gradient-hero)",
                    color: "white",
                  }}
                >
                  Save
                </button>
              </div>
              <Link
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setQuickEntryPerson(null);
                  setShowAddDialog(true);
                  setFormData({
                    ...formData,
                    name: quickEntryPerson.person.name,
                    mobile: quickEntryPerson.person.mobile,
                    type: quickEntryPerson.type,
                  });
                }}
                className="text-center text-sm"
                style={{ color: "var(--muted-foreground)" }}
              >
                More details →
              </Link>
            </div>
          </div>
        )}

        {/* Ledger Details Dialog (Individual Person's Ledger) */}
        <Dialog open={showLedgerModal} onOpenChange={setShowLedgerModal}>
          <DialogContent
            className="max-w-2xl h-[100dvh] sm:h-[85vh] w-full flex flex-col p-0 overflow-hidden card-surface border-none shadow-2xl rounded-none sm:rounded-[2.5rem]"
            style={{ background: "var(--background)" }}
          >
            <div
              className="p-5 sm:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0 relative overflow-hidden transition-all duration-300"
              style={{
                background: isPersonIgnored
                  ? "var(--warning)"
                  : personNetBalance > 0
                    ? "var(--success)"
                    : personNetBalance < 0
                      ? "var(--danger)"
                      : "var(--muted-foreground)",
                color: "white",
              }}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10" />

              <div className="flex items-center gap-3 relative z-10 w-full sm:w-auto">
                <div
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-sm shadow-xl hover:bg-white/20 transition-all cursor-pointer"
                  onClick={() => setShowLedgerModal(false)}
                >
                  <ArrowLeft className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <div className="min-w-0">
                  <DialogTitle className="text-xl sm:text-2xl font-black leading-none mb-1 text-white truncate">
                    {selectedPerson?.name}
                  </DialogTitle>
                  <p className="text-white/80 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 mb-1.5">
                    {selectedPerson?.mobile ? (
                      <>
                        <Phone className="h-2.5 w-2.5" />{" "}
                        {selectedPerson.mobile}
                      </>
                    ) : (
                      "No mobile linked"
                    )}
                  </p>
                  <button
                    onClick={async () => {
                      if (!selectedPerson) return;
                      try {
                        await secureFetch("/api/hisab/ignore", {
                          method: "POST",
                          body: JSON.stringify({
                            name: selectedPerson.name,
                            mobile: selectedPerson.mobile || "",
                            ignored: !isPersonIgnored,
                          }),
                        });
                        toast.success(
                          isPersonIgnored
                            ? "Person unignored"
                            : "Person ignored",
                        );
                        refreshData();
                      } catch (err) {
                        toast.error("Failed to update ignored status");
                      }
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1 text-[9px] font-black uppercase tracking-wider bg-white/25 hover:bg-white/35 text-white rounded-full transition-all active:scale-95 border border-white/10 shadow-sm"
                  >
                    {isPersonIgnored ? "Unignore Person" : "Ignore Person"}
                  </button>
                </div>
              </div>

              <div className="text-left sm:text-right relative z-10 w-full sm:w-auto pt-2.5 sm:pt-0 border-t border-white/10 sm:border-none">
                <p className="text-[9px] font-black uppercase tracking-widest text-white/70 leading-none mb-1.5">
                  Net Status
                </p>
                <div className="flex items-baseline gap-1.5 sm:justify-end">
                  <p className="text-2xl sm:text-3xl font-black">
                    ₹{Math.abs(personNetBalance).toLocaleString()}
                  </p>
                  <span className="text-[9px] font-black uppercase tracking-wider bg-white/10 px-2 py-0.5 rounded-full">
                    {isPersonIgnored
                      ? "Ignored"
                      : personNetBalance > 0
                        ? "You Get"
                        : personNetBalance < 0
                          ? "You Give"
                          : "Settled"}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6 no-scrollbar">
              {isLoadingLedger ? (
                <div className="h-full flex items-center justify-center min-h-[200px]">
                  <div className="w-8 h-8 border-4 border-current border-t-transparent rounded-full animate-spin opacity-50" />
                </div>
              ) : Object.entries(recordsByDate).length === 0 ? (
                <EmptyState
                  icon={AlertCircle}
                  title="No transaction history"
                  hint="Use buttons below to log your first transaction."
                />
              ) : (
                Object.entries(recordsByDate).map(([date, dateRecords]) => (
                  <div key={date} className="space-y-3">
                    <div className="flex items-center gap-4">
                      <div
                        className="h-px flex-1"
                        style={{ background: "var(--border)" }}
                      />
                      <span
                        className="text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border shadow-sm"
                        style={{
                          color: "var(--muted-foreground)",
                          background: "var(--secondary)",
                          borderColor: "var(--border)",
                        }}
                      >
                        {date}
                      </span>
                      <div
                        className="h-px flex-1"
                        style={{ background: "var(--border)" }}
                      />
                    </div>
                    <div className="space-y-2.5">
                      {dateRecords.map((r) => {
                        const isLent = r.type === "debit";
                        const bal = r.balance ?? 0;
                        const isBalReceivable = bal < 0;
                        const isBalPayable = bal > 0;

                        return (
                          <div
                            key={r.hisab_id}
                            className="card-surface p-3.5 group border"
                            style={{ borderColor: "var(--border)" }}
                          >
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex items-center gap-3 min-w-0">
                                <div
                                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border"
                                  style={{
                                    background: isLent
                                      ? "var(--success-soft)"
                                      : "var(--danger-soft)",
                                    color: isLent
                                      ? "var(--success)"
                                      : "var(--danger)",
                                    borderColor: "transparent",
                                  }}
                                >
                                  {isLent ? (
                                    <ArrowUpRight className="h-5 w-5" />
                                  ) : (
                                    <ArrowDownLeft className="h-5 w-5" />
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <p
                                    className="font-bold text-sm leading-tight mb-0.5"
                                    style={{ color: "var(--foreground)" }}
                                  >
                                    {r.description ||
                                      (isLent
                                        ? "Lent Money"
                                        : "Borrowed Money")}
                                  </p>
                                  <p
                                    className="text-[9px] font-semibold flex items-center gap-1 uppercase tracking-tight"
                                    style={{ color: "var(--muted-foreground)" }}
                                  >
                                    <Calendar className="h-2.5 w-2.5" />
                                    {new Date(r.date).toLocaleDateString([], {
                                      month: "short",
                                      day: "numeric",
                                    })}{" "}
                                    at{" "}
                                    {new Date(
                                      r.created_at || r.date,
                                    ).toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-3 shrink-0">
                                <div className="text-right">
                                  <p
                                    className="font-black text-base"
                                    style={{
                                      color: isLent
                                        ? "var(--success)"
                                        : "var(--danger)",
                                    }}
                                  >
                                    ₹{r.amount.toLocaleString()}
                                  </p>
                                  <span
                                    className="inline-block text-[8px] font-black uppercase tracking-wider"
                                    style={{
                                      color: isLent
                                        ? "var(--success)"
                                        : "var(--danger)",
                                    }}
                                  >
                                    {isLent ? "Lent" : "Borrowed"}
                                  </span>
                                </div>

                                <div className="flex gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity flex-shrink-0">
                                  <button
                                    onClick={() => {
                                      setFormData({
                                        name: r.name,
                                        mobile: r.mobile || "",
                                        type: r.type,
                                        amount: r.amount.toString(),
                                        description: r.description || "",
                                        date: new Date(r.date)
                                          .toISOString()
                                          .split("T")[0],
                                        logAsExpense:
                                          r.log_as_expense !== undefined
                                            ? !!r.log_as_expense
                                            : true,
                                      });
                                      setEditId(r.hisab_id);
                                      setShowLedgerModal(false);
                                      setShowAddDialog(true);
                                    }}
                                    className="p-2.5 sm:p-2 rounded-xl transition-all focus:outline-none flex items-center justify-center hover:bg-black/5"
                                    style={{ color: "var(--muted-foreground)" }}
                                  >
                                    <MoreVertical className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
                                  </button>
                                  <button
                                    onClick={() => setDeleteConfirm(r.hisab_id)}
                                    className="p-2.5 sm:p-2 rounded-xl transition-all focus:outline-none flex items-center justify-center hover:bg-black/5"
                                    style={{ color: "var(--danger)" }}
                                    title="Delete transaction"
                                  >
                                    <Trash2 className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Running Balance and sync status */}
                            <div
                              className="mt-2.5 pt-2 flex justify-between items-center text-[10px]"
                              style={{ borderTop: "1px solid var(--border)" }}
                            >
                              <p
                                className="font-bold"
                                style={{ color: "var(--muted-foreground)" }}
                              >
                                Net Balance:{" "}
                                {isBalReceivable && (
                                  <span
                                    className="font-extrabold"
                                    style={{ color: "var(--success)" }}
                                  >
                                    Gets ₹{Math.abs(bal).toLocaleString()}
                                  </span>
                                )}
                                {isBalPayable && (
                                  <span
                                    className="font-extrabold"
                                    style={{ color: "var(--danger)" }}
                                  >
                                    Gives ₹{Math.abs(bal).toLocaleString()}
                                  </span>
                                )}
                                {bal === 0 && (
                                  <span className="font-black">Settled</span>
                                )}
                              </p>
                              {r.log_as_expense && (
                                <span
                                  className="text-[9px] font-black px-1.5 py-0.5 rounded border"
                                  style={{
                                    color: "var(--violet)",
                                    background: "var(--violet-soft)",
                                    borderColor: "transparent",
                                  }}
                                >
                                  Synced with expenses
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Quick Add buttons inside Ledger Modal */}
            <div
              className="p-4 sm:p-6 card-surface border-t shrink-0 flex flex-col sm:flex-row gap-3 sm:gap-4 z-20 m-0 rounded-none border-x-0 border-b-0"
              style={{ borderColor: "var(--border)" }}
            >
              <Button
                onClick={() => {
                  setFormData({
                    name: selectedPerson?.name || "",
                    mobile: selectedPerson?.mobile || "",
                    type: "debit",
                    amount: "",
                    description: "",
                    date: new Date().toISOString().split("T")[0],
                    logAsExpense: true,
                  });
                  setEditId(null);
                  setShowLedgerModal(false);
                  setShowAddDialog(true);
                }}
                className="flex-1 h-12 sm:h-14 rounded-xl sm:rounded-2xl font-black text-xs sm:text-sm uppercase shadow-xl transition-all active:scale-95 text-white flex items-center justify-center gap-1.5"
                style={{ background: "var(--success)" }}
              >
                <ArrowUpRight className="h-4 w-4 sm:h-5 sm:w-5" /> I Lent (Gave)
              </Button>
              <Button
                onClick={() => {
                  setFormData({
                    name: selectedPerson?.name || "",
                    mobile: selectedPerson?.mobile || "",
                    type: "credit",
                    amount: "",
                    description: "",
                    date: new Date().toISOString().split("T")[0],
                    logAsExpense: true,
                  });
                  setEditId(null);
                  setShowLedgerModal(false);
                  setShowAddDialog(true);
                }}
                className="flex-1 h-12 sm:h-14 rounded-xl sm:rounded-2xl font-black text-xs sm:text-sm uppercase shadow-xl transition-all active:scale-95 text-white flex items-center justify-center gap-1.5"
                style={{ background: "var(--danger)" }}
              >
                <ArrowDownLeft className="h-4 w-4 sm:h-5 sm:w-5" /> I Borrowed
                (Took)
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Add/Edit Transaction Dialog */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent className="max-w-md w-[92vw] sm:w-full rounded-[2rem] sm:rounded-[2.5rem] p-0 overflow-hidden card-surface border-none shadow-2xl">
            <div
              className="p-6 sm:p-8 relative"
              style={{
                backgroundImage: "var(--gradient-hero)",
                color: "white",
              }}
            >
              <div className="absolute top-4 right-4 opacity-10">
                <HandCoins className="h-16 w-16 sm:h-20 sm:w-20" />
              </div>
              <DialogTitle className="text-2xl sm:text-3xl font-black mb-1">
                {editId ? "Edit Entry" : "New Entry"}
              </DialogTitle>
              <p className="text-xs sm:text-sm font-medium opacity-90">
                {editId
                  ? "Modify this transaction record."
                  : "Capture a new money exchange."}
              </p>
            </div>

            <form onSubmit={handleAddRecord} className="p-6 space-y-6">
              <div className="space-y-4">
                {/* Person Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label
                      className="text-[10px] font-black tracking-widest uppercase ml-1"
                      style={{ color: "var(--muted-foreground)" }}
                    >
                      Person Name
                    </Label>
                    <Input
                      placeholder="e.g. Rahul Sharma"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="h-12 rounded-xl transition-all font-bold px-4"
                      style={{
                        background: "var(--secondary)",
                        border: "1px solid var(--border)",
                        color: "var(--foreground)",
                      }}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label
                      className="text-[10px] font-black tracking-widest uppercase ml-1"
                      style={{ color: "var(--muted-foreground)" }}
                    >
                      Mobile No.
                    </Label>
                    <Input
                      placeholder="Optional"
                      value={formData.mobile}
                      onChange={(e) =>
                        setFormData({ ...formData, mobile: e.target.value })
                      }
                      className="h-12 rounded-xl transition-all font-medium px-4"
                      style={{
                        background: "var(--secondary)",
                        border: "1px solid var(--border)",
                        color: "var(--foreground)",
                      }}
                    />
                  </div>
                </div>

                {/* Transaction Type Buttons */}
                <div className="space-y-2">
                  <Label
                    className="text-[10px] font-black tracking-widest uppercase ml-1"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    Type of Transaction
                  </Label>
                  <div className="flex gap-2 sm:gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, type: "debit" })
                      }
                      className={`flex-1 py-3 px-2 sm:px-4 rounded-xl font-bold text-[11px] sm:text-xs uppercase transition-all flex flex-col items-center justify-center gap-1 sm:gap-1.5 border-2`}
                      style={{
                        background:
                          formData.type === "debit"
                            ? "var(--success-soft)"
                            : "var(--secondary)",
                        borderColor:
                          formData.type === "debit"
                            ? "var(--success)"
                            : "transparent",
                        color:
                          formData.type === "debit"
                            ? "var(--success)"
                            : "var(--muted-foreground)",
                      }}
                    >
                      <ArrowUpRight className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
                      <span>Lent (Gave)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, type: "credit" })
                      }
                      className={`flex-1 py-3 px-2 sm:px-4 rounded-xl font-bold text-[11px] sm:text-xs uppercase transition-all flex flex-col items-center justify-center gap-1 sm:gap-1.5 border-2`}
                      style={{
                        background:
                          formData.type === "credit"
                            ? "var(--danger-soft)"
                            : "var(--secondary)",
                        borderColor:
                          formData.type === "credit"
                            ? "var(--danger)"
                            : "transparent",
                        color:
                          formData.type === "credit"
                            ? "var(--danger)"
                            : "var(--muted-foreground)",
                      }}
                    >
                      <ArrowDownLeft className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
                      <span>Borrowed (Took)</span>
                    </button>
                  </div>
                  <p className="text-[10px] text-center mt-1.5 font-semibold">
                    {formData.type === "debit" ? (
                      <span
                        className="flex items-center justify-center gap-1"
                        style={{ color: "var(--success)" }}
                      >
                        <Info className="h-3 w-3" /> They will have to return
                        this money to you.
                      </span>
                    ) : (
                      <span
                        className="flex items-center justify-center gap-1"
                        style={{ color: "var(--danger)" }}
                      >
                        <Info className="h-3 w-3" /> You will have to return
                        this money to them.
                      </span>
                    )}
                  </p>
                </div>

                {/* Amount & Date */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label
                      className="text-[10px] font-black tracking-widest uppercase ml-1"
                      style={{ color: "var(--muted-foreground)" }}
                    >
                      Amount (₹)
                    </Label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={formData.amount}
                      onChange={(e) =>
                        setFormData({ ...formData, amount: e.target.value })
                      }
                      className="h-12 rounded-xl transition-all font-black text-lg px-4 amount"
                      style={{
                        background: "var(--secondary)",
                        border: "1px solid var(--border)",
                        color: "var(--foreground)",
                      }}
                      required
                      min="0.01"
                      step="any"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label
                      className="text-[10px] font-black tracking-widest uppercase ml-1"
                      style={{ color: "var(--muted-foreground)" }}
                    >
                      Date
                    </Label>
                    <Input
                      type="date"
                      value={formData.date}
                      onChange={(e) =>
                        setFormData({ ...formData, date: e.target.value })
                      }
                      className="h-12 rounded-xl transition-all font-medium px-4"
                      style={{
                        background: "var(--secondary)",
                        border: "1px solid var(--border)",
                        color: "var(--foreground)",
                      }}
                      required
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <Label
                    className="text-[10px] font-black tracking-widest uppercase ml-1"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    Description (Optional)
                  </Label>
                  <Input
                    placeholder="Purpose of transaction..."
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="h-12 rounded-xl transition-all font-medium px-4"
                    style={{
                      background: "var(--secondary)",
                      border: "1px solid var(--border)",
                      color: "var(--foreground)",
                    }}
                  />
                </div>

                {/* Log as Daily Expense Checkbox */}
                <div className="space-y-2 pt-1">
                  <label
                    className="flex items-center gap-3 cursor-pointer p-3 rounded-xl transition-all select-none border"
                    style={{
                      background: "var(--secondary)",
                      borderColor: "var(--border)",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={formData.logAsExpense}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          logAsExpense: e.target.checked,
                        })
                      }
                      className="h-4 w-4 rounded cursor-pointer"
                    />
                    <div className="flex flex-col">
                      <span
                        className="text-xs font-bold"
                        style={{ color: "var(--foreground)" }}
                      >
                        Sync with Daily Expenses
                      </span>
                      <span
                        className="text-[10px] font-semibold leading-tight mt-0.5"
                        style={{ color: "var(--muted-foreground)" }}
                      >
                        Automatically log this cash exchange as a daily expense
                        or income.
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              <Button
                disabled={isSubmitting}
                className="w-full h-14 rounded-2xl font-black text-lg text-white transition-transform active:scale-95"
                style={{ backgroundImage: "var(--gradient-hero)" }}
              >
                {isSubmitting
                  ? editId
                    ? "Updating..."
                    : "Recording..."
                  : editId
                    ? "Update Transaction"
                    : "Record Transaction"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <ConfirmDialog
          open={!!deleteConfirm}
          onOpenChange={() => setDeleteConfirm(null)}
          onConfirm={handleDelete}
          title="Delete Record?"
          description="Are you sure you want to delete this transaction record? This will permanently undo this entry."
          confirmText="Delete Now"
          variant="destructive"
        />
      </div>
    </AppShell>
  );
}
