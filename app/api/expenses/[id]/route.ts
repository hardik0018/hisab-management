export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { ObjectId } from 'mongodb';
import { getAuthenticatedUser } from '@/lib/auth';
import { validateExpense } from '@/models/Expense';
import { Expense } from '@/types';
import { revalidatePath } from 'next/cache';

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
      return Response.json(
        { error: 'Bad Request', message: 'Invalid expense ID format' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { itemName, amount, note, date } = body;

    const db = await getDb();
    const spaceId = user.space_id || user.user_id;

    // Ensure item belongs to the user's space
    const existing = await db.collection('expenses').findOne({ 
      _id: new ObjectId(id),
      space_id: spaceId
    });

    if (!existing) {
      return Response.json(
        { error: 'Not Found', message: 'Expense record not found' },
        { status: 404 }
      );
    }

    // Merge updates
    const updatedDoc: Partial<Expense> = {
      space_id: spaceId,
      user_id: existing.user_id, // keep original creator
      date: date !== undefined ? date : existing.date,
      itemName: itemName !== undefined ? itemName : existing.itemName,
      amount: amount !== undefined ? Number(amount) : existing.amount,
      note: note !== undefined ? note : existing.note,
    };

    const validation = validateExpense(updatedDoc);
    if (!validation.isValid) {
      return Response.json(
        { error: 'Validation Error', message: validation.reason || 'Invalid expense data' },
        { status: 400 }
      );
    }

    const setObj = {
      ...updatedDoc,
      updatedAt: new Date(),
    };

    await db.collection('expenses').updateOne(
      { _id: new ObjectId(id), space_id: spaceId },
      { $set: setObj }
    );

    // Sync if it's a transfer
    if ((existing.type === 'transfer_in' || existing.type === 'transfer_out') && existing.associatedId) {
      await db.collection('expenses').updateOne(
        { 
          associatedId: existing.associatedId, 
          space_id: spaceId, 
          _id: { $ne: new ObjectId(id) } 
        },
        { 
          $set: {
            date: setObj.date,
            itemName: setObj.itemName,
            amount: setObj.amount,
            note: setObj.note,
            updatedAt: setObj.updatedAt
          } 
        }
      );
    }

    const result = {
      _id: id,
      ...existing,
      ...setObj,
    };

    revalidatePath('/expenses', 'layout');
    revalidatePath('/dashboard', 'layout');

    return Response.json({ expense: result });
  } catch (error) {
    console.error('[API_EXPENSE_PATCH_ERROR]', error);
    return Response.json(
      { error: 'Internal Server Error', message: 'Failed to update expense' },
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
      return Response.json(
        { error: 'Bad Request', message: 'Invalid expense ID format' },
        { status: 400 }
      );
    }

    const db = await getDb();
    const spaceId = user.space_id || user.user_id;

    // Delete item constrained by space_id
    const existing = await db.collection('expenses').findOne({ 
      _id: new ObjectId(id),
      space_id: spaceId
    });

    if (!existing) {
      return Response.json(
        { error: 'Not Found', message: 'Expense record not found' },
        { status: 404 }
      );
    }

    // Sync delete if it's a transfer
    if ((existing.type === 'transfer_in' || existing.type === 'transfer_out') && existing.associatedId) {
      await db.collection('expenses').deleteMany({
        associatedId: existing.associatedId,
        space_id: spaceId
      });
    } else {
      await db.collection('expenses').deleteOne({ 
        _id: new ObjectId(id),
        space_id: spaceId
      });
    }



    revalidatePath('/expenses', 'layout');
    revalidatePath('/dashboard', 'layout');

    return Response.json({ success: true });
  } catch (error) {
    console.error('[API_EXPENSE_DELETE_ERROR]', error);
    return Response.json(
      { error: 'Internal Server Error', message: 'Failed to delete expense' },
      { status: 500 }
    );
  }
}
