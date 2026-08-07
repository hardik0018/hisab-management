'use client'

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  LogOut, 
  Mail, 
  UserPlus, 
  Shield, 
  ChevronRight, 
  Info, 
  Users, 
  CheckCircle2,
  Sparkles,
  Settings,
  Trash2,
  LucideIcon,
  FileText,
  FileSpreadsheet,
  Download,
  DatabaseBackup,
  CloudLightning
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { signOut, useSession } from 'next-auth/react';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Dialog, DialogContent, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { motion } from 'framer-motion';
import { secureFetch } from '@/lib/api-utils';
import { User, CollaborationRequest, CollaborationData } from '@/types';
import PushNotificationManager from '@/components/settings/PushNotificationManager';
import PageHeader from '@/components/PageHeader';
import { formatDisplayDate, formatDisplayTime } from '@/lib/date-utils';
import ClearAllData from '@/components/settings/ClearAllData';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import AppShell from '@/components/AppShell';
import SectionTitle from '@/components/SectionTitle';

interface ProfileClientProps {
  initialCollaborationData: CollaborationData;
  initialSettings: any;
}

interface RemoveConfirm {
  userId: string;
  name: string;
}

export default function ProfileClient({ initialCollaborationData, initialSettings }: ProfileClientProps) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const user = session?.user;
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [collaborators, setCollaborators] = useState<User[]>(initialCollaborationData?.collaborators || []);
  const [sentRequests, setSentRequests] = useState<CollaborationRequest[]>(initialCollaborationData?.sentRequests || []);
  const [receivedRequests, setReceivedRequests] = useState<CollaborationRequest[]>(initialCollaborationData?.receivedRequests || []);
  const [currentUserId, setCurrentUserId] = useState(initialCollaborationData?.currentUserId);
  const [currentSpaceId, setCurrentSpaceId] = useState(initialCollaborationData?.currentSpaceId);
  const [inviteEmail, setInviteEmail] = useState('');
  const [removeConfirm, setRemoveConfirm] = useState<RemoveConfirm | null>(null);
  const [isInviting, setIsInviting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Settings State
  const [settings, setSettings] = useState<any>(initialSettings);
  const [largeLimit, setLargeLimit] = useState<string>(String(initialSettings?.largeAmountLimit || '5000'));
  const [reminderEnabled, setReminderEnabled] = useState<boolean>(initialSettings?.backupReminder?.enabled || false);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  // Export States
  const [exportScope, setExportScope] = useState<'month' | 'range' | 'all'>('month');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const fetchCollaborators = async () => {
    try {
      const data = await secureFetch<CollaborationData>('/api/collaboration');
      setCollaborators(data.collaborators || []);
      setSentRequests(data.sentRequests || []);
      setReceivedRequests(data.receivedRequests || []);
      setCurrentUserId(data.currentUserId);
      setCurrentSpaceId(data.currentSpaceId);
    } catch (e) {}
  };

  const handleRequestAction = async (requestId: string, action: 'accept' | 'reject') => {
    setIsProcessing(true);
    try {
      const data = await secureFetch<{ message: string }>(`/api/collaboration/requests/${requestId}`, {
        method: 'POST',
        body: JSON.stringify({ action }),
      });
      toast.success(data.message);
      fetchCollaborators();
    } catch (e) {
    } finally {
      setIsProcessing(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsInviting(true);
    try {
      const data = await secureFetch<{ message: string }>('/api/collaboration', {
        method: 'POST',
        body: JSON.stringify({ email: inviteEmail }),
      });
      toast.success(data.message);
      setInviteEmail('');
      fetchCollaborators();
    } catch (e) {
    } finally {
      setIsInviting(false);
    }
  };

  const handleRemoveCollaborator = async () => {
    if (!removeConfirm) return;
    setIsProcessing(true);
    try {
      const data = await secureFetch<{ message: string }>('/api/collaboration', {
        method: 'DELETE',
        body: JSON.stringify({ targetUserId: removeConfirm.userId }),
      });
      toast.success(data.message);
      fetchCollaborators();
    } catch (e) {
    } finally {
      setIsProcessing(false);
      setRemoveConfirm(null);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut({ redirect: false });
      toast.success('Logged out successfully');
      router.push('/login');
    } catch (error) {
      toast.error('Failed to logout');
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await secureFetch<{ settings: any }>('/api/settings');
      setSettings(res.settings);
      setLargeLimit(String(res.settings.largeAmountLimit));
      setReminderEnabled(res.settings.backupReminder.enabled);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveSettings = async () => {
    const limit = parseInt(largeLimit, 10);
    if (isNaN(limit) || limit <= 0) {
      toast.error('Large amount limit must be a positive number');
      return;
    }

    setIsUpdating(true);
    try {
      const data = await secureFetch<{ settings: any }>('/api/settings', {
        method: 'PATCH',
        body: JSON.stringify({
          largeAmountLimit: limit,
          backupReminder: {
            enabled: reminderEnabled,
            frequency: 'monthly',
            display: 'inside-app'
          }
        }),
      });

      setSettings(data.settings);
      toast.success('Settings updated successfully!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to save settings');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleExport = (format: string) => {
    const params = new URLSearchParams();

    if (exportScope === 'month') {
      const now = new Date();
      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      params.append('month', `${yyyy}-${mm}`);
    } else if (exportScope === 'all') {
      params.append('month', 'all');
    } else if (exportScope === 'range') {
      if (!startDate || !endDate) {
        toast.error('Please select both Start Date and End Date');
        return;
      }
      if (startDate > endDate) {
        toast.error('Start Date cannot be after End Date');
        return;
      }
      params.append('startDate', startDate);
      params.append('endDate', endDate);
    }

    window.location.href = `/api/export/${format.toLowerCase()}?${params.toString()}`;
    toast.success(`Generating ${format.toUpperCase()} export...`);

    setTimeout(() => {
      fetchSettings();
    }, 1500);
  };

  const getBackupTime = () => {
    if (!settings || !settings.lastBackupAt) return 'Never';
    const parts = settings.lastBackupAt.split('T');
    const datePart = formatDisplayDate(parts[0]);
    const timePart = parts.length > 1 ? formatDisplayTime(settings.lastBackupAt) : '';
    return `${datePart} ${timePart}`.trim();
  };

  const handleBackup = () => {
    // A manual backup trigger could be implemented here
    toast.success('Backup completed successfully');
  };

  if (status === 'loading') {
    return (
      <div className="p-4 space-y-6 max-w-xl mx-auto">
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <AppShell>
      <PageHeader title="Account" subtitle="Profile, collaborators, exports" />
      
      {/* Profile Card */}
      <div className="hero-gradient p-6 flex items-center gap-4 rounded-3xl mb-8 shadow-sm">
        <Avatar className="h-16 w-16 border-2 border-white/20 shadow-xl">
          <AvatarImage src={user?.image || undefined} alt={user?.name || undefined} />
          <AvatarFallback style={{ background: 'var(--card)', color: 'var(--foreground)' }} className="text-xl font-bold">
            {user?.name?.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold text-white truncate">{user?.name}</h2>
          <p className="text-white/80 text-sm truncate">{user?.email}</p>
          <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/20 text-white text-[10px] font-bold uppercase tracking-wider">
             <Sparkles className="h-3 w-3" />
             {collaborators.length > 1 ? 'Collaborative' : 'Private'} Space
          </div>
        </div>
      </div>

      <div className="space-y-8">
        {/* Collaborators */}
        <section>
          <SectionTitle>Collaborators</SectionTitle>
          <div className="card-surface p-4 space-y-4">
             <form onSubmit={handleInvite} className="flex gap-2">
                <Input 
                  placeholder="Invite by email..."
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="flex-1 h-12 bg-transparent"
                  style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
                  required
                  type="email"
                />
                <Button disabled={isInviting} size="icon" className="h-12 w-12 shrink-0 active:scale-95 transition-all" style={{ background: 'var(--primary)', color: 'white' }}>
                   <UserPlus className="h-5 w-5" />
                </Button>
             </form>
             
             {receivedRequests.length > 0 && (
                <div className="space-y-3 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
                   <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--warning)' }}>Pending Requests</p>
                   {receivedRequests.map((req) => (
                      <div key={req._id} className="flex items-center justify-between gap-3 p-3 rounded-2xl" style={{ background: 'var(--surface-muted)' }}>
                         <div className="flex items-center gap-3 min-w-0">
                            <div className="tile w-10 h-10 shrink-0" style={{ background: 'var(--warning-soft)', color: 'var(--warning)' }}>
                               {req.from_name?.charAt(0)}
                            </div>
                            <div className="min-w-0">
                               <p className="text-sm font-bold truncate" style={{ color: 'var(--foreground)' }}>{req.from_name}</p>
                               <p className="text-xs truncate" style={{ color: 'var(--muted-foreground)' }}>wants to collaborate</p>
                            </div>
                         </div>
                         <div className="flex gap-2 shrink-0">
                            <Button size="sm" onClick={() => handleRequestAction(req._id, 'accept')} style={{ background: 'var(--success)', color: 'white' }} className="active:scale-95 transition-all h-8 px-3 text-xs">Accept</Button>
                            <Button size="sm" variant="outline" onClick={() => handleRequestAction(req._id, 'reject')} style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }} className="active:scale-95 transition-all h-8 px-3 text-xs bg-transparent">Reject</Button>
                         </div>
                      </div>
                   ))}
                </div>
             )}

             <div className="space-y-3 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
                 {collaborators.map((c) => (
                    <div key={c.user_id} className="flex items-center justify-between gap-3 p-2">
                       <div className="flex items-center gap-3 min-w-0">
                          <Avatar className="h-10 w-10 shrink-0 ring-2" style={{ borderColor: 'var(--border)' }}>
                             <AvatarImage src={c.image} />
                             <AvatarFallback className="tile w-10 h-10" style={{ background: 'var(--violet-soft)', color: 'var(--violet)' }}>
                                {c.name?.charAt(0)}
                             </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                             <p className="text-sm font-bold truncate" style={{ color: 'var(--foreground)' }}>
                               {c.name} {c.user_id === currentUserId && '(You)'}
                             </p>
                             <p className="text-xs truncate" style={{ color: 'var(--muted-foreground)' }}>{c.email}</p>
                          </div>
                       </div>
                       
                       <div className="flex items-center gap-2 shrink-0">
                          {c.user_id === currentSpaceId && (
                             <span className="text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider" style={{ background: 'var(--teal-soft)', color: 'var(--teal)' }}>Admin</span>
                          )}
                          <span className="text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider" style={{ background: 'var(--success-soft)', color: 'var(--success)' }}>
                             Accepted
                          </span>
                          
                          {c.user_id === currentUserId ? (
                             currentUserId !== currentSpaceId && (
                                <button onClick={() => setRemoveConfirm({ userId: c.user_id, name: 'this space' })} className="p-2 rounded-xl active:scale-95 transition-all" style={{ background: 'var(--danger-soft)', color: 'var(--danger)' }}>
                                   <LogOut className="w-4 h-4" />
                                </button>
                             )
                          ) : (
                             currentUserId === currentSpaceId && (
                                <button onClick={() => setRemoveConfirm({ userId: c.user_id, name: c.name })} className="p-2 rounded-xl active:scale-95 transition-all" style={{ background: 'var(--danger-soft)', color: 'var(--danger)' }}>
                                   <Trash2 className="w-4 h-4" />
                                </button>
                             )
                          )}
                       </div>
                    </div>
                 ))}
                 
                 {sentRequests.map((req) => (
                    <div key={req._id} className="flex items-center justify-between gap-3 p-2 opacity-60">
                       <div className="flex items-center gap-3 min-w-0">
                          <div className="tile w-10 h-10 shrink-0" style={{ background: 'var(--muted-foreground)', color: 'var(--surface)' }}>
                             <Mail className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                             <p className="text-sm font-bold truncate" style={{ color: 'var(--foreground)' }}>{req.to_email}</p>
                             <p className="text-xs truncate" style={{ color: 'var(--muted-foreground)' }}>Invitation sent</p>
                          </div>
                       </div>
                       <span className="text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider shrink-0" style={{ background: 'var(--warning-soft)', color: 'var(--warning-foreground)' }}>
                          Pending
                       </span>
                    </div>
                 ))}
             </div>
          </div>
        </section>

        {/* Settings */}
        <section>
          <SectionTitle>Preferences</SectionTitle>
          <div className="card-surface p-5 space-y-5">
            <div className="space-y-2">
               <Label style={{ color: 'var(--foreground)' }}>Large Amount Warning Limit (₹)</Label>
               <Input 
                 type="number"
                 value={largeLimit} 
                 onChange={(e) => setLargeLimit(e.target.value)}
                 className="h-12 bg-transparent"
                 style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
               />
            </div>
            
            <div className="flex items-center justify-between gap-4 py-1">
              <div className="space-y-0.5">
                <Label htmlFor="reminder-toggle" className="text-sm font-semibold cursor-pointer" style={{ color: 'var(--foreground)' }}>
                  In-App Backup Reminders
                </Label>
                <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                  Trigger alerts when backup age exceeds 30 days.
                </p>
              </div>
              <input
                id="reminder-toggle"
                type="checkbox"
                checked={reminderEnabled}
                onChange={(e) => setReminderEnabled(e.target.checked)}
                className="w-5 h-5 rounded-lg border-input bg-background focus:ring-ring cursor-pointer accent-primary"
                style={{ accentColor: 'var(--primary)' }}
              />
            </div>

            <Button disabled={isUpdating} onClick={handleSaveSettings} className="w-full h-12 font-bold active:scale-95 transition-all" style={{ background: 'var(--primary)', color: 'white' }}>
               {isUpdating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
               {isUpdating ? 'Updating...' : 'Save Preferences'}
            </Button>
          </div>
        </section>
        
        {/* Push Notifications */}
        <section>
          <SectionTitle>Notifications</SectionTitle>
          <PushNotificationManager />
        </section>

        {/* Exports */}
        <section>
          <SectionTitle>Exports</SectionTitle>
          <div className="card-surface overflow-hidden divide-y" style={{ borderColor: 'var(--border)' }}>
            
            <div className="p-4 space-y-4">
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: 'var(--muted-foreground)' }}>Select Scope</span>
                <div className="grid grid-cols-3 gap-2">
                  {['month', 'range', 'all'].map((scope) => (
                    <button
                      key={scope}
                      type="button"
                      onClick={() => setExportScope(scope as any)}
                      className={cn(
                        "py-2 px-1 rounded-xl border text-[11px] font-bold transition-all",
                        exportScope === scope
                          ? "bg-primary/10 border-primary/30 text-primary"
                          : "bg-muted/50 border-border hover:border-muted-foreground/60"
                      )}
                      style={exportScope === scope ? { background: 'var(--primary-soft)', borderColor: 'var(--primary)', color: 'var(--primary)' } : { color: 'var(--muted-foreground)' }}
                    >
                      {scope === 'month' ? 'Current Month' : scope === 'range' ? 'Custom Range' : 'All Data'}
                    </button>
                  ))}
                </div>
              </div>

              {exportScope === 'range' && (
                <div className="grid grid-cols-2 gap-3.5 p-3.5 rounded-2xl" style={{ background: 'var(--surface-muted)' }}>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase" style={{ color: 'var(--muted-foreground)' }}>Start Date</label>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="bg-transparent text-xs rounded-xl h-9"
                      style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase" style={{ color: 'var(--muted-foreground)' }}>End Date</label>
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="bg-transparent text-xs rounded-xl h-9"
                      style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
                    />
                  </div>
                </div>
              )}
            </div>

            <button onClick={() => handleExport('CSV')} className="flex items-center gap-3 px-4 py-3 w-full active:scale-95 transition-all group">
              <div className="tile w-10 h-10 shrink-0" style={{ background: 'var(--teal-soft)', color: 'var(--teal)' }}>
                <FileText className="w-5 h-5" />
              </div>
              <span className="font-bold text-sm" style={{ color: 'var(--foreground)' }}>Export CSV</span>
              <ChevronRight className="ml-auto w-4 h-4 group-hover:translate-x-1 transition-transform" style={{ color: 'var(--muted-foreground)' }} />
            </button>
            <button onClick={() => handleExport('Excel')} className="flex items-center gap-3 px-4 py-3 w-full active:scale-95 transition-all group">
              <div className="tile w-10 h-10 shrink-0" style={{ background: 'var(--success-soft)', color: 'var(--success)' }}>
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <span className="font-bold text-sm" style={{ color: 'var(--foreground)' }}>Export Excel</span>
              <ChevronRight className="ml-auto w-4 h-4 group-hover:translate-x-1 transition-transform" style={{ color: 'var(--muted-foreground)' }} />
            </button>
            <button onClick={() => handleExport('PDF')} className="flex items-center gap-3 px-4 py-3 w-full active:scale-95 transition-all group">
              <div className="tile w-10 h-10 shrink-0" style={{ background: 'var(--danger-soft)', color: 'var(--danger)' }}>
                <Download className="w-5 h-5" />
              </div>
              <span className="font-bold text-sm" style={{ color: 'var(--foreground)' }}>Export PDF</span>
              <ChevronRight className="ml-auto w-4 h-4 group-hover:translate-x-1 transition-transform" style={{ color: 'var(--muted-foreground)' }} />
            </button>
          </div>
        </section>

        {/* Backup */}
        <section>
          <SectionTitle>Data & Backup</SectionTitle>
          <div className="card-surface p-4 flex flex-col gap-4">
             <div className="flex items-center justify-between gap-4">
                 <div className="flex items-center gap-3 min-w-0">
                    <div className="tile w-10 h-10 shrink-0" style={{ background: 'var(--sky-soft)', color: 'var(--sky)' }}>
                       <DatabaseBackup className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                       <p className="text-sm font-bold truncate" style={{ color: 'var(--foreground)' }}>Manual Backup</p>
                       <p className="text-xs truncate" style={{ color: 'var(--muted-foreground)' }}>Last backup: {getBackupTime()}</p>
                    </div>
                 </div>
                 <Button onClick={handleBackup} variant="outline" size="sm" className="shrink-0 h-9 font-bold active:scale-95 transition-all bg-transparent" style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}>
                    Backup Now
                 </Button>
             </div>
             <div className="border-t pt-4" style={{ borderColor: 'var(--border)' }}>
                <ClearAllData />
             </div>
          </div>
        </section>

        <Button
          onClick={() => setShowLogoutConfirm(true)}
          variant="ghost"
          className="w-full h-14 font-bold rounded-2xl active:scale-95 transition-all bg-transparent border border-dashed"
          style={{ borderColor: 'var(--danger-soft)', color: 'var(--danger)' }}
        >
          <LogOut className="mr-2 h-5 w-5" />
          Sign Out
        </Button>

      </div>

      <ConfirmDialog
        open={showLogoutConfirm}
        onOpenChange={setShowLogoutConfirm}
        onConfirm={handleLogout}
        title="Sign Out?"
        description="Are you sure you want to end your session? You'll need to login again to access your records."
        confirmText="Yes, End Session"
        variant="destructive"
      />

      <ConfirmDialog
        open={!!removeConfirm}
        onOpenChange={() => setRemoveConfirm(null)}
        onConfirm={handleRemoveCollaborator}
        title={removeConfirm?.userId === currentUserId ? "Leave Space?" : "Remove Collaborator?"}
        description={removeConfirm?.userId === currentUserId 
          ? "Are you sure you want to leave this shared space? You will lose access to its records and return to your private space."
          : `Are you sure you want to remove ${removeConfirm?.name} from your space? They will no longer have access to these records.`}
        confirmText={removeConfirm?.userId === currentUserId ? "Leave Now" : "Remove Now"}
        variant="destructive"
      />
    </AppShell>
  );
}
