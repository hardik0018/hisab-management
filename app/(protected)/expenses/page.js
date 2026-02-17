'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  CreditCard as Cash,
  Smartphone,
  ChevronRight,
  Receipt,
  AlertCircle
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import PageWrapper from '@/components/PageWrapper';
import { motion, AnimatePresence } from 'framer-motion';
import { secureFetch } from '@/lib/api-utils';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

const CATEGORIES = ['Food', 'Transport', 'Shopping', 'Bills', 'Groceries', 'Health', 'Entertainment', 'Other'];
const PAYMENT_MODES = [
  { value: 'cash', label: 'Cash', icon: Cash, color: 'text-green-600' },
  { value: 'online', label: 'Online/UPI', icon: Smartphone, color: 'text-primary' },
  { value: 'card', label: 'Credit Card', icon: CreditCard, color: 'text-purple-600' },
];

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    category: 'Other',
    paymentMode: 'cash',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  useEffect(() => {
    fetchExpenses();
  }, [filterCategory]);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const url = `/api/expenses?category=${filterCategory}`;
      const data = await secureFetch(url);
      setExpenses(data.expenses || []);
    } catch (err) {
      // secureFetch handles toast
    } finally {
      setLoading(false);
    }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await secureFetch('/api/expenses', {
        method: 'POST',
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount),
        }),
      });
      toast.success('Expense added successfully');
      setShowAddDialog(false);
      setFormData({
        title: '',
        amount: '',
        category: 'Other',
        paymentMode: 'cash',
        date: new Date().toISOString().split('T')[0],
        notes: '',
      });
      fetchExpenses();
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
    exp.title.toLowerCase().includes(search.toLowerCase())
  );

  const totalSpent = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <PageWrapper>
      <div className="p-4 space-y-8 max-w-5xl mx-auto pb-32">
        {/* Header Section */}
        <div className="space-y-6">
           <div className="flex justify-between items-end">
             <div className="space-y-1">
                <h1 className="text-4xl font-black text-slate-900 tracking-tight">Expenses</h1>
                <p className="text-slate-500 font-medium">Keep your daily spendings in check.</p>
             </div>
             <Button onClick={() => setShowAddDialog(true)} className="rounded-2xl h-12 px-6 shadow-xl shadow-primary/20 bg-slate-900 hover:bg-black font-bold">
                <Plus className="mr-2 h-5 w-5" /> Log Expense
             </Button>
           </div>

           {/* Quick Summary Card */}
           <Card className="border-none shadow-2xl bg-slate-950 text-white rounded-[2.5rem] overflow-hidden relative p-8">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                 <Receipt className="h-32 w-32 rotate-12" />
              </div>
              <div className="relative z-10 space-y-1">
                 <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-[10px]">Filter Aggregate</p>
                 <div className="flex items-baseline gap-2">
                    <h2 className="text-5xl font-black">₹{totalSpent.toLocaleString()}</h2>
                    <span className="text-slate-400 font-bold text-sm">Total Spent</span>
                 </div>
              </div>
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
           ) : (
             <AnimatePresence mode="popLayout">
               {filteredExpenses.map((exp, idx) => (
                 <motion.div
                   key={exp.expense_id}
                   initial={{ opacity: 0, scale: 0.95 }}
                   animate={{ opacity: 1, scale: 1 }}
                   exit={{ opacity: 0, scale: 0.95 }}
                   transition={{ delay: idx * 0.05 }}
                   className="group relative"
                 >
                    <Card className="border-none shadow-xl hover:shadow-2xl transition-all rounded-3xl bg-white overflow-hidden p-6 hover:-translate-y-1">
                       <div className="flex items-center justify-between">
                          <div className="flex items-center gap-5">
                             <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center group-hover:bg-primary/5 transition-colors">
                                <span className="text-2xl">
                                  {PAYMENT_MODES.find(p => p.value === exp.paymentMode)?.icon ? 
                                   <exp.paymentMode className="h-6 w-6" /> : '💰'}
                                </span>
                             </div>
                             <div>
                                <h3 className="font-bold text-slate-900 text-lg leading-tight">{exp.title}</h3>
                                <div className="flex items-center gap-3 mt-1">
                                   <span className="flex items-center gap-1 text-[10px] bg-slate-50 text-slate-500 px-2 py-0.5 rounded-full font-black uppercase tracking-tighter">
                                      <Tag className="h-2.5 w-2.5" /> {exp.category}
                                   </span>
                                   <span className="flex items-center gap-1 text-[10px] text-slate-400 font-bold">
                                      <Calendar className="h-2.5 w-2.5" /> {new Date(exp.date).toLocaleDateString()}
                                   </span>
                                </div>
                             </div>
                          </div>
                          <div className="flex items-center gap-6">
                             <div className="text-right">
                                <p className="text-2xl font-black text-red-500">-₹{exp.amount.toLocaleString()}</p>
                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{exp.paymentMode}</p>
                             </div>
                             <button 
                               onClick={() => setDeleteConfirm(exp.expense_id)}
                               className="opacity-0 group-hover:opacity-100 p-3 rounded-xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm"
                             >
                                <Trash2 className="h-5 w-5" />
                             </button>
                          </div>
                       </div>
                    </Card>
                 </motion.div>
               ))}
             </AnimatePresence>
           )}
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
              <div className="bg-slate-950 p-8 text-white relative">
                 <div className="absolute top-4 right-4 opacity-10">
                    <Receipt className="h-20 w-20" />
                 </div>
                 <h2 className="text-3xl font-black mb-1">New Expense</h2>
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
                            type="number" 
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
                    <div className="space-y-2">
                       <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Category</Label>
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
                 <Button disabled={isSubmitting} className="w-full h-14 rounded-2xl bg-slate-950 font-black text-lg shadow-2xl transition-all active:scale-95">
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