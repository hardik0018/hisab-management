export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { validateExpense } from '@/models/Expense';
import { getAuthenticatedUser } from '@/lib/auth';
import { Expense } from '@/types';
import { revalidatePath } from 'next/cache';

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
        type: exp.type === 'income' ? 'income' : 'expense',
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

    revalidatePath('/expenses', 'layout');
    revalidatePath('/dashboard', 'layout');

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
