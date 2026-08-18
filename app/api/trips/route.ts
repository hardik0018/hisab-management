export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';
import { tripSchema } from '@/models/Trip';
import { getTrips } from '@/lib/trip-fetching';
import { v4 as uuidv4 } from 'uuid';
import { revalidatePath } from 'next/cache';
import { Trip, TripMember } from '@/types/trip';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;

    const trips = await getTrips({ status });
    return Response.json({ trips, success: true });
  } catch (error) {
    console.error('[API_TRIPS_GET_ERROR]', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = tripSchema.safeParse(body);

    if (!validation.success) {
      return Response.json(
        {
          error: 'Validation Error',
          message: validation.error.issues[0]?.message || 'Invalid trip data',
          details: validation.error.issues,
        },
        { status: 400 }
      );
    }

    const data = validation.data;
    const db = await getDb();
    const spaceId = user.space_id || user.user_id;
    const tripId = `trp_${uuidv4().replace(/-/g, '').slice(0, 10)}`;
    const now = new Date();

    // Default members if none provided: add current user
    let members: TripMember[] = [];
    if (!data.members || data.members.length === 0) {
      members = [
        {
          id: `mem_${uuidv4().slice(0, 8)}`,
          name: user.name || 'Me',
          isCurrentUser: true,
          userId: user.user_id,
        },
      ];
    } else {
      members = data.members.map((m) => ({
        id: m.id || `mem_${uuidv4().slice(0, 8)}`,
        name: m.name || '',
        mobile: m.mobile,
        isCurrentUser: !!m.isCurrentUser,
        userId: m.userId,
      }));
      // Ensure at least one member is marked as current user
      const hasCurrentUser = members.some((m) => m.isCurrentUser || m.userId === user.user_id);
      if (!hasCurrentUser && members.length > 0) {
        members[0].isCurrentUser = true;
      }
    }

    // If marked as active, unset any other active trip in this space
    if (data.isCurrentActive) {
      await db.collection('trips').updateMany(
        { space_id: spaceId, isCurrentActive: true },
        { $set: { isCurrentActive: false, updatedAt: now } }
      );
    }

    const newTrip: Trip = {
      trip_id: tripId,
      space_id: spaceId,
      user_id: user.user_id,
      title: data.title.trim(),
      destination: data.destination ? data.destination.trim() : data.title.trim(),
      category: data.category || 'village_visit',
      startDate: data.startDate || now.toISOString().split('T')[0],
      endDate: data.endDate || '',
      budget: Number(data.budget || 0),
      coverEmoji: data.coverEmoji || '🌴',
      status: data.status || 'active',
      isCurrentActive: !!data.isCurrentActive,
      members,
      notes: data.notes?.trim() || '',
      createdAt: now,
      updatedAt: now,
    };

    await db.collection('trips').insertOne(newTrip as any);

    revalidatePath('/expenses/trips', 'layout');
    revalidatePath('/expenses', 'layout');
    revalidatePath('/dashboard', 'layout');

    return Response.json({ success: true, trip: newTrip }, { status: 201 });
  } catch (error) {
    console.error('[API_TRIPS_POST_ERROR]', error);
    return Response.json({ error: 'Internal Server Error', message: 'Failed to create trip' }, { status: 500 });
  }
}
