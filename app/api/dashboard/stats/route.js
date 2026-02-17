import { getDb } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';

export async function GET(request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDb();
    const spaceId = user.space_id || user.user_id;

    // Get stats for current space
    const expenseQuery = { space_id: spaceId };
    const hisabQuery = { space_id: spaceId };
    const marriageQuery = { space_id: spaceId };

    const expenses = await db.collection('expenses').find(expenseQuery).toArray();
    const hisab = await db.collection('hisab').find(hisabQuery).toArray();
    const marriage = await db.collection('marriage_hisab').find(marriageQuery).toArray();

    const totalExpense = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const totalDebit = hisab.filter(h => h.type === 'debit').reduce((sum, h) => sum + (h.amount || 0), 0);
    const totalCredit = hisab.filter(h => h.type === 'credit').reduce((sum, h) => sum + (h.amount || 0), 0);
    const totalMarriage = marriage.reduce((sum, m) => sum + (m.amount || 0), 0);

    const stats = {
      totalExpense,
      totalDebit,
      totalCredit,
      totalMarriage,
      balance: totalCredit - totalDebit,
      recentExpenses: expenses.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5),
      recentHisab: hisab.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5),
    };

    return Response.json(stats);
  } catch (error) {
    console.error('Stats API Error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
