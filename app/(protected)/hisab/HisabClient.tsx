'use client'

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  LucideIcon
} from 'lucide-react';
import PageWrapper from '@/components/PageWrapper';
import { secureFetch } from '@/lib/api-utils';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { HisabRecord, TransactionType } from '@/types';

interface HisabClientProps {
  initialRecords: HisabRecord[];
}

interface FormData {
  name: string;
  mobile: string;
  type: TransactionType;
  amount: string;
  description: string;
  date: string;
}

interface PersonSummary {
  name: string;
  mobile: string;
  debit: number;
  credit: number;
  latest: string | Date;
}

export default function HisabClient({ initialRecords }: HisabClientProps) {
  const [records, setRecords] = useState<HisabRecord[]>(initialRecords);
  const [search, setSearch] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);

  const [selectedPerson, setSelectedPerson] = useState<{ name: string; mobile: string } | null>(null);
  const [showLedgerModal, setShowLedgerModal] = useState(false);
  const [expandedPerson, setExpandedPerson] = useState<string | null>(null);

  const [debouncedSearch, setDebouncedSearch] = useState(search);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  const [formData, setFormData] = useState<FormData>({
    name: '',
    mobile: '',
    type: 'debit',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
  });

  const fetchRecords = async () => {
    try {
      const data = await secureFetch<{ records: HisabRecord[] }>('/api/hisab');
      setRecords(data.records || []);
    } catch (err) {} 
  };

  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editId) {
        const response = await secureFetch<{ record: HisabRecord }>(`/api/hisab/${editId}`, {
          method: 'PUT',
          body: JSON.stringify({ ...formData, amount: parseFloat(formData.amount) }),
        });
        setRecords(records.map(r => r.hisab_id === editId ? response.record : r));
        toast.success('Updated successfully');
      } else {
        const response = await secureFetch<{ record: HisabRecord }>('/api/hisab', {
          method: 'POST',
          body: JSON.stringify({ ...formData, amount: parseFloat(formData.amount) }),
        });
        setRecords([response.record, ...records]);
        toast.success('Recorded successfully');
      }
      setFormData({ 
        name: '', 
        mobile: '', 
        type: 'debit', 
        amount: '', 
        description: '', 
        date: new Date().toISOString().split('T')[0] 
      });
      setEditId(null);
      setShowAddDialog(false);
    } catch (err) {} 
    finally { setIsSubmitting(false); }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await secureFetch(`/api/hisab/${deleteConfirm}`, { method: 'DELETE' });
      toast.success('Deleted successfully');
      fetchRecords();
    } catch (err) {} 
    finally { setDeleteConfirm(null); }
  };

  const filteredRecords = records.filter(r => {
    const matchesSearch = r.name.toLowerCase().includes(search.toLowerCase()) || 
                          (r.mobile && String(r.mobile).includes(search));
    const matchesPerson = selectedPerson ? (r.name === selectedPerson.name && r.mobile === selectedPerson.mobile) : true;
    return matchesSearch && matchesPerson;
  });

  const personRecords = records
    .filter(r => selectedPerson && r.name === selectedPerson.name && r.mobile === selectedPerson.mobile)
    .sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      if (dateA !== dateB) return dateA - dateB;
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });

  let bal = 0;
  const recordsWithBalance = personRecords.map(r => {
    if (r.type === 'credit') bal += r.amount;
    else bal -= r.amount;
    return { ...r, balance: bal };
  }).reverse();

  const recordsByDate = recordsWithBalance.reduce((acc: Record<string, typeof recordsWithBalance>, r) => {
    const date = new Date(r.date).toLocaleDateString();
    if (!acc[date]) acc[date] = [];
    acc[date].push(r);
    return acc;
  }, {});

  const totalDebit = filteredRecords.filter(r => r.type === 'debit').reduce((sum, r) => sum + r.amount, 0);
  const totalCredit = filteredRecords.filter(r => r.type === 'credit').reduce((sum, r) => sum + r.amount, 0);
  const netBalance = totalCredit - totalDebit;

  const peopleGroups = records
    .reduce((acc: Record<string, PersonSummary>, r) => {
      const key = `${r.name}_${r.mobile || ''}`;
      if (!acc[key]) acc[key] = { name: r.name, mobile: r.mobile, debit: 0, credit: 0, latest: r.date };
      acc[key][r.type] += r.amount;
      return acc;
    }, {});

  const displayedPeople = Object.values(peopleGroups).filter(p => 
    p.name.toLowerCase().includes(debouncedSearch.toLowerCase()) || 
    (p.mobile && String(p.mobile).includes(debouncedSearch))
  );

  return (
    <PageWrapper>
      <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-5xl mx-auto pb-32">
        <div className="space-y-6">
           <div className="flex justify-between items-end">
             <div className="space-y-1">
                <h1 className="text-4xl font-black text-slate-900 tracking-tight">Hisab</h1>
                <p className="text-slate-500 font-medium">Manage your personal debit-credit.</p>
             </div>
              <Button 
                onClick={() => {
                   setFormData({ 
                     name: selectedPerson?.name || '', 
                     mobile: selectedPerson?.mobile || '',
                     type: 'debit',
                     amount: '',
                     description: '',
                     date: new Date().toISOString().split('T')[0]
                   });
                   setEditId(null);
                   setShowAddDialog(true);
                }} 
                className="rounded-2xl h-12 px-6 shadow-xl shadow-indigo-200 bg-indigo-600 hover:bg-indigo-700 font-bold"
              >
                 <Plus className="mr-2 h-5 w-5" /> Log Transaction
              </Button>
           </div>

           <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6">
              <SummaryCard label="I Gave" value={Object.values(peopleGroups).reduce((s, p) => s + p.debit, 0)} color="red" icon={ArrowUpRight} />
              <SummaryCard label="I Took" value={Object.values(peopleGroups).reduce((s, p) => s + p.credit, 0)} color="green" icon={ArrowDownLeft} />
              <div className="col-span-2 md:col-span-1">
                 <SummaryCard 
                    label="Wallet Balance" 
                    value={Object.values(peopleGroups).reduce((s, p) => s + (p.credit - p.debit), 0)} 
                    color={Object.values(peopleGroups).reduce((s, p) => s + (p.credit - p.debit), 0) >= 0 ? 'green' : 'red'} 
                    icon={HandCoins} 
                 />
              </div>
           </div>
        </div>

        <div className="space-y-6 flex-1 h-full overflow-hidden flex flex-col min-h-0">
               <div className="relative group shrink-0">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                  <Input
                    placeholder="Search by name or mobile..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-12 h-14 rounded-2xl border-2 border-slate-100 bg-white shadow-sm focus-visible:ring-4 focus-visible:ring-indigo-50 focus-visible:border-indigo-600 transition-all font-medium"
                  />
               </div>

               <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-4 shrink-0">People Involved</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto pb-8 px-1 scrollbar-hide">
                  {displayedPeople.length === 0 ? (
                     <div className="col-span-full text-center py-20 bg-white/50 rounded-[3rem] border border-dashed border-slate-200">
                        <Users className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-400 font-medium italic">No people found</p>
                     </div>
                  ) : (
                     displayedPeople.map((p, idx) => (
                        <Card
                        key={idx}
                        onClick={() => {
                           if (expandedPerson === p.name) {
                               setExpandedPerson(null);
                           } else {
                               setExpandedPerson(p.name);
                           }
                        }}
                        className={`border-none shadow-sm hover:shadow-xl rounded-[2rem] overflow-hidden transition-all cursor-pointer bg-white group border-2 ${expandedPerson === p.name ? 'border-indigo-100 ring-2 ring-indigo-50' : 'border-transparent hover:border-indigo-100'}`}
                       >
                          <CardContent className="p-5 flex items-center justify-between">
                             <div className="flex items-center gap-4">
                                <div className="w-12 h-12 font-bold rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-100 group-hover:scale-110 transition-transform">
                                     {p.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                   <p className="font-black text-slate-900 text-lg leading-tight mb-0.5">{p.name}</p>
                                   <p className="text-[11px] text-slate-400 font-bold flex items-center gap-1.5 uppercase tracking-tight">
                                      {p.mobile ? <Phone className="h-3 w-3 text-slate-300" /> : null}
                                      {p.mobile || 'No mobile linked'}
                                   </p>
                                </div>
                             </div>
                             <div className="text-right">
                                <p className={`font-black text-base sm:text-xl leading-none mb-1 ${p.credit - p.debit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                   ₹{Math.abs(p.credit - p.debit).toLocaleString()}
                                </p>
                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-300 whitespace-nowrap">
                                   {p.credit - p.debit >= 0 ? 'To Return' : 'Give Him'}
                                </p>
                             </div>
                           </CardContent>
                           
                           {expandedPerson === p.name && (
                               <div className="border-t border-slate-100 p-5 bg-slate-50/50 space-y-3">
                                   {(p.credit - p.debit) !== 0 && (
                                     <Button 
                                       className="w-full h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black shadow-lg shadow-indigo-100 transition-all"
                                       onClick={(e) => {
                                         e.stopPropagation();
                                         const net = p.credit - p.debit;
                                         setFormData({
                                           name: p.name,
                                           mobile: p.mobile || '',
                                           type: net > 0 ? 'debit' : 'credit',
                                           amount: Math.abs(net).toString(),
                                           description: 'Settle Balance',
                                           date: new Date().toISOString().split('T')[0]
                                         });
                                         setEditId(null);
                                         setShowAddDialog(true);
                                       }}
                                     >
                                       <HandCoins className="mr-2 h-5 w-5" /> Settle Balance of ₹{Math.abs(p.credit - p.debit).toLocaleString()}
                                     </Button>
                                   )}
                                   <div className="flex gap-2">
                                     <Button 
                                        variant="outline" 
                                        className="flex-1 h-12 rounded-xl border-slate-200 font-bold bg-white text-slate-600 hover:bg-slate-50"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedPerson({ name: p.name, mobile: p.mobile });
                                            setShowLedgerModal(true);
                                        }}
                                     >
                                        View Full Ledger
                                     </Button>
                                   </div>
                               </div>
                           )}
                        </Card>
                     ))
                  )}
                  </div>
               </div>
        </div>

        <Dialog open={showLedgerModal} onOpenChange={setShowLedgerModal}>
            <DialogContent className="max-w-2xl h-[85vh] flex flex-col p-0 overflow-hidden bg-slate-50 border-none shadow-2xl rounded-[2.5rem]">
               <div className="bg-indigo-600 p-8 text-white flex justify-between items-center shrink-0 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10" />
                  <div className="flex items-center gap-4 relative z-10">
                     <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-sm shadow-xl">
                        <ArrowLeft className="h-7 w-7 cursor-pointer" onClick={() => setShowLedgerModal(false)} />
                     </div>
                     <div>
                        <DialogTitle className="text-2xl font-black leading-none mb-1 text-white">{selectedPerson?.name}</DialogTitle>
                        <p className="text-indigo-100 text-[10px] font-black uppercase tracking-widest flex items-center gap-1 opacity-80">
                           <Phone className="h-3 w-3" /> {selectedPerson?.mobile || 'No mobile linked'}
                        </p>
                     </div>
                  </div>
                  <div className="text-right relative z-10">
                     <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200 leading-none mb-2">Settlement Balance</p>
                     <p className="text-3xl font-black">₹{Math.abs(netBalance).toLocaleString()}</p>
                     <p className="text-[9px] font-bold opacity-75 uppercase tracking-tighter mt-1">
                        {netBalance >= 0 ? 'You owe this person' : 'This person owes you'}
                     </p>
                  </div>
               </div>

               <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide bg-slate-50/50">
                  {Object.entries(recordsByDate).length === 0 ? (
                    <div className="text-center py-20">
                       <AlertCircle className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                       <p className="text-slate-400 font-medium italic">No transactions found.</p>
                    </div>
                  ) : (
                    Object.entries(recordsByDate).map(([date, dateRecords]) => (
                      <div key={date} className="space-y-4">
                          <div className="flex items-center gap-4">
                            <div className="h-px flex-1 bg-slate-200" />
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-white px-3 py-1 rounded-full border border-slate-100 shadow-sm">{date}</span>
                            <div className="h-px flex-1 bg-slate-200" />
                          </div>
                          <div className="space-y-3">
                            {dateRecords.map((r) => (
                                <Card key={r.hisab_id} className="border-none shadow-sm rounded-3xl bg-white p-4 group hover:shadow-md transition-all">
                                  <div className="flex items-center justify-between gap-4">
                                      <div className="flex items-center gap-4 min-w-0">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${r.type === 'debit' ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-500'}`}>
                                            {r.type === 'debit' ? <ArrowUpRight className="h-6 w-6" /> : <ArrowDownLeft className="h-6 w-6" />}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-bold text-slate-900 text-sm leading-tight mb-0.5">{r.description || (r.type === 'debit' ? 'Money Given' : 'Money Taken')}</p>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">{new Date(r.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-4">
                                         <div className="text-right">
                                            <p className={`font-black text-lg ${r.type === 'debit' ? 'text-red-500' : 'text-green-500'}`}>
                                              ₹{r.amount.toLocaleString()}
                                            </p>
                                            <p className="text-[8px] font-black uppercase text-slate-300 leading-none">{r.type}</p>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <button
                                                onClick={() => {
                                                    setFormData({
                                                        name: r.name,
                                                        mobile: r.mobile || '',
                                                        type: r.type,
                                                        amount: r.amount.toString(),
                                                        description: r.description || '',
                                                        date: new Date(r.date).toISOString().split('T')[0]
                                                    });
                                                    setEditId(r.hisab_id);
                                                    setShowLedgerModal(false);
                                                    setShowAddDialog(true);
                                                }}
                                                className="p-2 rounded-xl bg-slate-50 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 transition-all opacity-0 group-hover:opacity-100"
                                            >
                                                <MoreVertical className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => setDeleteConfirm(r.hisab_id)}
                                                className="p-2 rounded-xl bg-slate-50 text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                      </div>
                                  </div>
                                  <div className="mt-2 pt-2 border-t border-slate-50 flex justify-between items-center">
                                      <p className="text-[10px] font-bold text-slate-400">
                                          Bal. <span className={(r.balance ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'}>₹{Math.abs(r.balance ?? 0).toLocaleString()}</span>
                                      </p>
                                      {r.description && <p className="text-[10px] text-slate-400 italic font-medium">{r.description}</p>}
                                  </div>
                                </Card>
                            ))}
                          </div>
                      </div>
                    ))
                  )}
               </div>

               <div className="p-6 bg-white border-t shrink-0 flex gap-4 shadow-[0_-10px_40px_rgba(0,0,0,0.02)] relative z-20">
                  <Button
                         onClick={() => {
                            setFormData({ 
                                name: selectedPerson?.name || '', 
                                mobile: selectedPerson?.mobile || '', 
                                type: 'credit',
                                amount: '',
                                description: '',
                                date: new Date().toISOString().split('T')[0]
                            });
                            setEditId(null);
                            setShowLedgerModal(false);
                            setShowAddDialog(true);
                         }}
                     className="flex-1 h-14 rounded-2xl bg-green-600 hover:bg-green-700 font-black text-sm uppercase shadow-xl shadow-green-100 transition-all active:scale-95 text-white"
                  >
                     I Took (Credit)
                  </Button>
                  <Button
                         onClick={() => {
                            setFormData({ 
                                name: selectedPerson?.name || '', 
                                mobile: selectedPerson?.mobile || '', 
                                type: 'debit',
                                amount: '',
                                description: '',
                                date: new Date().toISOString().split('T')[0]
                            });
                            setEditId(null);
                            setShowLedgerModal(false);
                            setShowAddDialog(true);
                         }}
                     className="flex-1 h-14 rounded-2xl bg-red-600 hover:bg-red-700 font-black text-sm uppercase shadow-xl shadow-red-100 transition-all active:scale-95 text-white"
                  >
                     I Gave (Debit)
                  </Button>
               </div>
            </DialogContent>
        </Dialog>

        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
           <DialogContent className="max-w-md rounded-[2.5rem] p-0 overflow-hidden bg-white border-none shadow-2xl">
              <div className="bg-indigo-600 p-8 text-white relative">
                 <div className="absolute top-4 right-4 opacity-10">
                    <HandCoins className="h-20 w-20" />
                 </div>
                  <DialogTitle className="text-3xl font-black mb-1 text-white">{editId ? 'Edit Entry' : 'New Entry'}</DialogTitle>
                  <p className="text-indigo-100 text-sm font-medium">{editId ? 'Modify this transaction record.' : 'Capture a new money exchange.'}</p>
              </div>
              <form onSubmit={handleAddRecord} className="p-8 space-y-6">
                 <div className="space-y-4">
                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                           <Label className="text-[10px] font-black tracking-widest uppercase text-slate-400 ml-1">Person Name</Label>
                           <Input 
                            placeholder="e.g. Rahul Sharma"
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                            className="h-12 rounded-xl bg-slate-50 border-2 border-transparent focus-visible:border-indigo-600 focus-visible:ring-4 focus-visible:ring-indigo-50 transition-all font-medium px-4"
                            required
                           />
                        </div>
                        <div className="space-y-2">
                           <Label className="text-[10px] font-black tracking-widest uppercase text-slate-400 ml-1">Mobile No.</Label>
                           <Input 
                            placeholder="Optional"
                            value={formData.mobile}
                            onChange={(e) => setFormData({...formData, mobile: e.target.value})}
                            className="h-12 rounded-xl bg-slate-50 border-2 border-transparent focus-visible:border-indigo-600 focus-visible:ring-4 focus-visible:ring-indigo-50 transition-all font-medium px-4"
                           />
                        </div>
                     </div>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-2">
                          <Label className="text-[10px] font-black tracking-widest uppercase text-slate-400 ml-1">Type</Label>
                          <div className="flex gap-2">
                             <button
                               type="button"
                               onClick={() => setFormData({...formData, type: 'debit'})}
                               className={`flex-1 h-12 rounded-xl font-black text-[10px] uppercase transition-all ${
                                 formData.type === 'debit' ? 'bg-red-500 text-white shadow-lg shadow-red-200' : 'bg-slate-50 text-slate-400'
                               }`}
                             >
                                I Gave (Debit)
                             </button>
                             <button
                               type="button"
                               onClick={() => setFormData({...formData, type: 'credit'})}
                               className={`flex-1 h-12 rounded-xl font-black text-[10px] uppercase transition-all ${
                                 formData.type === 'credit' ? 'bg-green-500 text-white shadow-lg shadow-green-200' : 'bg-slate-50 text-slate-400'
                               }`}
                             >
                                I Took (Credit)
                             </button>
                          </div>
                       </div>
                       <div className="space-y-2">
                          <Label className="text-[10px] font-black tracking-widest uppercase text-slate-400 ml-1">Amount (₹)</Label>
                           <Input 
                             autoFocus
                             type="number"
                             inputMode="decimal"
                             placeholder="0.00"
                             value={formData.amount}
                             onChange={(e) => setFormData({...formData, amount: e.target.value})}
                             className="h-12 rounded-xl bg-slate-50 border-2 border-transparent focus-visible:border-indigo-600 focus-visible:ring-4 focus-visible:ring-indigo-50 transition-all font-black text-lg px-4"
                             required
                           />
                        </div>
                    </div>
                        <div className="space-y-2">
                           <Label className="text-[10px] font-black tracking-widest uppercase text-slate-400 ml-1">Date</Label>
                           <Input 
                             type="date"
                             value={formData.date}
                             onChange={(e) => setFormData({...formData, date: e.target.value})}
                             className="h-12 rounded-xl bg-slate-50 border-2 border-transparent focus-visible:border-indigo-600 focus-visible:ring-4 focus-visible:ring-indigo-50 transition-all font-medium px-4"
                             required
                           />
                        </div>
                        <div className="space-y-2">
                           <Label className="text-[10px] font-black tracking-widest uppercase text-slate-400 ml-1">Description (Optional)</Label>
                           <Input 
                            placeholder="Purpose of transaction..."
                            value={formData.description}
                            onChange={(e) => setFormData({...formData, description: e.target.value})}
                            className="h-12 rounded-xl bg-slate-50 border-2 border-transparent focus-visible:border-indigo-600 focus-visible:ring-4 focus-visible:ring-indigo-50 transition-all font-medium px-4"
                           />
                        </div>
                 </div>
                  <Button disabled={isSubmitting} className="w-full h-14 rounded-2xl bg-indigo-600 font-black text-lg shadow-xl shadow-indigo-100 text-white">
                     {isSubmitting ? (editId ? 'Updating...' : 'Recording...') : (editId ? 'Update Transaction' : 'Record Transaction')}
                  </Button>
              </form>
           </DialogContent>
        </Dialog>

        <ConfirmDialog
          open={!!deleteConfirm}
          onOpenChange={() => setDeleteConfirm(null)}
          onConfirm={handleDelete}
          title="Delete Record?"
          description="Are you sure you want to delete this transaction record?"
          confirmText="Delete Now"
          variant="destructive"
        />
      </div>
    </PageWrapper>
  );
}

