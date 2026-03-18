export const dynamic = 'force-dynamic';
import { getExpenses } from '@/lib/data-fetching';
import ExpensesClient from './ExpensesClient';
import { redirect } from 'next/navigation';
import { getAuthenticatedUser } from '@/lib/auth';

interface ExpensesPageProps {
  searchParams: Promise<{ category?: string }>;
}

/**
 * SSR Page for Expenses.
 * Fetches initial expense list on the server for instant rendering.
 * Justification for SSR: Expense tracking pages need quick feedback on total spend and recent entries.
 * SSR ensures the aggregate data is calculated before the page reaches the user.
 */
export default async function ExpensesPage({ searchParams }: ExpensesPageProps) {
  const user = await getAuthenticatedUser();
  
  if (!user) {
    redirect('/login');
  }

  const { category = 'all' } = await searchParams;
  const initialData = await getExpenses({ category });

  if (!initialData) {
    // Handle null case if needed, or pass empty defaults
    return <ExpensesClient initialData={{ expenses: [], topCategories: [], pagination: { total: 0, page: 1, limit: 50, totalPages: 0 } }} initialCategory={category} />;
  }

  return <ExpensesClient initialData={initialData} initialCategory={category} />;
}
