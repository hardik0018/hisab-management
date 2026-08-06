export const dynamic = 'force-dynamic';

import { getRecurringExpenses, getCollaborationData } from '@/lib/data-fetching';
import RecurringClient from './RecurringClient';
import { redirect } from 'next/navigation';
import { getAuthenticatedUser } from '@/lib/auth';
import SegmentedTabs from '@/components/SegmentedTabs';

const EXPENSE_TABS = [
  { label: 'Today', href: '/expenses' },
  { label: 'History', href: '/expenses/history' },
  { label: 'Auto', href: '/expenses/recurring' },
  { label: 'Report', href: '/expenses/summary' },
  { label: 'Tax', href: '/expenses/tax' },
  { label: 'Settings', href: '/expenses/settings' },
];

export default async function RecurringExpensesPage() {
  const user = await getAuthenticatedUser();
  
  if (!user) {
    redirect('/login');
  }

  const [initialTemplates, collabData] = await Promise.all([
    getRecurringExpenses(),
    getCollaborationData()
  ]);

  const collaborators = collabData?.collaborators || [];

  return (
    <>
      <SegmentedTabs tabs={EXPENSE_TABS} />
      <RecurringClient 
        initialTemplates={initialTemplates || []} 
        collaborators={collaborators}
        currentUserId={user.user_id}
      />
    </>
  );
}
