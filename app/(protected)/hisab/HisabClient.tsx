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
  CheckCircle2,
  Calendar,
  Info,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import PageWrapper from '@/components/PageWrapper';
import { motion, AnimatePresence } from 'framer-motion';
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
  logAsExpense: boolean;
}

interface PersonSummary {
  name: string;
  mobile: string;
  debit: number; // money given / lent
  credit: number; // money taken / borrowed
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
  const [showSettled, setShowSettled] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    name: '',
    mobile: '',
    type: 'debit',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    logAsExpense: true,
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
        await secureFetch(`/api/hisab/${editId}`, {
          method: 'PUT',
          body: JSON.stringify({ ...formData, amount: parseFloat(formData.amount) }),
        });
        toast.success('Updated successfully');
      } else {
        await secureFetch('/api/hisab', {
          method: 'POST',
          body: JSON.stringify({ ...formData, amount: parseFloat(formData.amount) }),
        });
        toast.success('Recorded successfully');
      }
      setFormData({ 
        name: selectedPerson?.name || '', 
        mobile: selectedPerson?.mobile || '', 
        type: 'debit', 
        amount: '', 
        description: '', 
        date: new Date().toISOString().split('T')[0],
        logAsExpense: true
      });
      setEditId(null);
      setShowAddDialog(false);
      fetchRecords();
    } catch (err) {} 
    finally { setIsSubmitting(false); }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await secureFetch(`/api/hisab/${deleteConfirm}`, { method: 'DELETE' });
      toast.success('Deleted successfully');
      fetchRecords();
      // If we are currently viewing the ledger modal and we delete a record, let's refresh.
      // If no records remain for this person, we might want to close the modal.
      setTimeout(() => {
        fetchRecords();
      }, 300);
    } catch (err) {} 
    finally { setDeleteConfirm(null); }
  };

  // Filter records matching general search or selected person ledger
  const filteredRecords = records.filter(r => {
    const matchesSearch = r.name.toLowerCase().includes(search.toLowerCase()) || 
                          (r.mobile && String(r.mobile).includes(search));
    const matchesPerson = selectedPerson ? (r.name === selectedPerson.name && r.mobile === selectedPerson.mobile) : true;
    return matchesSearch && matchesPerson;
  });

  // Specifically for ledger of selected person
  const personRecords = records
    .filter(r => selectedPerson && r.name === selectedPerson.name && r.mobile === selectedPerson.mobile)
    .sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      if (dateA !== dateB) return dateA - dateB;
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });

  // Calculate transaction history balances (credit - debit)
  // Positive means you owe them, Negative means they owe you.
  let runningBal = 0;
  const recordsWithBalance = personRecords.map(r => {
    if (r.type === 'credit') runningBal += r.amount;
    else runningBal -= r.amount;
    return { ...r, balance: runningBal };
  }).reverse();

  const recordsByDate = recordsWithBalance.reduce((acc: Record<string, typeof recordsWithBalance>, r) => {
    const date = new Date(r.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    if (!acc[date]) acc[date] = [];
    acc[date].push(r);
    return acc;
  }, {});

  const totalDebit = filteredRecords.filter(r => r.type === 'debit').reduce((sum, r) => sum + r.amount, 0);
  const totalCredit = filteredRecords.filter(r => r.type === 'credit').reduce((sum, r) => sum + r.amount, 0);
  const netBalance = totalCredit - totalDebit; // positive if you owe them, negative if they owe you

  // Group by name & mobile
  const peopleGroups = records
    .reduce((acc: Record<string, PersonSummary>, r) => {
      const key = `${r.name}_${r.mobile || ''}`;
      if (!acc[key]) acc[key] = { name: r.name, mobile: r.mobile, debit: 0, credit: 0, latest: r.date };
      acc[key][r.type] += r.amount;
      return acc;
    }, {});

  // Calculate Net totals
  // You Will Get: Sum of (debit - credit) where debit > credit (they owe you)
  const youWillGet = Object.values(peopleGroups).reduce((sum, p) => {
    const diff = p.debit - p.credit;
    return diff > 0 ? sum + diff : sum;
  }, 0);

  // You Will Give: Sum of (credit - debit) where credit > debit (you owe them)
  const youWillGive = Object.values(peopleGroups).reduce((sum, p) => {
    const diff = p.credit - p.debit;
    return diff > 0 ? sum + diff : sum;
  }, 0);

  const overallNet = youWillGet - youWillGive;

  // Filter people based on search query
  const searchedPeople = Object.values(peopleGroups).filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    (p.mobile && String(p.mobile).includes(search))
  );

  // Group into Active Outstanding (non-zero balance) and Settled (zero balance)
  const activePeople = searchedPeople.filter(p => p.debit !== p.credit);
  const settledPeople = searchedPeople.filter(p => p.debit === p.credit);

  return (
    <PageWrapper>
      <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-5xl mx-auto pb-32">
        
        {/* Header Section */}
        <div className="space-y-6">
           <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
             <div className="space-y-1">
                <h1 className="text-4xl font-black text-slate-900 tracking-tight">
                  Hisab <span className="text-indigo-600 italic">Ledger</span>
                </h1>
                <p className="text-slate-500 font-medium">Track your personal lent and borrowed money.</p>
             </div>
              <Button 
                onClick={() => {
                   setFormData({ 
                     name: selectedPerson?.name || '', 
                     mobile: selectedPerson?.mobile || '',
                     type: 'debit',
                     amount: '',
                     description: '',
                     date: new Date().toISOString().split('T')[0],
                     logAsExpense: true
                   });
                   setEditId(null);
                   setShowAddDialog(true);
                }} 
                className="rounded-2xl h-12 px-6 shadow-xl shadow-indigo-100 bg-indigo-600 hover:bg-indigo-700 font-bold w-full sm:w-auto transition-transform active:scale-95"
              >
                 <Plus className="mr-2 h-5 w-5" /> New Entry
              </Button>
           </div>

           {/* Summary Cards */}
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
              <SummaryCard 
                label="You Will Get (Lent)" 
                value={youWillGet} 
                color="green" 
                icon={ArrowUpRight} 
                description="Money others owe you" 
              />
              <SummaryCard 
                label="You Will Give (Borrowed)" 
                value={youWillGive} 
                color="red" 
                icon={ArrowDownLeft} 
                description="Money you owe others" 
              />
              <SummaryCard 
                label="Overall Net Status" 
                value={Math.abs(overallNet)} 
                color={overallNet > 0 ? 'green' : overallNet < 0 ? 'red' : 'blue'} 
                icon={HandCoins} 
                description={
                  overallNet > 0 
                    ? "In net, others owe you" 
                    : overallNet < 0 
                      ? "In net, you owe others" 
                      : "All settled up!"
                }
              />
           </div>
        </div>

        {/* Search & Content Area */}
        <div className="space-y-6 flex-1 h-full overflow-hidden flex flex-col min-h-0">
               {/* Search Bar */}
               <div className="relative group shrink-0">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                  <Input
                    placeholder="Search by name or mobile number..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-12 h-14 rounded-2xl border-2 border-slate-100 bg-white shadow-sm focus-visible:ring-4 focus-visible:ring-indigo-50 focus-visible:border-indigo-600 transition-all font-medium"
                  />
               </div>

               {/* Active Accounts Grid */}
               <div className="space-y-4">
                  <div className="flex items-center justify-between px-2">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                      Active Balances ({activePeople.length})
                    </h3>
                    {activePeople.length > 0 && (
                      <span className="text-[10px] text-slate-400 font-bold">
                        Click cards to see transaction details
                      </span>
                    )}
                  </div>
                  
                  {activePeople.length === 0 ? (
                     <div className="text-center py-16 bg-white rounded-[2rem] border border-dashed border-slate-200">
                        <Users className="h-12 w-12 text-slate-350 mx-auto mb-3" />
                        <p className="text-slate-500 font-bold mb-1">No active outstanding balances</p>
                        <p className="text-slate-450 text-xs font-medium">Add a transaction to get started, or check settled accounts below.</p>
                     </div>
                  ) : (
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                       {activePeople.map((p, idx) => {
                         const bal = p.debit - p.credit; // positive = they owe us, negative = we owe them
                         const isReceivable = bal > 0;
                         const absBal = Math.abs(bal);
                         
                         return (
                           <motion.div
                             key={idx}
                             whileHover={{ y: -4 }}
                             transition={{ duration: 0.2 }}
                           >
                             <Card
                               onClick={() => {
                                  setSelectedPerson({ name: p.name, mobile: p.mobile });
                                  setShowLedgerModal(true);
                               }}
                               className={`border-none shadow-sm hover:shadow-xl rounded-[2rem] overflow-hidden transition-all cursor-pointer bg-white group border-2 border-transparent hover:border-indigo-100 ${
                                 isReceivable ? 'hover:bg-emerald-50/10' : 'hover:bg-rose-50/10'
                               }`}
                             >
                               <CardContent className="p-5 flex items-center justify-between">
                                  <div className="flex items-center gap-4 min-w-0">
                                     <div className={`w-12 h-12 font-bold rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 shrink-0 ${
                                       isReceivable 
                                         ? 'bg-emerald-600 text-white shadow-emerald-100' 
                                         : 'bg-rose-600 text-white shadow-rose-100'
                                     }`}>
                                          {p.name.charAt(0).toUpperCase()}
                                     </div>
                                     <div className="min-w-0">
                                        <p className="font-black text-slate-900 text-base leading-tight mb-0.5 truncate">{p.name}</p>
                                        <p className="text-[11px] text-slate-400 font-bold flex items-center gap-1.5 uppercase tracking-tight">
                                           {p.mobile ? <Phone className="h-3 w-3 text-slate-350" /> : null}
                                           {p.mobile || 'No mobile linked'}
                                        </p>
                                     </div>
                                  </div>
                                  <div className="text-right shrink-0">
                                     <p className={`font-black text-lg sm:text-xl leading-none mb-1.5 ${isReceivable ? 'text-emerald-600' : 'text-rose-600'}`}>
                                        ₹{absBal.toLocaleString()}
                                     </p>
                                     <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                                       isReceivable 
                                         ? 'bg-emerald-50 text-emerald-700' 
                                         : 'bg-rose-50 text-rose-700'
                                     }`}>
                                        {isReceivable ? 'You Get' : 'You Give'}
                                     </span>
                                  </div>
                               </CardContent>
                            </Card>
                          </motion.div>
                         );
                       })}
                     </div>
                  )}
               </div>

               {/* Collapsible Settled Accounts Section */}
               {settledPeople.length > 0 && (
                 <div className="mt-8 border-t border-slate-100 pt-6">
                   <button
                     onClick={() => setShowSettled(!showSettled)}
                     className="flex items-center justify-between w-full px-5 py-4 bg-slate-50 hover:bg-slate-100/80 rounded-2xl transition-all border border-slate-100"
                   >
                     <span className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-2">
                       <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                       Settled Accounts ({settledPeople.length})
                     </span>
                     <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                       <span>{showSettled ? 'Collapse' : 'Expand'}</span>
                       {showSettled ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                     </div>
                   </button>
                   
                   <AnimatePresence initial={false}>
                     {showSettled && (
                       <motion.div
                         initial={{ opacity: 0, height: 0 }}
                         animate={{ opacity: 1, height: 'auto' }}
                         exit={{ opacity: 0, height: 0 }}
                         transition={{ duration: 0.3, ease: 'easeInOut' }}
                         className="overflow-hidden"
                       >
                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 pb-4 px-1">
                           {settledPeople.map((p, idx) => (
                             <Card
                               key={idx}
                               onClick={() => {
                                 setSelectedPerson({ name: p.name, mobile: p.mobile });
                                 setShowLedgerModal(true);
                               }}
                               className="border-none shadow-sm hover:shadow-md rounded-[2rem] overflow-hidden transition-all cursor-pointer bg-white/70 hover:bg-white group border border-slate-200 hover:border-indigo-100 opacity-80 hover:opacity-100"
                             >
                               <CardContent className="p-4 flex items-center justify-between">
                                 <div className="flex items-center gap-3 min-w-0">
                                   <div className="w-10 h-10 font-bold rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
                                     {p.name.charAt(0).toUpperCase()}
                                   </div>
                                   <div className="min-w-0">
                                     <p className="font-bold text-slate-700 text-sm leading-tight mb-0.5 truncate">{p.name}</p>
                                     <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-tight">
                                       {p.mobile || 'No mobile'}
                                     </p>
                                   </div>
                                 </div>
                                 <div className="text-right shrink-0">
                                   <p className="font-bold text-slate-400 text-sm leading-none mb-1">
                                     ₹0
                                   </p>
                                   <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[8px] font-black bg-slate-100 text-slate-500 uppercase tracking-widest">
                                     Settled
                                   </span>
                                 </div>
                               </CardContent>
                             </Card>
                           ))}
                         </div>
                       </motion.div>
                     )}
                   </AnimatePresence>
                 </div>
               )}
        </div>

        {/* Ledger Details Dialog (Individual Person's Ledger) */}
        <Dialog open={showLedgerModal} onOpenChange={setShowLedgerModal}>
            <DialogContent className="max-w-2xl h-[100dvh] sm:h-[85vh] w-full flex flex-col p-0 overflow-hidden bg-slate-50 border-none shadow-2xl rounded-none sm:rounded-[2.5rem]">
               
               {/* Banner Header - Dynamic Color Coding & Responsive Stacking */}
               <div className={`p-5 sm:p-8 text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0 relative overflow-hidden bg-gradient-to-r transition-all duration-300 ${
                 netBalance > 0 
                   ? 'from-rose-600 to-indigo-700' 
                   : netBalance < 0 
                     ? 'from-emerald-600 to-indigo-700' 
                     : 'from-slate-600 to-slate-700'
               }`}>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10" />
                  
                  {/* Left Side: Back button + Person details */}
                  <div className="flex items-center gap-3 relative z-10 w-full sm:w-auto">
                     <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-sm shadow-xl hover:bg-white/20 transition-all cursor-pointer" onClick={() => setShowLedgerModal(false)}>
                        <ArrowLeft className="h-5 w-5 sm:h-6 sm:w-6" />
                     </div>
                     <div>
                        <DialogTitle className="text-xl sm:text-2xl font-black leading-none mb-1 text-white">{selectedPerson?.name}</DialogTitle>
                        <p className="text-white/80 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1">
                           {selectedPerson?.mobile ? (
                             <>
                               <Phone className="h-2.5 w-2.5" /> {selectedPerson.mobile}
                             </>
                           ) : (
                             'No mobile linked'
                           )}
                        </p>
                     </div>
                  </div>

                  {/* Right Side: Ledger summary status - stacks on mobile */}
                  <div className="text-left sm:text-right relative z-10 w-full sm:w-auto pt-2.5 sm:pt-0 border-t border-white/10 sm:border-none">
                     <p className="text-[9px] font-black uppercase tracking-widest text-white/70 leading-none mb-1.5">Net Status</p>
                     <div className="flex items-baseline gap-1.5 sm:justify-end">
                        <p className="text-2xl sm:text-3xl font-black">₹{Math.abs(netBalance).toLocaleString()}</p>
                        <span className="text-[9px] font-black uppercase tracking-wider bg-white/10 px-2 py-0.5 rounded-full">
                           {netBalance > 0 
                             ? 'You Give' 
                             : netBalance < 0 
                               ? 'You Get' 
                               : 'Settled'}
                        </span>
                     </div>
                  </div>
               </div>

                {/* Transaction Timeline */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6 bg-slate-50/50">
                  {Object.entries(recordsByDate).length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-[2rem] border border-dashed border-slate-200">
                       <AlertCircle className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                       <p className="text-slate-500 font-bold mb-1">No transaction history</p>
                       <p className="text-slate-400 text-xs font-semibold">Use buttons below to log your first transaction.</p>
                    </div>
                  ) : (
                    Object.entries(recordsByDate).map(([date, dateRecords]) => (
                      <div key={date} className="space-y-3">
                          <div className="flex items-center gap-4">
                            <div className="h-px flex-1 bg-slate-200/80" />
                            <span className="text-[9px] font-black text-slate-450 uppercase tracking-widest bg-slate-100 px-3 py-1 rounded-full border border-slate-200/50 shadow-sm">{date}</span>
                            <div className="h-px flex-1 bg-slate-200/80" />
                          </div>
                          <div className="space-y-2.5">
                            {dateRecords.map((r) => {
                              const isLent = r.type === 'debit';
                              const bal = r.balance ?? 0;
                              const isBalReceivable = bal < 0;
                              const isBalPayable = bal > 0;
                              
                              return (
                                <Card key={r.hisab_id} className="border-none shadow-sm rounded-2xl bg-white p-3.5 group hover:shadow-md transition-all border border-slate-100">
                                  <div className="flex items-center justify-between gap-4">
                                      <div className="flex items-center gap-3 min-w-0">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                                          isLent 
                                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                                            : 'bg-rose-50 text-rose-600 border border-rose-100'
                                        }`}>
                                            {isLent ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownLeft className="h-5 w-5" />}
                                        </div>
                                         <div className="min-w-0">
                                             <p className="font-bold text-slate-800 text-sm leading-tight mb-0.5">
                                               {r.description || (isLent ? 'Lent Money' : 'Borrowed Money')}
                                             </p>
                                            <p className="text-[9px] text-slate-400 font-semibold flex items-center gap-1 uppercase tracking-tight">
                                              <Calendar className="h-2.5 w-2.5" />
                                              {new Date(r.date).toLocaleDateString([], { month: 'short', day: 'numeric' })} at {new Date(r.created_at || r.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                      </div>
                                      
                                      <div className="flex items-center gap-3 shrink-0">
                                         <div className="text-right">
                                            <p className={`font-black text-base ${isLent ? 'text-emerald-600' : 'text-rose-600'}`}>
                                              ₹{r.amount.toLocaleString()}
                                            </p>
                                            <span className={`inline-block text-[8px] font-black uppercase tracking-wider ${isLent ? 'text-emerald-600' : 'text-rose-600'}`}>
                                              {isLent ? 'Lent' : 'Borrowed'}
                                            </span>
                                        </div>
                                        
                                        {/* Action buttons on hover */}
                                        <div className="flex gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => {
                                                    setFormData({
                                                        name: r.name,
                                                        mobile: r.mobile || '',
                                                        type: r.type,
                                                        amount: r.amount.toString(),
                                                        description: r.description || '',
                                                        date: new Date(r.date).toISOString().split('T')[0],
                                                        logAsExpense: r.log_as_expense !== undefined ? !!r.log_as_expense : true
                                                    });
                                                    setEditId(r.hisab_id);
                                                    setShowLedgerModal(false);
                                                    setShowAddDialog(true);
                                                }}
                                                className="p-1.5 rounded-lg bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-100 transition-all focus:outline-none focus:ring-0 focus-visible:ring-0"
                                                title="Edit transaction"
                                            >
                                                <MoreVertical className="h-3.5 w-3.5" />
                                            </button>
                                            <button
                                                onClick={() => setDeleteConfirm(r.hisab_id)}
                                                className="p-1.5 rounded-lg bg-slate-50 text-slate-400 hover:text-red-600 hover:bg-red-50 border border-slate-100 transition-all focus:outline-none focus:ring-0 focus-visible:ring-0"
                                                title="Delete transaction"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                         </div>
                                      </div>
                                  </div>
                                  
                                  {/* Running Balance and sync status */}
                                  <div className="mt-2.5 pt-2 border-t border-slate-100/70 flex justify-between items-center text-[10px]">
                                      <p className="font-bold text-slate-400">
                                          Net Balance: {' '}
                                          {isBalReceivable && (
                                            <span className="text-emerald-600 font-extrabold">Gets ₹{Math.abs(bal).toLocaleString()}</span>
                                          )}
                                          {isBalPayable && (
                                            <span className="text-rose-600 font-extrabold">Gives ₹{Math.abs(bal).toLocaleString()}</span>
                                          )}
                                          {bal === 0 && (
                                            <span className="text-slate-450 font-black">Settled</span>
                                          )}
                                      </p>
                                      {r.log_as_expense && (
                                        <span className="text-[9px] font-black text-indigo-500/80 bg-indigo-50/50 px-1.5 py-0.5 rounded border border-indigo-100/30">Synced with expenses</span>
                                      )}
                                  </div>
                                </Card>
                              );
                            })}
                          </div>
                      </div>
                    ))
                  )}
               </div>

               {/* Quick Add buttons inside Ledger Modal */}
               <div className="p-4 sm:p-6 bg-white border-t shrink-0 flex flex-col sm:flex-row gap-3 sm:gap-4 shadow-[0_-10px_40px_rgba(0,0,0,0.02)] relative z-20">
                  <Button
                     onClick={() => {
                        setFormData({ 
                            name: selectedPerson?.name || '', 
                            mobile: selectedPerson?.mobile || '', 
                            type: 'debit',
                            amount: '',
                            description: '',
                            date: new Date().toISOString().split('T')[0],
                            logAsExpense: true
                        });
                        setEditId(null);
                        setShowLedgerModal(false);
                        setShowAddDialog(true);
                     }}
                     className="flex-1 h-12 sm:h-14 rounded-xl sm:rounded-2xl bg-emerald-600 hover:bg-emerald-700 font-black text-xs sm:text-sm uppercase shadow-xl shadow-emerald-100 transition-all active:scale-95 text-white flex items-center justify-center gap-1.5"
                  >
                     <ArrowUpRight className="h-4 w-4 sm:h-5 sm:w-5" /> I Lent (Gave)
                  </Button>
                  <Button
                     onClick={() => {
                        setFormData({ 
                            name: selectedPerson?.name || '', 
                            mobile: selectedPerson?.mobile || '', 
                            type: 'credit',
                            amount: '',
                            description: '',
                            date: new Date().toISOString().split('T')[0],
                            logAsExpense: true
                        });
                        setEditId(null);
                        setShowLedgerModal(false);
                        setShowAddDialog(true);
                     }}
                     className="flex-1 h-12 sm:h-14 rounded-xl sm:rounded-2xl bg-rose-600 hover:bg-rose-700 font-black text-xs sm:text-sm uppercase shadow-xl shadow-rose-100 transition-all active:scale-95 text-white flex items-center justify-center gap-1.5"
                  >
                     <ArrowDownLeft className="h-4 w-4 sm:h-5 sm:w-5" /> I Borrowed (Took)
                  </Button>
               </div>
            </DialogContent>
        </Dialog>

        {/* Add/Edit Transaction Dialog */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
           <DialogContent className="max-w-md w-[92vw] sm:w-full rounded-[2rem] sm:rounded-[2.5rem] p-0 overflow-hidden bg-white border-none shadow-2xl">
              <div className="bg-indigo-600 p-6 sm:p-8 text-white relative">
                 <div className="absolute top-4 right-4 opacity-10">
                    <HandCoins className="h-16 w-16 sm:h-20 sm:w-20" />
                 </div>
                  <DialogTitle className="text-2xl sm:text-3xl font-black mb-1 text-white">{editId ? 'Edit Entry' : 'New Entry'}</DialogTitle>
                  <p className="text-indigo-100 text-xs sm:text-sm font-medium">{editId ? 'Modify this transaction record.' : 'Capture a new money exchange.'}</p>
              </div>
              
              <form onSubmit={handleAddRecord} className="p-6 space-y-6">
                 <div className="space-y-4">
                     
                     {/* Person Info */}
                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                           <Label className="text-[10px] font-black tracking-widest uppercase text-slate-400 ml-1">Person Name</Label>
                           <Input 
                            placeholder="e.g. Rahul Sharma"
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                            className="h-12 rounded-xl bg-slate-50 border-2 border-transparent focus-visible:border-indigo-600 focus-visible:ring-4 focus-visible:ring-indigo-50 transition-all font-bold px-4"
                            required
                           />
                        </div>
                        <div className="space-y-1.5">
                           <Label className="text-[10px] font-black tracking-widest uppercase text-slate-400 ml-1">Mobile No.</Label>
                           <Input 
                            placeholder="Optional"
                            value={formData.mobile}
                            onChange={(e) => setFormData({...formData, mobile: e.target.value})}
                            className="h-12 rounded-xl bg-slate-50 border-2 border-transparent focus-visible:border-indigo-600 focus-visible:ring-4 focus-visible:ring-indigo-50 transition-all font-medium px-4"
                           />
                        </div>
                     </div>

                     {/* Transaction Type Buttons */}
                     <div className="space-y-2">
                        <Label className="text-[10px] font-black tracking-widest uppercase text-slate-400 ml-1">Type of Transaction</Label>
                        <div className="flex gap-2 sm:gap-3">
                           <button
                             type="button"
                             onClick={() => setFormData({...formData, type: 'debit'})}
                             className={`flex-1 py-3 px-2 sm:px-4 rounded-xl font-bold text-[11px] sm:text-xs uppercase transition-all flex flex-col items-center justify-center gap-1 sm:gap-1.5 border-2 ${
                               formData.type === 'debit' 
                                 ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-md shadow-emerald-50' 
                                 : 'bg-slate-50 border-transparent text-slate-500 hover:bg-slate-100/50'
                             }`}
                           >
                              <ArrowUpRight className="h-4.5 w-4.5 sm:h-5 sm:w-5 text-emerald-600" />
                              <span>Lent (Gave)</span>
                           </button>
                           <button
                             type="button"
                             onClick={() => setFormData({...formData, type: 'credit'})}
                             className={`flex-1 py-3 px-2 sm:px-4 rounded-xl font-bold text-[11px] sm:text-xs uppercase transition-all flex flex-col items-center justify-center gap-1 sm:gap-1.5 border-2 ${
                               formData.type === 'credit' 
                                 ? 'bg-rose-50 border-rose-500 text-rose-700 shadow-md shadow-rose-50' 
                                 : 'bg-slate-50 border-transparent text-slate-500 hover:bg-slate-100/50'
                             }`}
                           >
                              <ArrowDownLeft className="h-4.5 w-4.5 sm:h-5 sm:w-5 text-rose-600" />
                              <span>Borrowed (Took)</span>
                           </button>
                        </div>
                        <p className="text-[10px] text-center mt-1.5 font-semibold">
                          {formData.type === 'debit' ? (
                            <span className="text-emerald-600 flex items-center justify-center gap-1"><Info className="h-3 w-3" /> They will have to return this money to you.</span>
                          ) : (
                            <span className="text-rose-600 flex items-center justify-center gap-1"><Info className="h-3 w-3" /> You will have to return this money to them.</span>
                          )}
                        </p>
                     </div>

                     {/* Amount & Date */}
                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                           <Label className="text-[10px] font-black tracking-widest uppercase text-slate-400 ml-1">Amount (₹)</Label>
                           <Input 
                             type="number"
                             placeholder="0.00"
                             value={formData.amount}
                             onChange={(e) => setFormData({...formData, amount: e.target.value})}
                             className="h-12 rounded-xl bg-slate-50 border-2 border-transparent focus-visible:border-indigo-600 focus-visible:ring-4 focus-visible:ring-indigo-50 transition-all font-black text-lg px-4"
                             required
                             min="0.01"
                             step="any"
                           />
                        </div>
                        <div className="space-y-1.5">
                           <Label className="text-[10px] font-black tracking-widest uppercase text-slate-400 ml-1">Date</Label>
                           <Input 
                             type="date"
                             value={formData.date}
                             onChange={(e) => setFormData({...formData, date: e.target.value})}
                             className="h-12 rounded-xl bg-slate-50 border-2 border-transparent focus-visible:border-indigo-600 focus-visible:ring-4 focus-visible:ring-indigo-50 transition-all font-medium px-4"
                             required
                           />
                        </div>
                     </div>

                     {/* Description */}
                     <div className="space-y-1.5">
                        <Label className="text-[10px] font-black tracking-widest uppercase text-slate-400 ml-1">Description (Optional)</Label>
                        <Input 
                         placeholder="Purpose of transaction..."
                         value={formData.description}
                         onChange={(e) => setFormData({...formData, description: e.target.value})}
                         className="h-12 rounded-xl bg-slate-50 border-2 border-transparent focus-visible:border-indigo-600 focus-visible:ring-4 focus-visible:ring-indigo-50 transition-all font-medium px-4"
                        />
                     </div>

                     {/* Log as Daily Expense Checkbox */}
                     <div className="space-y-2 pt-1">
                        <label className="flex items-center gap-3 cursor-pointer p-3 bg-slate-50 hover:bg-slate-100/70 border border-slate-100 rounded-xl transition-all select-none">
                           <input 
                             type="checkbox"
                             checked={formData.logAsExpense}
                             onChange={(e) => setFormData({...formData, logAsExpense: e.target.checked})}
                             className="h-4 w-4 rounded border-slate-350 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                           />
                           <div className="flex flex-col">
                              <span className="text-xs font-bold text-slate-700">Sync with Daily Expenses</span>
                              <span className="text-[10px] text-slate-400 font-semibold leading-tight mt-0.5">Automatically log this cash exchange as a daily expense or income.</span>
                           </div>
                        </label>
                     </div>
                 </div>
                 
                 <Button disabled={isSubmitting} className="w-full h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 font-black text-lg shadow-xl shadow-indigo-100 text-white transition-transform active:scale-98">
                    {isSubmitting ? (editId ? 'Updating...' : 'Recording...') : (editId ? 'Update Transaction' : 'Record Transaction')}
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
    </PageWrapper>
  );
}

