export const dynamic = 'force-dynamic';

import { getExpenses, getCollaborationData } from '@/lib/data-fetching';
import HistoryClient from './HistoryClient';
import { redirect } from 'next/navigation';
import { getAuthenticatedUser } from '@/lib/auth';
import ExpenseNavTabs from '@/components/expense/ExpenseNavTabs';

interface PageProps {
  searchParams: Promise<{
    search?: string;
    date?: string;
    month?: string;
    page?: string;
  }>;
}

export default async function HistoryPage({ searchParams }: PageProps) {
  const user = await getAuthenticatedUser();
  
  if (!user) {
    redirect('/login');
  }

  const params = await searchParams;
  const page = parseInt(params.page || '1', 10);
  const limit = 50;
  
  const [initialExpenses, collabData] = await Promise.all([
    getExpenses({
      search: params.search,
      date: params.date,
      month: params.month,
      page,
      limit
    }),
    getCollaborationData()
  ]);

  const collaborators = collabData?.collaborators || [];
  const currentUserId = collabData?.currentUserId || user.user_id;

  return (
    <>
      <ExpenseNavTabs />
      <HistoryClient 
        initialExpenses={initialExpenses || []} 
        searchParams={params} 
        collaborators={collaborators}
        currentUserId={currentUserId}
      />
    </>
  );
}
