export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const db = await getDb();
    const spaceId = user.space_id || user.user_id;
    const now = new Date();

    const trip = await db.collection('trips').findOne({ trip_id: id, space_id: spaceId });
    if (!trip) {
      return Response.json({ error: 'Not Found', message: 'Trip not found' }, { status: 404 });
    }

    const willBeActive = !trip.isCurrentActive;

    if (willBeActive) {
      // Unset active on all other trips in this space
      await db.collection('trips').updateMany(
        { space_id: spaceId, isCurrentActive: true },
        { $set: { isCurrentActive: false, updatedAt: now } }
      );
    }

    await db.collection('trips').updateOne(
      { trip_id: id, space_id: spaceId },
      { $set: { isCurrentActive: willBeActive, status: willBeActive ? 'active' : trip.status, updatedAt: now } }
    );

    revalidatePath('/expenses/trips', 'layout');
    revalidatePath(`/expenses/trips/${id}`, 'layout');
    revalidatePath('/expenses', 'layout');

    return Response.json({
      success: true,
      isCurrentActive: willBeActive,
      message: willBeActive ? `"${trip.title}" is now your Active Trip!` : `Active trip deactivated.`,
    });
  } catch (error) {
    console.error('[API_TRIP_ACTIVATE_ERROR]', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
