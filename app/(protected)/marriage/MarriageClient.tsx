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

  const handleEdit = (record: MarriageRecord) => {
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

  return (
    <PageWrapper>
      <div className="p-4 space-y-8 max-w-7xl mx-auto pb-32">
        {/* Header */}
        <div className="space-y-6">
           <div className="flex justify-between items-end">
             <div className="space-y-1">
                <h1 className="text-4xl font-black text-slate-900 tracking-tight">Marriage</h1>
                <p className="text-slate-500 font-medium">Manage social gifting and vayvhar.</p>
             </div>
             <Button onClick={() => { resetForm(); setShowDialog(true); }} className="rounded-2xl h-12 px-6 shadow-xl shadow-rose-200 bg-rose-600 hover:bg-rose-700 font-bold text-white">
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
                  placeholder="Filter families..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 h-14 rounded-2xl border-none bg-white shadow-lg focus-visible:ring-rose-200"
                 />
              </div>
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-4">Family Aggregates</h3>
              {loading ? (
                 [1,2,3].map(i => <Skeleton key={i} className="h-24 rounded-3xl" />)
              ) : filteredRecords.map((record, idx) => (
                        <div
                           key={record.marriage_id}
                           
                           
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
                                       <button onClick={() => handleEdit(record)} className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors">
                                          <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                       </button>
                                       <button onClick={() => setRecordToDelete(record.marriage_id)} className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors">
                                          <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                       </button>
                                    </div>
                                 </div>
                              </div>
                           </Card>
                        </div>
                    ))}

           </div>
        </div>

        {/* Dialogs */}
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
           <DialogContent className="max-w-md rounded-[2.5rem] p-0 overflow-hidden bg-white border-none shadow-2xl">
              <div className="bg-rose-600 p-8 text-white relative">
                 <div className="absolute top-4 right-4 opacity-10">
                    <Heart className="h-20 w-20 fill-current" />
                 </div>
                 <DialogTitle className="text-3xl font-black mb-1 text-white">{editingRecord ? 'Edit Entry' : 'New Vayvhar'}</DialogTitle>
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
                 <Button className="w-full h-14 rounded-2xl bg-rose-600 font-black text-lg shadow-xl shadow-rose-100 text-white">
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
