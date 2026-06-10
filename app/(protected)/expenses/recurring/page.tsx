export const dynamic = 'force-dynamic';

import React from 'react';
import { getRecurringExpenses } from '@/lib/data-fetching';
import RecurringClient from './RecurringClient';
import { redirect } from 'next/navigation';
import { getAuthenticatedUser } from '@/lib/auth';

export default async function RecurringExpensesPage() {
  const user = await getAuthenticatedUser();
  
  if (!user) {
    redirect('/login');
  }

  const initialTemplates = await getRecurringExpenses();

  return <RecurringClient initialTemplates={initialTemplates || []} />;
}
