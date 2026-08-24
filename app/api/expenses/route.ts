export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { expenseSchema } from '@/models/Expense';
import { getAuthenticatedUser } from '@/lib/auth';
import { Expense } from '@/types';
import { categorizeExpense } from '@/lib/category-engine';
import { revalidatePath } from 'next/cache';
import { getExpenses } from '@/lib/data-fetching';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || undefined;
    const date = searchParams.get('date') || undefined;
    const month = searchParams.get('month') || undefined;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const expenses = await getExpenses({ search, date, month, page, limit });
    return Response.json({ expenses, success: true });
  } catch (error) {
    console.error('[API_EXPENSES_GET_ERROR]', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized', message: 'You must be logged in' }, { status: 401 });
    }

    const body = await request.json();
    let rawExpensesList: any[] = [];

    if (body.expenses && Array.isArray(body.expenses)) {
      rawExpensesList = body.expenses;
    } else if (Array.isArray(body)) {
      rawExpensesList = body;
    } else if (body.itemName && body.amount !== undefined) {
      rawExpensesList = [body];
    } else {
      return Response.json(
        { error: 'Bad Request', message: 'Missing fields: expense or expenses array is required' },
        { status: 400 }
      );
    }

    const db = await getDb();
    const now = new Date();
    const spaceId = user.space_id || user.user_id;
    const userId = user.user_id;
    
    const validExpensesToInsert: Expense[] = [];

    for (const exp of rawExpensesList) {
      const expenseDoc: Partial<Expense> = {
        space_id: spaceId,
        user_id: exp.user_id || userId,
        date: exp.date,
        itemName: exp.itemName,
        amount: Number(exp.amount),
        note: exp.note || '',
        category: categorizeExpense(exp.itemName, exp.note, Number(exp.amount), exp.type, exp.category),
        currency: 'INR',
        type: exp.type, // handled below
        associatedType: exp.associatedType,
        associatedId: exp.associatedId,
      };

      if (exp.type === 'transfer') {
        if (!exp.transfer_to_user_id) {
          return Response.json(
            { error: 'Validation Error', message: 'Transfer requires a recipient' },
            { status: 400 }
          );
        }
        const transferId = new Date().getTime().toString() + Math.random().toString(36).substr(2, 5);
        
        const transferOut: Partial<Expense> = {
          ...expenseDoc,
          type: 'transfer_out',
          associatedId: transferId,
          associatedType: 'transfer', // Not hisab, to avoid confusion and disabled edits
        };
        const transferIn: Partial<Expense> = {
          ...expenseDoc,
          user_id: exp.transfer_to_user_id,
          type: 'transfer_in',
          associatedId: transferId,
          associatedType: 'transfer',
        };
        
        const outValidation = expenseSchema.safeParse(transferOut);
        const inValidation = expenseSchema.safeParse(transferIn);
        if (!outValidation.success || !inValidation.success) {
          return Response.json({ error: 'Validation Error', message: 'Invalid transfer data' }, { status: 400 });
        }
        
        validExpensesToInsert.push({ ...transferOut, createdAt: now, updatedAt: now } as Expense);
        validExpensesToInsert.push({ ...transferIn, createdAt: now, updatedAt: now } as Expense);
        continue;
      }

      expenseDoc.type = exp.type === 'income' ? 'income' : 'expense';

      const validationResult = expenseSchema.safeParse(expenseDoc);
      if (!validationResult.success) {
        return Response.json(
          { error: 'Validation Error', message: validationResult.error.issues[0]?.message || 'Invalid expense data' },
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
