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

  const [expenses, total] = await Promise.all([
    db.collection('expenses')
      .find(query, { projection: { _id: 0 } })
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray(),
    db.collection('expenses').countDocuments(query)
  ]);

  return {
    expenses: expenses as unknown as ExpenseRecord[],
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
export async function getDashboardStats(): Promise<DashboardStats | null> {
    const user = await getAuthenticatedUser();
    if (!user) return null;

    const db = await getDb();
    const spaceId = user.space_id;

    const [expensesRaw, hisabRaw, marriageRaw] = await Promise.all([
        db.collection('expenses').find({ space_id: spaceId }, { projection: { _id: 0 } }).toArray(),
        db.collection('hisab').find({ space_id: spaceId }, { projection: { _id: 0 } }).toArray(),
        db.collection('marriage_hisab').find({ space_id: spaceId }, { projection: { _id: 0 } }).toArray()
    ]);

    const expenses = expensesRaw as unknown as ExpenseRecord[];
    const hisab = hisabRaw as unknown as HisabRecord[];
    const marriage = marriageRaw as unknown as MarriageRecord[];

    const totalExpense = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const totalDebit = hisab.filter(h => h.type === 'debit').reduce((sum, h) => sum + (h.amount || 0), 0);
    const totalCredit = hisab.filter(h => h.type === 'credit').reduce((sum, h) => sum + (h.amount || 0), 0);
    const totalMarriage = marriage.reduce((sum, m) => sum + (m.amount || 0), 0);

    return {
      totalExpense,
      totalDebit,
      totalCredit,
      totalMarriage,
      balance: totalCredit - totalDebit,
      recentExpenses: expenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5),
      recentHisab: hisab.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5),
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
