export const dynamic = 'force-dynamic';
import { getCollaborationData } from '@/lib/data-fetching';
import ProfileClient from './ProfileClient';
import { redirect } from 'next/navigation';
import { getAuthenticatedUser } from '@/lib/auth';

/**
 * SSR Page for Profile and Collaboration management.
 * Fetches user profile, collaborators, and pending requests on the server.
 * Justification for SSR: Profile settings and collaboration status are critical for 
 * app functionality. Loading this on the server avoids flashing empty state for partners.
 */
export default async function ProfilePage() {
  const user = await getAuthenticatedUser();
  
  if (!user) {
    redirect('/login');
  }

  const collaborationData = await getCollaborationData();

  if (!collaborationData) {
      // Handle the case where collaborationData is null
      return <div>Loading...</div>; // Or a proper error state
  }

  return <ProfileClient initialCollaborationData={collaborationData} />;
}
