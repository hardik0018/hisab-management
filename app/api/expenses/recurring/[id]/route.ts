export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { ObjectId } from 'mongodb';
import { getAuthenticatedUser } from '@/lib/auth';

function getPreviousMonth(monthStr: string): string {
  const [year, month] = monthStr.split('-').map(Number);
  if (month === 1) {
    return `${year - 1}-12`;
  }
  return `${year}-${String(month - 1).padStart(2, '0')}`;
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized', message: 'You must be logged in' }, { status: 401 });
    }

    const { id } = await context.params;
    if (!ObjectId.isValid(id)) {
      return Response.json({ error: 'Bad Request', message: 'Invalid template ID format' }, { status: 400 });
    }

    const body = await request.json();
    const { itemName, amount, dayOfMonth, startDate, note, category, isActive } = body;

    const db = await getDb();
    const spaceId = user.space_id || user.user_id;

    // Verify ownership/space isolation
    const existing = await db.collection('recurring_expenses').findOne({
      _id: new ObjectId(id),
      space_id: spaceId
    });

    if (!existing) {
      return Response.json({ error: 'Not Found', message: 'Recurring template not found' }, { status: 404 });
    }

    const updates: any = {};

    if (itemName !== undefined) {
      if (itemName.trim().length < 2) {
        return Response.json({ error: 'Validation Error', message: 'Item name must be at least 2 characters' }, { status: 400 });
      }
      updates.itemName = itemName.trim();
    }

    if (amount !== undefined) {
      const amt = Number(amount);
      if (isNaN(amt) || amt <= 0) {
        return Response.json({ error: 'Validation Error', message: 'Amount must be greater than 0' }, { status: 400 });
      }
      updates.amount = amt;
    }

    if (dayOfMonth !== undefined) {
      const dom = Number(dayOfMonth);
      if (isNaN(dom) || dom < 1 || dom > 31) {
        return Response.json({ error: 'Validation Error', message: 'Day of month must be between 1 and 31' }, { status: 400 });
      }
      updates.dayOfMonth = dom;
    }

    if (startDate !== undefined) {
      if (!/^\d{4}-\d{2}$/.test(startDate)) {
        return Response.json({ error: 'Validation Error', message: 'Start month must be in YYYY-MM format' }, { status: 400 });
      }
      updates.startDate = startDate;
      // If start date changes, recalculate lastGeneratedMonth to keep logic consistent
      if (startDate !== existing.startDate) {
        updates.lastGeneratedMonth = getPreviousMonth(startDate);
      }
    }

    if (note !== undefined) {
      updates.note = note.trim();
    }

    if (category !== undefined) {
      updates.category = category.trim();
    }

    if (isActive !== undefined) {
      updates.isActive = !!isActive;
    }

    updates.updatedAt = new Date();

    await db.collection('recurring_expenses').updateOne(
      { _id: new ObjectId(id), space_id: spaceId },
      { $set: updates }
    );

    const refreshed = await db.collection('recurring_expenses').findOne({ _id: new ObjectId(id) });

    return Response.json({ 
      success: true, 
      template: {
        ...refreshed,
        _id: refreshed?._id.toString()
      } 
    });
  } catch (error) {
    console.error('[API_RECURRING_PATCH_ERROR]', error);
    return Response.json(
      { error: 'Internal Server Error', message: 'Failed to update recurring template' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized', message: 'You must be logged in' }, { status: 401 });
    }

    const { id } = await context.params;
    if (!ObjectId.isValid(id)) {
      return Response.json({ error: 'Bad Request', message: 'Invalid template ID format' }, { status: 400 });
    }

    const db = await getDb();
    const spaceId = user.space_id || user.user_id;

    const result = await db.collection('recurring_expenses').deleteOne({
      _id: new ObjectId(id),
      space_id: spaceId
    });

    if (result.deletedCount === 0) {
      return Response.json({ error: 'Not Found', message: 'Recurring template not found' }, { status: 404 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('[API_RECURRING_DELETE_ERROR]', error);
    return Response.json(
      { error: 'Internal Server Error', message: 'Failed to delete recurring template' },
      { status: 500 }
    );
  }
}
