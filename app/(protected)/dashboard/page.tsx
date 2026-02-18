export const dynamic = 'force-dynamic';
import { getDashboardStats, getCollaborationData } from '@/lib/data-fetching';
import DashboardClient from './DashboardClient';
import { redirect } from 'next/navigation';
import { getAuthenticatedUser } from '@/lib/auth';

/**
 * SSR Page for the Main Dashboard.
 * Fetches all financial aggregates and collaboration status on the server.
 * Justification for SSR: The dashboard is the first thing a user sees. Any delay or 
 * loading flicker here degrades the premium experience. Rendering on the server ensures
 * that charts and stats are ready immediately.
 */
export default async function DashboardPage() {
  const user = await getAuthenticatedUser();
  
  if (!user) {
    redirect('/login');
  }

  const [stats, collaborationData] = await Promise.all([
    getDashboardStats(),
    getCollaborationData()
  ]);

  return (
    <DashboardClient 
      initialStats={stats} 
      initialCollaborators={collaborationData?.collaborators || []} 
    />
  );
}
