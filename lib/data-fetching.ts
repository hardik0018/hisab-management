import { getDb } from './db';
import { getAuthenticatedUser } from './auth';
import { 
  HisabRecord, 
  MarriageRecord, 
  DashboardStats, 
  CollaborationData,
  Expense,
  Settings
} from '@/types';
import { getSystemSettings } from '@/models/Settings';
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

export async function getDashboardStats(): Promise<DashboardStats | null> {
    const user = await getAuthenticatedUser();
    if (!user) return null;

    const db = await getDb();
    const spaceId = user.space_id;

    const [
        hisabAgg,
        marriageAgg,
        recentHisab
    ] = await Promise.all([
        db.collection('hisab').aggregate([
             { $match: { space_id: spaceId } },
             { $group: { 
                 _id: null, 
                 debit: { $sum: { $cond: [{ $eq: ["$type", "debit"] }, "$amount", 0] } }, 
                 credit: { $sum: { $cond: [{ $eq: ["$type", "credit"] }, "$amount", 0] } } 
             } }
        ]).toArray(),
        db.collection('marriage_hisab').aggregate([
            { $match: { space_id: spaceId } },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]).toArray(),
        db.collection('hisab')
            .find({ space_id: spaceId }, { projection: { _id: 0 } })
            .sort({ date: -1, created_at: -1 }) // Tie-break with created_at if needed
            .limit(5)
            .toArray()
    ]);

    const totalDebit = hisabAgg[0]?.debit || 0;
    const totalCredit = hisabAgg[0]?.credit || 0;
    const totalMarriage = marriageAgg[0]?.total || 0;

    return {
      totalExpense: 0,
      totalDebit,
      totalCredit,
      totalMarriage,
      balance: totalCredit - totalDebit,
      recentExpenses: [],
      recentHisab: recentHisab as unknown as HisabRecord[],
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

/**
 * Fetches expenses for the authenticated user's space, matching the criteria.
 */
export async function getExpenses(options: {
  search?: string;
  date?: string;
  month?: string;
  startDate?: string;
  endDate?: string;
} = {}): Promise<Expense[] | null> {
  const user = await getAuthenticatedUser();
  if (!user) return null;

  const db = await getDb();
  const spaceId = user.space_id || user.user_id;
  const query: any = { space_id: spaceId };

  if (options.date) {
    query.date = options.date;
  } else if (options.month) {
    query.date = { $regex: `^${options.month}` };
  } else if (options.startDate || options.endDate) {
    query.date = {};
    if (options.startDate) {
      query.date.$gte = options.startDate;
    }
    if (options.endDate) {
      query.date.$lte = options.endDate;
    }
  }

  if (options.search) {
    const searchRegex = { $regex: options.search, $options: 'i' };
    query.$or = [
      { itemName: searchRegex },
      { note: searchRegex }
    ];
  }

  const expenses = await db
    .collection('expenses')
    .find(query)
    .sort({ date: -1, createdAt: -1 })
    .toArray();

  return expenses.map(exp => ({
    ...exp,
    _id: exp._id.toString(),
    createdAt: exp.createdAt instanceof Date ? exp.createdAt.toISOString() : exp.createdAt,
    updatedAt: exp.updatedAt instanceof Date ? exp.updatedAt.toISOString() : exp.updatedAt,
  })) as unknown as Expense[];
}

/**
 * Fetches system settings for the authenticated user.
 */
export async function getSettings(): Promise<Settings | null> {
  const user = await getAuthenticatedUser();
  if (!user) return null;

  const spaceId = user.space_id || user.user_id;
  const settings = await getSystemSettings(spaceId);
  return {
    ...settings,
    _id: settings._id?.toString(),
    createdAt: settings.createdAt instanceof Date ? settings.createdAt.toISOString() : settings.createdAt,
    updatedAt: settings.updatedAt instanceof Date ? settings.updatedAt.toISOString() : settings.updatedAt,
  } as unknown as Settings;
}

/**
 * Gets today's date string in Asia/Kolkata timezone (YYYY-MM-DD).
 */
export function getTodayKolkata(): string {
  const options = { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' } as const;
  const parts = new Intl.DateTimeFormat('en-US', options).formatToParts(new Date());
  const yyyy = parts.find(p => p.type === 'year')?.value;
  const mm = parts.find(p => p.type === 'month')?.value;
  const dd = parts.find(p => p.type === 'day')?.value;
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Fetches monthly summary data for the authenticated user.
 */
export async function getMonthlySummary(monthStr?: string, search?: string): Promise<{
  month: string;
  monthlyTotal: number;
  filteredTotal: number;
  dailyTotals: { date: string; total: number }[];
  todayTotal: number;
} | null> {
  const user = await getAuthenticatedUser();
  if (!user) return null;

  let month = monthStr || '';
  if (!month) {
    const todayStr = getTodayKolkata();
    month = todayStr.substring(0, 7); // e.g. "2026-05"
  }

  const db = await getDb();
  const spaceId = user.space_id || user.user_id;

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

  let filteredTotal = monthlyTotal;

  if (search) {
    const filteredQuery: any = {
      space_id: spaceId,
      date: { $regex: `^${month}` }
    };

    const searchRegex = { $regex: search, $options: 'i' };
    filteredQuery.$or = [
      { itemName: searchRegex },
      { note: searchRegex }
    ];

    const filteredExpenses = await db
      .collection('expenses')
      .find(filteredQuery)
      .toArray();

    filteredTotal = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  }

  const today = getTodayKolkata();
  const todayExpenses = await db
    .collection('expenses')
    .find({ space_id: spaceId, date: today })
    .toArray();
  const todayTotal = todayExpenses.reduce((s: number, e: any) => s + e.amount, 0);

  return {
    month,
    monthlyTotal,
    filteredTotal,
    dailyTotals,
    todayTotal
  };
}
