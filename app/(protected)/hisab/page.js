'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Plus, 
  Search, 
  ArrowUpRight, 
  ArrowDownLeft, 
  User, 
  Calendar, 
  Trash2,
  Filter,
  Users,
  AlertCircle,
  MoreVertical,
  ChevronRight,
  HandCoins
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import PageWrapper from '@/components/PageWrapper';
import { motion, AnimatePresence } from 'framer-motion';
import { secureFetch } from '@/lib/api-utils';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function HisabPage() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    type: 'debit',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const data = await secureFetch('/api/hisab');
      setRecords(data.records || []);
    } catch (err) {} 
    finally { setLoading(false); }
  };

  const handleAddRecord = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await secureFetch('/api/hisab', {
        method: 'POST',
        body: JSON.stringify({ ...formData, amount: parseFloat(formData.amount) }),
      });
      toast.success('Transaction recorded');
      setShowAddDialog(false);
      setFormData({ name: '', type: 'debit', amount: '', description: '', date: new Date().toISOString().split('T')[0] });
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
    } catch (err) {} 
    finally { setDeleteConfirm(null); }
  };

  const filteredRecords = records.filter(r => 
    r.name.toLowerCase().includes(search.toLowerCase())
  );

  const totalDebit = filteredRecords.filter(r => r.type === 'debit').reduce((sum, r) => sum + r.amount, 0);
  const totalCredit = filteredRecords.filter(r => r.type === 'credit').reduce((sum, r) => sum + r.amount, 0);
  const netBalance = totalCredit - totalDebit;

  const peopleGroups = filteredRecords.reduce((acc, r) => {
    if (!acc[r.name]) acc[r.name] = { debit: 0, credit: 0, latest: r.date };
    acc[r.name][r.type] += r.amount;
    return acc;
  }, {});

  return (
    <PageWrapper>
      <div className="p-4 space-y-8 max-w-5xl mx-auto pb-32">
        {/* Header */}
        <div className="space-y-6">
           <div className="flex justify-between items-end">
             <div className="space-y-1">
                <h1 className="text-4xl font-black text-slate-900 tracking-tight">Hisab</h1>
                <p className="text-slate-500 font-medium">Manage your personal debit-credit.</p>
             </div>
             <Button onClick={() => setShowAddDialog(true)} className="rounded-2xl h-12 px-6 shadow-xl shadow-indigo-200 bg-indigo-600 hover:bg-indigo-700 font-bold">
                <Plus className="mr-2 h-5 w-5" /> Log Transaction
             </Button>
           </div>

           {/* Summary Cards */}
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <SummaryCard label="I Gave (Debit)" value={totalDebit} color="red" icon={ArrowUpRight} />
              <SummaryCard label="I Took (Credit)" value={totalCredit} color="green" icon={ArrowDownLeft} />
              <SummaryCard label="Net Balance" value={netBalance} color={netBalance >= 0 ? 'green' : 'red'} icon={Wallet} />
           </div>
        </div>

        {/* Search & Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <div className="lg:col-span-1 space-y-6">
              <div className="relative group">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                 <Input 
                  placeholder="Filter by person..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-12 h-14 rounded-2xl border-none bg-white shadow-lg focus-visible:ring-indigo-600"
                 />
              </div>

              <div className="space-y-4">
                 <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-4">People Involved</h3>
                 {Object.keys(peopleGroups).length === 0 ? (
                    <p className="text-center py-8 text-slate-400 text-sm font-medium italic">No groups to show</p>
                 ) : (
                    Object.entries(peopleGroups).map(([name, stats], idx) => (
                       <Card key={idx} className="border-none shadow-md rounded-2xl overflow-hidden hover:scale-[1.02] transition-transform">
                          <CardContent className="p-4 flex items-center justify-between">
                             <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                                   <User className="h-5 w-5" />
                                </div>
                                <div>
                                   <p className="font-bold text-slate-900 leading-tight">{name}</p>
                                   <p className="text-[10px] text-slate-400 font-medium">Last: {new Date(stats.latest).toLocaleDateString()}</p>
                                </div>
                             </div>
                             <div className="text-right">
                                <p className={`font-black text-sm ${stats.credit - stats.debit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                   ₹{Math.abs(stats.credit - stats.debit).toLocaleString()}
                                </p>
                                <p className="text-[8px] font-bold uppercase text-slate-300">{stats.credit - stats.debit >= 0 ? 'To Return' : 'Give Him'}</p>
                             </div>
                          </CardContent>
                       </Card>
                    ))
                 )}
              </div>
           </div>

           <div className="lg:col-span-2 space-y-4">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-4">Detailed Transaction Log</h3>
              {loading ? (
                 [1,2,3].map(i => <Skeleton key={i} className="h-24 rounded-3xl" />)
              ) : (
                 <AnimatePresence mode="popLayout">
                    {filteredRecords.map((r, idx) => (
                       <motion.div
                        key={r.hisab_id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ delay: idx * 0.05 }}
                       >
                          <Card className="border-none shadow-xl rounded-3xl bg-white overflow-hidden p-6 group">
                             <div className="flex items-center justify-between">
                                <div className="flex items-center gap-5">
                                   <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${r.type === 'debit' ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-500'}`}>
                                      {r.type === 'debit' ? <ArrowUpRight className="h-6 w-6" /> : <ArrowDownLeft className="h-6 w-6" />}
                                   </div>
                                   <div>
                                      <h3 className="font-bold text-slate-900 leading-tight">{r.name}</h3>
                                      <p className="text-xs text-slate-500 line-clamp-1">{r.description || 'No description'}</p>
                                      <span className="text-[9px] text-slate-300 font-bold mt-1 block">{new Date(r.date).toLocaleDateString()}</span>
                                   </div>
                                </div>
                                <div className="flex items-center gap-4">
                                   <div className="text-right">
                                      <p className={`text-xl font-black ${r.type === 'debit' ? 'text-red-500' : 'text-green-500'}`}>
                                         ₹{r.amount.toLocaleString()}
                                      </p>
                                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{r.type}</span>
                                   </div>
                                   <button 
                                    onClick={() => setDeleteConfirm(r.hisab_id)}
                                    className="opacity-0 group-hover:opacity-100 p-2 rounded-xl bg-slate-50 text-slate-400 hover:text-red-500 transition-all"
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
           </div>
        </div>

        {/* Add Dialog */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
           <DialogContent className="max-w-md rounded-[2.5rem] p-0 overflow-hidden bg-white border-none shadow-2xl">
              <div className="bg-indigo-600 p-8 text-white relative">
                 <div className="absolute top-4 right-4 opacity-10">
                    <HandCoins className="h-20 w-20" />
                 </div>
                 <h2 className="text-3xl font-black mb-1">New Entry</h2>
                 <p className="text-indigo-100 text-sm font-medium">Capture a new money exchange.</p>
              </div>
              <form onSubmit={handleAddRecord} className="p-8 space-y-6">
                 <div className="space-y-4">
                    <div className="space-y-2">
                       <Label className="text-[10px] font-black tracking-widest uppercase text-slate-400 ml-1">Person Name</Label>
                       <Input 
                        placeholder="e.g. Rahul Sharma"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="h-12 rounded-xl bg-slate-50 border-none px-4"
                        required
                       />
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
                            type="number"
                            placeholder="0.00"
                            value={formData.amount}
                            onChange={(e) => setFormData({...formData, amount: e.target.value})}
                            className="h-12 rounded-xl bg-slate-50 border-none px-4 font-black text-lg"
                            required
                          />
                       </div>
                    </div>
                    <div className="space-y-2">
                       <Label className="text-[10px] font-black tracking-widest uppercase text-slate-400 ml-1">Description (Optional)</Label>
                       <Input 
                        placeholder="Purpose of transaction..."
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        className="h-12 rounded-xl bg-slate-50 border-none px-4"
                       />
                    </div>
                 </div>
                 <Button disabled={isSubmitting} className="w-full h-14 rounded-2xl bg-indigo-600 font-black text-lg shadow-xl shadow-indigo-100">
                    {isSubmitting ? 'Recording...' : 'Record Transaction'}
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

function SummaryCard({ label, value, color, icon: Icon }) {
   const colors = {
      red: "text-red-500 bg-red-50",
      green: "text-green-500 bg-green-50",
      blue: "text-blue-500 bg-blue-50"
   };
   
   return (
      <Card className="border-none shadow-xl rounded-[2rem] bg-white p-6 relative overflow-hidden group">
         <div className={`absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity`}>
            <Icon className="h-16 w-16" />
         </div>
         <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{label}</p>
            <h3 className={`text-3xl font-black ${colors[color].split(' ')[0]}`}>₹{Math.abs(value).toLocaleString()}</h3>
         </div>
         <div className={`mt-4 w-10 h-10 rounded-xl ${colors[color]} flex items-center justify-center`}>
            <Icon className="h-5 w-5" />
         </div>
      </Card>
   );
}

function Wallet() { return <HandCoins className="h-6 w-6" />; }