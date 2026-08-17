export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';
import { getTripDetail } from '@/lib/trip-fetching';
import { revalidatePath } from 'next/cache';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const detail = await getTripDetail(id);

    if (!detail) {
      return Response.json({ error: 'Not Found', message: 'Trip not found' }, { status: 404 });
    }

    return Response.json({ success: true, data: detail });
  } catch (error) {
    console.error('[API_TRIP_DETAIL_GET_ERROR]', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const db = await getDb();
    const spaceId = user.space_id || user.user_id;
    const now = new Date();

    const updateFields: Record<string, any> = { updatedAt: now };

    if (body.title !== undefined) updateFields.title = String(body.title).trim();
    if (body.destination !== undefined) updateFields.destination = String(body.destination).trim();
    if (body.category !== undefined) updateFields.category = body.category;
    if (body.startDate !== undefined) updateFields.startDate = body.startDate;
    if (body.endDate !== undefined) updateFields.endDate = body.endDate;
    if (body.budget !== undefined) updateFields.budget = Number(body.budget);
    if (body.coverEmoji !== undefined) updateFields.coverEmoji = body.coverEmoji;
    if (body.status !== undefined) updateFields.status = body.status;
    if (body.notes !== undefined) updateFields.notes = body.notes;
    if (body.members !== undefined && Array.isArray(body.members)) updateFields.members = body.members;

    if (body.isCurrentActive === true) {
      // Unset active on all other trips in this space first
      await db.collection('trips').updateMany(
        { space_id: spaceId, isCurrentActive: true },
        { $set: { isCurrentActive: false, updatedAt: now } }
      );
      updateFields.isCurrentActive = true;
    } else if (body.isCurrentActive === false) {
      updateFields.isCurrentActive = false;
    }

    const result = await db.collection('trips').updateOne(
      { trip_id: id, space_id: spaceId },
      { $set: updateFields }
    );

    if (result.matchedCount === 0) {
      return Response.json({ error: 'Not Found', message: 'Trip not found' }, { status: 404 });
    }

    revalidatePath('/expenses/trips', 'layout');
    revalidatePath(`/expenses/trips/${id}`, 'layout');
    revalidatePath('/expenses', 'layout');

    return Response.json({ success: true, message: 'Trip updated successfully' });
  } catch (error) {
    console.error('[API_TRIP_PATCH_ERROR]', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const cascade = searchParams.get('cascade') === 'true';

    const db = await getDb();
    const spaceId = user.space_id || user.user_id;

    const trip = await db.collection('trips').findOne({ trip_id: id, space_id: spaceId });
    if (!trip) {
      return Response.json({ error: 'Not Found', message: 'Trip not found' }, { status: 404 });
    }

    // Delete trip document
    await db.collection('trips').deleteOne({ trip_id: id, space_id: spaceId });

    // Handle linked expenses
    if (cascade) {
      await db.collection('expenses').deleteMany({
        space_id: spaceId,
        associatedType: 'trip',
        associatedId: id,
      });
    } else {
      await db.collection('expenses').updateMany(
        { space_id: spaceId, associatedType: 'trip', associatedId: id },
        {
          $unset: {
            associatedType: '',
            associatedId: '',
            tripMetadata: '',
          },
        }
      );
    }

    revalidatePath('/expenses/trips', 'layout');
    revalidatePath('/expenses', 'layout');

    return Response.json({ success: true, message: 'Trip deleted successfully' });
  } catch (error) {
    console.error('[API_TRIP_DELETE_ERROR]', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
