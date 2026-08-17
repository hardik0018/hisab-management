export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { getActiveTrip } from '@/lib/trip-fetching';
import { getAuthenticatedUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const activeTrip = await getActiveTrip();
    return Response.json({ activeTrip, success: true });
  } catch (error) {
    console.error('[API_TRIPS_ACTIVE_GET_ERROR]', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
