export const dynamic = 'force-dynamic';
import { getMarriageRecords, getCollaborationData } from '@/lib/data-fetching';
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

  const [data, collabData] = await Promise.all([
    getMarriageRecords(),
    getCollaborationData(),
  ]);

  return <MarriageClient 
    initialRecords={data?.records || []} 
    initialTotalGiven={data?.totalGiven || 0}
    initialTotalReceived={data?.totalReceived || 0}
    initialNetBalance={data?.netBalance || 0}
    initialHasMore={data?.hasMore || false}
    collaborators={collabData?.collaborators || []}
    currentUserId={collabData?.currentUserId || user.user_id}
  />;
}
