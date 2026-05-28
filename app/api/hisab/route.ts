export const dynamic = 'force-dynamic';
import { getDb } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';
import { NextRequest } from 'next/server';
import { HisabRecord } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDb();
    const spaceId = user.space_id || user.user_id;

    const query = { space_id: spaceId };
    
    const records = await db
      .collection('hisab')
      .find(query, { projection: { _id: 0 } })
      .sort({ date: -1 })
      .toArray() as unknown as HisabRecord[];

    return Response.json({ records });
  } catch (error) {
    console.error('API Error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, mobile, type, amount, description, date, logAsExpense } = body;

    if (!name || !type || !amount) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const db = await getDb();
    const hisabId = `hsb_${uuidv4().split('-')[0]}`;
    const spaceId = user.space_id || user.user_id;

    const record: HisabRecord = {
      hisab_id: hisabId,
      user_id: user.user_id,
      space_id: spaceId,
      name,
      mobile: mobile ? String(mobile) : '',
      type,
      amount: parseFloat(amount),
      description: description || '',
      date: date ? new Date(date) : new Date(),
      created_at: new Date(),
      log_as_expense: !!logAsExpense,
    };

    await db.collection('hisab').insertOne(record);

    if (logAsExpense) {
      const expenseAmount = type === 'credit' ? -parseFloat(amount) : parseFloat(amount);
      const dateObj = date ? new Date(date) : new Date();
      const year = dateObj.getFullYear();
      const monthStr = String(dateObj.getMonth() + 1).padStart(2, '0');
      const dayStr = String(dateObj.getDate()).padStart(2, '0');
      const dateStr = `${year}-${monthStr}-${dayStr}`;

      const expenseDoc = {
        space_id: spaceId,
        user_id: user.user_id,
        date: dateStr,
        itemName: `Hisab: ${name}`,
        amount: expenseAmount,
        note: description || '',
        category: 'Debt/Credit',
        currency: 'INR',
        associatedId: hisabId,
        associatedType: 'hisab',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await db.collection('expenses').insertOne(expenseDoc);
    }

    return Response.json({ record }, { status: 201 });
  } catch (error) {
    console.error('API Error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
