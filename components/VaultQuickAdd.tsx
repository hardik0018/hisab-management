'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { secureFetch } from '@/lib/api-utils';
import { Loader2, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

type QuickAddType = 'bike' | 'puc' | 'license' | 'bill' | 'life' | 'warranty';

interface VaultQuickAddProps {
  onSaved: () => void;
}

const todayStr = () => new Date().toISOString().slice(0, 10);

export function VaultQuickAdd({ onSaved }: VaultQuickAddProps) {
  const [type, setType] = useState<QuickAddType>('bike');
  const [loading, setLoading] = useState(false);
  const [f, setF] = useState<any>({
    startDate: todayStr(),
    nextDueDate: todayStr(),
    purchaseDate: todayStr()
  });

  const handleTypeChange = (val: QuickAddType) => {
    setType(val);
    setF({
      startDate: todayStr(),
      nextDueDate: todayStr(),
      purchaseDate: todayStr(),
      premiumFrequency: val === 'life' ? 'yearly' : 'one_time',
    });
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      if (type === 'bike' || type === 'puc' || type === 'license' || type === 'life') {
        const payload: any = {
          category: type === 'bike' ? 'vehicle' : type === 'life' ? 'life' : type,
          policyName: f.policyName || (type === 'puc' ? `PUC - ${f.vehicleNo}` : type === 'license' ? f.licenseName : 'Bike Insurance'),
          provider: f.provider || 'N/A',
          policyNumber: f.policyNumber || f.vehicleNo || f.licenseNo || 'N/A',
          holderName: f.holderName || 'Self',
          premiumAmount: Number(f.amount || 0),
          premiumFrequency: f.premiumFrequency || 'one_time',
          startDate: f.startDate,
          nextDueDate: f.nextDueDate,
        };
        await secureFetch('/api/insurance', { method: 'POST', body: JSON.stringify(payload) });
      } else {
        const payload: any = {
          itemName: f.itemName,
          category: type === 'bill' ? 'other' : 'appliance',
          vendor: f.vendor || '',
          purchaseAmount: Number(f.amount || 0),
          purchaseDate: f.purchaseDate,
          warrantyMonths: Number(f.warrantyMonths || 12),
        };
        await secureFetch('/api/warranty', { method: 'POST', body: JSON.stringify(payload) });
      }
      
      toast.success('Added to Vault!');
      setF({ startDate: todayStr(), nextDueDate: todayStr(), purchaseDate: todayStr() });
      onSaved();
    } catch (e: any) {
      toast.error(e.message || 'Failed to add');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card-surface p-4 rounded-2xl mb-8 border shadow-sm relative overflow-hidden" style={{ borderColor: 'var(--border)' }}>

      <div className="flex items-center gap-2 mb-4 relative z-10">
        <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}>
          <Zap className="w-4 h-4 fill-current" />
        </div>
        <h3 className="font-bold text-base" style={{ color: 'var(--foreground)' }}>Fast Add</h3>
      </div>

      <div className="space-y-5 relative z-10">
        <div>
          <Label className="text-xs font-bold text-muted-foreground mb-2 block">What are you adding?</Label>
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'bike', label: 'Bike Insurance' },
              { id: 'puc', label: 'PUC' },
              { id: 'license', label: 'License' },
              { id: 'bill', label: 'Item Bill' },
              { id: 'life', label: 'Life/Health Policy' },
              { id: 'warranty', label: 'Warranty' },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => handleTypeChange(t.id as QuickAddType)}
                className={cn(
                  "px-3.5 py-1.5 rounded-full text-[13px] font-bold transition-all border",
                  type === t.id 
                    ? "shadow-sm" 
                    : "bg-transparent text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5"
                )}
                style={type === t.id ? { background: 'var(--primary)', color: '#fff', borderColor: 'var(--primary)' } : { borderColor: 'var(--border)' }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-2">
          {type === 'bike' && (
            <>
              <Input placeholder="Provider (e.g. ICICI Lombard)" value={f.provider || ''} onChange={e => setF({...f, provider: e.target.value})} className="text-sm" />
              <Input placeholder="Policy No." value={f.policyNumber || ''} onChange={e => setF({...f, policyNumber: e.target.value})} className="text-sm" />
              <Input type="number" placeholder="Premium Amount (₹)" value={f.amount || ''} onChange={e => setF({...f, amount: e.target.value})} className="text-sm" />
              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground ml-1">Expiry Date</Label>
                <Input type="date" value={f.nextDueDate || ''} onChange={e => setF({...f, nextDueDate: e.target.value})} className="text-sm" />
              </div>
            </>
          )}

          {type === 'puc' && (
            <>
              <Input placeholder="Vehicle No. (e.g. GJ01AB1234)" value={f.vehicleNo || ''} onChange={e => setF({...f, vehicleNo: e.target.value})} className="text-sm" />
              <Input type="number" placeholder="Amount (₹) (Optional)" value={f.amount || ''} onChange={e => setF({...f, amount: e.target.value})} className="text-sm" />
              <div className="space-y-1 sm:col-span-2">
                <Label className="text-[10px] text-muted-foreground ml-1">Expiry Date</Label>
                <Input type="date" value={f.nextDueDate || ''} onChange={e => setF({...f, nextDueDate: e.target.value})} className="text-sm w-full sm:w-1/2 pr-2" />
              </div>
            </>
          )}

          {type === 'license' && (
            <>
              <Input placeholder="License Name (e.g. Driving License)" value={f.licenseName || ''} onChange={e => setF({...f, licenseName: e.target.value})} className="text-sm" />
              <Input placeholder="License No." value={f.licenseNo || ''} onChange={e => setF({...f, licenseNo: e.target.value})} className="text-sm" />
              <div className="space-y-1 sm:col-span-2">
                <Label className="text-[10px] text-muted-foreground ml-1">Expiry Date</Label>
                <Input type="date" value={f.nextDueDate || ''} onChange={e => setF({...f, nextDueDate: e.target.value})} className="text-sm w-full sm:w-1/2 pr-2" />
              </div>
            </>
          )}

          {type === 'bill' && (
            <>
              <Input placeholder="Item Name (e.g. Laptop)" value={f.itemName || ''} onChange={e => setF({...f, itemName: e.target.value})} className="text-sm" />
              <Input placeholder="Vendor / Store" value={f.vendor || ''} onChange={e => setF({...f, vendor: e.target.value})} className="text-sm" />
              <Input type="number" placeholder="Amount (₹)" value={f.amount || ''} onChange={e => setF({...f, amount: e.target.value})} className="text-sm" />
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground ml-1">Purchase Date</Label>
                  <Input type="date" value={f.purchaseDate || ''} onChange={e => setF({...f, purchaseDate: e.target.value})} className="text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground ml-1">Warranty (Months)</Label>
                  <Input type="number" placeholder="Months" value={f.warrantyMonths || ''} onChange={e => setF({...f, warrantyMonths: e.target.value})} className="text-sm" />
                </div>
              </div>
            </>
          )}

          {type === 'life' && (
            <>
              <Input placeholder="Policy Name" value={f.policyName || ''} onChange={e => setF({...f, policyName: e.target.value})} className="text-sm" />
              <Input placeholder="Provider" value={f.provider || ''} onChange={e => setF({...f, provider: e.target.value})} className="text-sm" />
              <Input placeholder="Policy No." value={f.policyNumber || ''} onChange={e => setF({...f, policyNumber: e.target.value})} className="text-sm" />
              <Input type="number" placeholder="Premium (₹)" value={f.amount || ''} onChange={e => setF({...f, amount: e.target.value})} className="text-sm" />
              <div className="space-y-1 sm:col-span-2">
                <Label className="text-[10px] text-muted-foreground ml-1">Next Due Date</Label>
                <Input type="date" value={f.nextDueDate || ''} onChange={e => setF({...f, nextDueDate: e.target.value})} className="text-sm w-full sm:w-1/2 pr-2" />
              </div>
            </>
          )}

          {type === 'warranty' && (
            <>
              <Input placeholder="Item Name" value={f.itemName || ''} onChange={e => setF({...f, itemName: e.target.value})} className="text-sm" />
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground ml-1">Purchase Date</Label>
                  <Input type="date" value={f.purchaseDate || ''} onChange={e => setF({...f, purchaseDate: e.target.value})} className="text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground ml-1">Duration (Months)</Label>
                  <Input type="number" placeholder="Months" value={f.warrantyMonths || ''} onChange={e => setF({...f, warrantyMonths: e.target.value})} className="text-sm" />
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex justify-end pt-2 border-t mt-4" style={{ borderColor: 'var(--border)' }}>
          <Button onClick={handleSave} disabled={loading} className="w-full sm:w-auto h-10 px-8 rounded-xl font-bold mt-4" style={{ background: 'var(--primary)', color: '#fff' }}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Zap className="w-4 h-4 mr-2 fill-current" />}
            Instant Save
          </Button>
        </div>
      </div>
    </div>
  );
}
