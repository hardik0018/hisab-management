import { getDb } from './db';
import { getAuthenticatedUser } from './auth';
import { 
  HisabRecord, 
  ExpenseRecord, 
  MarriageRecord, 
  DashboardStats, 
  CollaborationData 
} from '@/types';
import { Collection, Document } from 'mongodb';

/**
 * Fetches all hisab records for the authenticated user's space.
 */
export async function getHisabRecords(): Promise<HisabRecord[] | null> {
  const user = await getAuthenticatedUser();
  if (!user) return null;

  const db = await getDb();
  const spaceId = user.space_id;

  const records = await db
    .collection('hisab')
    .find({ space_id: spaceId }, { projection: { _id: 0 } })
    .sort({ date: -1 })
    .toArray();

  return records as unknown as HisabRecord[];
}

interface GetExpensesParams {
  category?: string;
  page?: number;
  limit?: number;
}

/**
 * Fetches expenses for the authenticated user's space with filtering and pagination.
 */
export async function getExpenses({ category, page = 1, limit = 50 }: GetExpensesParams = {}): Promise<{
  expenses: ExpenseRecord[];
  topCategories: string[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
} | null> {
  const user = await getAuthenticatedUser();
  if (!user) return null;

  const db = await getDb();
  const spaceId = user.space_id;
  const query: any = { space_id: spaceId };

  if (category && category !== 'all') {
    query.category = category;
  }

  const [expenses, total, categoryStats] = await Promise.all([
    db.collection('expenses')
      .find(query, { projection: { _id: 0 } })
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray(),
    db.collection('expenses').countDocuments(query),
    db.collection('expenses').aggregate([
      { $match: { space_id: spaceId } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 3 }
    ]).toArray()
  ]);

  const topCategories = categoryStats.map((stat: any) => stat._id);

  return {
    expenses: expenses as unknown as ExpenseRecord[],
    topCategories,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };
}

/**
 * Fetches marriage/vayvhar records for the authenticated user's space.
 */
export async function getMarriageRecords(): Promise<MarriageRecord[] | null> {
  const user = await getAuthenticatedUser();
  if (!user) return null;

  const db = await getDb();
  const spaceId = user.space_id;

  const records = await db
    .collection('marriage_hisab')
    .find({ space_id: spaceId }, { projection: { _id: 0 } })
    .sort({ date: -1 })
    .toArray();

  return records as unknown as MarriageRecord[];
}

/**
 * Fetches dashboard statistics.
 */
/**
 * Fetches dashboard statistics using optimized aggregation pipelines.
 */
export async function getDashboardStats(): Promise<DashboardStats | null> {
    const user = await getAuthenticatedUser();
    if (!user) return null;

    const db = await getDb();
    const spaceId = user.space_id;

    const [
        expensesAgg,
        hisabAgg,
        marriageAgg,
        mostUsedCatAgg,
        recentExpensesData,
        recentHisabData
    ] = await Promise.all([
        // 1. Total Expenses
        db.collection('expenses').aggregate([
            { $match: { space_id: spaceId } },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]).toArray(),

        // 2. Total Debit/Credit
        db.collection('hisab').aggregate([
             { $match: { space_id: spaceId } },
             { $group: { 
                 _id: null, 
                 debit: { $sum: { $cond: [{ $eq: ["$type", "debit"] }, "$amount", 0] } }, 
                 credit: { $sum: { $cond: [{ $eq: ["$type", "credit"] }, "$amount", 0] } } 
             } }
        ]).toArray(),

        // 3. Total Marriage Gifting
        db.collection('marriage_hisab').aggregate([
            { $match: { space_id: spaceId } },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]).toArray(),

        // 4. Most Used Category
        db.collection('expenses').aggregate([
            { $match: { space_id: spaceId } },
            { $group: { _id: "$category", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 1 }
        ]).toArray(),

        // 4. Recent Expenses (Limit 5)
        db.collection('expenses')
            .find({ space_id: spaceId }, { projection: { _id: 0 } })
            .sort({ date: -1 })
            .limit(5)
            .toArray(),

        // 5. Recent Hisab (Limit 5) - Fixed sort order
        db.collection('hisab')
            .find({ space_id: spaceId }, { projection: { _id: 0 } })
            .sort({ date: -1, created_at: -1 }) // Tie-break with created_at if needed
            .limit(5)
            .toArray()
    ]);

    const totalExpense = expensesAgg[0]?.total || 0;
    const totalDebit = hisabAgg[0]?.debit || 0;
    const totalCredit = hisabAgg[0]?.credit || 0;
    const totalMarriage = marriageAgg[0]?.total || 0;

    return {
      totalExpense,
      totalDebit,
      totalCredit,
      totalMarriage,
      balance: totalCredit - totalDebit, // Assuming balance is credit - debit? Or do we need expense factored in? The original code was just credit - debit.
      recentExpenses: recentExpensesData as unknown as ExpenseRecord[],
      recentHisab: recentHisabData as unknown as HisabRecord[],
      mostUsedCategory: mostUsedCatAgg[0]?._id as string | undefined,
    };
}

/**
 * Fetches collaboration data (members and requests) for the authenticated user.
 */
export async function getCollaborationData(): Promise<CollaborationData | null> {
  const user = await getAuthenticatedUser();
  if (!user) return null;

  const db = await getDb();
  
  const [collaborators, sentRequestsRaw, receivedRequestsRaw] = await Promise.all([
    db.collection('users')
      .find({ space_id: user.space_id })
      .project({ _id: 0, name: 1, email: 1, image: 1, user_id: 1, space_id: 1 })
      .toArray(),
    db.collection('collaboration_requests')
      .find({ from_user_id: user.user_id, status: 'pending' })
      .toArray(),
    db.collection('collaboration_requests')
      .find({ to_email: user.email.toLowerCase(), status: 'pending' })
      .toArray()
  ]);

  return {
    collaborators: collaborators as any[],
    sentRequests: sentRequestsRaw.map(r => ({ ...r, _id: r._id.toString() })) as any[],
    receivedRequests: receivedRequestsRaw.map(r => ({ ...r, _id: r._id.toString() })) as any[],
    currentUserId: user.user_id,
    currentSpaceId: user.space_id
  };
}
