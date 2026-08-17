export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';
import { RecurringExpense } from '@/types';
import { categorizeExpense } from '@/lib/category-engine';
import { getInitialLastGenMonth } from '@/lib/recurring-engine';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized', message: 'You must be logged in' }, { status: 401 });
    }

    const db = await getDb();
    const spaceId = user.space_id || user.user_id;

    const templates = await db.collection('recurring_expenses')
      .find({ space_id: spaceId })
      .sort({ createdAt: -1 })
      .toArray();

    const serialized = templates.map(t => ({
      ...t,
      _id: t._id.toString(),
      createdAt: t.createdAt instanceof Date ? t.createdAt.toISOString() : t.createdAt,
      updatedAt: t.updatedAt instanceof Date ? t.updatedAt.toISOString() : t.updatedAt,
    }));

    return Response.json({ success: true, templates: serialized });
  } catch (error) {
    console.error('[API_RECURRING_GET_ERROR]', error);
    return Response.json(
      { error: 'Internal Server Error', message: 'Failed to fetch recurring templates' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized', message: 'You must be logged in' }, { status: 401 });
    }

    const body = await request.json();
    const { itemName, amount, dayOfMonth, startDate, note, category, isActive, user_id, type, initialInvestedAmount, frequency, frequencyIntervalMonths } = body;

    // Validation
    if (!itemName || itemName.trim().length < 2) {
      return Response.json({ error: 'Validation Error', message: 'Item name must be at least 2 characters' }, { status: 400 });
    }

    const amt = Number(amount);
    if (isNaN(amt) || amt <= 0) {
      return Response.json({ error: 'Validation Error', message: 'Amount must be greater than 0' }, { status: 400 });
    }

    const dom = Number(dayOfMonth);
    if (isNaN(dom) || dom < 1 || dom > 31) {
      return Response.json({ error: 'Validation Error', message: 'Day of month must be between 1 and 31' }, { status: 400 });
    }

    if (!startDate || !/^\d{4}-\d{2}$/.test(startDate)) {
      return Response.json({ error: 'Validation Error', message: 'Start month must be in YYYY-MM format' }, { status: 400 });
    }

    const db = await getDb();
    const now = new Date();
    const spaceId = user.space_id || user.user_id;
    const userId = user_id || user.user_id;

    const freq = frequency || 'monthly';
    let intervalMonths = Number(frequencyIntervalMonths || 1);
    if (isNaN(intervalMonths) || intervalMonths < 1) {
      if (freq === 'quarterly') intervalMonths = 3;
      else if (freq === 'half_yearly') intervalMonths = 6;
      else if (freq === 'yearly') intervalMonths = 12;
      else intervalMonths = 1;
    }

    const lastGenMonth = getInitialLastGenMonth(startDate, intervalMonths);
    const templateType = type === 'income' ? 'income' : 'expense';

    const newTemplate: Omit<RecurringExpense, '_id'> = {
      space_id: spaceId,
      user_id: userId,
      itemName: itemName.trim(),
      amount: amt,
      note: note ? note.trim() : '',
      category: categorizeExpense(itemName, note, amt, templateType, category),
      type: templateType,
      frequency: freq,
      frequencyIntervalMonths: intervalMonths,
      dayOfMonth: dom,
      isActive: isActive !== undefined ? !!isActive : true,
      startDate,
      lastGeneratedMonth: lastGenMonth,
      initialInvestedAmount: Number(initialInvestedAmount || 0),
      createdAt: now,
      updatedAt: now,
    };

    const result = await db.collection('recurring_expenses').insertOne(newTemplate as any);

    return Response.json(
      { 
        success: true, 
        template: {
          _id: result.insertedId.toString(),
          ...newTemplate
        } 
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[API_RECURRING_POST_ERROR]', error);
    return Response.json(
      { error: 'Internal Server Error', message: 'Failed to create recurring template' },
      { status: 500 }
    );
  }
}
