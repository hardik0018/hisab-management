'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Plus, 
  Activity,
  Users,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import PageWrapper from '@/components/PageWrapper';
import { HandCoins } from 'lucide-react';
import { Heart } from 'lucide-react';
import { DashboardStats, User, ExpenseRecord } from '@/types';
import { LucideIcon, Tag, Calendar, CreditCard, Smartphone, Receipt } from 'lucide-react';
import { secureFetch } from '@/lib/api-utils';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const CATEGORIES = ['Food', 'Transport', 'Shopping', 'Bills', 'Groceries', 'Health', 'Entertainment', 'Other'];

const PAYMENT_MODES: { value: 'cash' | 'online' | 'card'; label: string; icon: LucideIcon; color: string }[] = [
  { value: 'cash', label: 'Cash', icon: CreditCard, color: 'text-green-600' },
  { value: 'online', label: 'Online/UPI', icon: Smartphone, color: 'text-primary' },
  { value: 'card', label: 'Credit Card', icon: CreditCard, color: 'text-purple-600' },
];

interface DashboardClientProps {
  initialStats: DashboardStats | null;
  initialCollaborators: User[];
}

export default function DashboardClient({ initialStats, initialCollaborators }: DashboardClientProps) {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(initialStats);
  const [collaborators] = useState<User[]>(initialCollaborators);

  const [showAddExpenseDialog, setShowAddExpenseDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quickExpenseForm, setQuickExpenseForm] = useState({
    title: '',
    amount: '',
    category: initialStats?.mostUsedCategory || 'Other',
    paymentMode: 'cash' as 'cash' | 'online' | 'card',
    date: new Date().toISOString().split('T')[0],
  });

  const handleQuickAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await secureFetch<{ expense: ExpenseRecord }>('/api/expenses', {
        method: 'POST',
        body: JSON.stringify({
          ...quickExpenseForm,
          amount: parseFloat(quickExpenseForm.amount),
        }),
      });
      
      toast.success('Expense added successfully');
      setShowAddExpenseDialog(false);
      setQuickExpenseForm({
        ...quickExpenseForm,
        title: '',
        amount: '',
        category: initialStats?.mostUsedCategory || 'Other',
      });
      
      // Optimistically update dashboard stats
      if (stats && response.expense) {
        setStats({
          ...stats,
          totalExpense: stats.totalExpense + response.expense.amount,
          balance: stats.balance - response.expense.amount,
          recentExpenses: [response.expense, ...stats.recentExpenses].slice(0, 5)
        });
      }
      router.refresh();
    } catch (err) {
       // Error handled by secureFetch
    } finally {
      setIsSubmitting(false);
    }
  };

  const chartData = [
    { name: 'Expenses', value: stats?.totalExpense || 0, color: '#EF4444' },
    { name: 'Income/Credit', value: stats?.totalCredit || 0, color: '#10B981' },
    { name: 'Gifts/Marriage', value: stats?.totalMarriage || 0, color: '#6366F1' },
  ];

  return (
    <PageWrapper>
      <div className="p-4 space-y-8 max-w-7xl mx-auto pb-32">
        {/* Header Section */}
        <div className="flex flex-col gap-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1">
              <h1 
                className="text-4xl font-black tracking-tight text-slate-900 lg:text-5xl"
              >
                My <span className="text-primary italic">Financials</span>
              </h1>
              <div className="flex items-center gap-3">
                 <p className="text-slate-500 font-medium text-sm">Tracking flow across {collaborators.length} members.</p>
                 {collaborators.length > 1 && (
                   <div className="flex -space-x-2">
                     {collaborators.map((c, i) => (
                        <div 
                          key={i} 
                          className="w-7 h-7 rounded-full border-2 border-white bg-slate-200 overflow-hidden ring-2 ring-primary/10" 
                          title={c.name}
                        >
                          {c.image && <img src={c.image} alt={c.name} className="w-full h-full object-cover" />}
                        </div>
                     ))}
                   </div>
                 )}
              </div>
            </div>
          </div>

          {/* Quick Actions Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
             <QuickActionButton theme="sky" icon={Plus} label="New Expense" onClick={() => setShowAddExpenseDialog(true)} />
             <QuickActionButton theme="indigo" icon={HandCoins} label="Log Hisab" onClick={() => router.push('/hisab')} />
             <QuickActionButton theme="rose" icon={Heart} label="Social Gift" onClick={() => router.push('/marriage')} />
          </div>

        </div>


        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatCard label="Spent" value={stats?.totalExpense || 0} icon={TrendingDown} color="red" />
          <StatCard label="Balance" value={stats?.balance || 0} icon={Wallet} color="blue" />
          <StatCard label="Credit" value={stats?.totalCredit || 0} icon={TrendingUp} color="green" />
          <StatCard label="Social" value={stats?.totalMarriage || 0} icon={Users} color="indigo" />
        </div>

        {/* Charts & Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 border-none shadow-lg bg-white rounded-2xl sm:rounded-[2.5rem] overflow-hidden">
            <div className="p-4 sm:p-8 border-b border-slate-50">
               <h3 className="text-base sm:text-xl font-black text-slate-900 leading-none">Spending Overview</h3>
               <p className="text-[10px] sm:text-sm text-slate-500 font-medium mt-1">Financial distribution this period</p>
            </div>
            <CardContent className="p-2 sm:p-8 h-[250px] sm:h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#64748B', fontSize: 10, fontWeight: 700}} 
                    dy={5} 
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#64748B', fontSize: 10, fontWeight: 700}} 
                  />
                  <Tooltip 
                    cursor={{fill: '#F8FAFC'}} 
                    contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px'}}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={40}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>


          <div className="space-y-6">
             <RecentList title="Recent Activity" items={stats?.recentExpenses || []} collaborators={collaborators} />
          </div>
        </div>
      </div>

      <Dialog open={showAddExpenseDialog} onOpenChange={setShowAddExpenseDialog}>
         <DialogContent className="max-w-md rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden bg-white">
            <div className="bg-slate-950 px-6 py-5 text-white relative">
               <div className="absolute top-4 right-4 opacity-10">
                  <Receipt className="h-20 w-20" />
               </div>
               <DialogTitle className="text-3xl font-black mb-1 text-white">Quick Add Expense</DialogTitle>
               <p className="text-slate-400 text-sm font-medium">Fast entry straight from the dashboard.</p>
            </div>
            <form onSubmit={handleQuickAddExpense} className="p-8 space-y-6">
               <div className="space-y-4">
                  <div className="space-y-2">
                     <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Expense Title</Label>
                     <Input 
                      placeholder="e.g. Starbucks Coffee" 
                      value={quickExpenseForm.title}
                      onChange={(e) => setQuickExpenseForm({...quickExpenseForm, title: e.target.value})}
                      className="h-12 rounded-xl bg-slate-50 border-none px-4 focus-visible:ring-primary"
                      required
                     />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Amount (₹)</Label>
                        <Input 
                          autoFocus
                          type="number" 
                          inputMode="decimal"
                          placeholder="0.00" 
                          value={quickExpenseForm.amount}
                          onChange={(e) => setQuickExpenseForm({...quickExpenseForm, amount: e.target.value})}
                          className="h-12 rounded-xl bg-slate-50 border-none px-4 font-black text-lg focus-visible:ring-primary"
                          required
                        />
                     </div>
                     <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Date</Label>
                        <Input 
                          type="date"
                          value={quickExpenseForm.date}
                          onChange={(e) => setQuickExpenseForm({...quickExpenseForm, date: e.target.value})}
                          className="h-12 rounded-xl bg-slate-50 border-none px-4 font-bold focus-visible:ring-primary"
                          required
                        />
                     </div>
                  </div>
                  <div className="space-y-2">
                     <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Category</Label>
                     <div className="flex flex-wrap gap-2">
                        {CATEGORIES.map(c => (
                           <button
                             key={c}
                             type="button"
                             onClick={() => setQuickExpenseForm({...quickExpenseForm, category: c})}
                             className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tighter transition-all ${
                               quickExpenseForm.category === c ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                             }`}
                           >
                              {c}
                           </button>
                        ))}
                     </div>
                  </div>
                  <div className="space-y-2">
                     <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Payment Method</Label>
                     <div className="grid grid-cols-3 gap-3">
                        {PAYMENT_MODES.map(m => (
                           <button
                             key={m.value}
                             type="button"
                             onClick={() => setQuickExpenseForm({...quickExpenseForm, paymentMode: m.value})}
                             className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all ${
                               quickExpenseForm.paymentMode === m.value ? 'bg-primary/5 border-primary' : 'bg-slate-50 border-transparent hover:border-slate-100'
                             }`}
                           >
                              <m.icon className={`h-5 w-5 mb-1 ${quickExpenseForm.paymentMode === m.value ? 'text-primary' : 'text-slate-400'}`} />
                              <span className={`text-[9px] font-black uppercase ${quickExpenseForm.paymentMode === m.value ? 'text-primary' : 'text-slate-400'}`}>{m.label}</span>
                           </button>
                        ))}
                     </div>
                  </div>
               </div>
               <Button disabled={isSubmitting} className="w-full h-14 rounded-2xl bg-slate-950 font-black text-lg shadow-2xl transition-all active:scale-95 text-white">
                  {isSubmitting ? 'Recording...' : 'Quick Add'}
               </Button>
            </form>
         </DialogContent>
      </Dialog>
    </PageWrapper>
  );
}

interface StatCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
  color: 'red' | 'green' | 'blue' | 'indigo';
}

function StatCard({ label, value, icon: Icon, color }: StatCardProps) {
  const colors = {
    red: "bg-red-50 text-red-600 ring-red-100",
    green: "bg-green-50 text-green-600 ring-green-100",
    blue: "bg-blue-50 text-blue-600 ring-blue-100",
    indigo: "bg-indigo-50 text-indigo-600 ring-indigo-100"
  };

  return (
    <div  className="group">
      <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl sm:rounded-[2rem] bg-white overflow-hidden p-3 sm:p-6 ring-1 ring-slate-100 h-full">
        <div className="flex items-center gap-3 sm:gap-5 h-full">
          <div className={`w-10 h-10 sm:w-16 sm:h-16 rounded-xl sm:rounded-3xl ${colors[color]} ring-2 sm:ring-4 flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110`}>
            <Icon className="h-5 w-5 sm:h-8 sm:w-8" />
          </div>
          <div className="min-w-0">
            <p className="text-[8px] sm:text-sm font-bold text-slate-500 uppercase tracking-widest leading-none mb-1 truncate">{label}</p>
            <h3 className="text-sm sm:text-3xl font-black text-slate-900 leading-tight">₹{(value || 0).toLocaleString()}</h3>
          </div>
        </div>
      </Card>
    </div>
  );
}

interface RecentListProps {
  title: string;
  items: ExpenseRecord[];
  collaborators: User[];
}

function RecentList({ title, items, collaborators }: RecentListProps) {
  return (
    <Card className="border-none shadow-xl rounded-[2.5rem] bg-slate-50 overflow-hidden">
      <div className="p-6 border-b border-slate-100 bg-white">
        <h3 className="font-black text-slate-900 text-lg uppercase tracking-tight">{title}</h3>
      </div>
      <CardContent className="p-4 space-y-3">
        
          {items?.map((item, idx) => {
            const addedBy = collaborators.find(c => c.user_id === item.user_id);
            return (
              <div
                key={idx}
                
                className="flex items-center justify-between p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white shadow-sm border border-transparent hover:border-primary/20 transition-all group"
              >
                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-slate-50 flex items-center justify-center group-hover:bg-primary/5 transition-colors flex-shrink-0">
                    <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-slate-400 group-hover:text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 text-xs sm:text-sm leading-tight truncate">{item.title}</p>
                    <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5 sm:mt-1">
                       <span className="text-[8px] sm:text-[10px] text-slate-400 font-bold uppercase">{item.category}</span>
                       {addedBy && <span className="text-[7px] sm:text-[9px] bg-slate-100 px-1 sm:px-1.5 py-0.5 rounded-full text-slate-500 font-black uppercase tracking-tighter">By {addedBy.name.split(' ')[0]}</span>}
                    </div>
                  </div>
                </div>
                <p className="font-black text-red-500 text-xs sm:text-sm flex-shrink-0">-₹{item.amount.toLocaleString()}</p>
              </div>
            );
          })}
       
        {!items?.length && <p className="text-center py-8 text-slate-400 font-bold text-xs uppercase italic tracking-widest">Everything is quiet...</p>}
      </CardContent>
    </Card>
  );
}

interface QuickActionButtonProps {
  label: string;
  icon: LucideIcon;
  theme: 'blue' | 'emerald' | 'sky' | 'indigo' | 'rose';
  onClick: () => void;
}

function QuickActionButton({ label, icon: Icon, theme, onClick }: QuickActionButtonProps) {
  const themes = {
    blue: "bg-blue-50 text-blue-600 ring-blue-100",
    emerald: "bg-emerald-50 text-emerald-600 ring-emerald-100",
    sky: "bg-sky-50 text-sky-600 ring-sky-100",
    indigo: "bg-indigo-50 text-indigo-600 ring-indigo-100",
    rose: "bg-rose-50 text-rose-600 ring-rose-100",
  };

  return (
    <button
      
      onClick={onClick}
      className="flex items-center gap-3 p-3 sm:p-4 rounded-2xl sm:rounded-[1.5rem] bg-white border border-slate-100 shadow-sm hover:shadow-xl hover:border-primary/20 transition-all group w-full"
    >
      <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl ${themes[theme]} flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110 ring-2 sm:ring-4`}>
        <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
      </div>
      <span className="text-[9px] sm:text-xs font-black uppercase tracking-widest text-slate-500 group-hover:text-slate-900 transition-colors text-left flex-1 truncate">{label}</span>
    </button>
  );
}
