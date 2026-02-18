import { auth } from "@/auth";
import { redirect } from "next/navigation";
import BottomNav from '@/components/BottomNav';
import { ReactNode } from 'react';

interface ProtectedLayoutProps {
  children: ReactNode;
}

/**
 * SSR Protected Layout.
 * Performs server-side authentication check before rendering any protected content.
 * Justification for SSR: Security and speed. By checking auth on the server, we prevent
 * the client from seeing protected UI even for a split second before redirecting.
 */
export default async function ProtectedLayout({ children }: ProtectedLayoutProps) {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {children}
      <BottomNav />
    </div>
  );
}
