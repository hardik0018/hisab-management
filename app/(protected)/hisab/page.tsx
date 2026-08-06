export const dynamic = 'force-dynamic';
import { getHisabRecords } from '@/lib/data-fetching';
import HisabClient from './HisabClient';
import { redirect } from 'next/navigation';
import { getAuthenticatedUser } from '@/lib/auth';

/**
 * SSR Page for Hisab Records.
 * Fetches data on the server to ensure fast initial load and SEO compatibility.
 * Justification for SSR: Dashboard/List data is best loaded on the server to reduce waterfalls
 * and provide immediate content to the user.
 */
export default async function HisabPage() {
  const user = await getAuthenticatedUser();
  
  if (!user) {
    redirect('/login');
  }

  const data = await getHisabRecords();

  return <HisabClient 
    initialPeople={data?.people || []} 
    initialTotalDebit={data?.totalDebit || 0}
    initialTotalCredit={data?.totalCredit || 0}
    initialNetBalance={data?.netBalance || 0}
    initialHasMore={data?.hasMore || false}
  />;
}