interface SummaryCardProps {
  label: string;
  value: number;
  color: 'red' | 'green' | 'blue';
  icon: any;
  description?: string;
}

function SummaryCard({ label, value, color, icon: Icon, description }: SummaryCardProps) {
    const colors = {
       red: "text-rose-600 bg-rose-50 border-rose-100",
       green: "text-emerald-600 bg-emerald-50 border-emerald-100",
       blue: "text-indigo-600 bg-indigo-50 border-indigo-100"
    };
    
    return (
       <Card className="border-none shadow-sm hover:shadow-lg rounded-[1.8rem] sm:rounded-[2.2rem] bg-white p-4 sm:p-5 relative overflow-hidden group h-full border border-slate-100 transition-all duration-300">
          <div className="flex items-center gap-3 sm:gap-4 relative z-10">
             <div className={`w-11 h-11 sm:w-14 sm:h-14 rounded-xl sm:rounded-[1.3rem] ${colors[color].split(' ')[0]} ${colors[color].split(' ')[1]} border ${colors[color].split(' ')[2]} flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110 shadow-sm`}>
                <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
             </div>
             <div className="min-w-0">
                <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.12em] sm:tracking-[0.15em] text-slate-400 leading-none mb-1 sm:mb-1.5">{label}</p>
                <h3 className={`text-lg sm:text-2xl font-black ${colors[color]?.split(' ')[0]} truncate tracking-tight mb-0.5`}>₹{Math.abs(value).toLocaleString()}</h3>
                {description && <p className="text-[9px] sm:text-[10px] font-semibold text-slate-400 truncate">{description}</p>}
             </div>
          </div>
          <div className={`absolute -right-4 -bottom-4 w-24 h-24 rounded-full ${colors[color]?.split(' ')[1]} opacity-20 blur-2xl group-hover:opacity-40 transition-opacity`} />
       </Card>
    );
 }
