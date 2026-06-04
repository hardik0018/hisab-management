'use client'

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import {
  TrendingUp,
  Wallet,
  Users,
} from 'lucide-react';
import dynamic from 'next/dynamic';

const DashboardChart = dynamic(() => import('@/components/dashboard/DashboardChart'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-slate-50 dark:bg-slate-900/50 animate-pulse rounded-2xl">
      <div className="flex flex-col items-center gap-2">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
        <span className="text-xs text-muted-foreground font-medium">Loading Overview...</span>
      </div>
    </div>
  ),
});
import PageWrapper from '@/components/PageWrapper';
import { motion } from 'framer-motion';
import { DashboardStats, User } from '@/types';
import { LucideIcon } from 'lucide-react';

interface DashboardClientProps {
  initialStats: DashboardStats | null;
  initialCollaborators: User[];
}

export default function DashboardClient({ initialStats, initialCollaborators }: DashboardClientProps) {
  const [stats] = useState<DashboardStats | null>(initialStats);
  const [collaborators] = useState<User[]>(initialCollaborators);

  const chartData = [
    { name: 'Income/Credit', value: stats?.totalCredit || 0, color: '#10B981' },
    { name: 'Gifts/Marriage', value: stats?.totalMarriage || 0, color: '#6366F1' },
  ];

  return (
    <PageWrapper>
      <div className="p-4 space-y-4 mx-auto max-w-6xl pb-2">
        {/* Header Section */}
        <div className="flex flex-col gap-6">
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
                <p className="text-slate-500 font-medium text-sm">Tracking flow across {collaborators.length} members.</p>
                {collaborators.length > 1 && (
                  <div className="flex -space-x-2">
                    {collaborators.map((c, i) => (
                      <motion.div
                        key={i}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: i * 0.1 }}
                        className="w-7 h-7 rounded-full border-2 border-white bg-slate-200 overflow-hidden ring-2 ring-primary/10"
                        title={c.name}
                      >
                        {c.image && <img src={c.image} alt={c.name} className="w-full h-full object-cover" />}
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-2">
          <StatCard label="Balance" value={stats?.balance || 0} icon={Wallet} color="blue" />
          <StatCard label="Credit" value={stats?.totalCredit || 0} icon={TrendingUp} color="green" />
          <StatCard label="Social" value={stats?.totalMarriage || 0} icon={Users} color="indigo" />
        </div>

        {/* Charts & Activity */}
        <div className="grid grid-cols-1 gap-6">
          <Card className="lg:col-span-2 border-none shadow-lg bg-white rounded-2xl sm:rounded-[2.5rem] overflow-hidden">
            <div className="p-4 sm:p-8 border-b border-slate-50">
              <h3 className="text-base sm:text-xl font-black text-slate-900 leading-none">Spending Overview</h3>
              <p className="text-[10px] sm:text-sm text-slate-500 font-medium mt-1">Financial distribution this period</p>
            </div>
            <CardContent className="p-2 sm:p-8 h-[250px] sm:h-[350px]">
              <DashboardChart data={chartData} />
            </CardContent>
          </Card>
        </div>
      </div>
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
    <motion.div className="group">
      <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl sm:rounded-[2rem] bg-white overflow-hidden p-4 sm:p-6 ring-1 ring-slate-100 h-full">
        <div className="flex items-center gap-3 sm:gap-5 h-full">
          <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-3xl ${colors[color]} ring-2 sm:ring-4 flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110`}>
            <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] sm:text-sm font-bold text-slate-500 uppercase tracking-widest leading-none mb-1 truncate">{label}</p>
            <h3 className="text-xl sm:text-3xl font-black text-slate-900 leading-tight">₹{(value || 0).toLocaleString()}</h3>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
