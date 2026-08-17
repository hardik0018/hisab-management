export const dynamic = 'force-dynamic';

import { getTripDetail } from '@/lib/trip-fetching';
import { getCollaborationData } from '@/lib/data-fetching';
import { getAuthenticatedUser } from '@/lib/auth';
import { notFound, redirect } from 'next/navigation';
import AppShell from '@/components/AppShell';
import TripDetailClient from './TripDetailClient';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function TripDetailPage({ params }: PageProps) {
  const user = await getAuthenticatedUser();
  if (!user) {
    redirect('/login');
  }

  const { id } = await params;
  const [detailData, collabData] = await Promise.all([
    getTripDetail(id),
    getCollaborationData(),
  ]);

  if (!detailData) {
    notFound();
  }

  const collaborators = collabData?.collaborators || [];
  const currentUserId = collabData?.currentUserId || user.user_id;

  return (
    <AppShell className="pt-3 pb-24">
      <TripDetailClient
        initialData={detailData}
        collaborators={collaborators}
        currentUserId={currentUserId}
      />
    </AppShell>
  );
}
