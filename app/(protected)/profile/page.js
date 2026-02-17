'use client'

import { useState } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut, Mail, Calendar } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { signOut, useSession } from 'next-auth/react';

import { ConfirmDialog } from '@/components/ConfirmDialog';

export default function ProfilePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const user = session?.user;
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut({ redirect: false });
      toast.success('Logged out successfully');
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to logout');
    }
  };

  if (status === 'loading') {
    return (
      <div className="p-4">
        <div className="h-32 bg-gray-200 rounded-xl animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
        <p className="text-gray-600">Manage your account</p>
      </div>

      {/* User Info Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={user?.image} alt={user?.name} />
              <AvatarFallback className="text-2xl">
                {user?.name?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900">{user?.name}</h2>
              <div className="flex items-center gap-2 mt-2 text-gray-600">
                <Mail className="h-4 w-4" />
                <span>{user?.email}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* App Info */}
      <Card>
        <CardHeader>
          <CardTitle>About Hisab Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-gray-600">
          <p>Professional finance management app for Indian users</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Manage daily expenses</li>
            <li>Track debit-credit hisab</li>
            <li>Record marriage vayvhar</li>
            <li>View comprehensive dashboard</li>
          </ul>
        </CardContent>
      </Card>

      {/* Logout Button */}
      <Button
        onClick={() => setShowLogoutConfirm(true)}
        variant="destructive"
        className="w-full h-12 text-base"
      >
        <LogOut className="mr-2 h-5 w-5" />
        Logout
      </Button>

      <ConfirmDialog
        open={showLogoutConfirm}
        onOpenChange={setShowLogoutConfirm}
        onConfirm={handleLogout}
        title="Logout"
        description="Are you sure you want to logout? You will need to sign in again to access your account."
        confirmText="Logout"
        variant="destructive"
      />
    </div>
  );
}