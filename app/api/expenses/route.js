import { getDb } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

export async function GET(request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDb();
    const url = new URL(request.url);
    const category = url.searchParams.get('category');
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '50');

    const query = { user_id: user.user_id };

    if (category && category !== 'all') {
      query.category = category;
    }

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const expenses = await db
      .collection('expenses')
      .find(query, { projection: { _id: 0 } })
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();

    const total = await db.collection('expenses').countDocuments(query);

    return Response.json({ expenses, total, page, limit });
  } catch (error) {
    console.error('API Error:', error);
    return Response.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, amount, category, paymentMode, date, notes } = body;

    if (!title || !amount || !category) {
      return Response.json(
        { error: 'title, amount, and category are required' },
        { status: 400 }
      );
    }

    const db = await getDb();
    const expenseId = `exp_${uuidv4().split('-')[0]}`;

    const expense = {
      expense_id: expenseId,
      user_id: user.user_id,
      title,
      amount: parseFloat(amount),
      category,
      paymentMode: paymentMode || 'cash',
      date: date ? new Date(date) : new Date(),
      notes: notes || '',
      created_at: new Date(),
    };

    await db.collection('expenses').insertOne(expense);

    return Response.json({ expense }, { status: 201 });
  } catch (error) {
    console.error('API Error:', error);
    return Response.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
