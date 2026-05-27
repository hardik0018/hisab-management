'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Trash2, AlertTriangle, ShieldAlert, Loader2 } from 'lucide-react';

export default function ClearAllData() {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [confirmText, setConfirmText] = useState<string>('');
  const [isClearing, setIsClearing] = useState<boolean>(false);

  const handleClear = async () => {
    if (confirmText !== 'DELETE') {
      toast.error('Confirmation text does not match.');
      return;
    }

    setIsClearing(true);
    try {
      const res = await fetch('/api/settings/clear-all', {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Failed to clear application data');
      }

      toast.success('All data cleared successfully! Factory settings restored.');
      setIsOpen(false);
      setConfirmText('');

      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err) {
      console.error(err);
      toast.error('An error occurred while clearing data.');
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 space-y-4 shadow-sm">
      <div className="flex gap-3">
        <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Danger Zone</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Permanently clear all expense entries and reset large amount limits.
          </p>
        </div>
      </div>

      <Button
        type="button"
        onClick={() => setIsOpen(true)}
        className="w-full h-11 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-650 dark:hover:bg-rose-600 text-rose-600 dark:text-rose-450 hover:text-white border border-rose-100 dark:border-rose-500/20 rounded-2xl font-bold transition-all cursor-pointer"
      >
        <Trash2 className="w-4 h-4 mr-2" />
        Clear All Data
      </Button>

      {/* Confirmation Modal */}
      <Dialog open={isOpen} onOpenChange={(open) => !open && setIsOpen(false)}>
        <DialogContent className="max-w-md w-[92%] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-850 dark:text-slate-100 rounded-3xl p-6 shadow-2xl">
          <DialogHeader className="text-left space-y-2">
            <div className="flex items-center gap-2 text-rose-500">
              <ShieldAlert className="w-6 h-6 animate-bounce" />
              <DialogTitle className="text-lg font-bold text-slate-900 dark:text-white font-sans">Are you absolutely sure?</DialogTitle>
            </div>
            <DialogDescription className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">
              This action is <span className="font-bold text-rose-600 dark:text-rose-400">permanent</span> and will erase all your expense documents from the database. Backup your files first!
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-3">
            <div className="space-y-2">
              <Label htmlFor="delete-confirm" className="text-xs font-semibold text-slate-500 dark:text-slate-400 leading-relaxed">
                To confirm, type <span className="font-mono text-slate-800 dark:text-slate-200 font-bold bg-slate-100 dark:bg-slate-950 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-850">DELETE</span> below:
              </Label>
              <Input
                id="delete-confirm"
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="DELETE"
                className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-850 text-slate-800 dark:text-slate-200 text-sm rounded-xl h-11 text-center font-mono tracking-widest font-black uppercase"
              />
            </div>
          </div>

          <DialogFooter className="flex-row gap-2 mt-6">
            <Button
              type="button"
              variant="outline"
              disabled={isClearing}
              onClick={() => setIsOpen(false)}
              className="w-1/2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white rounded-xl cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={confirmText !== 'DELETE' || isClearing}
              onClick={handleClear}
              className="w-1/2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl border-0 transition-all cursor-pointer"
            >
              {isClearing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Clearing...
                </>
              ) : (
                'Permanently Delete'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
