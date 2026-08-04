import { getDb } from './db';
import { getAuthenticatedUser } from './auth';
import { 
  HisabRecord, 
  MarriageRecord, 
  DashboardStats, 
  CollaborationData,
  Expense,
  Settings,
  FinancialYearSummary,
  MonthlyTaxBreakdown
} from '@/types';
import { getSystemSettings } from '@/models/Settings';
import { Collection, Document } from 'mongodb';
import { checkAndGenerateRecurringExpenses } from './recurring-engine';
import { RecurringExpense } from '@/types';

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

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
        hisabRecords,
        marriageAgg,
        recentHisab,
        expenseAgg
    ] = await Promise.all([
        db.collection('hisab').find({ space_id: spaceId }).toArray(),
        db.collection('marriage_hisab').aggregate([
            { $match: { space_id: spaceId } },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]).toArray(),
        db.collection('hisab')
            .find({ space_id: spaceId, ignored: { $ne: true } }, { projection: { _id: 0 } })
            .sort({ date: -1, created_at: -1 }) // Tie-break with created_at if needed
            .limit(5)
            .toArray(),
        db.collection('expenses').aggregate([
            { $match: { space_id: spaceId } },
            { $group: {
                _id: null,
                totalExpense: { $sum: { $cond: [{ $in: ["$type", ["income", "transfer_in", "transfer_out"]] }, 0, "$amount"] } },
                totalIncome: { $sum: { $cond: [{ $eq: ["$type", "income"] }, "$amount", 0] } }
            } }
        ]).toArray()
    ]);

    // Calculate Hisab net totals by grouping by person (matching HisabClient.tsx exactly)
    const peopleGroups: Record<string, { debit: number; credit: number; ignored?: boolean }> = {};
    for (const r of hisabRecords) {
      const key = `${r.name}_${r.mobile || ''}`;
      if (!peopleGroups[key]) {
        peopleGroups[key] = { debit: 0, credit: 0, ignored: r.ignored };
      }
      if (r.type === 'debit') peopleGroups[key].debit += (r.amount || 0);
      else if (r.type === 'credit') peopleGroups[key].credit += (r.amount || 0);
      if (r.ignored !== undefined) {
        peopleGroups[key].ignored = r.ignored;
      }
    }

    let hisabYouWillGet = 0;
    let hisabYouWillGive = 0;
    for (const p of Object.values(peopleGroups)) {
      if (p.ignored) continue;
      const diffGet = p.debit - p.credit;
      if (diffGet > 0) hisabYouWillGet += diffGet;
      const diffGive = p.credit - p.debit;
      if (diffGive > 0) hisabYouWillGive += diffGive;
    }
    const hisabNetBalance = hisabYouWillGet - hisabYouWillGive; // positive = to get, negative = to give

    const totalMarriage = marriageAgg[0]?.total || 0;
    const totalExpense = expenseAgg[0]?.totalExpense || 0;
    const totalIncome = expenseAgg[0]?.totalIncome || 0;

    return {
      totalExpense,
      totalIncome,
      totalDebit: hisabYouWillGet,
      totalCredit: hisabYouWillGive,
      totalMarriage,
      balance: hisabNetBalance,
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
  limit?: number;
  page?: number;
} = {}): Promise<Expense[] | null> {
  const user = await getAuthenticatedUser();
  if (!user) return null;

  const spaceId = user.space_id || user.user_id;

  try {
    await checkAndGenerateRecurringExpenses(spaceId, user.user_id);
  } catch (err) {
    console.error('[AUTO_GENERATE_RECURRING_EXPENSES_ERROR]', err);
  }

  const db = await getDb();
  const query: any = { space_id: spaceId, type: { $ne: 'transfer_in' } };

  if (options.date) {
    query.date = options.date;
  } else if (options.month) {
    // Use range query instead of $regex — ranges work with indexes, regex does not
    const [year, mon] = options.month.split('-').map(Number);
    const paddedMon = String(mon).padStart(2, '0');
    const nextMon = mon === 12 ? 1 : mon + 1;
    const nextYear = mon === 12 ? year + 1 : year;
    const paddedNextMon = String(nextMon).padStart(2, '0');
    query.date = { $gte: `${year}-${paddedMon}-01`, $lt: `${nextYear}-${paddedNextMon}-01` };
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
    const escapedSearch = escapeRegExp(options.search);
    const searchRegex = { $regex: escapedSearch, $options: 'i' };
    query.$or = [
      { itemName: searchRegex },
      { note: searchRegex }
    ];
  }

  const limit = options.limit || 50;
  const page = options.page || 1;
  const skip = (page - 1) * limit;

  const expenses = await db
    .collection('expenses')
    .find(query)
    .sort({ date: -1, createdAt: -1 })
    .skip(skip)
    .limit(limit)
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
export async function getMonthlySummary(monthStr?: string, search?: string, categoryStr?: string): Promise<{
  month: string;
  monthlyTotal: number;
  monthlyIncome: number;
  filteredTotal: number;
  dailyTotals: { date: string; total: number }[];
  todayTotal: number;
  memberBalances: { user_id: string; name: string; income: number; expense: number; transfer_in: number; transfer_out: number; month_balance: number; previous_balance: number; total_balance: number; }[];
  categoryBreakdown: { category: string; total: number; count: number; percentage: number }[];
  categoryTransactions: { _id: string; itemName: string; amount: number; date: string; category: string; note: string }[];
  topExpenses: { _id: string; itemName: string; amount: number; date: string; category: string; note: string }[];
} | null> {
  const user = await getAuthenticatedUser();
  if (!user) return null;

  const spaceId = user.space_id || user.user_id;

  try {
    await checkAndGenerateRecurringExpenses(spaceId, user.user_id);
  } catch (err) {
    console.error('[AUTO_GENERATE_RECURRING_EXPENSES_SUMMARY_ERROR]', err);
  }

  let month = monthStr || '';
  if (!month) {
    const todayStr = getTodayKolkata();
    month = todayStr.substring(0, 7); // e.g. "2026-05"
  }

  const db = await getDb();
  const today = getTodayKolkata();

  // Build range bounds for the month (avoids slow $regex scan)
  const [year, mon] = month.split('-').map(Number);
  const paddedMon = String(mon).padStart(2, '0');
  const nextMon = mon === 12 ? 1 : mon + 1;
  const nextYear = mon === 12 ? year + 1 : year;
  const paddedNextMon = String(nextMon).padStart(2, '0');
  const monthStart = `${year}-${paddedMon}-01`;
  const monthEnd = `${nextYear}-${paddedNextMon}-01`;

  // Single aggregation for monthly totals + daily breakdown + member balances
  const [monthlyAgg, todayAgg, incomeAgg, userExpenseAgg, userIncomeAgg, userTransferInAgg, userTransferOutAgg, spaceUsers, categoryAgg, topExpensesAgg, previousBalancesAgg] = await Promise.all([
    db.collection('expenses').aggregate([
      {
        $match: {
          space_id: spaceId,
          date: { $gte: monthStart, $lt: monthEnd },
          type: { $nin: ['income', 'transfer_in', 'transfer_out'] }
        },
      },
      {
        $group: {
          _id: '$date',
          dailyTotal: { $sum: '$amount' },
        },
      },
      { $sort: { _id: 1 } },
    ]).toArray(),
    db.collection('expenses').aggregate([
      { $match: { space_id: spaceId, date: today, type: { $nin: ['income', 'transfer_in', 'transfer_out'] } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]).toArray(),
    db.collection('expenses').aggregate([
      { $match: { space_id: spaceId, date: { $gte: monthStart, $lt: monthEnd }, type: 'income' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]).toArray(),
    db.collection('expenses').aggregate([
      { $match: { space_id: spaceId, date: { $gte: monthStart, $lt: monthEnd }, type: { $nin: ['income', 'transfer_in', 'transfer_out'] } } },
      { $group: { _id: '$user_id', total: { $sum: '$amount' } } },
    ]).toArray(),
    db.collection('expenses').aggregate([
      { $match: { space_id: spaceId, date: { $gte: monthStart, $lt: monthEnd }, type: 'income' } },
      { $group: { _id: '$user_id', total: { $sum: '$amount' } } },
    ]).toArray(),
    db.collection('expenses').aggregate([
      { $match: { space_id: spaceId, date: { $gte: monthStart, $lt: monthEnd }, type: 'transfer_in' } },
      { $group: { _id: '$user_id', total: { $sum: '$amount' } } },
    ]).toArray(),
    db.collection('expenses').aggregate([
      { $match: { space_id: spaceId, date: { $gte: monthStart, $lt: monthEnd }, type: 'transfer_out' } },
      { $group: { _id: '$user_id', total: { $sum: '$amount' } } },
    ]).toArray(),
    db.collection('users').find({ space_id: spaceId }, { projection: { user_id: 1, name: 1, _id: 0 } }).toArray(),
    db.collection('expenses').aggregate([
      {
        $match: {
          space_id: spaceId,
          date: { $gte: monthStart, $lt: monthEnd },
          type: { $nin: ['income', 'transfer_in', 'transfer_out'] }
        },
      },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { total: -1 } },
    ]).toArray(),
    db.collection('expenses')
      .find({
        space_id: spaceId,
        date: { $gte: monthStart, $lt: monthEnd },
        type: { $nin: ['income', 'transfer_in', 'transfer_out'] }
      })
      .sort({ amount: -1 })
      .limit(5)
      .toArray(),
    db.collection('expenses').aggregate([
      { $match: { space_id: spaceId, date: { $gte: '2026-07-01', $lt: monthStart } } },
      { $group: { _id: { user_id: '$user_id', type: '$type' }, total: { $sum: '$amount' } } }
    ]).toArray()
  ]);

  const dailyTotals = monthlyAgg.map((d) => ({ date: d._id as string, total: d.dailyTotal as number }));
  const monthlyTotal = dailyTotals.reduce((sum, d) => sum + d.total, 0);
  const todayTotal = todayAgg[0]?.total || 0;
  const monthlyIncome = incomeAgg[0]?.total || 0;

  // Build Member Balances
  const memberBalancesMap = new Map<string, { user_id: string; name: string; income: number; expense: number; transfer_in: number; transfer_out: number; month_balance: number; previous_balance: number; total_balance: number; }>();
  
  // Initialize with all users in space
  spaceUsers.forEach((u: any) => {
    memberBalancesMap.set(u.user_id, {
      user_id: u.user_id,
      name: u.name,
      income: 0,
      expense: 0,
      transfer_in: 0,
      transfer_out: 0,
      month_balance: 0,
      previous_balance: 0,
      total_balance: 0
    });
  });

  const getOrInitMember = (userId: string) => {
    if (!memberBalancesMap.has(userId)) {
      memberBalancesMap.set(userId, { user_id: userId, name: 'Unknown User', income: 0, expense: 0, transfer_in: 0, transfer_out: 0, month_balance: 0, previous_balance: 0, total_balance: 0 });
    }
    return memberBalancesMap.get(userId)!;
  };

  // Populate incomes
  userIncomeAgg.forEach((agg: any) => {
    const mb = getOrInitMember(agg._id);
    mb.income = agg.total;
  });

  // Populate expenses
  userExpenseAgg.forEach((agg: any) => {
    const mb = getOrInitMember(agg._id);
    mb.expense = agg.total;
  });

  // Populate transfer_in
  userTransferInAgg.forEach((agg: any) => {
    const mb = getOrInitMember(agg._id);
    mb.transfer_in = agg.total;
  });

  // Populate transfer_out
  userTransferOutAgg.forEach((agg: any) => {
    const mb = getOrInitMember(agg._id);
    mb.transfer_out = agg.total;
  });

  // Populate previous balances
  previousBalancesAgg.forEach((agg: any) => {
    if (!agg._id || !agg._id.user_id) return;
    const userId = agg._id.user_id;
    const type = agg._id.type;
    const amount = agg.total || 0;
    
    const mb = getOrInitMember(userId);
    
    if (type === 'income' || type === 'transfer_in') {
      mb.previous_balance += amount;
    } else {
      // expense, transfer_out, or undefined/null
      mb.previous_balance -= amount;
    }
  });

  // Calculate balances
  const memberBalances = Array.from(memberBalancesMap.values()).map(mb => {
    const month_balance = (mb.income + mb.transfer_in) - (mb.expense + mb.transfer_out);
    return {
      ...mb,
      month_balance,
      total_balance: mb.previous_balance + month_balance
    };
  });

  // Filtered total: only needed when a search term is provided
  let filteredTotal = monthlyTotal;
  if (search) {
    const escapedSearch = escapeRegExp(search);
    const searchRegex = { $regex: escapedSearch, $options: 'i' };
    const filteredAgg = await db.collection('expenses').aggregate([
      {
        $match: {
          space_id: spaceId,
          date: { $gte: monthStart, $lt: monthEnd },
          type: { $nin: ['income', 'transfer_in', 'transfer_out'] },
          $or: [{ itemName: searchRegex }, { note: searchRegex }],
        },
      },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]).toArray();
    filteredTotal = filteredAgg[0]?.total || 0;
  }

  const categoryBreakdown = categoryAgg.map((c: any) => ({
    category: (c._id as string) || 'Uncategorized',
    total: Number(c.total || 0),
    count: Number(c.count || 0),
    percentage: monthlyTotal > 0 ? Math.round((Number(c.total || 0) / monthlyTotal) * 1000) / 10 : 0
  }));

  const topExpenses = topExpensesAgg.map((exp: any) => ({
    _id: exp._id.toString(),
    itemName: exp.itemName || 'Unknown Item',
    amount: Number(exp.amount || 0),
    date: exp.date || '',
    category: exp.category || 'Uncategorized',
    note: exp.note || ''
  }));

  let categoryTransactions: any[] = [];
  if (categoryStr) {
    categoryTransactions = await db.collection('expenses')
      .find({
        space_id: spaceId,
        date: { $gte: monthStart, $lt: monthEnd },
        type: { $nin: ['income', 'transfer_in', 'transfer_out'] },
        category: categoryStr
      })
      .sort({ date: -1, createdAt: -1 })
      .toArray();
  }

  return {
    month,
    monthlyTotal,
    monthlyIncome,
    filteredTotal,
    dailyTotals,
    todayTotal,
    memberBalances,
    categoryBreakdown,
    categoryTransactions: categoryTransactions.map((exp: any) => ({
      _id: exp._id.toString(),
      itemName: exp.itemName || 'Unknown Item',
      amount: Number(exp.amount || 0),
      date: exp.date || '',
      category: exp.category || 'Uncategorized',
      note: exp.note || ''
    })),
    topExpenses,
  };
}

/**
 * Fetches all recurring expense templates for the authenticated user's space.
 */
export async function getRecurringExpenses(): Promise<RecurringExpense[] | null> {
  const user = await getAuthenticatedUser();
  if (!user) return null;

  const db = await getDb();
  const spaceId = user.space_id || user.user_id;

  const templates = await db
    .collection('recurring_expenses')
    .find({ space_id: spaceId })
    .sort({ createdAt: -1 })
    .toArray();

  return templates.map(t => ({
    ...t,
    _id: t._id.toString(),
    createdAt: t.createdAt instanceof Date ? t.createdAt.toISOString() : t.createdAt,
    updatedAt: t.updatedAt instanceof Date ? t.updatedAt.toISOString() : t.updatedAt,
  })) as unknown as RecurringExpense[];
}

/**
 * Fetches summary of income and expenses for a given Financial Year (e.g. "2025-26" or "2026-27").
 * Financial Year in India runs from April 1 to March 31.
 */
export async function getFinancialYearSummary(fy: string): Promise<FinancialYearSummary | null> {
  const user = await getAuthenticatedUser();
  if (!user) return null;

  const db = await getDb();
  const spaceId = user.space_id || user.user_id;

  const parts = fy.split('-');
  let startYear = parseInt(parts[0], 10);
  if (isNaN(startYear)) {
    startYear = new Date().getFullYear();
    if (new Date().getMonth() < 3) startYear -= 1; // Before April belongs to previous startYear
  }
  const endYear = startYear + 1;
  const startDate = `${startYear}-04-01`;
  const endDate = `${endYear}-03-31`;

  const records = await db
    .collection('expenses')
    .find({
      space_id: spaceId,
      date: { $gte: startDate, $lte: endDate },
      type: { $in: ['expense', 'income', null] }
    })
    .sort({ date: -1 })
    .toArray();

  let totalIncome = 0;
  let totalExpense = 0;
  const monthMap: Record<string, { income: number; expense: number }> = {};

  for (let m = 4; m <= 12; m++) {
    const monStr = `${startYear}-${String(m).padStart(2, '0')}`;
    monthMap[monStr] = { income: 0, expense: 0 };
  }
  for (let m = 1; m <= 3; m++) {
    const monStr = `${endYear}-${String(m).padStart(2, '0')}`;
    monthMap[monStr] = { income: 0, expense: 0 };
  }

  const recentIncome: Expense[] = [];
  const recentExpenses: Expense[] = [];

  for (const doc of records) {
    const exp = {
      ...doc,
      _id: doc._id.toString(),
      createdAt: doc.createdAt instanceof Date ? doc.createdAt.toISOString() : doc.createdAt,
      updatedAt: doc.updatedAt instanceof Date ? doc.updatedAt.toISOString() : doc.updatedAt,
    } as unknown as Expense;

    const amt = Number(exp.amount) || 0;
    const mon = exp.date.substring(0, 7);

    if (!monthMap[mon]) {
      monthMap[mon] = { income: 0, expense: 0 };
    }

    if (exp.type === 'income') {
      totalIncome += amt;
      monthMap[mon].income += amt;
      if (recentIncome.length < 5) recentIncome.push(exp);
    } else if (exp.type === 'expense' || !exp.type) {
      totalExpense += amt;
      monthMap[mon].expense += amt;
      if (recentExpenses.length < 5) recentExpenses.push(exp);
    }
  }

  const monthlyBreakdown: MonthlyTaxBreakdown[] = Object.keys(monthMap)
    .sort()
    .map(mon => ({
      month: mon,
      income: monthMap[mon].income,
      expense: monthMap[mon].expense,
    }));

  return {
    fy: `${startYear}-${String(endYear).slice(-2)}`,
    startDate,
    endDate,
    totalIncome,
    totalExpense,
    monthlyBreakdown,
    recentIncome,
    recentExpenses,
  };
}

export async function getVaultReminders(): Promise<any[]> {
  const user = await getAuthenticatedUser();
  if (!user) return [];
  const db = await getDb();
  const spaceId = user.space_id || user.user_id;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const horizon = new Date(today);
  horizon.setDate(horizon.getDate() + 60);
  const horizonStr = horizon.toISOString().slice(0, 10);

  const [insurance, warranties] = await Promise.all([
    db.collection('insurance_policies').find({ space_id: spaceId, nextDueDate: { $lte: horizonStr } }).sort({ nextDueDate: 1 }).toArray(),
    db.collection('warranties').find({ space_id: spaceId, expiryDate: { $lte: horizonStr } }).sort({ expiryDate: 1 }).toArray()
  ]);

  const dayDiff = (d: string) => Math.round((new Date(d).getTime() - today.getTime()) / 86400000);

  return [
    ...insurance.map((p: any) => ({
      kind: 'insurance' as const,
      id: p._id ? p._id.toString() : Math.random().toString(),
      title: p.policyName || 'Policy',
      subtitle: `${p.provider || ''} • ${p.policyNumber || ''}`,
      dueDate: p.nextDueDate || '',
      daysLeft: dayDiff(p.nextDueDate || today.toISOString()),
      amount: p.premiumAmount || 0,
    })),
    ...warranties.map((w: any) => ({
      kind: 'warranty' as const,
      id: w._id ? w._id.toString() : Math.random().toString(),
      title: w.itemName || 'Warranty Item',
      subtitle: [w.brand, w.vendor].filter(Boolean).join(' • ') || 'Warranty',
      dueDate: w.expiryDate || '',
      daysLeft: dayDiff(w.expiryDate || today.toISOString()),
    })),
  ].sort((a, b) => a.daysLeft - b.daysLeft);
}

export async function getRecentActivity(limit = 6): Promise<any[]> {
  const user = await getAuthenticatedUser();
  if (!user) return [];
  const db = await getDb();
  const spaceId = user.space_id || user.user_id;

  const [expenses, hisabs, marriages] = await Promise.all([
    db.collection('expenses').find({ space_id: spaceId }).sort({ date: -1, createdAt: -1 }).limit(limit).toArray(),
    db.collection('hisab').find({ space_id: spaceId, ignored: { $ne: true } }).sort({ date: -1, created_at: -1 }).limit(limit).toArray(),
    db.collection('marriage_hisab').find({ space_id: spaceId }).sort({ date: -1 }).limit(limit).toArray()
  ]);

  const safeDateStr = (d: any): string => {
    if (!d) return '';
    if (typeof d === 'string') return d.slice(0, 10);
    if (d instanceof Date) return d.toISOString().slice(0, 10);
    try {
      return new Date(d).toISOString().slice(0, 10);
    } catch {
      return String(d);
    }
  };

  const safeTimestamp = (d: any): number => {
    if (!d) return 0;
    if (typeof d === 'number') return d;
    if (d instanceof Date) return d.getTime();
    const parsed = new Date(d).getTime();
    return isNaN(parsed) ? 0 : parsed;
  };

  const activity = [
    ...expenses.map((e: any) => ({
      kind: 'expense' as const,
      id: e._id ? e._id.toString() : Math.random().toString(),
      title: e.itemName || 'Expense',
      subtitle: e.category || 'General',
      amount: e.amount || 0,
      date: safeDateStr(e.date),
      rawDate: e.date || e.createdAt,
      type: e.type || 'expense'
    })),
    ...hisabs.map((h: any) => ({
      kind: 'hisab' as const,
      id: h._id ? h._id.toString() : Math.random().toString(),
      title: h.name || 'Hisab',
      subtitle: h.type === 'debit' ? 'Gave money' : 'Took money',
      amount: h.amount || 0,
      date: safeDateStr(h.date),
      rawDate: h.date || h.created_at,
      type: h.type
    })),
    ...marriages.map((m: any) => ({
      kind: 'marriage' as const,
      id: m._id ? m._id.toString() : Math.random().toString(),
      title: m.person_name || 'Social Vayvhar',
      subtitle: m.event_name || 'Gift',
      amount: m.amount || 0,
      date: safeDateStr(m.date),
      rawDate: m.date || m.createdAt,
      type: m.type
    }))
  ];

  return activity.sort((a, b) => safeTimestamp(b.rawDate) - safeTimestamp(a.rawDate)).slice(0, limit);
}

