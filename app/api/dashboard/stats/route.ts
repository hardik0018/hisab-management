export const dynamic = 'force-dynamic';
import { getDb } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';
import { NextRequest } from 'next/server';
import { DashboardStats } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDb();
    const spaceId = user.space_id || user.user_id;

    // Use parallel MongoDB aggregation pipelines instead of fetching all records into JS
    const [hisabAgg, marriageAgg, recentHisab] = await Promise.all([
      db.collection('hisab').aggregate([
        { $match: { space_id: spaceId, ignored: { $ne: true } } },
        {
          $group: {
            _id: null,
            totalDebit: { $sum: { $cond: [{ $eq: ['$type', 'debit'] }, '$amount', 0] } },
            totalCredit: { $sum: { $cond: [{ $eq: ['$type', 'credit'] }, '$amount', 0] } },
          },
        },
      ]).toArray(),
      db.collection('marriage_hisab').aggregate([
        { $match: { space_id: spaceId } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]).toArray(),
      db.collection('hisab')
        .find({ space_id: spaceId, ignored: { $ne: true } }, { projection: { _id: 0 } })
        .sort({ date: -1, created_at: -1 })
        .limit(5)
        .toArray(),
    ]);

    const totalDebit = hisabAgg[0]?.totalDebit || 0;
    const totalCredit = hisabAgg[0]?.totalCredit || 0;
    const totalMarriage = marriageAgg[0]?.total || 0;

    const stats: DashboardStats = {
      totalDebit,
      totalCredit,
      totalMarriage,
      balance: totalCredit - totalDebit,
      recentHisab: recentHisab as any,
    };

    return Response.json(stats);
  } catch (error) {
    console.error('Stats API Error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
