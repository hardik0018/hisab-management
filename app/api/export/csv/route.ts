export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { generateCSV } from '@/lib/export-csv';
import { updateSystemSettings } from '@/models/Settings';
import { getAuthenticatedUser } from '@/lib/auth';
import { Expense } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized', message: 'You must be logged in' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const db = await getDb();
    const spaceId = user.space_id || user.user_id;
    const query: any = { space_id: spaceId };

    if (month && month !== 'all') {
      query.date = { $regex: `^${month}` };
    } else if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = startDate;
      if (endDate) query.date.$lte = endDate;
    } else if (!month) {
      const now = new Date();
      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      query.date = { $regex: `^${yyyy}-${mm}` };
    }

    const expenses = (await db
      .collection('expenses')
      .find(query)
      .sort({ date: -1, createdAt: -1 })
      .toArray()) as unknown as Expense[];

    const csvContent = generateCSV(expenses);

    // Reset backup reminder for this space
    await updateSystemSettings(spaceId, {
      lastBackupAt: new Date().toISOString()
    });

    let filename = 'expenses-backup';
    if (month && month !== 'all') {
      filename += `-${month}`;
    } else if (startDate && endDate) {
      filename += `-range-${startDate}-to-${endDate}`;
    } else if (month === 'all') {
      filename += '-all';
    }

    return new Response(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}.csv"`,
      },
    });
  } catch (error) {
    console.error('[API_EXPORT_CSV_ERROR]', error);
    return Response.json(
      { error: 'Internal Server Error', message: 'Failed to generate CSV export' },
      { status: 500 }
    );
  }
}
