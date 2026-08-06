"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { secureFetch } from "@/lib/api-utils";
import { generatePassword, scorePassword } from "@/lib/passwordUtils";
import type { PasswordEntryPublic, PasswordCategory } from "@/types/passwordVault";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, Dices, Copy, Check, Plus, Search, Star, Globe, Shield, ShieldAlert, KeyRound, BarChart2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import AppShell from "@/components/AppShell";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import { ConfirmDialog } from "@/components/ConfirmDialog";

const CATS: PasswordCategory[] = ["Bank", "Social", "Work", "Shopping", "Email", "Utility", "Other"];

const CAT_COLORS: Record<string, { bg: string, color: string }> = {
  Bank:     { bg: "var(--success-soft)", color: "var(--success)" },
  Social:   { bg: "var(--sky-soft)", color: "var(--sky)" },
  Work:     { bg: "var(--violet-soft)", color: "var(--violet)" },
  Shopping: { bg: "var(--amber-soft)", color: "var(--amber)" },
  Email:    { bg: "var(--pink-soft)", color: "var(--pink)" },
  Utility:  { bg: "var(--teal-soft)", color: "var(--teal)" },
  Other:    { bg: "var(--surface-muted)", color: "var(--muted-foreground)" },
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
    <AppShell>
      <PageHeader
        title="Password Vault"
        subtitle={`${items.length} saved credential${items.length !== 1 ? "s" : ""}`}
        right={
          <Button onClick={() => setEditing({})} className="shrink-0 rounded-xl" style={{ background: 'var(--primary)', color: 'white' }}>
            <Plus className="h-4 w-4 mr-1.5" />
            New
          </Button>
        }
      />

      <div className="space-y-5">
        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl w-full" style={{ background: 'var(--surface-muted)' }}>
          <button
            onClick={() => setTab("list")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all duration-200"
            )}
            style={{
              background: tab === "list" ? 'var(--card)' : 'transparent',
              color: tab === "list" ? 'var(--primary)' : 'var(--muted-foreground)',
              boxShadow: tab === "list" ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            <Shield className="h-4 w-4" />
            All Passwords
          </button>
          <button
            onClick={() => setTab("audit")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all duration-200"
            )}
            style={{
              background: tab === "audit" ? 'var(--card)' : 'transparent',
              color: tab === "audit" ? 'var(--primary)' : 'var(--muted-foreground)',
              boxShadow: tab === "audit" ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            <BarChart2 className="h-4 w-4" />
            Security Audit
          </button>
        </div>

        {/* Search */}
        {tab === "list" && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--muted-foreground)' }} />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search title, username, site…"
              className="pl-9 rounded-xl"
              style={{ background: 'var(--card)', color: 'var(--foreground)', border: '1px solid var(--border)' }}
            />
          </div>
        )}

        {/* List */}
        {tab === "list" && (
          <div className="space-y-2.5 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {items.length === 0 && (
              <EmptyState 
                icon={KeyRound} 
                title="No passwords yet" 
                hint="Tap + New to save your first credential." 
              />
            )}
            {items.map((it) => {
              const colors = CAT_COLORS[it.category] ?? CAT_COLORS.Other;
              return (
                <div
                  key={String(it._id)}
                  className="card-surface p-4 flex gap-3 items-center group cursor-pointer active:scale-95 transition-all"
                  onClick={() => setEditing(it)}
                >
                  {/* Avatar */}
                  <div 
                    className="tile w-11 h-11 shrink-0 text-base font-bold"
                    style={{ background: colors.bg, color: colors.color }}
                  >
                    {it.title.charAt(0).toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-sm leading-tight truncate" style={{ color: 'var(--foreground)' }}>
                        {it.title}
                      </span>
                      {it.favorite && <Star className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--amber)', fill: 'var(--amber)' }} />}
                      {it.space_id && <Globe className="h-3 w-3 shrink-0" style={{ color: 'var(--muted-foreground)' }} aria-label="Shared" />}
                    </div>
                    <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--muted-foreground)' }}>{it.username}</p>
                    <span 
                      className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full mt-1.5 inline-block"
                      style={{ background: colors.bg, color: colors.color }}
                    >
                      {it.category}
                    </span>
                  </div>

                  {/* Copy action */}
                  <button
                    className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0 transition-colors"
                    style={{ background: 'var(--surface-muted)' }}
                    onClick={(e) => { e.stopPropagation(); copyPassword(String(it._id)); }}
                    title="Copy password"
                  >
                    {copiedId === String(it._id)
                      ? <Check className="h-4 w-4" style={{ color: 'var(--success)' }} />
                      : <Copy className="h-4 w-4" style={{ color: 'var(--foreground)' }} />
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
              icon={<ShieldAlert className="h-5 w-5" style={{ color: 'var(--danger)' }} />}
              title="Weak passwords"
              subtitle="Less than 10 characters"
              rows={audit.weak}
              colorVars={{ bg: 'var(--danger-soft)', border: 'var(--danger)' }}
            />
            <AuditCard
              icon={<Copy className="h-5 w-5" style={{ color: 'var(--warning)' }} />}
              title="Reused passwords"
              subtitle="Same password used in multiple entries"
              rows={audit.reused}
              colorVars={{ bg: 'var(--warning-soft)', border: 'var(--warning)' }}
            />
            <AuditCard
              icon={<BarChart2 className="h-5 w-5" style={{ color: 'var(--muted-foreground)' }} />}
              title="Stale passwords"
              subtitle="Not changed in over 1 year"
              rows={audit.stale}
              colorVars={{ bg: 'var(--surface-muted)', border: 'var(--border)' }}
            />
          </div>
        )}
        {tab === "audit" && !audit && (
          <div className="py-12 flex items-center justify-center text-sm" style={{ color: 'var(--muted-foreground)' }}>Loading audit…</div>
        )}
      </div>

      {editing && <EditorModal initial={editing} onClose={() => { setEditing(null); load(); }} />}
    </AppShell>
  );
}

function AuditCard({ icon, title, subtitle, rows, colorVars }: { icon: React.ReactNode; title: string; subtitle: string; rows: any[]; colorVars: { bg: string, border: string } }) {
  return (
    <div className="border rounded-2xl p-4 space-y-3" style={{ background: colorVars.bg, borderColor: colorVars.border }}>
      <div className="flex items-center gap-3">
        {icon}
        <div>
          <div className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>
            {title} <span className="font-normal" style={{ color: 'var(--muted-foreground)' }}>({rows.length})</span>
          </div>
          <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{subtitle}</div>
        </div>
      </div>
      {rows.length === 0
        ? <p className="text-sm font-medium" style={{ color: 'var(--success)' }}>✓ All good!</p>
        : <ul className="space-y-1.5">
            {rows.map((r) => (
              <li key={String(r._id)} className="text-sm flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-current opacity-40 shrink-0" style={{ color: 'var(--foreground)' }} />
                <span className="font-medium" style={{ color: 'var(--foreground)' }}>{r.title}</span>
                <span className="truncate" style={{ color: 'var(--muted-foreground)' }}>— {r.username}</span>
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

  const strengthColorMap: Record<string, string> = { 
    weak: "var(--danger)", 
    fair: "var(--warning)", 
    good: "var(--sky)", 
    strong: "var(--success)" 
  };
  const strengthColor = strengthColorMap[strength.label] ?? "var(--muted-foreground)";

  return (
    <div className="fixed inset-0 grid place-items-center p-4 z-[200]" style={{ background: 'oklch(0.19 0.03 268 / 0.5)', backdropFilter: 'blur(4px)' }}>
      <div className="card-surface rounded-2xl w-full max-w-md max-h-[92vh] flex flex-col border" style={{ borderColor: 'var(--border)' }}>
        {/* Modal header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b shrink-0" style={{ borderColor: 'var(--border)' }}>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg shrink-0" type="button" onClick={onClose}>
            <ArrowLeft className="h-4 w-4" style={{ color: 'var(--foreground)' }} />
          </Button>
          <h2 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>{isEdit ? "Edit entry" : "New entry"}</h2>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-5 py-4">
          <form autoComplete="off" onSubmit={(e) => e.preventDefault()} className="space-y-3">
            <Input placeholder="Title (e.g. HDFC Netbanking)" autoFocus autoComplete="off"
              value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} 
              className="rounded-xl" style={{ background: 'var(--secondary)', color: 'var(--foreground)', border: '1px solid var(--border)' }} />
            <Input placeholder="Username / email" autoComplete="off"
              value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} 
              className="rounded-xl" style={{ background: 'var(--secondary)', color: 'var(--foreground)', border: '1px solid var(--border)' }} />

            {/* Password row */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input type={showPw ? "text" : "password"} className="w-full pr-9 rounded-xl"
                  autoComplete="new-password"
                  placeholder={isEdit ? "Leave blank to keep" : "Password"}
                  value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} 
                  style={{ background: 'var(--secondary)', color: 'var(--foreground)', border: '1px solid var(--border)' }} />
                {form.password && (
                  <button type="button"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 transition-colors"
                    style={{ color: 'var(--muted-foreground)' }}
                    onClick={handleCopy} title="Copy password"
                  >
                    {copied ? <Check className="w-4 h-4" style={{ color: 'var(--success)' }} /> : <Copy className="w-4 h-4" />}
                  </button>
                )}
              </div>
              <Button variant="outline" size="icon" type="button" className="rounded-xl shrink-0 h-10 w-10"
                style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)' }}
                onClick={() => setShowPw((v) => !v)} title={showPw ? "Hide" : "Show"}>
                {showPw ? <EyeOff className="w-4 h-4" style={{ color: 'var(--foreground)' }} /> : <Eye className="w-4 h-4" style={{ color: 'var(--foreground)' }} />}
              </Button>
              <Button variant="secondary" size="icon" type="button" className="rounded-xl shrink-0 h-10 w-10"
                style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)' }}
                onClick={() => setForm({ ...form, password: generatePassword({ length: 18 }) })} title="Generate">
                <Dices className="w-4 h-4" style={{ color: 'var(--foreground)' }} />
              </Button>
            </div>

            {/* Strength bar */}
            {form.password && (
              <div className="space-y-1">
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--surface-muted)' }}>
                  <div className="h-full rounded-full transition-all duration-300"
                    style={{ width: `${strength.score}%`, background: strengthColor }} />
                </div>
                <div className="text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>
                  Strength: <span className="capitalize font-semibold">{strength.label}</span>
                  <span className="ml-1 opacity-70">({Math.round(strength.entropy)} bits)</span>
                </div>
              </div>
            )}

            <Input placeholder="Website (optional)" autoComplete="off"
              value={form.website || ""} onChange={(e) => setForm({ ...form, website: e.target.value })} 
              className="rounded-xl" style={{ background: 'var(--secondary)', color: 'var(--foreground)', border: '1px solid var(--border)' }} />

            <select
              className="flex h-10 w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              style={{ background: 'var(--secondary)', color: 'var(--foreground)', borderColor: 'var(--border)' }}
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              {CATS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>

            <textarea
              className="flex min-h-[72px] w-full rounded-xl border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary resize-none"
              style={{ background: 'var(--secondary)', color: 'var(--foreground)', borderColor: 'var(--border)' }}
              placeholder="Notes (optional)"
              value={form.notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} />

            {/* Toggles */}
            <div className="flex items-center justify-between py-1">
              <span className="font-medium text-sm" style={{ color: 'var(--foreground)' }}>Favorite</span>
              <button type="button" onClick={() => setForm({ ...form, favorite: !form.favorite })}
                className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2"
                style={{ background: form.favorite ? 'var(--primary)' : 'var(--surface-muted)' }}>
                <span className={cn("inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform",
                  form.favorite ? "translate-x-6" : "translate-x-1")} />
              </button>
            </div>

            <div className="flex items-center justify-between py-1">
              <span className="font-medium text-sm" style={{ color: 'var(--foreground)' }}>Share with workspace</span>
              <button type="button"
                onClick={() => setForm({ ...form, space_id: !form.space_id ? ((window as any).__activeSpaceId ?? null) : null })}
                className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2"
                style={{ background: form.space_id ? 'var(--primary)' : 'var(--surface-muted)' }}>
                <span className={cn("inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform",
                  form.space_id ? "translate-x-6" : "translate-x-1")} />
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center px-5 py-4 border-t shrink-0" style={{ borderColor: 'var(--border)' }}>
          {isEdit ? (
            <>
              <Button variant="destructive" type="button" size="sm" onClick={() => setDeleteOpen(true)}
                style={{ background: 'var(--danger)', color: 'white' }}>Delete</Button>
              <ConfirmDialog
                open={deleteOpen}
                onOpenChange={setDeleteOpen}
                title="Delete this entry?"
                description={`This will permanently delete "${form.title}". This action cannot be undone.`}
                onConfirm={remove}
                confirmText="Delete"
                variant="destructive"
              />
            </>
          ) : <span />}
          <div className="flex gap-2">
            <Button variant="outline" type="button" size="sm" onClick={onClose}
              style={{ background: 'var(--surface-muted)', color: 'var(--foreground)', border: 'none' }}>Cancel</Button>
            <Button size="sm" onClick={save} disabled={saving}
              style={{ backgroundImage: 'var(--gradient-hero)', color: 'white', border: 'none' }}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
