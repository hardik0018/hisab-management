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
import { Shield, Package, Bell, Plus, Trash2, Pencil, ExternalLink, AlertTriangle, Loader2, Key, ChevronRight, Lock, ShieldCheck } from 'lucide-react';
import { FileOrUrlInput } from '@/components/ui/file-or-url-input';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import type { InsurancePolicy, Warranty, VaultReminder } from '@/types/vault';

import PageHeader from '@/components/PageHeader';
import AppShell from '@/components/AppShell';
import SectionTitle from '@/components/SectionTitle';
import EmptyState from '@/components/EmptyState';
import Link from 'next/link';

type Tab = 'insurance' | 'warranty';

export default function VaultClient() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('insurance');
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
    <AppShell>
      <PageHeader title="Vault" subtitle="Insurance · Warranty · Passwords" />

      <div className="grid grid-cols-3 gap-3 mb-8 mt-2">
        <button onClick={() => setTab('insurance')} className={cn("card-surface p-4 flex flex-col items-center gap-2 active:scale-95 transition-all border-2", tab === 'insurance' ? 'border-[var(--primary)]' : 'border-transparent')}>
          <div className="tile w-10 h-10" style={{ background: 'var(--sky-soft)', color: 'var(--sky)' }}>
            <ShieldCheck className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold" style={{ color: 'var(--foreground)' }}>Insurance</span>
          <span className="text-lg font-extrabold amount" style={{ color: 'var(--primary)' }}>{policies.length}</span>
        </button>
        
        <button onClick={() => setTab('warranty')} className={cn("card-surface p-4 flex flex-col items-center gap-2 active:scale-95 transition-all border-2", tab === 'warranty' ? 'border-[var(--primary)]' : 'border-transparent')}>
          <div className="tile w-10 h-10" style={{ background: 'var(--teal-soft)', color: 'var(--teal)' }}>
            <Package className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold" style={{ color: 'var(--foreground)' }}>Warranty</span>
          <span className="text-lg font-extrabold amount" style={{ color: 'var(--primary)' }}>{warranties.length}</span>
        </button>
        
        <button onClick={() => router.push('/vault/passwords')} className="card-surface p-4 flex flex-col items-center gap-2 active:scale-95 transition-all border-2 border-transparent">
          <div className="tile w-10 h-10" style={{ background: 'var(--pink-soft)', color: 'var(--pink)' }}>
            <Lock className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold" style={{ color: 'var(--foreground)' }}>Passwords</span>
          <span className="text-lg font-extrabold amount" style={{ color: 'var(--primary)' }}>Secure</span>
        </button>
      </div>

      {reminders.filter(r => r.daysLeft <= 30).length > 0 && (
        <div className="mb-8">
          <SectionTitle>Expiring Soon</SectionTitle>
          <div className="flex overflow-x-auto gap-3 no-scrollbar pb-4 snap-x mt-3">
            {reminders.filter(r => r.daysLeft <= 30).map(r => (
              <div key={`${r.kind}-${r.id}`} className="card-surface p-4 min-w-[240px] shrink-0 snap-start flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div className="tile w-10 h-10" style={{ background: r.daysLeft <= 0 ? 'var(--danger-soft)' : 'var(--warning-soft)', color: r.daysLeft <= 0 ? 'var(--danger)' : 'var(--warning-foreground)' }}>
                    {r.kind === 'insurance' ? <Shield className="w-5 h-5" /> : <Package className="w-5 h-5" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-sm truncate" style={{ color: 'var(--foreground)' }}>{r.title}</div>
                    <div className="text-xs truncate" style={{ color: 'var(--muted-foreground)' }}>{r.subtitle}</div>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-dashed" style={{ borderColor: 'var(--border)' }}>
                  <span className="text-xs px-2 py-1 rounded-full font-bold" style={{ background: r.daysLeft <= 0 ? 'var(--danger-soft)' : 'var(--warning-soft)', color: r.daysLeft <= 0 ? 'var(--danger)' : 'var(--warning-foreground)' }}>
                    {r.daysLeft < 0 ? `Overdue by ${-r.daysLeft}d` : r.daysLeft === 0 ? 'Due today' : `Due in ${r.daysLeft}d`}
                  </span>
                  {r.amount ? (
                    <span className="font-extrabold amount text-sm" style={{ color: 'var(--foreground)' }}>₹{r.amount.toLocaleString('en-IN')}</span>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading && (
        <div className="py-20 flex flex-col items-center justify-center space-y-3" style={{ color: 'var(--muted-foreground)' }}>
          <Loader2 className="h-6 w-6 animate-spin" />
          <p className="text-sm">Loading your vault...</p>
        </div>
      )}

      {!loading && tab === 'insurance' && (
        <div className="space-y-4 animate-in fade-in duration-500">
          <div className="flex items-center justify-between mb-4">
            <SectionTitle>Insurance Policies</SectionTitle>
            <Button onClick={() => setInsDialog({ open: true })} variant="outline" size="sm" className="h-8 rounded-full border-dashed" style={{ borderColor: 'var(--primary)', color: 'var(--primary)' }}>
              <Plus className="w-4 h-4 mr-1" /> Add Policy
            </Button>
          </div>
          
          {policies.length === 0 ? (
            <div className="py-6">
               <EmptyState icon={ShieldCheck} title="No policies yet" hint="Add LIC, health, vehicle, term — everything in one place." color="--sky" />
            </div>
          ) : (
            <div className="space-y-4">
              {policies.map(p => (
                <div key={p._id as string} className="card-surface p-4">
                  <div className="flex justify-between items-start mb-4">
                    <div className="min-w-0 pr-3">
                      <div className="font-bold text-base truncate" style={{ color: 'var(--foreground)' }}>{p.policyName}</div>
                      <div className="text-xs mt-1 truncate font-medium" style={{ color: 'var(--muted-foreground)' }}>{p.provider} • #{p.policyNumber}</div>
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
                  
                  <div className="rounded-xl p-3 grid grid-cols-2 gap-y-3 text-sm" style={{ background: 'var(--surface-muted)' }}>
                    <Meta label="Premium" value={`₹${p.premiumAmount.toLocaleString('en-IN')}`} sub={`/${p.premiumFrequency.replace('_', ' ')}`} />
                    <Meta label="Next Due" value={<DueDateBadge date={p.nextDueDate} />} />
                    {p.sumAssured ? <Meta label="Sum Assured" value={`₹${p.sumAssured.toLocaleString('en-IN')}`} /> : null}
                    {p.nominee ? <Meta label="Nominee" value={p.nominee} /> : null}
                  </div>

                  {p.attachmentUrl && (
                    <Link className="mt-4 flex items-center justify-center gap-2 text-xs font-bold py-2.5 rounded-xl transition-all active:scale-95" style={{ background: 'var(--sky-soft)', color: 'var(--sky)' }} href={p.attachmentUrl} target="_blank" rel="noreferrer">
                      <ExternalLink className="h-4 w-4" /> View Document
                    </Link>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!loading && tab === 'warranty' && (
        <div className="space-y-4 animate-in fade-in duration-500">
          <div className="flex items-center justify-between mb-4">
            <SectionTitle>Warranties</SectionTitle>
            <Button onClick={() => setWarDialog({ open: true })} variant="outline" size="sm" className="h-8 rounded-full border-dashed" style={{ borderColor: 'var(--primary)', color: 'var(--primary)' }}>
              <Plus className="w-4 h-4 mr-1" /> Add Warranty
            </Button>
          </div>
          
          {warranties.length === 0 ? (
            <div className="py-6">
              <EmptyState icon={Package} title="No warranties yet" hint="Never lose a bill for washing machine, TV, or phone repairs again." color="--teal" />
            </div>
          ) : (
            <div className="space-y-4">
              {warranties.map(w => (
                <div key={w._id as string} className="card-surface p-4">
                  <div className="flex justify-between items-start mb-4">
                    <div className="min-w-0 pr-3">
                      <div className="font-bold text-base truncate" style={{ color: 'var(--foreground)' }}>{w.itemName}</div>
                      <div className="text-xs mt-1 truncate font-medium" style={{ color: 'var(--muted-foreground)' }}>{[w.brand, w.modelNumber].filter(Boolean).join(' • ') || w.category}</div>
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

                  <div className="rounded-xl p-3 grid grid-cols-2 gap-y-3 text-sm" style={{ background: 'var(--surface-muted)' }}>
                    <Meta label="Purchased" value={formatDateFriendly(w.purchaseDate)} />
                    <Meta label="Expires On" value={<DueDateBadge date={w.expiryDate} />} />
                    <Meta label="Term" value={`${w.warrantyMonths} months`} />
                    {w.vendor ? <Meta label="Vendor" value={w.vendor} /> : null}
                  </div>
                  
                  {(w.invoiceUrl || w.warrantyCardUrl) && (
                    <div className="mt-4 flex gap-3">
                      {w.invoiceUrl && (
                        <Link className="flex-1 flex items-center justify-center gap-2 text-xs font-bold py-2.5 rounded-xl transition-all active:scale-95" style={{ background: 'var(--teal-soft)', color: 'var(--teal)' }} href={w.invoiceUrl} target="_blank" rel="noreferrer">
                          <ExternalLink className="h-4 w-4" /> Invoice
                        </Link>
                      )}
                      {w.warrantyCardUrl && (
                        <Link className="flex-1 flex items-center justify-center gap-2 text-xs font-bold py-2.5 rounded-xl transition-all active:scale-95" style={{ background: 'var(--teal-soft)', color: 'var(--teal)' }} href={w.warrantyCardUrl} target="_blank" rel="noreferrer">
                          <ExternalLink className="h-4 w-4" /> Card
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <InsuranceDialog state={insDialog} onClose={() => setInsDialog({ open: false })} onSaved={loadAll} />
      <WarrantyDialog  state={warDialog} onClose={() => setWarDialog({ open: false })} onSaved={loadAll} />

      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => !open && setDeleteDialog(prev => ({ ...prev, open: false }))}>
        <AlertDialogContent className="w-[calc(100%-2rem)] sm:w-full rounded-2xl" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
          <AlertDialogHeader>
            <AlertDialogTitle style={{ color: 'var(--foreground)' }}>Delete Confirmation</AlertDialogTitle>
            <AlertDialogDescription style={{ color: 'var(--muted-foreground)' }}>{deleteDialog.title}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteDialog.isDeleting} style={{ color: 'var(--foreground)', borderColor: 'var(--border)' }}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault();
                deleteDialog.onConfirm();
              }} 
              disabled={deleteDialog.isDeleting}
              style={{ background: 'var(--danger)', color: '#fff' }}
              className="min-w-[80px]"
            >
              {deleteDialog.isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
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

function DueDateBadge({ date }: { date: string }) {
  const days = daysBetween(date);
  if (days <= 30) {
    return (
      <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: 'var(--danger-soft)', color: 'var(--danger)' }}>
        {formatDateFriendly(date)}
      </span>
    );
  }
  if (days <= 90) {
    return (
      <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: 'var(--warning-soft)', color: 'var(--warning-foreground)' }}>
        {formatDateFriendly(date)}
      </span>
    );
  }
  return <span style={{ color: 'var(--foreground)' }} className="font-bold">{formatDateFriendly(date)}</span>;
}

function Meta({ label, value, sub }: { label: string; value: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <div className="text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>{label}</div>
      <div className="font-bold text-sm capitalize" style={{ color: 'var(--foreground)' }}>
        {value} {sub && <span className="text-xs font-medium lowercase" style={{ color: 'var(--muted-foreground)' }}>{sub}</span>}
      </div>
    </div>
  );
}

function RowActions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="flex gap-1 shrink-0 -mt-1 -mr-1">
      <button onClick={onEdit} className="p-2 rounded-lg transition-all hover:bg-black/5 active:scale-95" style={{ color: 'var(--muted-foreground)' }}><Pencil className="h-4 w-4" /></button>
      <button onClick={onDelete} className="p-2 rounded-lg transition-all active:scale-95" style={{ color: 'var(--danger)', background: 'var(--danger-soft)' }}><Trash2 className="h-4 w-4" /></button>
    </div>
  );
}

/* ---------- Forms / Dialogs ---------- */

function Field({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5 flex flex-col">
      <Label className="text-sm font-bold" style={{ color: error ? 'var(--danger)' : 'var(--foreground)' }}>
        {label} {required && <span style={{ color: 'var(--danger)' }}>*</span>}
      </Label>
      {children}
      {error && <span className="text-[11px] font-bold mt-0.5 animate-in slide-in-from-top-1" style={{ color: 'var(--danger)' }}>{error}</span>}
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
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={state.open} onOpenChange={onClose}>
      <DialogContent className="w-[calc(100%-2rem)] sm:w-full max-w-xl p-0 overflow-hidden flex flex-col max-h-[85vh] rounded-2xl" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
        <DialogHeader className="px-5 py-4 sm:px-6 sm:py-5 border-b shrink-0" style={{ borderColor: 'var(--border)' }}>
          <DialogTitle className="text-xl font-extrabold" style={{ color: 'var(--foreground)' }}>{editing ? 'Edit Insurance Policy' : 'Add Insurance Policy'}</DialogTitle>
          <DialogDescription style={{ color: 'var(--muted-foreground)' }}>Track your policy details and upcoming premium renewals.</DialogDescription>
        </DialogHeader>
        
        <div className="px-5 py-4 sm:px-6 sm:py-5 overflow-y-auto space-y-4 sm:space-y-5">
          <Field label="Policy Name" required error={errors.policyName}>
            <Input value={f.policyName || ''} onChange={e => { setF({ ...f, policyName: e.target.value }); setErrors(prev => ({...prev, policyName: ''})); }} placeholder="e.g. LIC Jeevan Anand" style={{ borderColor: errors.policyName ? 'var(--danger)' : 'var(--border)', background: 'var(--background)', color: 'var(--foreground)' }} />
          </Field>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label="Provider" required error={errors.provider}>
              <Input value={f.provider || ''} onChange={e => { setF({ ...f, provider: e.target.value }); setErrors(prev => ({...prev, provider: ''})); }} placeholder="e.g. LIC of India" style={{ borderColor: errors.provider ? 'var(--danger)' : 'var(--border)', background: 'var(--background)', color: 'var(--foreground)' }} />
            </Field>
            <Field label="Category">
              <Select value={f.category} onValueChange={(v: any) => setF({ ...f, category: v })}>
                <SelectTrigger style={{ borderColor: 'var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}><SelectValue /></SelectTrigger>
                <SelectContent className="z-[150]" style={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--foreground)' }}>
                  {['life','health','vehicle','home','travel','term','other'].map(c => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label="Policy Number" required error={errors.policyNumber}>
              <Input value={f.policyNumber || ''} onChange={e => { setF({ ...f, policyNumber: e.target.value }); setErrors(prev => ({...prev, policyNumber: ''})); }} style={{ borderColor: errors.policyNumber ? 'var(--danger)' : 'var(--border)', background: 'var(--background)', color: 'var(--foreground)' }} />
            </Field>
            <Field label="Holder Name" required error={errors.holderName}>
              <Input value={f.holderName || ''} onChange={e => { setF({ ...f, holderName: e.target.value }); setErrors(prev => ({...prev, holderName: ''})); }} placeholder="Name of insured person" style={{ borderColor: errors.holderName ? 'var(--danger)' : 'var(--border)', background: 'var(--background)', color: 'var(--foreground)' }} />
            </Field>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label="Premium Amount (₹)" required error={errors.premiumAmount}>
              <Input type="number" min="0" step="any" value={f.premiumAmount ?? ''} onChange={e => { setF({ ...f, premiumAmount: Number(e.target.value) }); setErrors(prev => ({...prev, premiumAmount: ''})); }} style={{ borderColor: errors.premiumAmount ? 'var(--danger)' : 'var(--border)', background: 'var(--background)', color: 'var(--foreground)' }} />
            </Field>
            <Field label="Premium Frequency">
              <Select value={f.premiumFrequency} onValueChange={(v: any) => setF({ ...f, premiumFrequency: v })}>
                <SelectTrigger style={{ borderColor: 'var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}><SelectValue /></SelectTrigger>
                <SelectContent className="z-[150]" style={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--foreground)' }}>
                  {['monthly','quarterly','half_yearly','yearly','one_time'].map(c => <SelectItem key={c} value={c} className="capitalize">{c.replace('_',' ')}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label="Start Date" required error={errors.startDate}>
              <Input type="date" value={f.startDate || ''} onChange={e => { setF({ ...f, startDate: e.target.value }); setErrors(prev => ({...prev, startDate: ''})); }} style={{ borderColor: errors.startDate ? 'var(--danger)' : 'var(--border)', background: 'var(--background)', color: 'var(--foreground)' }} />
            </Field>
            <Field label="Next Due Date" required error={errors.nextDueDate}>
              <Input type="date" value={f.nextDueDate || ''} onChange={e => { setF({ ...f, nextDueDate: e.target.value }); setErrors(prev => ({...prev, nextDueDate: ''})); }} style={{ borderColor: errors.nextDueDate ? 'var(--danger)' : 'var(--border)', background: 'var(--background)', color: 'var(--foreground)' }} />
            </Field>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label="Sum Assured (Optional)">
              <Input type="number" min="0" value={f.sumAssured ?? ''} onChange={e => setF({ ...f, sumAssured: Number(e.target.value) })} style={{ borderColor: 'var(--border)', background: 'var(--background)', color: 'var(--foreground)' }} />
            </Field>
            <Field label="Nominee (Optional)">
              <Input value={f.nominee || ''} onChange={e => setF({ ...f, nominee: e.target.value })} style={{ borderColor: 'var(--border)', background: 'var(--background)', color: 'var(--foreground)' }} />
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
            <Input value={f.notes || ''} onChange={e => setF({ ...f, notes: e.target.value })} style={{ borderColor: 'var(--border)', background: 'var(--background)', color: 'var(--foreground)' }} />
          </Field>
        </div>

        <DialogFooter className="px-5 py-4 sm:px-6 border-t shrink-0 grid grid-cols-2 sm:flex sm:justify-end gap-3" style={{ borderColor: 'var(--border)', background: 'var(--surface-muted)' }}>
          <Button variant="outline" onClick={onClose} disabled={loading} style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}>Cancel</Button>
          <Button onClick={handleSave} disabled={loading} className="min-w-[100px]" style={{ background: 'var(--primary)', color: '#fff' }}>
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
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={state.open} onOpenChange={onClose}>
      <DialogContent className="w-[calc(100%-2rem)] sm:w-full max-w-xl p-0 overflow-hidden flex flex-col max-h-[85vh] rounded-2xl" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
        <DialogHeader className="px-5 py-4 sm:px-6 sm:py-5 border-b shrink-0" style={{ borderColor: 'var(--border)' }}>
          <DialogTitle className="text-xl font-extrabold" style={{ color: 'var(--foreground)' }}>{editing ? 'Edit Warranty' : 'Add Warranty'}</DialogTitle>
          <DialogDescription style={{ color: 'var(--muted-foreground)' }}>Track purchases and automatically calculate warranty expiry.</DialogDescription>
        </DialogHeader>
        
        <div className="px-5 py-4 sm:px-6 sm:py-5 overflow-y-auto space-y-4 sm:space-y-5">
          <Field label="Item Name" required error={errors.itemName}>
            <Input value={f.itemName || ''} onChange={e => { setF({ ...f, itemName: e.target.value }); setErrors(prev => ({...prev, itemName: ''})); }} placeholder="e.g. LG Refrigerator 260L" style={{ borderColor: errors.itemName ? 'var(--danger)' : 'var(--border)', background: 'var(--background)', color: 'var(--foreground)' }} />
          </Field>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label="Brand">
              <Input value={f.brand || ''} onChange={e => setF({ ...f, brand: e.target.value })} placeholder="e.g. LG" style={{ borderColor: 'var(--border)', background: 'var(--background)', color: 'var(--foreground)' }} />
            </Field>
            <Field label="Category">
              <Select value={f.category} onValueChange={(v: any) => setF({ ...f, category: v })}>
                <SelectTrigger style={{ borderColor: 'var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}><SelectValue /></SelectTrigger>
                <SelectContent className="z-[150]" style={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--foreground)' }}>
                  {['appliance','electronics','mobile','furniture','vehicle','other'].map(c => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label="Model No.">
              <Input value={f.modelNumber || ''} onChange={e => setF({ ...f, modelNumber: e.target.value })} style={{ borderColor: 'var(--border)', background: 'var(--background)', color: 'var(--foreground)' }} />
            </Field>
            <Field label="Serial No.">
              <Input value={f.serialNumber || ''} onChange={e => setF({ ...f, serialNumber: e.target.value })} style={{ borderColor: 'var(--border)', background: 'var(--background)', color: 'var(--foreground)' }} />
            </Field>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label="Vendor">
              <Input value={f.vendor || ''} onChange={e => setF({ ...f, vendor: e.target.value })} placeholder="e.g. Reliance Digital" style={{ borderColor: 'var(--border)', background: 'var(--background)', color: 'var(--foreground)' }} />
            </Field>
            <Field label="Purchase Amount (₹)">
              <Input type="number" min="0" value={f.purchaseAmount ?? ''} onChange={e => setF({ ...f, purchaseAmount: Number(e.target.value) })} style={{ borderColor: 'var(--border)', background: 'var(--background)', color: 'var(--foreground)' }} />
            </Field>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label="Purchase Date" required error={errors.purchaseDate}>
              <Input type="date" value={f.purchaseDate || ''} onChange={e => { setF({ ...f, purchaseDate: e.target.value, expiryDate: undefined }); setErrors(prev => ({...prev, purchaseDate: ''})); }} style={{ borderColor: errors.purchaseDate ? 'var(--danger)' : 'var(--border)', background: 'var(--background)', color: 'var(--foreground)' }} />
            </Field>
            <Field label="Warranty (Months)" required error={errors.warrantyMonths}>
              <Input type="number" min="1" value={f.warrantyMonths ?? ''} onChange={e => { setF({ ...f, warrantyMonths: Number(e.target.value), expiryDate: undefined }); setErrors(prev => ({...prev, warrantyMonths: ''})); }} style={{ borderColor: errors.warrantyMonths ? 'var(--danger)' : 'var(--border)', background: 'var(--background)', color: 'var(--foreground)' }} />
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
            <Input value={f.notes || ''} onChange={e => setF({ ...f, notes: e.target.value })} style={{ borderColor: 'var(--border)', background: 'var(--background)', color: 'var(--foreground)' }} />
          </Field>
        </div>

        <DialogFooter className="px-5 py-4 sm:px-6 border-t shrink-0 grid grid-cols-2 sm:flex sm:justify-end gap-3" style={{ borderColor: 'var(--border)', background: 'var(--surface-muted)' }}>
          <Button variant="outline" onClick={onClose} disabled={loading} style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}>Cancel</Button>
          <Button onClick={handleSave} disabled={loading} className="min-w-[100px]" style={{ background: 'var(--primary)', color: '#fff' }}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : editing ? 'Update' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
