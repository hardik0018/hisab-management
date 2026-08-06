'use client'

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Heart, Trash2, Edit } from 'lucide-react';
import { secureFetch } from '@/lib/api-utils';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { toast } from 'sonner';
import { MarriageRecord } from '@/types';
import PageHeader from '@/components/PageHeader';
import AppShell from '@/components/AppShell';
import StatCard from '@/components/StatCard';
import SectionTitle from '@/components/SectionTitle';
import EmptyState from '@/components/EmptyState';

interface MarriageClientProps {
  initialRecords: MarriageRecord[];
  initialTotalGiven: number;
  initialTotalReceived: number;
  initialNetBalance: number;
  initialHasMore: boolean;
}

interface FormData {
  name: string;
  city: string;
  amount: string;
  date: string;
  logAsExpense: boolean;
}

export default function MarriageClient({ initialRecords, initialTotalGiven, initialTotalReceived, initialNetBalance, initialHasMore }: MarriageClientProps) {
  const router = useRouter();
  const [records, setRecords] = useState<MarriageRecord[]>(initialRecords);
  const [totalGiven, setTotalGiven] = useState(initialTotalGiven);
  const [totalReceived, setTotalReceived] = useState(initialTotalReceived);
  const [netBalance, setNetBalance] = useState(initialNetBalance);
  
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const observerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    setRecords(initialRecords);
    setTotalGiven(initialTotalGiven);
    setTotalReceived(initialTotalReceived);
    setNetBalance(initialNetBalance);
    setHasMore(initialHasMore);
    setPage(1);
  }, [initialRecords, initialTotalGiven, initialTotalReceived, initialNetBalance, initialHasMore]);

  const loadMore = async () => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    try {
      const nextPage = page + 1;
      const res = await secureFetch(`/api/marriage?page=${nextPage}&limit=50`);
      const data = res as unknown as { records: MarriageRecord[]; totalGiven: number; totalReceived: number; netBalance: number; hasMore: boolean };
      if (data && data.records) {
        setRecords(prev => [...prev, ...data.records]);
        setHasMore(data.hasMore);
        setTotalGiven(data.totalGiven);
        setTotalReceived(data.totalReceived);
        setNetBalance(data.netBalance);
        setPage(nextPage);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          loadMore();
        }
      },
      { rootMargin: '100px' }
    );
    if (observerRef.current) observer.observe(observerRef.current);
    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, page]);
  const [editingRecord, setEditingRecord] = useState<MarriageRecord | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [recordToDelete, setRecordToDelete] = useState<string | null>(null);
  const [recordType, setRecordType] = useState<'given' | 'received'>('given');
  
  const [formData, setFormData] = useState<FormData>({
    name: '',
    city: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    logAsExpense: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.amount) return;
    
    try {
      const url = editingRecord 
        ? `/api/marriage/${editingRecord.marriage_id}`
        : '/api/marriage';
      
      const method = editingRecord ? 'PUT' : 'POST';
      
      const amountValue = parseFloat(formData.amount);
      const finalAmount = recordType === 'given' ? amountValue : -amountValue;

      const payload = {
        ...formData,
        amount: finalAmount.toString()
      };
      
      const response = await secureFetch<{ record: MarriageRecord }>(url, {
        method,
        body: JSON.stringify(payload),
      });
      
      if (editingRecord) {
        setRecords(prev => prev.map(r => r.marriage_id === editingRecord.marriage_id ? response.record : r));
      } else {
        setRecords(prev => [response.record, ...prev]);
      }
      
      toast.success(editingRecord ? 'Record updated!' : 'Vyavhar added!');
      resetForm();
      router.refresh();
    } catch (err) {}
  };

  const handleDelete = async () => {
    if (!recordToDelete) return;
    try {
      await secureFetch(`/api/marriage/${recordToDelete}`, { method: 'DELETE' });
      toast.success('Record deleted!');
      setRecords(prev => prev.filter(r => r.marriage_id !== recordToDelete));
      router.refresh();
    } catch (err) {} 
    finally { setRecordToDelete(null); }
  };

  const handleEdit = (record: MarriageRecord) => {
    setEditingRecord(record);
    const isGiven = record.amount >= 0;
    setRecordType(isGiven ? 'given' : 'received');
    setFormData({
      name: record.name,
      city: record.city || '',
      amount: Math.abs(record.amount).toString(),
      date: new Date(record.date).toISOString().split('T')[0],
      logAsExpense: record.log_as_expense !== undefined ? !!record.log_as_expense : true,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setEditingRecord(null);
    setRecordType('given');
    setFormData({
      name: '',
      city: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      logAsExpense: true,
    });
  };

  const filteredRecords = useMemo(() => {
    return records.filter(record => 
      record.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (record.city && record.city.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [records, searchTerm]);

  return (
    <AppShell>
      <PageHeader title="Vyavhar" subtitle="Social · Marriage · Gifts" />
      
      <div className="space-y-6">
        <StatCard 
          variant="hero" 
          label="Balance of Vyavhar" 
          amount={Math.abs(netBalance)} 
          caption={netBalance >= 0 ? 'Net given' : 'Net received'} 
        />
        
        <div className="grid grid-cols-2 gap-4">
          <StatCard variant="in" label="Received" amount={totalReceived} />
          <StatCard variant="out" label="Given" amount={totalGiven} />
        </div>

        <SectionTitle>{editingRecord ? "Edit Record" : "Add Record"}</SectionTitle>
        
        <div className="card-surface p-3 flex flex-col gap-3">
          <div className="flex gap-2">
             <button 
               type="button"
               onClick={() => setRecordType('given')}
               className={`flex-1 h-8 rounded-lg text-xs font-bold transition-all ${recordType === 'given' ? 'bg-[var(--danger-soft)] text-[var(--danger)]' : 'text-[var(--muted-foreground)]'}`}
             >Given</button>
             <button 
               type="button"
               onClick={() => setRecordType('received')}
               className={`flex-1 h-8 rounded-lg text-xs font-bold transition-all ${recordType === 'received' ? 'bg-[var(--success-soft)] text-[var(--success)]' : 'text-[var(--muted-foreground)]'}`}
             >Received</button>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
             <input 
                placeholder="Name (e.g. Mehta Family)"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                style={{ background: 'var(--secondary)', border: '1px solid var(--border)', color: 'var(--foreground)' }} 
                className="h-10 px-3 rounded-xl text-sm outline-none flex-1"
             />
             <input 
                placeholder="City"
                value={formData.city}
                onChange={(e) => setFormData({...formData, city: e.target.value})}
                style={{ background: 'var(--secondary)', border: '1px solid var(--border)', color: 'var(--foreground)' }} 
                className="h-10 px-3 rounded-xl text-sm outline-none w-full sm:w-28"
             />
             <input 
                type="number"
                placeholder="Amount"
                value={formData.amount}
                onChange={(e) => setFormData({...formData, amount: e.target.value})}
                style={{ background: 'var(--secondary)', border: '1px solid var(--border)', color: 'var(--foreground)' }} 
                className="h-10 px-3 rounded-xl text-sm outline-none w-full sm:w-28"
             />
          </div>
          {recordType === 'given' && (
            <label className="flex items-center gap-2 px-1">
               <input 
                 type="checkbox"
                 checked={formData.logAsExpense}
                 onChange={(e) => setFormData({...formData, logAsExpense: e.target.checked})}
                 className="rounded border-[var(--border)] text-[var(--violet)] focus:ring-[var(--violet)]"
               />
               <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Log as daily expense</span>
            </label>
          )}
          <div className="flex gap-2">
            {editingRecord && (
              <button 
                onClick={resetForm}
                style={{ background: 'var(--secondary)', color: 'var(--foreground)' }} 
                className="h-10 px-4 rounded-xl font-bold active:scale-95 transition-all"
              >
                Cancel
              </button>
            )}
            <button 
              onClick={handleSubmit}
              style={{ backgroundImage: 'var(--gradient-hero)', color: 'white' }} 
              className="flex-1 h-10 px-4 rounded-xl font-bold active:scale-95 transition-all"
            >
              {editingRecord ? 'Update Record' : 'Save Record'}
            </button>
          </div>
        </div>

        <div className="flex justify-between items-center px-1">
          <SectionTitle>Records</SectionTitle>
          <div className="relative group w-48">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5" style={{ color: 'var(--muted-foreground)' }} />
             <input 
               value={searchTerm} 
               onChange={(e) => setSearchTerm(e.target.value)}
               placeholder="Search..." 
               className="w-full h-8 pl-8 pr-3 rounded-full text-xs outline-none bg-transparent"
               style={{ border: '1px solid var(--border)', color: 'var(--foreground)' }}
             />
          </div>
        </div>
        
        {filteredRecords.length === 0 ? (
           <EmptyState icon={Heart} title="No records yet" hint="Add your first vyavhar record above" color="--pink" />
        ) : (
           <div className="card-surface overflow-hidden">
             <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
               {filteredRecords.map(record => (
                  <div key={record.marriage_id} className="p-4 flex items-center justify-between gap-3">
                     <div className="flex items-center gap-3 min-w-0">
                        <div className="tile w-10 h-10 flex-shrink-0" style={{ background: 'var(--pink-soft)', color: 'var(--pink)' }}>
                           {record.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex flex-col">
                           <span className="font-bold text-sm truncate" style={{ color: 'var(--foreground)' }}>{record.name}</span>
                           <span className="text-xs truncate" style={{ color: 'var(--muted-foreground)' }}>
                              {record.city ? `${record.city} • ` : ''}{new Date(record.date).toLocaleDateString()}
                           </span>
                        </div>
                     </div>
                     <div className="flex items-center gap-3">
                        <span className="font-bold whitespace-nowrap" style={{ color: record.amount >= 0 ? 'var(--danger)' : 'var(--success)' }}>
                           {record.amount >= 0 ? '-' : '+'}₹{Math.abs(record.amount).toLocaleString()}
                        </span>
                        <div className="flex gap-1">
                           <button onClick={() => handleEdit(record)} className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 transition-all" style={{ color: 'var(--muted-foreground)' }}>
                              <Edit className="w-4 h-4" />
                           </button>
                           <button onClick={() => setRecordToDelete(record.marriage_id)} className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 transition-all" style={{ color: 'var(--muted-foreground)' }}>
                              <Trash2 className="w-4 h-4" />
                           </button>
                        </div>
                     </div>
                  </div>
               ))}
               {hasMore && (
                 <div ref={observerRef} className="p-4 flex justify-center items-center gap-2 text-xs font-medium text-[var(--muted-foreground)]">
                   <div className="w-4 h-4 rounded-full border-2 border-t-transparent border-[var(--primary)] animate-spin" />
                   Loading more...
                 </div>
               )}
             </div>
           </div>
        )}
      </div>

      <ConfirmDialog
        open={!!recordToDelete}
        onOpenChange={() => setRecordToDelete(null)}
        onConfirm={handleDelete}
        title="Remove Record?"
        description="Are you sure you want to permanently delete this social gifting entry?"
        confirmText="Yes, delete"
        variant="destructive"
      />
    </AppShell>
  );
}
