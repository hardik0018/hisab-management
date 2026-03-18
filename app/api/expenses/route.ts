export const dynamic = 'force-dynamic';
import { getDb } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { NextRequest } from 'next/server';

// Input Validation Schema
const expenseSchema = z.object({
  title: z.string().min(1, "Title is required").max(100),
  amount: z.number().positive("Amount must be positive"),
  category: z.string().min(1),
  paymentMode: z.enum(['cash', 'online', 'card']).default('cash'),
  date: z.string().optional(),
  notes: z.string().max(500).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const json = await request.json();
    
    // Validate Input
    const result = expenseSchema.safeParse(json);
    if (!result.success) {
      return Response.json({ 
        error: 'Validation failed', 
        details: result.error.flatten().fieldErrors 
      }, { status: 400 });
    }

    const { title, amount, category, paymentMode, date, notes } = result.data;

    const db = await getDb();
    const expenseId = `exp_${uuidv4().split('-')[0]}`;
    const spaceId = user.space_id || user.user_id;

    const expense = {
      expense_id: expenseId,
      user_id: user.user_id,
      space_id: spaceId,
      title,
      amount,
      category,
      paymentMode,
      date: date ? new Date(date) : new Date(),
      notes: notes || '',
      created_at: new Date(),
      updated_at: new Date(),
    };

    await db.collection('expenses').insertOne(expense);
    
    return Response.json({ expense }, { status: 201 });
  } catch (error) {
    console.error('[EXPENSES_POST]', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDb();
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, parseInt(searchParams.get('limit') || '50'));

    const spaceId = user.space_id || user.user_id;
    const query: any = { space_id: spaceId };

    if (category && category !== 'all') {
      query.category = category;
    }

    const [expenses, total, categoryStats] = await Promise.all([
      db.collection('expenses')
        .find(query, { projection: { _id: 0 } })
        .sort({ date: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .toArray(),
      db.collection('expenses').countDocuments(query),
      db.collection('expenses').aggregate([
        { $match: { space_id: spaceId } },
        { $group: { _id: "$category", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 3 }
      ]).toArray()
    ]);

    const topCategories = categoryStats.map(stat => stat._id);

    return Response.json({ 
      expenses, 
      topCategories,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('[EXPENSES_GET]', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
