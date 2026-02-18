export const dynamic = 'force-dynamic';
import { getMarriageRecords } from '@/lib/data-fetching';
import MarriageClient from './MarriageClient';
import { redirect } from 'next/navigation';
import { getAuthenticatedUser } from '@/lib/auth';

/**
 * SSR Page for Marriage (Vayvhar) records.
 * Fetches celebration data on the server.
 * Justification for SSR: Social records are often static/viewed more than they are edited. 
 * SSR provides a superior experience for reading these important family records.
 */
export default async function MarriagePage() {
  const user = await getAuthenticatedUser();
  
  if (!user) {
    redirect('/login');
  }

  const records = await getMarriageRecords();

  return <MarriageClient initialRecords={records || []} />;
}
