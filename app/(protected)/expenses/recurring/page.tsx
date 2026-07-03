export const dynamic = 'force-dynamic';

import React from 'react';
import { getRecurringExpenses, getCollaborationData } from '@/lib/data-fetching';
import RecurringClient from './RecurringClient';
import { redirect } from 'next/navigation';
import { getAuthenticatedUser } from '@/lib/auth';

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
    <RecurringClient 
      initialTemplates={initialTemplates || []} 
      collaborators={collaborators}
      currentUserId={user.user_id}
    />
  );
}
