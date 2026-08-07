export const dynamic = 'force-dynamic';
import { getDb } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, mobile, ignored } = body;

    if (!name) {
      return Response.json({ error: 'Name is required' }, { status: 400 });
    }

    const db = await getDb();
    const spaceId = user.space_id || user.user_id;
    const isIgnored = !!ignored;

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

    // Update all matching hisab records to the new ignore state
    await db.collection('hisab').updateMany(
      {
        space_id: spaceId,
        name: name,
        mobile: mobileQuery,
      },
      {
        $set: { ignored: isIgnored }
      }
    );

    // Sync with daily expenses
    if (isIgnored) {
      // Find all hisab records for this person
      const records = await db.collection('hisab').find({
        space_id: spaceId,
        name: name,
        mobile: mobileQuery,
      }).toArray();
      
      const hisabIds = records.map(r => r.hisab_id);

      // Delete corresponding daily expenses because they are now ignored
      await db.collection('expenses').deleteMany({
        space_id: spaceId,
        associatedId: { $in: hisabIds },
        associatedType: 'hisab',
      });
    } else {
      // Re-create daily expenses for records that have log_as_expense set to true
      const records = await db.collection('hisab').find({
        space_id: spaceId,
        name: name,
        mobile: mobileQuery,
        log_as_expense: true
      }).toArray();

      for (const r of records) {
        const expenseAmount = r.type === 'credit' ? -r.amount : r.amount;
        const dateObj = new Date(r.date);
        const year = dateObj.getFullYear();
        const monthStr = String(dateObj.getMonth() + 1).padStart(2, '0');
        const dayStr = String(dateObj.getDate()).padStart(2, '0');
        const dateStr = `${year}-${monthStr}-${dayStr}`;

        await db.collection('expenses').updateOne(
          {
            space_id: spaceId,
            associatedId: r.hisab_id,
            associatedType: 'hisab'
          },
          {
            $set: {
              user_id: r.user_id,
              date: dateStr,
              itemName: `Hisab: ${r.name}`,
              amount: expenseAmount,
              note: r.description || '',
              category: 'Debt/Credit',
              currency: 'INR',
              updatedAt: new Date()
            },
            $setOnInsert: {
              createdAt: new Date()
            }
          },
          { upsert: true }
        );
      }
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('API Error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
