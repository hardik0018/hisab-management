export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized', message: 'You must be logged in' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const dateFilter = searchParams.get('date') || '';
    let month = searchParams.get('month') || '';

    if (!month) {
      const now = new Date();
      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      month = `${yyyy}-${mm}`;
    }

    const db = await getDb();
    const spaceId = user.space_id || user.user_id;

    // 1. Fetch all expenses for this month in the active space
    const monthQuery: any = {
      space_id: spaceId,
      date: { $regex: `^${month}` }
    };

    const monthlyExpenses = await db
      .collection('expenses')
      .find(monthQuery)
      .toArray();

    let monthlyTotal = 0;
    const dailyTotalsMap: { [date: string]: number } = {};

    for (const exp of monthlyExpenses) {
      monthlyTotal += exp.amount;
      const d = exp.date;
      dailyTotalsMap[d] = (dailyTotalsMap[d] || 0) + exp.amount;
    }

    const dailyTotals = Object.entries(dailyTotalsMap)
      .map(([date, total]) => ({ date, total }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // 2. Fetch filtered total in active space
    let filteredTotal = monthlyTotal;

    if (search || dateFilter) {
      const filteredQuery: any = {
        space_id: spaceId,
        date: { $regex: `^${month}` }
      };

      if (dateFilter) {
        filteredQuery.date = dateFilter;
      }

      if (search) {
        const searchRegex = { $regex: search, $options: 'i' };
        filteredQuery.$or = [
          { itemName: searchRegex },
          { note: searchRegex }
        ];
      }

      const filteredExpenses = await db
        .collection('expenses')
        .find(filteredQuery)
        .toArray();

      filteredTotal = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    }

    return Response.json({
      month,
      monthlyTotal,
      filteredTotal,
      dailyTotals
    });
  } catch (error) {
    console.error('[API_SUMMARY_MONTHLY_ERROR]', error);
    return Response.json(
      { error: 'Internal Server Error', message: 'Failed to retrieve monthly summary' },
      { status: 500 }
    );
  }
}
