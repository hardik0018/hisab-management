'use client'

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
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
  LucideIcon
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { signOut, useSession } from 'next-auth/react';
import { Skeleton } from '@/components/ui/skeleton';
import PageWrapper from '@/components/PageWrapper';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Dialog, DialogContent, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { secureFetch } from '@/lib/api-utils';
import { User, CollaborationRequest, CollaborationData } from '@/types';

interface ProfileClientProps {
  initialCollaborationData: CollaborationData;
}

interface RemoveConfirm {
  userId: string;
  name: string;
}

export default function ProfileClient({ initialCollaborationData }: ProfileClientProps) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const user = session?.user;
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showCollabDialog, setShowCollabDialog] = useState(false);
  const [collaborators, setCollaborators] = useState<User[]>(initialCollaborationData?.collaborators || []);
  const [sentRequests, setSentRequests] = useState<CollaborationRequest[]>(initialCollaborationData?.sentRequests || []);
  const [receivedRequests, setReceivedRequests] = useState<CollaborationRequest[]>(initialCollaborationData?.receivedRequests || []);
  const [currentUserId, setCurrentUserId] = useState(initialCollaborationData?.currentUserId);
  const [currentSpaceId, setCurrentSpaceId] = useState(initialCollaborationData?.currentSpaceId);
  const [inviteEmail, setInviteEmail] = useState('');
  const [removeConfirm, setRemoveConfirm] = useState<RemoveConfirm | null>(null);
  const [isInviting, setIsInviting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

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

  if (status === 'loading') {
    return (
      <div className="p-4 space-y-6 max-w-2xl mx-auto">
        <Skeleton className="h-40 rounded-[2.5rem]" />
        <div className="space-y-4">
           <Skeleton className="h-20 rounded-2xl" />
           <Skeleton className="h-20 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <PageWrapper>
      <div className="p-4 space-y-8 max-w-2xl mx-auto pb-32">
        <div className="space-y-1">
          <h1 
            
            className="text-4xl font-black text-slate-900 tracking-tight"
          >
            My <span className="text-primary italic">Profile</span>
          </h1>
          <p className="text-slate-500 font-medium">Manage your personal details and shared space.</p>
        </div>

        <Card className="border-none shadow-2xl bg-slate-950 text-white rounded-[2rem] sm:rounded-[2.5rem] overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-4 sm:p-8 opacity-10 group-hover:opacity-20 transition-all duration-700">
             <Settings className="h-24 w-24 sm:h-40 sm:w-40 rotate-[30deg] animate-pulse" />
          </div>
          <CardContent className="p-5 sm:p-8 relative z-10">
             <div className="flex items-center gap-4 sm:gap-8">
                <div

                  className="flex-shrink-0"
                >
                  <Avatar className="h-16 w-16 sm:h-32 sm:w-32 border-2 sm:border-4 border-white/10 ring-4 sm:ring-8 ring-white/5 shadow-2xl">
                    <AvatarImage src={user?.image || undefined} alt={user?.name || undefined} />
                    <AvatarFallback className="text-xl sm:text-4xl font-black bg-primary text-white">
                      {user?.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="space-y-0.5 sm:space-y-2 min-w-0">
                  <h2 
                    
                    className="text-xl sm:text-4xl font-black leading-tight truncate px-1 text-white"
                  >
                    {user?.name}
                  </h2>
                  <div className="flex items-center gap-1.5 text-slate-400 font-medium px-1">
                    <Mail className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                    <span className="text-[10px] sm:text-sm truncate">{user?.email}</span>
                  </div>
                  <div className="pt-1.5 sm:pt-4 flex flex-wrap gap-2">
                     <span className="px-2.5 py-1 sm:px-4 sm:py-1.5 rounded-full bg-white/10 text-white text-[7px] sm:text-[10px] font-black uppercase tracking-widest border border-white/10 shadow-inner inline-flex items-center">
                        <Sparkles className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1.5 text-yellow-400" />
                        {collaborators.length > 1 ? 'Collaborative' : 'Private'}
                     </span>
                  </div>
                </div>
             </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
           <SectionLabel label="Your Space" />
           <div >
             <Card className="border-none shadow-xl bg-white rounded-[2rem] overflow-hidden group cursor-pointer" onClick={() => setShowCollabDialog(true)}>
                <CardContent className="p-6">
                   <div className="flex items-center justify-between">
                      <div className="flex items-center gap-5">
                         <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300 shadow-sm shadow-indigo-100">
                            <Users className="h-7 w-7" />
                         </div>
                         <div className="text-left">
                            <p className="font-black text-slate-900 leading-tight text-lg">Manage Collaborators</p>
                             <p className="text-xs text-slate-500 font-bold mt-1 uppercase tracking-tighter opacity-70">
                                {collaborators.length > 1 
                                  ? `Sharing with ${collaborators.length - 1} people` 
                                  : "Invite partners to track together"}
                                {receivedRequests.length > 0 && ` • ${receivedRequests.length} pending`}
                             </p>
                         </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex -space-x-3">
                           {collaborators.slice(0, 3).map((c, i) => (
                              <Avatar key={i} className="h-10 w-10 border-4 border-white shadow-md">
                                 <AvatarImage src={c.image} />
                                 <AvatarFallback className="text-[10px] bg-slate-100 font-black">{c.name?.charAt(0)}</AvatarFallback>
                              </Avatar>
                           ))}
                           {collaborators.length > 3 && (
                              <div className="h-10 w-10 rounded-full bg-slate-50 border-4 border-white flex items-center justify-center text-[10px] font-black text-slate-400 shadow-md">
                                 +{collaborators.length - 3}
                              </div>
                           )}
                        </div>
                        <ChevronRight className="h-6 w-6 text-slate-300 group-hover:translate-x-1 transition-transform group-hover:text-primary" />
                      </div>
                   </div>
                </CardContent>
             </Card>
           </div>
        </div>

        <div className="space-y-3">
           <SectionLabel label="Preferences" />
           <div className="grid grid-cols-1 gap-3">
              <MenuButton icon={Shield} label="Privacy & Security" subLabel="Space Visibility" />
              <MenuButton icon={Info} label="Software Info" subLabel="Version 1.0.0" />
           </div>
        </div>

        <div >
          <Button
            onClick={() => setShowLogoutConfirm(true)}
            variant="ghost"
            className="w-full h-20 text-red-500 font-black rounded-[2rem] bg-red-50/50 hover:bg-red-50 hover:text-red-600 transition-all border-2 border-dashed border-red-100/50 hover:border-red-200"
          >
            <LogOut className="mr-3 h-6 w-6" />
            Sign Out of Application
          </Button>
        </div>

        <Dialog open={showCollabDialog} onOpenChange={setShowCollabDialog}>
           <DialogContent className="max-w-md rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden bg-white">
              <div className="bg-slate-900 p-10 text-white relative">
                 <div className="absolute top-6 right-6 text-white/10">
                    <Users className="h-24 w-24 rotate-6" />
                 </div>
                 <DialogTitle className="text-3xl font-black mb-2 tracking-tight text-white">Collaborate</DialogTitle>
                 <p className="text-slate-400 text-sm font-medium leading-relaxed max-w-[280px]">
                    Share this financial space with partners or family members.
                 </p>
              </div>
              <div className="p-8 space-y-8">
                 <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">New Invitation</Label>
                    <form onSubmit={handleInvite} className="flex gap-2">
                       <Input 
                        placeholder="email@example.com"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        className="rounded-2xl h-14 bg-slate-50 border-none px-5 focus-visible:ring-primary font-medium"
                        required
                        type="email"
                       />
                       <Button disabled={isInviting} size="icon" className="h-14 w-14 rounded-2xl bg-slate-900 shadow-xl shadow-slate-200 flex-shrink-0 text-white">
                          <UserPlus className="h-5 w-5" />
                       </Button>
                    </form>
                 </div>

                  {receivedRequests.length > 0 && (
                    <div className="space-y-4">
                       <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500 ml-1">Pending Invitations (To You)</Label>
                       <div className="space-y-3">
                          {receivedRequests.map((req) => (
                             <div 
                               key={req._id} 
                               
                               className="p-4 rounded-3xl bg-amber-50 border border-amber-100 space-y-4"
                             >
                                <div className="flex items-center gap-4">
                                   <div className="w-10 h-10 rounded-full bg-amber-200 flex items-center justify-center text-amber-700 font-black">
                                      {req.from_name?.charAt(0)}
                                   </div>
                                   <div>
                                      <p className="text-sm font-black text-slate-900 leading-none">{req.from_name}</p>
                                      <p className="text-[10px] text-slate-500 font-bold mt-1.5">Invited you to their space</p>
                                   </div>
                                </div>
                                <div className="flex gap-2">
                                   <Button 
                                     disabled={isProcessing}
                                     variant="default" 
                                     className="flex-1 rounded-xl h-10 bg-amber-500 hover:bg-amber-600 font-bold text-xs text-white"
                                     onClick={() => handleRequestAction(req._id, 'accept')}
                                   >
                                      Accept
                                   </Button>
                                   <Button 
                                     disabled={isProcessing}
                                     variant="outline" 
                                     className="flex-1 rounded-xl h-10 border-amber-200 text-amber-700 font-bold text-xs"
                                     onClick={() => handleRequestAction(req._id, 'reject')}
                                   >
                                      Decline
                                   </Button>
                                </div>
                             </div>
                          ))}
                       </div>
                    </div>
                  )}

                  <div className="space-y-4">
                     <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Current Members</Label>
                     <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                        {collaborators.map((c) => (
                           <div 
                             key={c.user_id} 
                             className="flex items-center justify-between p-4 rounded-3xl bg-slate-50 border border-slate-100 group"
                           >
                              <div className="flex items-center gap-4">
                                 <Avatar className="h-10 w-10 ring-2 ring-white shadow-sm">
                                    <AvatarImage src={c.image} />
                                    <AvatarFallback className="bg-slate-200 text-xs font-black">{c.name?.charAt(0)}</AvatarFallback>
                                 </Avatar>
                                 <div>
                                    <p className="text-sm font-black text-slate-900 leading-none">{c.name}</p>
                                    <p className="text-[10px] text-slate-400 font-bold mt-1.5">{c.email}</p>
                                 </div>
                              </div>
                               <div className="flex items-center gap-2">
                                 {c.user_id === currentSpaceId && (
                                    <span className="text-[7px] font-black bg-slate-900/5 text-slate-400 px-2 py-0.5 rounded-full uppercase tracking-widest border border-slate-200 mr-1">Admin</span>
                                 )}
                                 
                                 {c.user_id === currentUserId ? (
                                    <div className="flex items-center gap-2">
                                       <span className="text-[8px] font-black bg-slate-900 text-white px-3 py-1 rounded-full uppercase tracking-widest">You</span>
                                       {currentUserId !== currentSpaceId && (
                                          <button 
                                             onClick={() => setRemoveConfirm({ userId: c.user_id, name: 'this space' })}
                                             className="p-2 rounded-xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm"
                                          >
                                             <LogOut className="h-3.5 w-3.5" />
                                          </button>
                                       )}
                                    </div>
                                 ) : (
                                    <div className="flex items-center gap-2">
                                       {currentUserId === currentSpaceId && (
                                          <button 
                                             onClick={() => setRemoveConfirm({ userId: c.user_id, name: c.name })}
                                             className="p-2 rounded-xl bg-slate-100 text-slate-400 hover:bg-red-500 hover:text-white transition-all shadow-sm"
                                          >
                                             <Trash2 className="h-3.5 w-3.5" />
                                          </button>
                                       )}
                                       <CheckCircle2 className="h-5 w-5 text-green-500" />
                                    </div>
                                 )}
                               </div>
                            </div>
                        ))}
                        {sentRequests.map((req) => (
                           <div 
                             key={req._id} 
                             className="flex items-center justify-between p-4 rounded-3xl border border-dashed border-slate-200 opacity-60"
                           >
                              <div className="flex items-center gap-4">
                                 <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                                    <Mail className="h-4 w-4" />
                                 </div>
                                 <div>
                                    <p className="text-sm font-black text-slate-400 leading-none">{req.to_email}</p>
                                    <p className="text-[10px] text-slate-300 font-bold mt-1.5 italic">Pending Invitation...</p>
                                 </div>
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>
              </div>
              <DialogFooter className="p-6 pt-0">
                 <Button variant="outline" className="w-full h-14 rounded-2xl font-black uppercase tracking-widest text-xs border-slate-200 hover:bg-slate-50" onClick={() => setShowCollabDialog(false)}>
                    Close Manager
                 </Button>
              </DialogFooter>
           </DialogContent>
        </Dialog>

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
      </div>
    </PageWrapper>
  );
}

function SectionLabel({ label }: { label: string }) {
  return <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 px-4 mb-2">{label}</p>;
}

interface MenuButtonProps {
  icon: LucideIcon;
  label: string;
  badge?: string;
  subLabel?: string;
}

function MenuButton({ icon: Icon, label, badge, subLabel }: MenuButtonProps) {
  return (
    <button 
      className="w-full flex items-center justify-between p-5 rounded-[2rem] bg-white border border-slate-100 shadow-sm hover:shadow-xl hover:border-primary/20 transition-all group"
    >
       <div className="flex items-center gap-5">
          <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center group-hover:bg-primary/5 group-hover:text-primary transition-all duration-300">
             <Icon className="h-6 w-6" />
          </div>
          <div className="text-left">
            <p className="font-bold text-slate-900 leading-tight">{label}</p>
            {subLabel && <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter mt-0.5">{subLabel}</p>}
          </div>
       </div>
       <div className="flex items-center gap-3">
          {badge && <span className="bg-primary/10 text-primary text-[8px] font-black px-3 py-1 rounded-full border border-primary/10 uppercase tracking-widest">{badge}</span>}
          <ChevronRight className="h-5 w-5 text-slate-300 group-hover:translate-x-1 transition-transform group-hover:text-primary" />
       </div>
    </button>
  );
}
