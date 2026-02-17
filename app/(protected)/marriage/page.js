'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Plus, 
  Search, 
  Users, 
  Heart, 
  MapPin, 
  Calendar, 
  Trash2, 
  Edit,
  Cake,
  Filter,
  Users2
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import PageWrapper from '@/components/PageWrapper';
import { motion, AnimatePresence } from 'framer-motion';
import { secureFetch } from '@/lib/api-utils';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function MarriagePage() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [recordToDelete, setRecordToDelete] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    city: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const data = await secureFetch('/api/marriage');
      setRecords(data.records || []);
    } catch (err) {} 
    finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingRecord 
        ? `/api/marriage/${editingRecord.marriage_id}`
        : '/api/marriage';
      
      const method = editingRecord ? 'PUT' : 'POST';
      
      await secureFetch(url, {
        method,
        body: JSON.stringify(formData),
      });
      
      toast.success(editingRecord ? 'Record updated!' : 'Vayvhar added!');
      setShowDialog(false);
      resetForm();
      fetchRecords();
    } catch (err) {}
  };

  const handleDelete = async () => {
    if (!recordToDelete) return;
    try {
      await secureFetch(`/api/marriage/${recordToDelete}`, { method: 'DELETE' });
      toast.success('Record deleted!');
      fetchRecords();
    } catch (err) {} 
    finally { setRecordToDelete(null); }
  };

  const handleEdit = (record) => {
    setEditingRecord(record);
    setFormData({
      name: record.name,
      city: record.city || '',
      amount: record.amount.toString(),
      date: new Date(record.date).toISOString().split('T')[0],
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
    });
  };

  const filteredRecords = records.filter(record => 
    record.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (record.city && record.city.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalAmount = filteredRecords.reduce((sum, r) => sum + r.amount, 0);

  const groupedByPerson = filteredRecords.reduce((acc, record) => {
    if (!acc[record.name]) {
      acc[record.name] = { total: 0, city: record.city, count: 0 };
    }
    acc[record.name].total += record.amount;
    acc[record.name].count += 1;
    return acc;
  }, {});

  return (
    <PageWrapper>
      <div className="p-4 space-y-8 max-w-5xl mx-auto pb-32">
        {/* Header */}
        <div className="space-y-6">
           <div className="flex justify-between items-end">
             <div className="space-y-1">
                <h1 className="text-4xl font-black text-slate-900 tracking-tight">Marriage</h1>
                <p className="text-slate-500 font-medium">Manage social gifting and vayvhar.</p>
             </div>
             <Button onClick={() => { resetForm(); setShowDialog(true); }} className="rounded-2xl h-12 px-6 shadow-xl shadow-rose-200 bg-rose-600 hover:bg-rose-700 font-bold">
                <Heart className="mr-2 h-5 w-5 fill-current" /> Add Vayvhar
             </Button>
           </div>

           {/* Hero Card */}
           <Card className="border-none shadow-2xl bg-gradient-to-br from-rose-600 to-rose-700 text-white rounded-[2.5rem] overflow-hidden relative">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                 <Users2 className="h-32 w-32 rotate-12" />
              </div>
              <CardContent className="p-8 relative z-10 space-y-2">
                 <p className="text-rose-100 font-black uppercase tracking-[0.2em] text-[10px]">Total Social Gifting</p>
                 <div className="flex items-baseline gap-2">
                    <h2 className="text-5xl font-black">₹{totalAmount.toLocaleString()}</h2>
                    <span className="text-rose-100/60 font-medium text-sm">Given</span>
                 </div>
                 <p className="text-rose-100/80 text-xs font-bold pt-4 flex items-center">
                    <Cake className="h-4 w-4 mr-2" /> Shared across {filteredRecords.length} celebrations
                 </p>
              </CardContent>
           </Card>
        </div>

        {/* Search & Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <div className="lg:col-span-1 space-y-6">
              <div className="relative group">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-rose-600 transition-colors" />
                 <Input 
                  placeholder="Filter families..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 h-14 rounded-2xl border-none bg-white shadow-lg focus-visible:ring-rose-200"
                 />
              </div>

              <div className="space-y-4">
                 <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-4">Family Aggregates</h3>
                 <div className="space-y-3">
                    {Object.entries(groupedByPerson).length === 0 ? (
                       <p className="text-center py-8 text-slate-400 text-sm italic font-medium">No family records</p>
                    ) : (
                       Object.entries(groupedByPerson).map(([name, data]) => (
                          <motion.div key={name} layout>
                             <Card className="border-none shadow-md rounded-2xl overflow-hidden hover:scale-[1.02] transition-transform bg-white">
                                <CardContent className="p-4 flex items-center justify-between">
                                   <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-black">
                                         {name.charAt(0).toUpperCase()}
                                      </div>
                                      <div>
                                         <p className="font-bold text-slate-900 leading-tight">{name}</p>
                                         <p className="text-[10px] text-slate-400 font-medium flex items-center">
                                            <MapPin className="h-2.5 w-2.5 mr-1" /> {data.city || 'N/A'}
                                         </p>
                                      </div>
                                   </div>
                                   <div className="text-right">
                                      <p className="text-sm font-black text-rose-600">₹{data.total.toLocaleString()}</p>
                                      <p className="text-[9px] font-black text-slate-300 uppercase leading-none">{data.count} Events</p>
                                   </div>
                                </CardContent>
                             </Card>
                          </motion.div>
                       ))
                    )}
                 </div>
              </div>
           </div>

           <div className="lg:col-span-2 space-y-4">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-4">Event Timeline</h3>
              {loading ? (
                 [1,2,3].map(i => <Skeleton key={i} className="h-24 rounded-3xl" />)
              ) : (
                 <AnimatePresence mode="popLayout">
                    {filteredRecords.map((record, idx) => (
                       <motion.div
                          key={record.marriage_id}
                          layout
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ delay: idx * 0.05 }}
                       >
                          <Card className="group border-none shadow-xl rounded-3xl bg-white overflow-hidden p-6 hover:-translate-y-1 transition-all">
                             <div className="flex items-center justify-between">
                                <div className="flex items-center gap-5">
                                   <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-rose-50 group-hover:text-rose-400 transition-colors">
                                      <Users className="h-6 w-6" />
                                   </div>
                                   <div>
                                      <h3 className="font-bold text-slate-900 leading-tight text-lg">{record.name}</h3>
                                      <div className="flex items-center gap-3 mt-1">
                                         <span className="text-[10px] bg-indigo-50 text-indigo-500 px-2 py-0.5 rounded-full font-black uppercase tracking-tighter">Event</span>
                                         <span className="flex items-center gap-1 text-[10px] text-slate-400 font-bold uppercase">
                                            <Calendar className="h-2.5 w-2.5" /> {new Date(record.date).toLocaleDateString()}
                                         </span>
                                      </div>
                                   </div>
                                </div>
                                <div className="flex items-center gap-4">
                                   <div className="text-right">
                                      <p className="text-2xl font-black text-rose-600">₹{record.amount.toLocaleString()}</p>
                                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-300">{record.city || 'No City'}</p>
                                   </div>
                                   <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all scale-95 group-hover:scale-100">
                                      <button onClick={() => handleEdit(record)} className="p-2 rounded-xl bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors">
                                         <Edit className="h-4 w-4" />
                                      </button>
                                      <button onClick={() => setRecordToDelete(record.marriage_id)} className="p-2 rounded-xl bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors">
                                         <Trash2 className="h-4 w-4" />
                                      </button>
                                   </div>
                                </div>
                             </div>
                          </Card>
                       </motion.div>
                    ))}
                 </AnimatePresence>
              )}
           </div>
        </div>

        {/* Dialogs */}
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
           <DialogContent className="max-w-md rounded-[2.5rem] p-0 overflow-hidden bg-white border-none shadow-2xl">
              <div className="bg-rose-600 p-8 text-white relative">
                 <div className="absolute top-4 right-4 opacity-10">
                    <Heart className="h-20 w-20 fill-current" />
                 </div>
                 <h2 className="text-3xl font-black mb-1">{editingRecord ? 'Edit Entry' : 'New Vayvhar'}</h2>
                 <p className="text-rose-100 text-sm font-medium">Capture relationship tokens & gifts.</p>
              </div>
              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                 <div className="space-y-4">
                    <div className="space-y-2">
                       <Label className="text-[10px] font-black tracking-widest uppercase text-slate-400 ml-1">Family / Person Name</Label>
                       <Input 
                        placeholder="e.g. Mehta Family"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="h-12 rounded-xl bg-slate-50 border-none px-4"
                        required
                       />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-2">
                          <Label className="text-[10px] font-black tracking-widest uppercase text-slate-400 ml-1">City / Location</Label>
                          <Input 
                           placeholder="e.g. Mumbai"
                           value={formData.city}
                           onChange={(e) => setFormData({...formData, city: e.target.value})}
                           className="h-12 rounded-xl bg-slate-50 border-none px-4"
                          />
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
                       <Label className="text-[10px] font-black tracking-widest uppercase text-slate-400 ml-1">Date of Event</Label>
                       <Input 
                         type="date"
                         value={formData.date}
                         onChange={(e) => setFormData({...formData, date: e.target.value})}
                         className="h-12 rounded-xl bg-slate-50 border-none px-4 font-bold"
                         required
                       />
                    </div>
                 </div>
                 <Button className="w-full h-14 rounded-2xl bg-rose-600 font-black text-lg shadow-xl shadow-rose-100">
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