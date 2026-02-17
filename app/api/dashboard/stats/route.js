import { getDb } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';

export async function GET(request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDb();

    // Get total expenses
    const expensesAgg = await db
      .collection('expenses')
      .aggregate([
        { $match: { user_id: user.user_id } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ])
      .toArray();
    const totalExpense = expensesAgg[0]?.total || 0;

    // Get debit/credit totals
    const hisabAgg = await db
      .collection('hisab')
      .aggregate([
        { $match: { user_id: user.user_id } },
        {
          $group: {
            _id: '$type',
            total: { $sum: '$amount' },
          },
        },
      ])
      .toArray();

    let totalDebit = 0;
    let totalCredit = 0;
    hisabAgg.forEach((item) => {
      if (item._id === 'debit') totalDebit = item.total;
      if (item._id === 'credit') totalCredit = item.total;
    });

    const balance = totalCredit - totalDebit;

    // Get marriage total
    const marriageAgg = await db
      .collection('marriage_hisab')
      .aggregate([
        { $match: { user_id: user.user_id } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ])
      .toArray();
    const totalMarriage = marriageAgg[0]?.total || 0;

    // Recent activity
    const recentExpenses = await db
      .collection('expenses')
      .find({ user_id: user.user_id }, { projection: { _id: 0 } })
      .sort({ created_at: -1 })
      .limit(5)
      .toArray();

    const recentHisab = await db
      .collection('hisab')
      .find({ user_id: user.user_id }, { projection: { _id: 0 } })
      .sort({ created_at: -1 })
      .limit(5)
      .toArray();

    return Response.json({
      totalExpense,
      totalDebit,
      totalCredit,
      balance,
      totalMarriage,
      recentExpenses,
      recentHisab,
    });
  } catch (error) {
    console.error('API Error:', error);
    return Response.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
