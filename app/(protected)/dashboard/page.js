'use client'

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, TrendingUp, TrendingDown, Wallet, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/dashboard/stats', {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <div className="h-32 bg-gray-200 rounded-xl animate-pulse"></div>
        <div className="h-32 bg-gray-200 rounded-xl animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Your financial overview</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Total Expense */}
        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Expenses</CardTitle>
            <TrendingDown className="h-5 w-5 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">₹{stats?.totalExpense?.toFixed(2) || '0.00'}</div>
          </CardContent>
        </Card>

        {/* Balance */}
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Balance</CardTitle>
            <Wallet className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${stats?.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ₹{stats?.balance?.toFixed(2) || '0.00'}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Debit: ₹{stats?.totalDebit?.toFixed(2)} | Credit: ₹{stats?.totalCredit?.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        {/* Debit */}
        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Debit</CardTitle>
            <TrendingUp className="h-5 w-5 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">₹{stats?.totalDebit?.toFixed(2) || '0.00'}</div>
          </CardContent>
        </Card>

        {/* Credit */}
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Credit</CardTitle>
            <TrendingUp className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">₹{stats?.totalCredit?.toFixed(2) || '0.00'}</div>
          </CardContent>
        </Card>

        {/* Marriage Hisab */}
        <Card className="border-l-4 border-l-purple-500 md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Marriage Hisab Total</CardTitle>
            <Users className="h-5 w-5 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">₹{stats?.totalMarriage?.toFixed(2) || '0.00'}</div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="space-y-3">
        <h2 className="text-xl font-semibold text-gray-900">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Button
            onClick={() => router.push('/expenses')}
            className="h-14 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
          >
            <Plus className="mr-2 h-5 w-5" />
            Add Expense
          </Button>
          <Button
            onClick={() => router.push('/hisab')}
            className="h-14 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
          >
            <Plus className="mr-2 h-5 w-5" />
            Add Hisab
          </Button>
          <Button
            onClick={() => router.push('/marriage')}
            className="h-14 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
          >
            <Plus className="mr-2 h-5 w-5" />
            Add Vayvhar
          </Button>
        </div>
      </div>

      {/* Recent Activity */}
      {stats?.recentExpenses && stats.recentExpenses.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xl font-semibold text-gray-900">Recent Expenses</h2>
          <div className="space-y-2">
            {stats.recentExpenses.slice(0, 3).map((expense) => (
              <Card key={expense.expense_id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 flex justify-between items-center">
                  <div>
                    <p className="font-medium text-gray-900">{expense.title}</p>
                    <p className="text-sm text-gray-500">{expense.category}</p>
                  </div>
                  <p className="text-lg font-bold text-red-600">-₹{expense.amount.toFixed(2)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {stats?.recentHisab && stats.recentHisab.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xl font-semibold text-gray-900">Recent Hisab</h2>
          <div className="space-y-2">
            {stats.recentHisab.slice(0, 3).map((record) => (
              <Card key={record.hisab_id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 flex justify-between items-center">
                  <div>
                    <p className="font-medium text-gray-900">{record.name}</p>
                    <p className="text-sm text-gray-500 capitalize">{record.type}</p>
                  </div>
                  <p className={`text-lg font-bold ${record.type === 'credit' ? 'text-green-600' : 'text-orange-600'}`}>
                    {record.type === 'credit' ? '+' : '-'}₹{record.amount.toFixed(2)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}