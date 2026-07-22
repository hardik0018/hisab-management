export const dynamic = 'force-dynamic';
import { getDb } from '@/lib/db';
import clientPromise from '@/lib/mongodb-promise';
import { getAuthenticatedUser } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';
import { NextRequest } from 'next/server';
import { MarriageRecord } from '@/types';
import { revalidatePath } from 'next/cache';

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
      .collection('marriage_hisab')
      .find(query, { projection: { _id: 0 } })
      .sort({ date: -1 })
      .toArray() as unknown as MarriageRecord[];

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
    const { name, city, amount, date, logAsExpense } = body;

    if (!name || !amount) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const db = await getDb();
    const marriageId = `mar_${uuidv4().split('-')[0]}`;
    const spaceId = user.space_id || user.user_id;

    const record: MarriageRecord = {
      marriage_id: marriageId,
      user_id: user.user_id,
      space_id: spaceId,
      name,
      city: city || '',
      amount: parseFloat(amount),
      date: date ? new Date(date) : new Date(),
      created_at: new Date(),
      log_as_expense: !!logAsExpense,
    };

    const client = await clientPromise;
    const session = client.startSession();

    try {
      await session.withTransaction(async () => {
        await db.collection('marriage_hisab').insertOne(record, { session });

        if (logAsExpense) {
          const dateObj = date ? new Date(date) : new Date();
          const year = dateObj.getFullYear();
          const monthStr = String(dateObj.getMonth() + 1).padStart(2, '0');
          const dayStr = String(dateObj.getDate()).padStart(2, '0');
          const dateStr = `${year}-${monthStr}-${dayStr}`;

          const locationStr = city ? ` (${city})` : '';

          const expenseDoc = {
            space_id: spaceId,
            user_id: user.user_id,
            date: dateStr,
            itemName: `Vyahar: ${name}${locationStr}`,
            amount: parseFloat(amount),
            note: `Vyahar gift to ${name}${city ? ` from ${city}` : ''}`,
            category: 'Marriage',
            currency: 'INR',
            associatedId: marriageId,
            associatedType: 'marriage',
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          await db.collection('expenses').insertOne(expenseDoc, { session });
        }
      });
    } finally {
      await session.endSession();
    }

    revalidatePath('/marriage', 'layout');
    revalidatePath('/dashboard', 'layout');
    revalidatePath('/expenses', 'layout');

    return Response.json({ record }, { status: 201 });
  } catch (error) {
    console.error('API Error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
