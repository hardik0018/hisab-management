export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';
import { categorizeExpense } from '@/lib/category-engine';
import { revalidatePath } from 'next/cache';
import { Expense } from '@/types/expense';

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

    const trip = await db.collection('trips').findOne({ trip_id: id, space_id: spaceId });
    if (!trip) {
      return Response.json({ error: 'Not Found', message: 'Trip not found' }, { status: 404 });
    }

    const body = await request.json();
    const {
      itemName,
      amount,
      date,
      category,
      note,
      tripCategory,
      paidByMemberId,
      splitType,
      splits,
    } = body;

    if (!itemName || !amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      return Response.json(
        { error: 'Bad Request', message: 'Valid item name and positive amount are required' },
        { status: 400 }
      );
    }

    const numAmount = Number(amount);
    const dateStr = date || new Date().toISOString().split('T')[0];
    const now = new Date();

    const generalCategory = categorizeExpense(
      itemName,
      note,
      numAmount,
      'expense',
      category || tripCategory
    );

    const expenseDoc: Expense = {
      space_id: spaceId,
      user_id: user.user_id,
      date: dateStr,
      itemName: String(itemName).trim(),
      amount: numAmount,
      note: String(note || '').trim(),
      category: generalCategory,
      currency: 'INR',
      type: 'expense',
      associatedType: 'trip',
      associatedId: id,
      tripMetadata: {
        paidByMemberId: paidByMemberId || (trip.members?.[0]?.id ?? undefined),
        tripCategory: tripCategory || generalCategory,
        splitType: splitType || 'personal',
        splits: Array.isArray(splits) ? splits : undefined,
      },
      createdAt: now,
      updatedAt: now,
    };

    const result = await db.collection('expenses').insertOne(expenseDoc as any);

    revalidatePath(`/expenses/trips/${id}`, 'layout');
    revalidatePath('/expenses/trips', 'layout');
    revalidatePath('/expenses', 'layout');
    revalidatePath('/dashboard', 'layout');

    return Response.json(
      {
        success: true,
        expense: { ...expenseDoc, _id: result.insertedId.toString() },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[API_TRIP_EXPENSE_ADD_ERROR]', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
