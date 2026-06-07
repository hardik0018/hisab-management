export const dynamic = 'force-dynamic';

/**
 * /tracker - Live Tracker Dashboard Page (Server Component)
 *
 * SSR strategy:
 * - Fetches the latest tracker state on the server for immediate hydration.
 * - No auth required for the tracker data itself — the (protected) layout
 *   already ensures only signed-in users reach this page.
 * - Live updates are handled by TrackerProvider via SSE on the client.
 */

import { getTrackerLatestState } from '@/lib/data-fetching';
import { TrackerProvider } from '@/components/tracker/TrackerProvider';
import { TrackerDashboard } from '@/components/tracker/TrackerDashboard';

export const metadata = {
  title: 'Live Tracker | Hisab',
  description: 'Real-time GPS tracking dashboard with live location updates',
};

export default async function TrackerPage() {
  // SSR: fetch latest state once — live updates handled by SSE
  const initialLatest = await getTrackerLatestState();

  return (
    <TrackerProvider initialLatest={initialLatest}>
      <TrackerDashboard />
    </TrackerProvider>
  );
}
