'use client'

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  Users, 
  Heart, 
  MapPin, 
  Calendar, 
  Trash2, 
  Edit,
  Cake,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import PageWrapper from '@/components/PageWrapper';
import { motion, AnimatePresence } from 'framer-motion';
import { secureFetch } from '@/lib/api-utils';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { MarriageRecord } from '@/types';

interface MarriageClientProps {
  initialRecords: MarriageRecord[];
}

interface FormData {
  name: string;
  city: string;
  amount: string;
  date: string;
  logAsExpense: boolean;
}

export default function MarriageClient({ initialRecords }: MarriageClientProps) {
  const [records, setRecords] = useState<MarriageRecord[]>(initialRecords);
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [editingRecord, setEditingRecord] = useState<MarriageRecord | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [recordToDelete, setRecordToDelete] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<FormData>({
    name: '',
    city: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    logAsExpense: true,
  });

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const data = await secureFetch<{ records: MarriageRecord[] }>('/api/marriage');
      setRecords(data.records || []);
    } catch (err) {
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingRecord 
        ? `/api/marriage/${editingRecord.marriage_id}`
        : '/api/marriage';
      
      const method = editingRecord ? 'PUT' : 'POST';
      
      const response = await secureFetch<{ record: MarriageRecord }>(url, {
        method,
        body: JSON.stringify(formData),
      });
      
      if (editingRecord) {
        setRecords(prev => prev.map(r => r.marriage_id === editingRecord.marriage_id ? response.record : r));
      } else {
        setRecords(prev => [response.record, ...prev]);
      }
      
      toast.success(editingRecord ? 'Record updated!' : 'Vayvhar added!');
      setShowDialog(false);
      resetForm();
    } catch (err) {}
  };

  const handleDelete = async () => {
    if (!recordToDelete) return;
    try {
      await secureFetch(`/api/marriage/${recordToDelete}`, { method: 'DELETE' });
      toast.success('Record deleted!');
      setRecords(prev => prev.filter(r => r.marriage_id !== recordToDelete));
    } catch (err) {} 
    finally { setRecordToDelete(null); }
  };

  const handleEdit = (record: MarriageRecord) => {
    setEditingRecord(record);
    setFormData({
      name: record.name,
      city: record.city || '',
      amount: record.amount.toString(),
      date: new Date(record.date).toISOString().split('T')[0],
      logAsExpense: record.log_as_expense !== undefined ? !!record.log_as_expense : true,
    });
    setShowDialog(true);
  };

  const resetForm = () => {
    setEditingRecord(null);
    setFormData({
      name: '',
      city: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      logAsExpense: true,
    });
  };

  const filteredRecords = records.filter(record => 
    record.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (record.city && record.city.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalAmount = filteredRecords.reduce((sum, r) => sum + r.amount, 0);

  // Group records by year
  const groupedRecords: { [year: string]: MarriageRecord[] } = {};
  filteredRecords.forEach(record => {
    const dateObj = new Date(record.date);
    const year = isNaN(dateObj.getTime()) ? 'Unknown' : dateObj.getFullYear().toString();
    if (!groupedRecords[year]) groupedRecords[year] = [];
    groupedRecords[year].push(record);
  });

  const sortedYears = Object.keys(groupedRecords).sort((a, b) => {
    if (a === 'Unknown') return 1;
    if (b === 'Unknown') return -1;
    return parseInt(b) - parseInt(a);
  });

  return (
    <PageWrapper>
      <div className="p-4 space-y-8 max-w-7xl mx-auto pb-32">
        {/* Header */}
        <div className="space-y-6">
           <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
             <div className="space-y-1">
                <h1 className="text-4xl font-black text-slate-900 tracking-tight">
                  Marriage <span className="text-rose-600 italic">Vayvhar</span>
                </h1>
                <p className="text-slate-500 font-medium">Manage social gifting and relationship tokens.</p>
             </div>
             <Button onClick={() => { resetForm(); setShowDialog(true); }} className="rounded-2xl h-12 px-6 shadow-xl shadow-rose-100 bg-rose-600 hover:bg-rose-700 font-bold text-white w-full sm:w-auto transition-transform active:scale-95">
                <Heart className="mr-2 h-5 w-5 fill-current" /> Add Vayvhar
             </Button>
           </div>

           {/* Hero Card */}
           <Card className="border-none shadow-xl bg-gradient-to-br from-rose-600 to-rose-700 text-white rounded-[1.5rem] sm:rounded-[2.5rem] overflow-hidden relative">
              <CardContent className="p-5 sm:p-10 relative z-10">
                 <div className="flex items-center gap-4 sm:gap-8">
                    <div className="w-16 h-16 sm:w-28 sm:h-28 rounded-2xl sm:rounded-[2rem] bg-white/10 flex items-center justify-center flex-shrink-0 backdrop-blur-sm border border-white/10">
                       <Users className="h-8 w-8 sm:h-14 sm:w-14 text-rose-100" />
                    </div>
                    <div className="space-y-0.5 sm:space-y-2">
                       <p className="text-rose-100 font-black uppercase tracking-[0.1em] sm:tracking-[0.2em] text-[8px] sm:text-xs">Total Social Gifting</p>
                       <div className="flex items-baseline gap-1.5 sm:gap-3">
                          <h2 className="text-2xl sm:text-6xl font-black italic text-white">₹{totalAmount.toLocaleString()}</h2>
                          <span className="text-rose-100/60 font-medium text-[8px] sm:text-base">Given</span>
                       </div>
                       <p className="text-rose-100/80 text-[8px] sm:text-sm font-bold flex items-center">
                          <Cake className="h-2.5 w-2.5 sm:h-5 sm:w-5 mr-1.5 opacity-70" /> {filteredRecords.length} celebrations
                       </p>
                    </div>
                 </div>
              </CardContent>
           </Card>
        </div>

        {/* Search & Layout */}
        <div className="">
           <div className="lg:col-span-2 space-y-4">
             <div className="relative group">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-rose-600 transition-colors" />
                 <Input 
                  placeholder="Search by family name or city location..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 h-14 rounded-2xl border-2 border-slate-100 bg-white shadow-sm focus-visible:ring-4 focus-visible:ring-rose-50 focus-visible:border-rose-600 transition-all font-medium"
                 />
              </div>
              
              {loading ? (
                 <div className="space-y-4 mt-8">
                   {[1,2,3].map(i => <Skeleton key={i} className="h-24 rounded-3xl" />)}
                 </div>
              ) : (
                 <AnimatePresence mode="popLayout">
                    {sortedYears.map((year) => (
                      <motion.div 
                        key={year} 
                        layout 
                        initial={{ opacity: 0, y: 20 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        exit={{ opacity: 0, scale: 0.95 }} 
                        className="mb-8 pt-4"
                      >
                         <div className="flex items-center gap-3 mb-4 ml-1">
                           <div className="px-4 py-1.5 bg-rose-50 text-rose-600 font-black rounded-xl text-xs sm:text-sm uppercase tracking-widest flex items-center gap-2 shadow-sm">
                              <Calendar className="h-3.5 w-3.5" /> {year} Year
                           </div>
                           <div className="h-px bg-slate-200 flex-1 ml-2" />
                         </div>
                         
                         <div className="space-y-3 sm:space-y-4">
                           {groupedRecords[year].map((record, idx) => (
                               <motion.div
                                  key={record.marriage_id}
                                  layout
                                  initial={{ opacity: 0, x: 20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  exit={{ opacity: 0, scale: 0.95 }}
                                  transition={{ delay: idx * 0.05 }}
                               >
                                  <Card className="group border-none shadow-lg hover:shadow-xl rounded-2xl sm:rounded-3xl bg-white overflow-hidden p-3 sm:p-5 hover:-translate-y-0.5 transition-all">
                                     <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-3 sm:gap-5 flex-1 min-w-0">
                                          
                                              <div className="w-12 h-12 font-bold rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                                                {record.name.charAt(0).toUpperCase()}
                                             </div>
                                          
                                           <div className="min-w-0">
                                              <h3 className="font-bold text-slate-900 leading-tight text-sm sm:text-lg truncate">{record.name}</h3>
                                              <div className="flex items-center gap-2 mt-0.5 sm:mt-1">
                                                 <div className="flex items-center gap-1 text-[8px] sm:text-[10px] text-slate-600 font-bold uppercase truncate">
                                                    <MapPin className="h-2 w-2 sm:h-2.5 sm:w-2.5" />
                                                    <span className="truncate max-w-[60px] sm:max-w-none">{record.city || 'No City'}</span>
                                                    <span className="mx-1">-</span>
                                                    <Calendar className="h-2 w-2 sm:h-2.5 sm:w-2.5" /> {new Date(record.date).toLocaleDateString()}
                                                 </div>
                                              </div>
                                           </div>
                                        </div>
                                        <div className="flex items-center gap-3 sm:gap-4">
                                           <div className="text-right flex-shrink-0">
                                              <p className="text-lg sm:text-2xl font-black text-rose-600">₹{record.amount.toLocaleString()}</p>
                                           </div>
                                           <div className="flex gap-1 transition-all scale-90 sm:scale-95 group-hover:scale-100 flex-shrink-0">
                                              <button onClick={() => handleEdit(record)} className="p-2.5 sm:p-2 rounded-xl bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors focus:outline-none focus:ring-0 focus-visible:ring-0 flex items-center justify-center">
                                                 <Edit className="h-4 w-4 sm:h-4 sm:w-4" />
                                              </button>
                                              <button onClick={() => setRecordToDelete(record.marriage_id)} className="p-2.5 sm:p-2 rounded-xl bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors focus:outline-none focus:ring-0 focus-visible:ring-0 flex items-center justify-center">
                                                 <Trash2 className="h-4 w-4 sm:h-4 sm:w-4" />
                                              </button>
                                           </div>
                                        </div>
                                     </div>
                                  </Card>
                               </motion.div>
                           ))}
                         </div>
                      </motion.div>
                    ))}
                 </AnimatePresence>
              )}
           </div>
        </div>

        {/* Dialogs */}
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogContent className="max-w-md w-[92vw] sm:w-full rounded-[2rem] sm:rounded-[2.5rem] p-0 overflow-hidden bg-white border-none shadow-2xl">
               <div className="bg-rose-600 p-6 sm:p-8 text-white relative">
                  <div className="absolute top-4 right-4 opacity-10">
                     <Heart className="h-16 w-16 sm:h-20 sm:w-20 fill-current" />
                  </div>
                  <DialogTitle className="text-2xl sm:text-3xl font-black mb-1 text-white">{editingRecord ? 'Edit Entry' : 'New Vayvhar'}</DialogTitle>
                  <p className="text-rose-100 text-xs sm:text-sm font-medium">Capture relationship tokens & gifts.</p>
               </div>
               <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
                  <div className="space-y-4">
                     <div className="space-y-1.5">
                        <Label className="text-[10px] font-black tracking-widest uppercase text-slate-400 ml-1">Family / Person Name</Label>
                        <Input 
                         placeholder="e.g. Mehta Family"
                         value={formData.name}
                         onChange={(e) => setFormData({...formData, name: e.target.value})}
                         className="h-12 rounded-xl bg-slate-50 border-2 border-transparent focus-visible:border-rose-600 focus-visible:ring-4 focus-visible:ring-rose-50 transition-all font-bold px-4"
                         required
                        />
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                           <Label className="text-[10px] font-black tracking-widest uppercase text-slate-400 ml-1">City / Location</Label>
                           <Input 
                            placeholder="e.g. Mumbai"
                            value={formData.city}
                            onChange={(e) => setFormData({...formData, city: e.target.value})}
                            className="h-12 rounded-xl bg-slate-50 border-2 border-transparent focus-visible:border-rose-600 focus-visible:ring-4 focus-visible:ring-rose-50 transition-all font-medium px-4"
                           />
                        </div>
                        <div className="space-y-1.5">
                           <Label className="text-[10px] font-black tracking-widest uppercase text-slate-400 ml-1">Amount (₹)</Label>
                           <Input 
                             type="number"
                             placeholder="0.00"
                             value={formData.amount}
                             onChange={(e) => setFormData({...formData, amount: e.target.value})}
                             className="h-12 rounded-xl bg-slate-50 border-2 border-transparent focus-visible:border-rose-600 focus-visible:ring-4 focus-visible:ring-rose-50 transition-all font-black text-lg px-4"
                             required
                             min="1"
                           />
                        </div>
                     </div>
                     <div className="space-y-1.5">
                        <Label className="text-[10px] font-black tracking-widest uppercase text-slate-400 ml-1">Date of Event</Label>
                        <Input 
                          type="date"
                          value={formData.date}
                          onChange={(e) => setFormData({...formData, date: e.target.value})}
                          className="h-12 rounded-xl bg-slate-50 border-2 border-transparent focus-visible:border-rose-600 focus-visible:ring-4 focus-visible:ring-rose-50 transition-all font-bold px-4"
                          required
                        />
                     </div>
                     <div className="space-y-2 pt-1">
                        <label className="flex items-center gap-3 cursor-pointer p-3 bg-slate-50 hover:bg-slate-100/70 border border-slate-100 rounded-xl transition-all select-none">
                           <input 
                             type="checkbox"
                             checked={formData.logAsExpense}
                             onChange={(e) => setFormData({...formData, logAsExpense: e.target.checked})}
                             className="h-4 w-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500 cursor-pointer"
                           />
                           <div className="flex flex-col">
                              <span className="text-xs font-bold text-slate-700">Sync with Daily Expenses</span>
                              <span className="text-[10px] text-slate-400 font-semibold leading-tight mt-0.5">Automatically log this gifting as a daily wedding expense.</span>
                           </div>
                        </label>
                     </div>
                  </div>
                  <Button className="w-full h-14 rounded-2xl bg-rose-600 hover:bg-rose-700 font-black text-lg shadow-xl shadow-rose-100 text-white transition-transform active:scale-98">
                     {editingRecord ? 'Update Record' : 'Record Vayvhar'}
                  </Button>
               </form>
            </DialogContent>
         </Dialog>

        <ConfirmDialog
          open={!!recordToDelete}
          onOpenChange={() => setRecordToDelete(null)}
          onConfirm={handleDelete}
          title="Remove Record?"
          description="Are you sure you want to permanently delete this social gifting entry?"
          confirmText="Yes, delete"
          variant="destructive"
        />
      </div>
    </PageWrapper>
  );
}
