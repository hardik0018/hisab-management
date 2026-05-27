export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { validateExpense } from '@/models/Expense';
import { getAuthenticatedUser } from '@/lib/auth';
import { Expense } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized', message: 'You must be logged in' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const date = searchParams.get('date');
    const month = searchParams.get('month');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const db = await getDb();
    const spaceId = user.space_id || user.user_id;
    const query: any = { space_id: spaceId };

    // 1. Filter by specific date (e.g., 2026-05-27)
    if (date) {
      query.date = date;
    }
    // 2. Filter by month (e.g., 2026-05)
    else if (month) {
      query.date = { $regex: `^${month}` };
    }
    // 3. Filter by date range
    else if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        query.date.$gte = startDate;
      }
      if (endDate) {
        query.date.$lte = endDate;
      }
    }

    // 4. Filter by text search (itemName or note)
    if (search) {
      const searchRegex = { $regex: search, $options: 'i' };
      query.$or = [
        { itemName: searchRegex },
        { note: searchRegex }
      ];
    }

    // Execute query sorted by date DESC, then by createdAt DESC (latest first)
    const expenses = await db
      .collection('expenses')
      .find(query)
      .sort({ date: -1, createdAt: -1 })
      .toArray();

    // Map _id to string for standard JSON formatting
    const mappedExpenses = expenses.map(exp => ({
      ...exp,
      _id: exp._id.toString()
    }));

    return Response.json({ expenses: mappedExpenses });
  } catch (error) {
    console.error('[API_EXPENSES_GET_ERROR]', error);
    return Response.json(
      { error: 'Internal Server Error', message: 'Failed to retrieve expenses' },
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
    const { expenses } = body;

    if (!expenses || !Array.isArray(expenses)) {
      return Response.json(
        { error: 'Bad Request', message: 'Missing fields: expenses array is required' },
        { status: 400 }
      );
    }

    const db = await getDb();
    const now = new Date();
    const spaceId = user.space_id || user.user_id;
    const userId = user.user_id;
    
    const validExpensesToInsert: Expense[] = [];

    for (const exp of expenses) {
      const expenseDoc: Partial<Expense> = {
        space_id: spaceId,
        user_id: userId,
        date: exp.date,
        itemName: exp.itemName,
        amount: Number(exp.amount),
        note: exp.note || '',
        category: exp.category || 'Uncategorized',
        currency: 'INR',
      };

      const validationResult = validateExpense(expenseDoc);
      if (!validationResult.isValid) {
        return Response.json(
          { error: 'Validation Error', message: validationResult.reason || 'Invalid expense data' },
          { status: 400 }
        );
      }

      validExpensesToInsert.push({
        ...expenseDoc,
        createdAt: now,
        updatedAt: now,
      } as Expense);
    }

    if (validExpensesToInsert.length === 0) {
      return Response.json({ success: true, count: 0 });
    }

    const result = await db.collection('expenses').insertMany(validExpensesToInsert as any);

    return Response.json(
      { success: true, count: result.insertedCount },
      { status: 201 }
    );
  } catch (error) {
    console.error('[API_EXPENSES_POST_ERROR]', error);
    return Response.json(
      { error: 'Internal Server Error', message: 'Failed to save expenses' },
      { status: 500 }
    );
  }
}
