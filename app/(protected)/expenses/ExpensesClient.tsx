'use client'

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  Trash2,
  Tag,
  CreditCard,
  Smartphone,
  Receipt,
  LucideIcon
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import PageWrapper from '@/components/PageWrapper';
import { secureFetch } from '@/lib/api-utils';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { ExpenseRecord } from '@/types';

const CATEGORIES = ['Food', 'Transport', 'Shopping', 'Bills', 'Groceries', 'Health', 'Entertainment', 'Other'];

interface PaymentModeConfig {
  value: 'cash' | 'online' | 'card';
  label: string;
  icon: LucideIcon;
  color: string;
}

const PAYMENT_MODES: PaymentModeConfig[] = [
  { value: 'cash', label: 'Cash', icon: CreditCard, color: 'text-green-600' },
  { value: 'online', label: 'Online/UPI', icon: Smartphone, color: 'text-primary' },
  { value: 'card', label: 'Credit Card', icon: CreditCard, color: 'text-purple-600' },
];

interface ExpensesClientProps {
  initialData: {
    expenses: ExpenseRecord[];
    topCategories: string[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
  initialCategory: string;
}

interface FormData {
  title: string;
  amount: string;
  category: string;
  paymentMode: 'cash' | 'online' | 'card';
  date: string;
  notes: string;
}

export default function ExpensesClient({ initialData, initialCategory }: ExpensesClientProps) {
  const [expenses, setExpenses] = useState<ExpenseRecord[]>(initialData.expenses || []);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState(initialCategory || 'all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const [formData, setFormData] = useState<FormData>({
    title: '',
    amount: '',
    category: initialData.expenses?.[0]?.category || 'Other',
    paymentMode: 'cash',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const [debouncedSearch, setDebouncedSearch] = useState(search);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  useEffect(() => {
    // Only fetch if category changes from initial
    if (filterCategory !== initialCategory) {
      fetchExpenses();
    }
  }, [filterCategory]);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const url = `/api/expenses?category=${filterCategory}`;
      const data = await secureFetch<{ expenses: ExpenseRecord[] }>(url);
      setExpenses(data.expenses || []);
    } catch (err) {
      // secureFetch handles toast
    } finally {
      setLoading(false);
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await secureFetch<{ expense: ExpenseRecord }>('/api/expenses', {
        method: 'POST',
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount),
        }),
      });
      toast.success('Expense added successfully');
      setShowAddDialog(false);
      setExpenses([response.expense, ...expenses]);
      setFormData({
        title: '',
        amount: '',
        category: response.expense.category,
        paymentMode: 'cash',
        date: new Date().toISOString().split('T')[0],
        notes: '',
      });
    } catch (err) {
       // secureFetch handles toast
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await secureFetch(`/api/expenses/${deleteConfirm}`, { method: 'DELETE' });
      toast.success('Deleted successfully');
      fetchExpenses();
    } catch (err) {
      // Error handled by secureFetch
    } finally {
      setDeleteConfirm(null);
    }
  };

  const filteredExpenses = expenses.filter(exp => 
    exp.title.toLowerCase().includes(debouncedSearch.toLowerCase())
  );

  const totalSpent = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <PageWrapper>
      <div className="p-4 space-y-8 max-w-7xl mx-auto pb-32">
        {/* Header Section */}
        <div className="space-y-6">
           <div className="flex justify-between items-end">
             <div className="space-y-1">
                <h1 className="text-4xl font-black text-slate-900 tracking-tight">Expenses</h1>
                <p className="text-slate-500 font-medium">Keep your daily spendings in check.</p>
             </div>
             <Button onClick={() => setShowAddDialog(true)} className="rounded-2xl h-12 px-6 shadow-xl shadow-primary/20 bg-slate-900 hover:bg-black font-bold text-white">
                <Plus className="mr-2 h-5 w-5" /> Log Expense
             </Button>
           </div>

           {/* Quick Summary Card */}
           <Card className="border-none shadow-xl bg-slate-950 text-white rounded-[1.5rem] sm:rounded-[2.5rem] overflow-hidden relative">
              <CardContent className="p-5 sm:p-10 relative z-10">
                 <div className="flex items-center gap-4 sm:gap-8">
                    <div className="w-16 h-16 sm:w-28 sm:h-28 rounded-2xl sm:rounded-[2rem] bg-white/5 flex items-center justify-center flex-shrink-0 border border-white/5 shadow-inner">
                       <Receipt className="h-8 w-8 sm:h-14 sm:w-14 text-slate-400 opacity-80" />
                    </div>
                    <div className="space-y-0.5 sm:space-y-1">
                       <p className="text-slate-400 font-black uppercase tracking-[0.1em] sm:tracking-[0.2em] text-[8px] sm:text-xs">Filter Aggregate</p>
                       <div className="flex items-baseline gap-1.5 sm:gap-3">
                          <h2 className="text-2xl sm:text-6xl font-black text-white">₹{totalSpent.toLocaleString()}</h2>
                          <span className="text-slate-400 font-bold text-[8px] sm:text-base">Total Spent</span>
                       </div>
                    </div>
                 </div>
              </CardContent>
           </Card>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col md:flex-row gap-4 items-center">
           <div className="relative flex-1 w-full group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors" />
              <Input 
                placeholder="Search by title..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-12 h-14 rounded-2xl border-none bg-white shadow-lg focus-visible:ring-primary transition-all"
              />
           </div>
           <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="h-14 w-full md:w-[200px] rounded-2xl border-none bg-white shadow-lg font-bold">
                 <Filter className="mr-2 h-4 w-4" />
                 <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-none shadow-2xl">
                 <SelectItem value="all">All Categories</SelectItem>
                 {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
           </Select>
        </div>

        {/* Expense List */}
        <div className="space-y-4">
           {loading ? (
             [1,2,3].map(i => <Skeleton key={i} className="h-24 rounded-3xl" />)
           ) : 
               filteredExpenses.map((exp, idx) => {
                 const modeInfo = PAYMENT_MODES.find(p => p.value === exp.paymentMode);
                 const ModeIcon = modeInfo ? modeInfo.icon : CreditCard;

                 return (
                   <div
                     key={exp.expense_id}
                     
                     className="group relative"
                   >
                      <Card className="border-none shadow-lg hover:shadow-xl transition-all rounded-2xl bg-white overflow-hidden p-3 sm:p-5 hover:-translate-y-0.5 group">
                         <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                               <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-slate-50 flex items-center justify-center group-hover:bg-primary/5 transition-colors flex-shrink-0">
                                  <ModeIcon className="h-5 w-5 sm:h-6 sm:w-6 text-slate-400" />
                               </div>
                               <div className="min-w-0">
                                  <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-tight truncate">{exp.title}</h3>
                                  <div className="flex items-center gap-2 mt-0.5">
                                     <span className="flex items-center gap-1 text-[9px] sm:text-[10px] bg-slate-50 text-slate-500 px-1.5 py-0.5 rounded-full font-black uppercase tracking-tighter">
                                        <Tag className="h-2 w-2 sm:h-2.5 sm:w-2.5" /> {exp.category}
                                     </span>
                                     <span className="hidden xs:flex items-center gap-1 text-[9px] sm:text-[10px] text-slate-400 font-bold">
                                        <Calendar className="h-2 w-2 sm:h-2.5 sm:w-2.5" /> {new Date(exp.date).toLocaleDateString()}
                                     </span>
                                  </div>
                               </div>
                            </div>
                            <div className="flex items-center gap-3 sm:gap-6">
                               <div className="text-right flex-shrink-0">
                                  <p className="text-lg sm:text-xl font-black text-red-500">-₹{exp.amount.toLocaleString()}</p>
                                  <p className="text-[8px] sm:text-[10px] text-slate-400 font-black uppercase tracking-widest">{exp.paymentMode}</p>
                               </div>
                               <button 
                                 onClick={() => setDeleteConfirm(exp.expense_id)}
                                 className="xs:opacity-0 group-hover:opacity-100 p-2 sm:p-3 rounded-lg sm:rounded-xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm"
                               >
                                  <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                               </button>
                            </div>
                         </div>
                      </Card>
                   </div>
                 );
               })}
       
           
           {!loading && filteredExpenses.length === 0 && (
             <div className="text-center py-20 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
                <div className="w-16 h-16 bg-white rounded-2xl shadow-lg flex items-center justify-center mx-auto mb-4 text-slate-300">
                   <Receipt className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">No expenses found</h3>
                <p className="text-slate-500">Your wallet seems happy today!</p>
             </div>
           )}
        </div>

        {/* Add Dialog */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
           <DialogContent className="max-w-md rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden bg-white">
              <div className="bg-slate-950 px-6 py-5 text-white relative">
                 <div className="absolute top-4 right-4 opacity-10">
                    <Receipt className="h-20 w-20" />
                 </div>
                 <DialogTitle className="text-3xl font-black mb-1 text-white">New Expense</DialogTitle>
                 <p className="text-slate-400 text-sm font-medium">Record where your money is going.</p>
              </div>
              <form onSubmit={handleAddExpense} className="p-8 space-y-6">
                 <div className="space-y-4">
                    <div className="space-y-2">
                       <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Expense Title</Label>
                       <Input 
                        placeholder="e.g. Starbucks Coffee" 
                        value={formData.title}
                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                        className="h-12 rounded-xl bg-slate-50 border-none px-4 focus-visible:ring-primary"
                        required
                       />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Amount (₹)</Label>
                          <Input 
                            autoFocus
                            type="number"
                            inputMode="decimal"
                            placeholder="0.00" 
                            value={formData.amount}
                            onChange={(e) => setFormData({...formData, amount: e.target.value})}
                            className="h-12 rounded-xl bg-slate-50 border-none px-4 font-black text-lg focus-visible:ring-primary"
                            required
                          />
                       </div>
                       <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Date</Label>
                          <Input 
                            type="date"
                            value={formData.date}
                            onChange={(e) => setFormData({...formData, date: e.target.value})}
                            className="h-12 rounded-xl bg-slate-50 border-none px-4 font-bold focus-visible:ring-primary"
                            required
                          />
                       </div>
                    </div>
                    <div className="space-y-3">
                       {initialData.topCategories?.length > 0 && (
                         <div className="space-y-2 mb-4">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Frequent Categories</Label>
                            <div className="grid grid-cols-3 gap-2">
                               {initialData.topCategories.slice(0, 3).map(c => (
                                  <button
                                    key={`top-${c}`}
                                    type="button"
                                    onClick={() => setFormData({...formData, category: c})}
                                    className={`p-3 rounded-2xl text-[12px] font-black uppercase tracking-tighter transition-all flex items-center justify-center border-2 ${
                                      formData.category === c ? 'bg-primary text-white border-primary shadow-lg shadow-primary/30' : 'bg-slate-50 text-slate-500 border-transparent hover:border-slate-200'
                                    }`}
                                  >
                                     {c}
                                  </button>
                               ))}
                            </div>
                         </div>
                       )}
                       <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">All Categories</Label>
                       <div className="flex flex-wrap gap-2">
                          {CATEGORIES.map(c => (
                             <button
                               key={c}
                               type="button"
                               onClick={() => setFormData({...formData, category: c})}
                               className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tighter transition-all ${
                                 formData.category === c ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                               }`}
                             >
                                {c}
                             </button>
                          ))}
                       </div>
                    </div>
                    <div className="space-y-2">
                       <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Payment Method</Label>
                       <div className="grid grid-cols-3 gap-3">
                          {PAYMENT_MODES.map(m => (
                             <button
                               key={m.value}
                               type="button"
                               onClick={() => setFormData({...formData, paymentMode: m.value})}
                               className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all ${
                                 formData.paymentMode === m.value ? 'bg-primary/5 border-primary' : 'bg-slate-50 border-transparent hover:border-slate-100'
                               }`}
                             >
                                <m.icon className={`h-5 w-5 mb-1 ${formData.paymentMode === m.value ? 'text-primary' : 'text-slate-400'}`} />
                                <span className={`text-[9px] font-black uppercase ${formData.paymentMode === m.value ? 'text-primary' : 'text-slate-400'}`}>{m.label}</span>
                             </button>
                          ))}
                       </div>
                    </div>
                 </div>
                 <Button disabled={isSubmitting} className="w-full h-14 rounded-2xl bg-slate-950 font-black text-lg shadow-2xl transition-all active:scale-95 text-white">
                    {isSubmitting ? 'Recording...' : 'Finalize Record'}
                 </Button>
              </form>
           </DialogContent>
        </Dialog>

        <ConfirmDialog
          open={!!deleteConfirm}
          onOpenChange={() => setDeleteConfirm(null)}
          onConfirm={handleDelete}
          title="Delete Entry?"
          description="This will permanently remove this expense record. This action cannot be undone."
          confirmText="Yes, Delete"
          variant="destructive"
        />
      </div>
    </PageWrapper>
  );
}
