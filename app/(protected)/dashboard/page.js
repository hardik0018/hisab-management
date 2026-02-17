'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Plus, 
  Activity,
  Users,
  AlertCircle
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import PageWrapper from '@/components/PageWrapper';
import { motion, AnimatePresence } from 'framer-motion';
import { secureFetch } from '@/lib/api-utils';

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [collaborators, setCollaborators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initDashboard = async () => {
      setLoading(true);
      setError(null);
      try {
        const [statsData, collabData] = await Promise.all([
          secureFetch('/api/dashboard/stats'),
          secureFetch('/api/collaboration')
        ]);
        setStats(statsData);
        setCollaborators(collabData.collaborators || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    initDashboard();
  }, []);

  if (loading) return <DashboardSkeleton />;
  
  if (error) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center space-y-4">
      <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center text-red-500">
        <AlertCircle className="h-8 w-8" />
      </div>
      <h2 className="text-xl font-bold">Failed to load dashboard</h2>
      <p className="text-slate-500 max-w-xs">{error}</p>
      <Button onClick={() => window.location.reload()} variant="outline" className="rounded-xl">Try Again</Button>
    </div>
  );

  const chartData = [
    { name: 'Expenses', value: stats?.totalExpense || 0, color: '#EF4444' },
    { name: 'Income/Credit', value: stats?.totalCredit || 0, color: '#10B981' },
    { name: 'Gifts/Marriage', value: stats?.totalMarriage || 0, color: '#6366F1' },
  ];

  return (
    <PageWrapper>
      <div className="p-4 space-y-8 max-w-7xl mx-auto pb-32">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <motion.h1 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-4xl font-black tracking-tight text-slate-900 lg:text-5xl"
            >
              My <span className="text-primary italic">Financials</span>
            </motion.h1>
            <div className="flex items-center gap-3">
               <p className="text-slate-500 font-medium">Tracking flow across {collaborators.length} members.</p>
               {collaborators.length > 1 && (
                 <div className="flex -space-x-2">
                   {collaborators.map((c, i) => (
                      <motion.div 
                        key={i} 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: i * 0.1 }}
                        className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 overflow-hidden ring-2 ring-primary/10" 
                        title={c.name}
                      >
                        <img src={c.image} alt={c.name} className="w-full h-full object-cover" />
                      </motion.div>
                   ))}
                 </div>
               )}
            </div>
          </div>
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex gap-3"
          >
            <Button onClick={() => router.push('/expenses')} className="rounded-2xl h-12 px-6 shadow-xl shadow-primary/20 font-bold">
              <Plus className="mr-2 h-5 w-5" /> New Entry
            </Button>
          </motion.div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Spent" value={stats?.totalExpense} icon={TrendingDown} trend="down" color="red" />
          <StatCard label="Net Balance" value={stats?.balance} icon={Wallet} trend="neutral" color="blue" />
          <StatCard label="Total Credit" value={stats?.totalCredit} icon={TrendingUp} trend="up" color="green" />
          <StatCard label="Total Marriage" value={stats?.totalMarriage} icon={Users} trend="neutral" color="indigo" />
        </div>

        {/* Charts & Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 border-none shadow-2xl bg-white rounded-[2.5rem] overflow-hidden">
            <div className="p-8 border-b border-slate-50">
               <h3 className="text-xl font-black text-slate-900">Spending Overview</h3>
               <p className="text-sm text-slate-500 font-medium">Your financial distribution this period</p>
            </div>
            <CardContent className="p-8 h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12, fontWeight: 600}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12, fontWeight: 600}} />
                  <Tooltip 
                    cursor={{fill: '#F8FAFC'}} 
                    contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'}}
                  />
                  <Bar dataKey="value" radius={[10, 10, 0, 0]} barSize={60}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="space-y-6">
             <RecentList title="Recent Activity" items={stats?.recentExpenses} collaborators={collaborators} />
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}

function StatCard({ label, value, icon: Icon, trend, color }) {
  const colors = {
    red: "bg-red-50 text-red-600 ring-red-100",
    green: "bg-green-50 text-green-600 ring-green-100",
    blue: "bg-blue-50 text-blue-600 ring-blue-100",
    indigo: "bg-indigo-50 text-indigo-600 ring-indigo-100"
  };

  return (
    <motion.div whileHover={{ y: -5 }} className="group">
      <Card className="border-none shadow-xl hover:shadow-2xl transition-all duration-300 rounded-[2rem] bg-white overflow-hidden p-6 ring-1 ring-slate-100">
        <div className="flex items-start justify-between">
          <div className="space-y-3">
            <div className={`w-12 h-12 rounded-2xl ${colors[color]} ring-4 flex items-center justify-center transition-transform group-hover:scale-110`}>
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">{label}</p>
              <h3 className="text-3xl font-black text-slate-900 mt-1">₹{(value || 0).toLocaleString()}</h3>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

function RecentList({ title, items, collaborators }) {
  return (
    <Card className="border-none shadow-xl rounded-[2.5rem] bg-slate-50 overflow-hidden">
      <div className="p-6 border-b border-slate-100 bg-white">
        <h3 className="font-black text-slate-900 text-lg uppercase tracking-tight">{title}</h3>
      </div>
      <CardContent className="p-4 space-y-3">
        <AnimatePresence>
          {items?.map((item, idx) => {
            const addedBy = collaborators.find(c => c.user_id === item.user_id);
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="flex items-center justify-between p-4 rounded-2xl bg-white shadow-sm border border-transparent hover:border-primary/20 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center group-hover:bg-primary/5 transition-colors">
                    <Activity className="h-5 w-5 text-slate-400 group-hover:text-primary" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-sm leading-tight">{item.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                       <span className="text-[10px] text-slate-400 font-bold uppercase">{item.category}</span>
                       {addedBy && <span className="text-[9px] bg-slate-100 px-1.5 py-0.5 rounded-full text-slate-500 font-black uppercase tracking-tighter">By {addedBy.name.split(' ')[0]}</span>}
                    </div>
                  </div>
                </div>
                <p className="font-black text-red-500 text-sm">-₹{item.amount.toLocaleString()}</p>
              </motion.div>
            );
          })}
        </AnimatePresence>
        {!items?.length && <p className="text-center py-8 text-slate-400 font-bold text-xs uppercase italic tracking-widest">Everything is quiet...</p>}
      </CardContent>
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <div className="p-4 space-y-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <Skeleton className="h-12 w-64 rounded-xl" />
          <Skeleton className="h-4 w-48 rounded-full" />
        </div>
        <Skeleton className="h-12 w-32 rounded-2xl" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-40 rounded-[2rem]" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Skeleton className="lg:col-span-2 h-[450px] rounded-[2.5rem]" />
        <Skeleton className="h-[450px] rounded-[2.5rem]" />
      </div>
    </div>
  );
}