interface SummaryCardProps {
  label: string;
  value: number;
  color: 'red' | 'green' | 'blue';
  icon: LucideIcon;
}

function SummaryCard({ label, value, color, icon: Icon }: SummaryCardProps) {
    const colors = {
       red: "text-red-500 bg-red-50",
       green: "text-green-500 bg-green-50",
       blue: "text-blue-500 bg-blue-50"
    };
    
    return (
       <Card className="border-none shadow-sm hover:shadow-lg rounded-[2rem] bg-white p-4 sm:p-6 relative overflow-hidden group h-full border-2 border-slate-50 transition-all">
          <div className="flex items-center gap-4 sm:gap-6">
             <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-[1.25rem] sm:rounded-[1.5rem] ${colors[color]} flex items-center justify-center flex-shrink-0 transition-all group-hover:scale-110 shadow-sm`}>
                <Icon className="h-6 w-6 sm:h-8 sm:w-8" />
             </div>
             <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 leading-none mb-2">{label}</p>
                <h3 className={`text-lg sm:text-2xl lg:text-3xl font-black ${colors[color]?.split(' ')[0]} truncate tracking-tight`}>₹{Math.abs(value).toLocaleString()}</h3>
             </div>
          </div>
          <div className={`absolute -right-4 -bottom-4 w-24 h-24 rounded-full ${colors[color]?.split(' ')[1]} opacity-20 blur-2xl group-hover:opacity-40 transition-opacity`} />
       </Card>
    );
 }

