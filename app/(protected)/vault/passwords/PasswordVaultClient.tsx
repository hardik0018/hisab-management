"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { secureFetch } from "@/lib/api-utils";
import { generatePassword, scorePassword } from "@/lib/passwordUtils";
import type { PasswordEntryPublic, PasswordCategory } from "@/types/passwordVault";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Eye, EyeOff, Dices, Copy, Check, ArrowLeft, Plus, Search, Star, Globe, Shield, ShieldAlert, ChevronRight, KeyRound, BarChart2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const CATS: PasswordCategory[] = ["Bank", "Social", "Work", "Shopping", "Email", "Utility", "Other"];

const CAT_AVATAR: Record<string, string> = {
  Bank:     "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300",
  Social:   "bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300",
  Work:     "bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300",
  Shopping: "bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300",
  Email:    "bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300",
  Utility:  "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  Other:    "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
};

const CAT_BADGE: Record<string, string> = {
  Bank:     "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  Social:   "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",
  Work:     "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  Shopping: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  Email:    "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
  Utility:  "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  Other:    "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
};

export default function PasswordVaultClient() {
  const router = useRouter();
  const [items, setItems] = useState<PasswordEntryPublic[]>([]);
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<"list" | "audit">("list");
  const [audit, setAudit] = useState<any>(null);
  const [editing, setEditing] = useState<any | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  async function load() {
    const data = await secureFetch(`/api/vault/passwords?q=${encodeURIComponent(q)}`);
    setItems(data?.items || []);
  }
  async function loadAudit() {
    const data = await secureFetch("/api/vault/passwords/audit");
    setAudit(data);
  }

  useEffect(() => { load(); }, [q]);
  useEffect(() => { if (tab === "audit") loadAudit(); }, [tab]);

  async function copyPassword(id: string) {
    const data = await secureFetch(`/api/vault/passwords/${id}`);
    const { item } = data;
    await navigator.clipboard.writeText(item.password);
    setCopiedId(id);
    toast.success("Password copied! Clears in 20s.");
    setTimeout(() => {
      navigator.clipboard.writeText("").catch(() => {});
      setCopiedId(null);
    }, 20000);
  }

  return (
    <div className="max-w-3xl mx-auto pb-32 space-y-5">
      {/* Header with back button */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/vault")}
          className="rounded-xl h-9 w-9 shrink-0 hover:bg-muted"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <KeyRound className="h-6 w-6 text-primary" />
            Password Vault
          </h1>
          <p className="text-sm text-muted-foreground">{items.length} saved credential{items.length !== 1 ? "s" : ""}</p>
        </div>
        <Button onClick={() => setEditing({})} className="shrink-0 rounded-xl">
          <Plus className="h-4 w-4 mr-1.5" />
          New
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-muted/50 rounded-xl w-full">
        <button
          onClick={() => setTab("list")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
            tab === "list" ? "bg-background shadow text-primary" : "text-muted-foreground hover:text-foreground hover:bg-background/50"
          )}
        >
          <Shield className="h-4 w-4" />
          All Passwords
        </button>
        <button
          onClick={() => setTab("audit")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
            tab === "audit" ? "bg-background shadow text-primary" : "text-muted-foreground hover:text-foreground hover:bg-background/50"
          )}
        >
          <BarChart2 className="h-4 w-4" />
          Security Audit
        </button>
      </div>

      {/* Search */}
      {tab === "list" && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search title, username, site…"
            className="pl-9 rounded-xl"
          />
        </div>
      )}

      {/* List */}
      {tab === "list" && (
        <div className="space-y-2.5 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {items.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <KeyRound className="h-10 w-10 text-primary" />
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-base">No passwords yet</p>
                <p className="text-sm text-muted-foreground">Tap <strong>+ New</strong> to save your first credential.</p>
              </div>
            </div>
          )}
          {items.map((it) => {
            const colorPair = CAT_AVATAR[it.category] ?? CAT_AVATAR.Other;
            return (
              <div
                key={String(it._id)}
                className="flex items-center gap-3.5 p-4 bg-card border border-border rounded-2xl hover:shadow-md hover:border-primary/20 transition-all duration-200 group cursor-pointer"
                onClick={() => setEditing(it)}
              >
                {/* Avatar */}
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 text-base font-bold ${colorPair}`}>
                  {it.title.charAt(0).toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-sm leading-tight truncate">{it.title}</span>
                    {it.favorite && <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400 shrink-0" />}
                    {it.space_id && <Globe className="h-3 w-3 text-muted-foreground/60 shrink-0" aria-label="Shared" />}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{it.username}</p>
                  <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded-full mt-1.5 inline-block", CAT_BADGE[it.category] ?? CAT_BADGE.Other)}>
                    {it.category}
                  </span>
                </div>

                {/* Copy action */}
                <button
                  className="h-8 w-8 rounded-xl bg-muted/60 hover:bg-primary/10 hover:text-primary flex items-center justify-center shrink-0 transition-colors"
                  onClick={(e) => { e.stopPropagation(); copyPassword(String(it._id)); }}
                  title="Copy password"
                >
                  {copiedId === String(it._id)
                    ? <Check className="h-3.5 w-3.5 text-green-500" />
                    : <Copy className="h-3.5 w-3.5" />
                  }
                </button>
              </div>
            );
          })}
        </div>
      )}


      {/* Audit */}
      {tab === "audit" && audit && (
        <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <AuditCard
            icon={<ShieldAlert className="h-5 w-5 text-red-500" />}
            title="Weak passwords"
            subtitle="Less than 10 characters"
            rows={audit.weak}
            color="border-red-200 dark:border-red-900/40 bg-red-50/50 dark:bg-red-950/20"
          />
          <AuditCard
            icon={<Copy className="h-5 w-5 text-orange-500" />}
            title="Reused passwords"
            subtitle="Same password used in multiple entries"
            rows={audit.reused}
            color="border-orange-200 dark:border-orange-900/40 bg-orange-50/50 dark:bg-orange-950/20"
          />
          <AuditCard
            icon={<BarChart2 className="h-5 w-5 text-slate-500" />}
            title="Stale passwords"
            subtitle="Not changed in over 1 year"
            rows={audit.stale}
            color="border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30"
          />
        </div>
      )}
      {tab === "audit" && !audit && (
        <div className="py-12 flex items-center justify-center text-muted-foreground text-sm">Loading audit…</div>
      )}

      {editing && <EditorModal initial={editing} onClose={() => { setEditing(null); load(); }} />}
    </div>
  );
}

function AuditCard({ icon, title, subtitle, rows, color }: { icon: React.ReactNode; title: string; subtitle: string; rows: any[]; color: string }) {
  return (
    <div className={cn("border rounded-2xl p-4 space-y-3", color)}>
      <div className="flex items-center gap-3">
        {icon}
        <div>
          <div className="font-semibold text-sm">{title} <span className="font-normal text-muted-foreground">({rows.length})</span></div>
          <div className="text-xs text-muted-foreground">{subtitle}</div>
        </div>
      </div>
      {rows.length === 0
        ? <p className="text-sm text-green-600 dark:text-green-400 font-medium">✓ All good!</p>
        : <ul className="space-y-1.5">
            {rows.map((r) => (
              <li key={String(r._id)} className="text-sm flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-current opacity-40 shrink-0" />
                <span className="font-medium">{r.title}</span>
                <span className="text-muted-foreground truncate">— {r.username}</span>
              </li>
            ))}
          </ul>
      }
    </div>
  );
}

function EditorModal({ initial, onClose }: { initial: any; onClose: () => void }) {
  const isEdit = !!initial?._id;
  const [form, setForm] = useState<any>({
    title: "", username: "", password: "", website: "", category: "Other",
    notes: "", favorite: false, space_id: null, ...initial,
  });
  const [showPw, setShowPw] = useState(false);
  const [copied, setCopied] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const strength = useMemo(() => scorePassword(form.password || ""), [form.password]);

  const handleCopy = async () => {
    if (!form.password) return;
    await navigator.clipboard.writeText(form.password);
    setCopied(true);
    toast.success("Password copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  async function save() {
    if (!form.title?.trim() || !form.username?.trim()) {
      toast.error("Title and username are required.");
      return;
    }
    if (!isEdit && !form.password) {
      toast.error("Password is required.");
      return;
    }
    setSaving(true);
    try {
      const url = isEdit ? `/api/vault/passwords/${initial._id}` : "/api/vault/passwords";
      const method = isEdit ? "PUT" : "POST";
      const body = { ...form };
      if (isEdit && !body.password) delete body.password;
      await secureFetch(url, { method, body: JSON.stringify(body) });
      toast.success(isEdit ? "Entry updated!" : "Entry saved!");
      onClose();
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!isEdit) return;
    await secureFetch(`/api/vault/passwords/${initial._id}`, { method: "DELETE" });
    toast.success("Entry deleted.");
    onClose();
  }

  const strengthColor = { weak: "bg-red-500", fair: "bg-yellow-500", good: "bg-blue-500", strong: "bg-green-500" }[strength.label] ?? "bg-gray-300";

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm grid place-items-center p-4 z-[200]">
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md shadow-2xl border border-gray-200 dark:border-gray-800 max-h-[92vh] flex flex-col">
        {/* Modal header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 dark:border-gray-800 shrink-0">
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg shrink-0" type="button" onClick={onClose}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-lg font-semibold">{isEdit ? "Edit entry" : "New entry"}</h2>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-5 py-4">
          <form autoComplete="off" onSubmit={(e) => e.preventDefault()} className="space-y-3">
            <Input placeholder="Title (e.g. HDFC Netbanking)" autoFocus autoComplete="off"
              value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="rounded-xl" />
            <Input placeholder="Username / email" autoComplete="off"
              value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} className="rounded-xl" />

            {/* Password row */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input type={showPw ? "text" : "password"} className="w-full pr-9 rounded-xl"
                  autoComplete="new-password"
                  placeholder={isEdit ? "Leave blank to keep" : "Password"}
                  value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                {form.password && (
                  <button type="button"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                    onClick={handleCopy} title="Copy password"
                  >
                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                )}
              </div>
              <Button variant="outline" size="icon" type="button" className="rounded-xl shrink-0"
                onClick={() => setShowPw((v) => !v)} title={showPw ? "Hide" : "Show"}>
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
              <Button variant="secondary" size="icon" type="button" className="rounded-xl shrink-0"
                onClick={() => setForm({ ...form, password: generatePassword({ length: 18 }) })} title="Generate">
                <Dices className="w-4 h-4" />
              </Button>
            </div>

            {/* Strength bar */}
            {form.password && (
              <div className="space-y-1">
                <div className="h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div className={cn("h-full rounded-full transition-all duration-300", strengthColor)}
                    style={{ width: `${strength.score}%` }} />
                </div>
                <div className="text-xs text-muted-foreground font-medium">
                  Strength: <span className="capitalize font-semibold">{strength.label}</span>
                  <span className="ml-1 text-muted-foreground/70">({Math.round(strength.entropy)} bits)</span>
                </div>
              </div>
            )}

            <Input placeholder="Website (optional)" autoComplete="off"
              value={form.website || ""} onChange={(e) => setForm({ ...form, website: e.target.value })} className="rounded-xl" />

            <select
              className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-950 dark:border-slate-800 dark:bg-slate-950 dark:focus:ring-slate-300"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              {CATS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>

            <textarea
              className="flex min-h-[72px] w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 dark:border-slate-800 dark:bg-slate-950 dark:focus-visible:ring-slate-300 resize-none"
              placeholder="Notes (optional)"
              value={form.notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} />

            {/* Toggles */}
            <div className="flex items-center justify-between py-1">
              <span className="font-medium text-sm">Favorite</span>
              <button type="button" onClick={() => setForm({ ...form, favorite: !form.favorite })}
                className={cn("relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                  form.favorite ? "bg-primary" : "bg-gray-200 dark:bg-gray-700")}>
                <span className={cn("inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform",
                  form.favorite ? "translate-x-6" : "translate-x-1")} />
              </button>
            </div>

            <div className="flex items-center justify-between py-1">
              <span className="font-medium text-sm">Share with workspace</span>
              <button type="button"
                onClick={() => setForm({ ...form, space_id: !form.space_id ? ((window as any).__activeSpaceId ?? null) : null })}
                className={cn("relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                  form.space_id ? "bg-primary" : "bg-gray-200 dark:bg-gray-700")}>
                <span className={cn("inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform",
                  form.space_id ? "translate-x-6" : "translate-x-1")} />
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center px-5 py-4 border-t border-gray-100 dark:border-gray-800 shrink-0">
          {isEdit ? (
            <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" type="button" size="sm">Delete</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this entry?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete &quot;{form.title}&quot;. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={remove} className="bg-red-600 hover:bg-red-700 text-white">Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : <span />}
          <div className="flex gap-2">
            <Button variant="outline" type="button" size="sm" onClick={onClose}>Cancel</Button>
            <Button size="sm" onClick={save} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
