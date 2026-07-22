'use client';

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { secureFetch } from '@/lib/api-utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield, Package, Bell, Plus, Trash2, Pencil, ExternalLink, AlertTriangle, Loader2, Key, ChevronRight, Lock } from 'lucide-react';
import { FileOrUrlInput } from '@/components/ui/file-or-url-input';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import type { InsurancePolicy, Warranty, VaultReminder } from '@/types/vault';

type Tab = 'reminders' | 'insurance' | 'warranty';

export default function VaultClient() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('reminders');
  const [policies, setPolicies] = useState<InsurancePolicy[]>([]);
  const [warranties, setWarranties] = useState<Warranty[]>([]);
  const [reminders, setReminders] = useState<VaultReminder[]>([]);
  const [loading, setLoading] = useState(true);

  const [insDialog, setInsDialog] = useState<{ open: boolean; edit?: InsurancePolicy }>({ open: false });
  const [warDialog, setWarDialog] = useState<{ open: boolean; edit?: Warranty }>({ open: false });
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; title: string; isDeleting?: boolean; onConfirm: () => Promise<void> }>({ open: false, title: '', onConfirm: async () => {} });

  const loadAll = async () => {
    setLoading(true);
    try {
      const [ins, war, rem] = await Promise.all([
        secureFetch<{ items: InsurancePolicy[] }>('/api/insurance'),
        secureFetch<{ items: Warranty[] }>('/api/warranty'),
        secureFetch<{ reminders: VaultReminder[] }>('/api/vault/reminders'),
      ]);
      setPolicies(ins?.items || []);
      setWarranties(war?.items || []);
      setReminders(rem?.reminders || []);
    } catch (e) {
      console.error(e);
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { loadAll(); }, []);

  const upcomingCount = useMemo(() => reminders.filter(r => r.daysLeft <= 30).length, [reminders]);

  return (
    <div className="max-w-4xl mx-auto pb-32 px-4 pt-6 space-y-6">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Vault</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your insurance policies, warranties, and important renewals.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setInsDialog({ open: true })} variant="outline" className="shrink-0">
            <Plus className="h-4 w-4 mr-2" />
            Insurance
          </Button>
          <Button onClick={() => setWarDialog({ open: true })} variant="default" className="shrink-0">
            <Plus className="h-4 w-4 mr-2" />
            Warranty
          </Button>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-muted/50 rounded-xl w-full">
        <TabBtn active={tab === 'reminders'} onClick={() => setTab('reminders')} icon={<Bell className="h-4 w-4" />} label="Alerts" badge={upcomingCount} />
        <TabBtn active={tab === 'insurance'} onClick={() => setTab('insurance')} icon={<Shield className="h-4 w-4" />} label="Insurance" badge={policies.length} />
        <TabBtn active={tab === 'warranty'} onClick={() => setTab('warranty')} icon={<Package className="h-4 w-4" />} label="Warranties" badge={warranties.length} />
      </div>

      {/* Password Manager entry card */}
      <button
        onClick={() => router.push('/vault/passwords')}
        className="w-full flex items-center gap-4 p-4 rounded-2xl border border-border bg-card hover:shadow-md hover:border-primary/30 transition-all duration-200 group text-left"
      >
        <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
          <Lock className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm">Password Manager</div>
          <div className="text-xs text-muted-foreground mt-0.5">Securely store and auto-fill your passwords</div>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 group-hover:text-primary transition-colors" />
      </button>

      {loading && (
        <div className="py-20 flex flex-col items-center justify-center text-muted-foreground space-y-3">
          <Loader2 className="h-6 w-6 animate-spin" />
          <p className="text-sm">Loading your vault...</p>
        </div>
      )}

      {/* Reminders */}
      {!loading && tab === 'reminders' && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
          {reminders.length === 0 && (
            <EmptyState icon={<Bell className="h-10 w-10" />} title="Nothing due soon" desc="Policies & warranties due in the next 60 days will appear here." />
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reminders.map(r => <ReminderCard key={`${r.kind}-${r.id}`} r={r} />)}
          </div>
        </div>
      )}

      {/* Insurance */}
      {!loading && tab === 'insurance' && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
          {policies.length === 0 && (
            <EmptyState icon={<Shield className="h-10 w-10" />} title="No policies yet" desc="Add LIC, health, vehicle, term — everything in one place." action={() => setInsDialog({ open: true })} actionLabel="Add Insurance" />
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {policies.map(p => (
              <Card key={p._id as string} className="p-5 flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow">
                <div>
                  <div className="flex justify-between items-start gap-3">
                    <div className="min-w-0">
                      <div className="font-semibold text-base truncate">{p.policyName}</div>
                      <div className="text-sm text-muted-foreground truncate">{p.provider} • #{p.policyNumber}</div>
                    </div>
                    <RowActions
                      onEdit={() => setInsDialog({ open: true, edit: p })}
                      onDelete={() => setDeleteDialog({
                        open: true,
                        isDeleting: false,
                        title: `Are you sure you want to delete "${p.policyName}"?`,
                        onConfirm: async () => {
                          setDeleteDialog(prev => ({ ...prev, isDeleting: true }));
                          try {
                            await secureFetch(`/api/insurance/${p._id}`, { method: 'DELETE' });
                            toast.success('Policy deleted'); 
                            await loadAll();
                            setDeleteDialog(prev => ({ ...prev, open: false }));
                          } catch (e) {
                            setDeleteDialog(prev => ({ ...prev, isDeleting: false }));
                          }
                        }
                      })}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-y-4 gap-x-2 mt-5 text-sm">
                    <Meta label="Category" value={p.category} />
                    <Meta label="Holder" value={p.holderName} />
                    <Meta label="Premium" value={`₹${p.premiumAmount.toLocaleString('en-IN')}`} sub={`/${p.premiumFrequency.replace('_', ' ')}`} />
                    <Meta label="Next Due" value={formatDateFriendly(p.nextDueDate)} highlight={daysBetween(p.nextDueDate) <= 15} />
                    {p.sumAssured ? <Meta label="Sum Assured" value={`₹${p.sumAssured.toLocaleString('en-IN')}`} /> : null}
                    {p.nominee ? <Meta label="Nominee" value={p.nominee} /> : null}
                  </div>
                </div>

                {p.attachmentUrl && (
                  <div className="pt-2 border-t border-border/50">
                    <a className="text-sm text-primary hover:underline inline-flex items-center gap-1.5 font-medium" href={p.attachmentUrl} target="_blank" rel="noreferrer">
                      <ExternalLink className="h-4 w-4" /> Open Document
                    </a>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Warranty */}
      {!loading && tab === 'warranty' && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
          {warranties.length === 0 && (
            <EmptyState icon={<Package className="h-10 w-10" />} title="No warranties yet" desc="Never lose a bill for washing machine, TV, or phone repairs again." action={() => setWarDialog({ open: true })} actionLabel="Add Warranty" />
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {warranties.map(w => (
              <Card key={w._id as string} className="p-5 flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow">
                <div>
                  <div className="flex justify-between items-start gap-3">
                    <div className="min-w-0">
                      <div className="font-semibold text-base truncate">{w.itemName}</div>
                      <div className="text-sm text-muted-foreground truncate">{[w.brand, w.modelNumber].filter(Boolean).join(' • ') || w.category}</div>
                    </div>
                    <RowActions
                      onEdit={() => setWarDialog({ open: true, edit: w })}
                      onDelete={() => setDeleteDialog({
                        open: true,
                        isDeleting: false,
                        title: `Are you sure you want to delete "${w.itemName}"?`,
                        onConfirm: async () => {
                          setDeleteDialog(prev => ({ ...prev, isDeleting: true }));
                          try {
                            await secureFetch(`/api/warranty/${w._id}`, { method: 'DELETE' });
                            toast.success('Warranty deleted'); 
                            await loadAll();
                            setDeleteDialog(prev => ({ ...prev, open: false }));
                          } catch (e) {
                            setDeleteDialog(prev => ({ ...prev, isDeleting: false }));
                          }
                        }
                      })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-y-4 gap-x-2 mt-5 text-sm">
                    <Meta label="Purchased On" value={formatDateFriendly(w.purchaseDate)} />
                    <Meta label="Warranty Term" value={`${w.warrantyMonths} months`} />
                    <Meta label="Expires On" value={formatDateFriendly(w.expiryDate)} highlight={daysBetween(w.expiryDate) <= 30} />
                    {w.vendor ? <Meta label="Vendor" value={w.vendor} /> : null}
                    {w.purchaseAmount ? <Meta label="Amount" value={`₹${w.purchaseAmount.toLocaleString('en-IN')}`} /> : null}
                  </div>
                </div>
                
                {(w.invoiceUrl || w.warrantyCardUrl) && (
                  <div className="pt-3 flex gap-4 border-t border-border/50">
                    {w.invoiceUrl && <a className="text-sm text-primary hover:underline inline-flex items-center gap-1.5 font-medium" href={w.invoiceUrl} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4" /> Invoice</a>}
                    {w.warrantyCardUrl && <a className="text-sm text-primary hover:underline inline-flex items-center gap-1.5 font-medium" href={w.warrantyCardUrl} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4" /> Card</a>}
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}

      <InsuranceDialog state={insDialog} onClose={() => setInsDialog({ open: false })} onSaved={loadAll} />
      <WarrantyDialog  state={warDialog} onClose={() => setWarDialog({ open: false })} onSaved={loadAll} />

      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => !open && setDeleteDialog(prev => ({ ...prev, open: false }))}>
        <AlertDialogContent className="w-[calc(100%-2rem)] sm:w-full rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Confirmation</AlertDialogTitle>
            <AlertDialogDescription>{deleteDialog.title}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteDialog.isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault();
                deleteDialog.onConfirm();
              }} 
              disabled={deleteDialog.isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 min-w-[80px]"
            >
              {deleteDialog.isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/* ---------- UI Helpers ---------- */

function daysBetween(iso: string) {
  const t = new Date(); t.setHours(0,0,0,0);
  return Math.round((new Date(iso).getTime() - t.getTime()) / 86400000);
}

function formatDateFriendly(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
}

const todayStr = () => new Date().toISOString().slice(0, 10);

function TabBtn({ active, onClick, icon, label, badge }: any) {
  return (
    <button onClick={onClick}
      className={cn(
        "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
        active ? 'bg-background shadow text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
      )}>
      {icon}
      <span>{label}</span>
      {badge ? <span className="text-[10px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full min-w-5">{badge}</span> : null}
    </button>
  );
}

function Meta({ label, value, sub, highlight }: { label: string; value: React.ReactNode; sub?: React.ReactNode; highlight?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5">
      <div className="text-xs text-muted-foreground font-medium">{label}</div>
      <div className={cn("font-medium capitalize", highlight ? "text-destructive" : "text-foreground")}>
        {value} {sub && <span className="text-xs font-normal text-muted-foreground lowercase">{sub}</span>}
      </div>
    </div>
  );
}

function RowActions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="flex gap-1 shrink-0 -mt-1 -mr-1">
      <Button size="icon" variant="ghost" onClick={onEdit} className="h-8 w-8 text-muted-foreground hover:text-primary"><Pencil className="h-4 w-4" /></Button>
      <Button size="icon" variant="ghost" onClick={onDelete} className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></Button>
    </div>
  );
}

function EmptyState({ icon, title, desc, action, actionLabel }: any) {
  return (
    <Card className="p-10 flex flex-col items-center text-center space-y-4 border-dashed bg-muted/20">
      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
        {icon}
      </div>
      <div className="space-y-1 max-w-sm">
        <h3 className="font-semibold text-lg">{title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
      </div>
      {action && (
        <Button onClick={action} className="mt-2">
          <Plus className="h-4 w-4 mr-2" />
          {actionLabel}
        </Button>
      )}
    </Card>
  );
}

function ReminderCard({ r }: { r: VaultReminder }) {
  const overdue = r.daysLeft < 0;
  const urgent = r.daysLeft <= 7 && !overdue;
  const colorClass = overdue ? 'border-destructive/30 bg-destructive/5' : urgent ? 'border-orange-500/30 bg-orange-500/5' : 'border-border bg-card';
  const iconColorClass = overdue ? 'bg-destructive/10 text-destructive' : urgent ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400' : 'bg-primary/10 text-primary';
  const textClass = overdue ? 'text-destructive' : urgent ? 'text-orange-600 dark:text-orange-400' : 'text-muted-foreground';

  return (
    <Card className={cn("p-4 transition-all hover:shadow-md", colorClass)}>
      <div className="flex items-start gap-4">
        <div className={cn("p-2.5 rounded-xl shrink-0 mt-0.5", iconColorClass)}>
          {r.kind === 'insurance' ? <Shield className="h-5 w-5" /> : <Package className="h-5 w-5" />}
        </div>
        <div className="flex-1 min-w-0 space-y-1">
          <div className="font-semibold text-base truncate">{r.title}</div>
          <div className="text-sm text-muted-foreground truncate">{r.subtitle}</div>
          
          <div className="flex items-center flex-wrap gap-x-3 gap-y-1 pt-1 text-sm">
            <div className={cn("flex items-center gap-1.5 font-medium", textClass)}>
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>
                {overdue ? `Overdue by ${-r.daysLeft} days` : r.daysLeft === 0 ? 'Due today' : `Due in ${r.daysLeft} days`}
              </span>
            </div>
            <span className="text-muted-foreground text-xs font-medium bg-background/50 px-2 py-0.5 rounded-md border">
              {formatDateFriendly(r.dueDate)}
            </span>
          </div>
        </div>
        {r.amount ? (
          <div className="font-bold text-base shrink-0 pt-1">
            ₹{r.amount.toLocaleString('en-IN')}
          </div>
        ) : null}
      </div>
    </Card>
  );
}

/* ---------- Forms / Dialogs ---------- */

function Field({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5 flex flex-col">
      <Label className={cn("text-sm font-medium", error ? "text-destructive" : "")}>
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
      {error && <span className="text-[11px] font-medium text-destructive mt-0.5 animate-in slide-in-from-top-1">{error}</span>}
    </div>
  );
}

function InsuranceDialog({ state, onClose, onSaved }: { state: { open: boolean; edit?: InsurancePolicy }; onClose: () => void; onSaved: () => void }) {
  const editing = state.edit;
  const [f, setF] = useState<Partial<InsurancePolicy>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (state.open) {
      setF(editing || { category: 'life', premiumFrequency: 'yearly', startDate: todayStr(), nextDueDate: todayStr() });
      setErrors({});
    }
  }, [state.open, editing]);

  const validate = () => {
    const err: Record<string, string> = {};
    if (!f.policyName?.trim()) err.policyName = "Policy name is required";
    if (!f.provider?.trim()) err.provider = "Provider is required";
    if (!f.policyNumber?.trim()) err.policyNumber = "Policy number is required";
    if (!f.holderName?.trim()) err.holderName = "Holder name is required";
    if (f.premiumAmount == null || f.premiumAmount < 0 || isNaN(Number(f.premiumAmount))) err.premiumAmount = "Valid premium amount is required";
    if (!f.startDate) err.startDate = "Start date is required";
    if (!f.nextDueDate) err.nextDueDate = "Next due date is required";
    
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    
    setLoading(true);
    try {
      if (editing?._id) {
        await secureFetch(`/api/insurance/${editing._id}`, { method: 'PUT', body: JSON.stringify(f) });
      } else {
        await secureFetch('/api/insurance', { method: 'POST', body: JSON.stringify(f) });
      }
      toast.success(editing ? 'Insurance updated' : 'Insurance added');
      onSaved(); 
      onClose();
    } catch (e) {
      // secureFetch handles the toast
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={state.open} onOpenChange={onClose}>
      <DialogContent className="w-[calc(100%-2rem)] sm:w-full max-w-xl p-0 overflow-hidden flex flex-col max-h-[85vh] rounded-2xl">
        <DialogHeader className="px-5 py-4 sm:px-6 sm:py-5 border-b shrink-0">
          <DialogTitle className="text-xl">{editing ? 'Edit Insurance Policy' : 'Add Insurance Policy'}</DialogTitle>
          <DialogDescription>Track your policy details and upcoming premium renewals.</DialogDescription>
        </DialogHeader>
        
        <div className="px-5 py-4 sm:px-6 sm:py-5 overflow-y-auto space-y-4 sm:space-y-5">
          <Field label="Policy Name" required error={errors.policyName}>
            <Input value={f.policyName || ''} onChange={e => { setF({ ...f, policyName: e.target.value }); setErrors(prev => ({...prev, policyName: ''})); }} placeholder="e.g. LIC Jeevan Anand" className={cn(errors.policyName && "border-destructive focus-visible:ring-destructive")} />
          </Field>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label="Provider" required error={errors.provider}>
              <Input value={f.provider || ''} onChange={e => { setF({ ...f, provider: e.target.value }); setErrors(prev => ({...prev, provider: ''})); }} placeholder="e.g. LIC of India" className={cn(errors.provider && "border-destructive focus-visible:ring-destructive")} />
            </Field>
            <Field label="Category">
              <Select value={f.category} onValueChange={(v: any) => setF({ ...f, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent className="z-[150]">
                  {['life','health','vehicle','home','travel','term','other'].map(c => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label="Policy Number" required error={errors.policyNumber}>
              <Input value={f.policyNumber || ''} onChange={e => { setF({ ...f, policyNumber: e.target.value }); setErrors(prev => ({...prev, policyNumber: ''})); }} className={cn(errors.policyNumber && "border-destructive focus-visible:ring-destructive")} />
            </Field>
            <Field label="Holder Name" required error={errors.holderName}>
              <Input value={f.holderName || ''} onChange={e => { setF({ ...f, holderName: e.target.value }); setErrors(prev => ({...prev, holderName: ''})); }} placeholder="Name of insured person" className={cn(errors.holderName && "border-destructive focus-visible:ring-destructive")} />
            </Field>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label="Premium Amount (₹)" required error={errors.premiumAmount}>
              <Input type="number" min="0" step="any" value={f.premiumAmount ?? ''} onChange={e => { setF({ ...f, premiumAmount: Number(e.target.value) }); setErrors(prev => ({...prev, premiumAmount: ''})); }} className={cn(errors.premiumAmount && "border-destructive focus-visible:ring-destructive")} />
            </Field>
            <Field label="Premium Frequency">
              <Select value={f.premiumFrequency} onValueChange={(v: any) => setF({ ...f, premiumFrequency: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent className="z-[150]">
                  {['monthly','quarterly','half_yearly','yearly','one_time'].map(c => <SelectItem key={c} value={c} className="capitalize">{c.replace('_',' ')}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label="Start Date" required error={errors.startDate}>
              <Input type="date" value={f.startDate || ''} onChange={e => { setF({ ...f, startDate: e.target.value }); setErrors(prev => ({...prev, startDate: ''})); }} className={cn(errors.startDate && "border-destructive focus-visible:ring-destructive")} />
            </Field>
            <Field label="Next Due Date" required error={errors.nextDueDate}>
              <Input type="date" value={f.nextDueDate || ''} onChange={e => { setF({ ...f, nextDueDate: e.target.value }); setErrors(prev => ({...prev, nextDueDate: ''})); }} className={cn(errors.nextDueDate && "border-destructive focus-visible:ring-destructive")} />
            </Field>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label="Sum Assured (Optional)">
              <Input type="number" min="0" value={f.sumAssured ?? ''} onChange={e => setF({ ...f, sumAssured: Number(e.target.value) })} />
            </Field>
            <Field label="Nominee (Optional)">
              <Input value={f.nominee || ''} onChange={e => setF({ ...f, nominee: e.target.value })} />
            </Field>
          </div>

          <Field label="Document Link (Optional)">
            <FileOrUrlInput
              value={f.attachmentUrl || ''}
              onChange={(url) => setF({ ...f, attachmentUrl: url })}
              disabled={loading}
              placeholder="e.g. Google Drive or Dropbox URL"
            />
          </Field>
          <Field label="Notes (Optional)">
            <Input value={f.notes || ''} onChange={e => setF({ ...f, notes: e.target.value })} />
          </Field>
        </div>

        <DialogFooter className="px-5 py-4 sm:px-6 border-t bg-muted/30 shrink-0 grid grid-cols-2 sm:flex sm:justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button onClick={handleSave} disabled={loading} className="min-w-[100px]">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : editing ? 'Update' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function WarrantyDialog({ state, onClose, onSaved }: { state: { open: boolean; edit?: Warranty }; onClose: () => void; onSaved: () => void }) {
  const editing = state.edit;
  const [f, setF] = useState<Partial<Warranty>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (state.open) {
      setF(editing || { category: 'appliance', purchaseDate: todayStr(), warrantyMonths: 12 });
      setErrors({});
    }
  }, [state.open, editing]);

  const validate = () => {
    const err: Record<string, string> = {};
    if (!f.itemName?.trim()) err.itemName = "Item name is required";
    if (!f.purchaseDate) err.purchaseDate = "Purchase date is required";
    if (f.warrantyMonths == null || f.warrantyMonths < 1 || isNaN(Number(f.warrantyMonths))) err.warrantyMonths = "Valid warranty duration is required";
    
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      if (editing?._id) {
        await secureFetch(`/api/warranty/${editing._id}`, { method: 'PUT', body: JSON.stringify(f) });
      } else {
        await secureFetch('/api/warranty', { method: 'POST', body: JSON.stringify(f) });
      }
      toast.success(editing ? 'Warranty updated' : 'Warranty added');
      onSaved(); 
      onClose();
    } catch (e) {
      // secureFetch handles the toast
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={state.open} onOpenChange={onClose}>
      <DialogContent className="w-[calc(100%-2rem)] sm:w-full max-w-xl p-0 overflow-hidden flex flex-col max-h-[85vh] rounded-2xl">
        <DialogHeader className="px-5 py-4 sm:px-6 sm:py-5 border-b shrink-0">
          <DialogTitle className="text-xl">{editing ? 'Edit Warranty' : 'Add Warranty'}</DialogTitle>
          <DialogDescription>Track purchases and automatically calculate warranty expiry.</DialogDescription>
        </DialogHeader>
        
        <div className="px-5 py-4 sm:px-6 sm:py-5 overflow-y-auto space-y-4 sm:space-y-5">
          <Field label="Item Name" required error={errors.itemName}>
            <Input value={f.itemName || ''} onChange={e => { setF({ ...f, itemName: e.target.value }); setErrors(prev => ({...prev, itemName: ''})); }} placeholder="e.g. LG Refrigerator 260L" className={cn(errors.itemName && "border-destructive focus-visible:ring-destructive")} />
          </Field>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label="Brand">
              <Input value={f.brand || ''} onChange={e => setF({ ...f, brand: e.target.value })} placeholder="e.g. LG" />
            </Field>
            <Field label="Category">
              <Select value={f.category} onValueChange={(v: any) => setF({ ...f, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent className="z-[150]">
                  {['appliance','electronics','mobile','furniture','vehicle','other'].map(c => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label="Model No.">
              <Input value={f.modelNumber || ''} onChange={e => setF({ ...f, modelNumber: e.target.value })} />
            </Field>
            <Field label="Serial No.">
              <Input value={f.serialNumber || ''} onChange={e => setF({ ...f, serialNumber: e.target.value })} />
            </Field>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label="Vendor">
              <Input value={f.vendor || ''} onChange={e => setF({ ...f, vendor: e.target.value })} placeholder="e.g. Reliance Digital" />
            </Field>
            <Field label="Purchase Amount (₹)">
              <Input type="number" min="0" value={f.purchaseAmount ?? ''} onChange={e => setF({ ...f, purchaseAmount: Number(e.target.value) })} />
            </Field>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label="Purchase Date" required error={errors.purchaseDate}>
              <Input type="date" value={f.purchaseDate || ''} onChange={e => { setF({ ...f, purchaseDate: e.target.value, expiryDate: undefined }); setErrors(prev => ({...prev, purchaseDate: ''})); }} className={cn(errors.purchaseDate && "border-destructive focus-visible:ring-destructive")} />
            </Field>
            <Field label="Warranty (Months)" required error={errors.warrantyMonths}>
              <Input type="number" min="1" value={f.warrantyMonths ?? ''} onChange={e => { setF({ ...f, warrantyMonths: Number(e.target.value), expiryDate: undefined }); setErrors(prev => ({...prev, warrantyMonths: ''})); }} className={cn(errors.warrantyMonths && "border-destructive focus-visible:ring-destructive")} />
            </Field>
          </div>

          <Field label="Invoice Link (Optional)">
            <FileOrUrlInput
              value={f.invoiceUrl || ''}
              onChange={(url) => setF({ ...f, invoiceUrl: url })}
              disabled={loading}
              placeholder="e.g. Google Drive URL"
            />
          </Field>
          <Field label="Warranty Card Link (Optional)">
            <FileOrUrlInput
              value={f.warrantyCardUrl || ''}
              onChange={(url) => setF({ ...f, warrantyCardUrl: url })}
              disabled={loading}
              placeholder="e.g. Google Drive URL"
            />
          </Field>
          <Field label="Notes (Optional)">
            <Input value={f.notes || ''} onChange={e => setF({ ...f, notes: e.target.value })} />
          </Field>
        </div>

        <DialogFooter className="px-5 py-4 sm:px-6 border-t bg-muted/30 shrink-0 grid grid-cols-2 sm:flex sm:justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button onClick={handleSave} disabled={loading} className="min-w-[100px]">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : editing ? 'Update' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
