export const dynamic = 'force-dynamic';

import { getCollaborationData } from '@/lib/data-fetching';
import { getAuthenticatedUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import ExpenseNavTabs from '@/components/expense/ExpenseNavTabs';
import AppShell from '@/components/AppShell';
import NewTripClient from './NewTripClient';

export default async function NewTripPage() {
  const user = await getAuthenticatedUser();
  if (!user) {
    redirect('/login');
  }

  const collabData = await getCollaborationData();
  const collaborators = collabData?.collaborators || [];
  const currentUserId = collabData?.currentUserId || user.user_id;
  const currentUserName = user.name || 'Me';

  return (
    <>
      <ExpenseNavTabs />
      <AppShell className="pt-3 pb-24">
        <NewTripClient
          collaborators={collaborators}
          currentUserId={currentUserId}
          currentUserName={currentUserName}
        />
      </AppShell>
    </>
  );
}
