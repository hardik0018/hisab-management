import { auth } from "@/auth";
import { redirect } from "next/navigation";
import BottomNav from '@/components/BottomNav';
import PullToRefresh from '@/components/PullToRefresh';
import { ReactNode } from 'react';

interface ProtectedLayoutProps {
  children: ReactNode;
}

/**
 * SSR Protected Layout.
 * Checks auth server-side, renders BottomNav.
 * QuickAddSheet removed — replaced by inline QuickAddBar on each screen.
 */
export default async function ProtectedLayout({ children }: ProtectedLayoutProps) {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  return (
    <div
      className="min-h-screen"
      style={{ background: 'var(--background)' }}
    >
      <PullToRefresh>
        {children}
      </PullToRefresh>
      <BottomNav />
    </div>
  );
}
