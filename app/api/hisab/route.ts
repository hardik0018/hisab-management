export const dynamic = 'force-dynamic';
import { getDb } from '@/lib/db';
import clientPromise from '@/lib/mongodb-promise';
import { getAuthenticatedUser } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';
import { NextRequest } from 'next/server';
import { HisabRecord } from '@/types';
import { revalidatePath } from 'next/cache';
import { getHisabRecords } from '@/lib/data-fetching';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const search = searchParams.get('search') || undefined;

    const data = await getHisabRecords({ page, limit, search });
    if (!data) return Response.json({ error: 'Failed to fetch' }, { status: 500 });

    return Response.json(data);
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
    const personMobile = mobile ? String(mobile) : '';

    const m = mobile ? String(mobile).trim() : '';
    let mobileQuery: any;
    if (m) {
      const num = Number(m);
      if (!isNaN(num)) {
        mobileQuery = { $in: [m, num] };
      } else {
        mobileQuery = m;
      }
    } else {
      mobileQuery = { $in: ['', null] };
    }

    const spaceIds = [user.space_id, user.user_id].filter(Boolean);

    // Check if this person is currently ignored
    const existingIgnored = await db.collection('hisab').findOne({
      space_id: { $in: spaceIds },
      name,
      mobile: mobileQuery,
      ignored: true
    });

    const record: HisabRecord = {
      hisab_id: hisabId,
      user_id: user.user_id,
      space_id: spaceId,
      name,
      mobile: personMobile,
      type,
      amount: parseFloat(amount),
      description: description || '',
      date: date ? new Date(date) : new Date(),
      created_at: new Date(),
      log_as_expense: !!logAsExpense,
      ignored: !!existingIgnored,
    };

    const client = await clientPromise;
    const session = client.startSession();

    try {
      await session.withTransaction(async () => {
        await db.collection('hisab').insertOne(record, { session });

        if (logAsExpense && !record.ignored) {
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

          await db.collection('expenses').insertOne(expenseDoc, { session });
        }
      });
    } finally {
      await session.endSession();
    }

    revalidatePath('/hisab', 'layout');
    revalidatePath('/dashboard', 'layout');
    revalidatePath('/expenses', 'layout');

    return Response.json({ record }, { status: 201 });
  } catch (error) {
    console.error('API Error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
