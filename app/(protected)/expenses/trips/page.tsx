export const dynamic = 'force-dynamic';

import { getTrips, getActiveTrip } from '@/lib/trip-fetching';
import { getCollaborationData } from '@/lib/data-fetching';
import { getAuthenticatedUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import ExpenseNavTabs from '@/components/expense/ExpenseNavTabs';
import AppShell from '@/components/AppShell';
import TripsListClient from './TripsListClient';

export default async function TripsPage() {
  const user = await getAuthenticatedUser();
  if (!user) {
    redirect('/login');
  }

  const [trips, activeTrip, collabData] = await Promise.all([
    getTrips(),
    getActiveTrip(),
    getCollaborationData(),
  ]);

  const collaborators = collabData?.collaborators || [];
  const currentUserId = collabData?.currentUserId || user.user_id;
  const currentUserName = user.name || 'Me';

  return (
    <>
      <ExpenseNavTabs />
      <AppShell className="pt-3 pb-24">
        <TripsListClient
          initialTrips={trips}
          initialActiveTrip={activeTrip}
          collaborators={collaborators}
          currentUserId={currentUserId}
          currentUserName={currentUserName}
        />
      </AppShell>
    </>
  );
}
