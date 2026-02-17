'use client'

import { useState, useEffect } from 'react';
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
  User, 
  Bell, 
  ChevronRight, 
  Info, 
  Users, 
  CheckCircle2,
  Sparkles,
  LayoutGrid,
  Settings
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { signOut, useSession } from 'next-auth/react';
import { Skeleton } from '@/components/ui/skeleton';
import PageWrapper from '@/components/PageWrapper';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { secureFetch } from '@/lib/api-utils';

export default function ProfilePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const user = session?.user;
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showCollabDialog, setShowCollabDialog] = useState(false);
  const [collaborators, setCollaborators] = useState([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [isInviting, setIsInviting] = useState(false);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchCollaborators();
    }
  }, [status]);

  const fetchCollaborators = async () => {
    try {
      const data = await secureFetch('/api/collaboration');
      setCollaborators(data.collaborators || []);
    } catch (e) {}
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    setIsInviting(true);
    try {
      const data = await secureFetch('/api/collaboration', {
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
        {/* Header */}
        <div className="space-y-1">
          <motion.h1 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-black text-slate-900 tracking-tight"
          >
            My <span className="text-primary italic">Profile</span>
          </motion.h1>
          <p className="text-slate-500 font-medium">Manage your personal details and shared space.</p>
        </div>

        {/* Profile Card */}
        <Card className="border-none shadow-2xl bg-slate-950 text-white rounded-[2.5rem] overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-all duration-700">
             <Settings className="h-40 w-40 rotate-[30deg] animate-pulse" />
          </div>
          <CardContent className="p-8 relative z-10">
             <div className="flex flex-col sm:flex-row items-center gap-8 text-center sm:text-left">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", bounce: 0.5 }}
                >
                  <Avatar className="h-32 w-32 border-4 border-white/10 ring-8 ring-white/5 shadow-2xl">
                    <AvatarImage src={user?.image} alt={user?.name} />
                    <AvatarFallback className="text-4xl font-black bg-primary text-white">
                      {user?.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </motion.div>
                <div className="space-y-2">
                  <motion.h2 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-4xl font-black leading-none"
                  >
                    {user?.name}
                  </motion.h2>
                  <div className="flex items-center justify-center sm:justify-start gap-2 text-slate-400 font-medium">
                    <Mail className="h-4 w-4" />
                    <span className="text-sm">{user?.email}</span>
                  </div>
                  <div className="pt-4 flex flex-wrap justify-center sm:justify-start gap-2">
                     <span className="px-4 py-1.5 rounded-full bg-white/10 text-white text-[10px] font-black uppercase tracking-widest border border-white/10 shadow-inner">
                        <Sparkles className="h-3 w-3 inline mr-2 text-yellow-400" />
                        Space: {collaborators.length > 1 ? 'Collaborative' : 'Private'}
                     </span>
                  </div>
                </div>
             </div>
          </CardContent>
        </Card>

        {/* Space Management Section */}
        <div className="space-y-4">
           <SectionLabel label="Your Space" />
           <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
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
           </motion.div>
        </div>

        {/* App Settings Menu */}
        <div className="space-y-3">
           <SectionLabel label="Preferences" />
           <div className="grid grid-cols-1 gap-3">
              <MenuButton icon={User} label="Profile Settings" subLabel="Name & Avatar" />
              <MenuButton icon={Bell} label="Notifications" badge="Active" subLabel="Alerts & Reminders" />
              <MenuButton icon={Shield} label="Privacy & Security" subLabel="Space Visibility" />
              <MenuButton icon={Info} label="Software Info" subLabel="Build v2.1.0 Optimized" />
           </div>
        </div>

        {/* Logout Section */}
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            onClick={() => setShowLogoutConfirm(true)}
            variant="ghost"
            className="w-full h-20 text-red-500 font-black rounded-[2rem] bg-red-50/50 hover:bg-red-50 hover:text-red-600 transition-all border-2 border-dashed border-red-100/50 hover:border-red-200"
          >
            <LogOut className="mr-3 h-6 w-6" />
            Sign Out of Application
          </Button>
        </motion.div>

        {/* Collaboration Dialog */}
        <Dialog open={showCollabDialog} onOpenChange={setShowCollabDialog}>
           <DialogContent className="max-w-md rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden bg-white">
              <div className="bg-slate-900 p-10 text-white relative">
                 <div className="absolute top-6 right-6 text-white/10">
                    <Users className="h-24 w-24 rotate-6" />
                 </div>
                 <h2 className="text-3xl font-black mb-2 tracking-tight">Collaborate</h2>
                 <p className="text-slate-400 text-sm font-medium leading-relaxed max-w-[280px]">
                    Share this financial space with partners or family members.
                 </p>
              </div>
              <div className="p-8 space-y-8">
                 {/* Invite Form */}
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
                       <Button disabled={isInviting} size="icon" className="h-14 w-14 rounded-2xl bg-slate-900 shadow-xl shadow-slate-200 flex-shrink-0">
                          <UserPlus className="h-5 w-5" />
                       </Button>
                    </form>
                 </div>

                 <div className="space-y-4">
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Current Members</Label>
                    <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                       {collaborators.map((c) => (
                          <motion.div 
                            key={c.user_id} 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
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
                             {c.email === user?.email ? (
                                <span className="text-[8px] font-black bg-slate-900 text-white px-3 py-1 rounded-full uppercase tracking-widest">You</span>
                             ) : (
                                <CheckCircle2 className="h-5 w-5 text-green-500" />
                             )}
                          </motion.div>
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
      </div>
    </PageWrapper>
  );
}

function SectionLabel({ label }) {
  return <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 px-4 mb-2">{label}</p>;
}

function MenuButton({ icon: Icon, label, badge, subLabel }) {
  return (
    <motion.button 
      whileHover={{ x: 5 }}
      whileTap={{ scale: 0.98 }}
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
    </motion.button>
  );
}