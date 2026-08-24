import { getDb } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';
import {
  Trip,
  TripCardItem,
  TripDetailData,
  TripDaySummary,
  TripCategorySummary,
  TripMemberBalance,
  TripSettlementDebt,
} from '@/types/trip';
import { Expense } from '@/types/expense';

/**
 * Returns all trips for the authenticated user's space, including aggregated spend totals.
 */
export async function getTrips(filter?: { status?: string }): Promise<TripCardItem[]> {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return [];

    const db = await getDb();
    const spaceIds = [user.space_id, user.user_id].filter(Boolean);

    const query: Record<string, any> = { space_id: { $in: spaceIds } };
    if (filter?.status && filter.status !== 'all') {
      query.status = filter.status;
    }

    const trips = (await db
      .collection('trips')
      .find(query)
      .sort({ isCurrentActive: -1, startDate: -1, createdAt: -1 })
      .toArray()) as unknown as Trip[];

    if (!trips || trips.length === 0) return [];

    const tripIds = trips.map((t) => t.trip_id);

    // Aggregate spend and expense counts for these trips in one pipeline
    const expenseAgg = await db
      .collection('expenses')
      .aggregate([
        {
          $match: {
            space_id: { $in: spaceIds },
            associatedType: 'trip',
            associatedId: { $in: tripIds },
            type: { $ne: 'income' },
          },
        },
        {
          $group: {
            _id: '$associatedId',
            totalSpent: { $sum: '$amount' },
            expenseCount: { $sum: 1 },
          },
        },
      ])
      .toArray();

    const spendMap = new Map<string, { totalSpent: number; expenseCount: number }>();
    expenseAgg.forEach((agg: any) => {
      spendMap.set(agg._id, {
        totalSpent: agg.totalSpent || 0,
        expenseCount: agg.expenseCount || 0,
      });
    });

    return trips.map((t) => {
      const stats = spendMap.get(t.trip_id) || { totalSpent: 0, expenseCount: 0 };
      const budget = t.budget || 0;
      const budgetPercentage =
        budget > 0 ? Math.min(100, Math.round((stats.totalSpent / budget) * 100)) : 0;

      return {
        _id: t._id?.toString(),
        trip_id: t.trip_id,
        title: t.title,
        destination: t.destination,
        category: t.category,
        startDate: t.startDate,
        endDate: t.endDate,
        budget: t.budget,
        coverEmoji: t.coverEmoji || '🌴',
        status: t.status,
        isCurrentActive: !!t.isCurrentActive,
        membersCount: t.members ? t.members.length : 0,
        totalSpent: stats.totalSpent,
        expenseCount: stats.expenseCount,
        budgetPercentage,
      };
    });
  } catch (error) {
    console.error('[GET_TRIPS_ERROR]', error);
    return [];
  }
}

/**
 * Returns the currently active trip in the user's space, if any.
 */
export async function getActiveTrip(): Promise<Trip | null> {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return null;

    const db = await getDb();
    const spaceIds = [user.space_id, user.user_id].filter(Boolean);

    const trip = (await db.collection('trips').findOne({
      space_id: { $in: spaceIds },
      isCurrentActive: true,
    })) as unknown as Trip | null;

    if (!trip) return null;

    return {
      ...trip,
      _id: trip._id?.toString(),
    };
  } catch (error) {
    console.error('[GET_ACTIVE_TRIP_ERROR]', error);
    return null;
  }
}

/**
 * Computes debt settlements (who owes whom) from net balances.
 */
function calculateSettlements(
  members: TripMemberBalance[]
): TripSettlementDebt[] {
  const debtors: { memberId: string; name: string; amount: number }[] = [];
  const creditors: { memberId: string; name: string; amount: number }[] = [];

  members.forEach((m) => {
    if (m.netBalance < -0.01) {
      debtors.push({
        memberId: m.memberId,
        name: m.memberName,
        amount: Math.abs(m.netBalance),
      });
    } else if (m.netBalance > 0.01) {
      creditors.push({
        memberId: m.memberId,
        name: m.memberName,
        amount: m.netBalance,
      });
    }
  });

  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);

  const debts: TripSettlementDebt[] = [];
  let dIdx = 0;
  let cIdx = 0;

  while (dIdx < debtors.length && cIdx < creditors.length) {
    const debtor = debtors[dIdx];
    const creditor = creditors[cIdx];

    const settledAmount = Math.min(debtor.amount, creditor.amount);
    if (settledAmount > 0.01) {
      debts.push({
        fromMemberId: debtor.memberId,
        fromMemberName: debtor.name,
        toMemberId: creditor.memberId,
        toMemberName: creditor.name,
        amount: Math.round(settledAmount),
        isSettled: false,
      });
    }

    debtor.amount -= settledAmount;
    creditor.amount -= settledAmount;

    if (debtor.amount <= 0.01) dIdx++;
    if (creditor.amount <= 0.01) cIdx++;
  }

  return debts;
}

/**
 * Returns comprehensive details, statistics, and breakdowns for a single trip.
 */
export async function getTripDetail(tripId: string): Promise<TripDetailData | null> {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return null;

    const db = await getDb();
    const spaceIds = [user.space_id, user.user_id].filter(Boolean);

    const tripDoc = (await db.collection('trips').findOne({
      trip_id: tripId,
      space_id: { $in: spaceIds },
    })) as unknown as Trip | null;

    if (!tripDoc) return null;

    const trip: Trip = {
      ...tripDoc,
      _id: tripDoc._id?.toString(),
    };

    // Fetch all linked expenses
    const rawExpenses = (await db
      .collection('expenses')
      .find({
        space_id: { $in: spaceIds },
        associatedType: 'trip',
        associatedId: tripId,
      })
      .sort({ date: -1, createdAt: -1 })
      .toArray()) as unknown as Expense[];

    const expenses: Expense[] = rawExpenses.map((e) => ({
      ...e,
      _id: e._id?.toString(),
    }));

    // Basic stats
    const totalSpent = expenses.reduce((sum, e) => (e.type !== 'income' ? sum + Number(e.amount || 0) : sum), 0);
    const budget = Number(trip.budget || 0);
    const budgetRemaining = Math.max(0, budget - totalSpent);
    const budgetUsedPercentage = budget > 0 ? Math.round((totalSpent / budget) * 100) : 0;

    // Days count calculation
    let daysCount = 1;
    if (trip.startDate && trip.endDate) {
      const start = new Date(trip.startDate);
      const end = new Date(trip.endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      daysCount = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1);
    }
    const dailyAverage = daysCount > 0 ? Math.round(totalSpent / daysCount) : totalSpent;

    // Day-by-Day Summary
    const dayMap = new Map<string, { total: number; count: number }>();
    expenses.forEach((e) => {
      if (e.type === 'income') return;
      const d = e.date;
      const curr = dayMap.get(d) || { total: 0, count: 0 };
      curr.total += Number(e.amount || 0);
      curr.count += 1;
      dayMap.set(d, curr);
    });

    const daySummaries: TripDaySummary[] = [];
    if (trip.startDate && trip.endDate) {
      const start = new Date(trip.startDate);
      const end = new Date(trip.endDate);
      let cur = new Date(start);
      let dayNum = 1;

      while (cur <= end) {
        const dateStr = cur.toISOString().split('T')[0];
        const stat = dayMap.get(dateStr) || { total: 0, count: 0 };
        daySummaries.push({
          date: dateStr,
          dayNumber: dayNum,
          total: stat.total,
          count: stat.count,
        });
        cur.setDate(cur.getDate() + 1);
        dayNum++;
      }
    } else {
      Array.from(dayMap.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .forEach(([date, stat], idx) => {
          daySummaries.push({
            date,
            dayNumber: idx + 1,
            total: stat.total,
            count: stat.count,
          });
        });
    }

    // Category Breakdown
    const catMap = new Map<string, { total: number; count: number }>();
    expenses.forEach((e) => {
      if (e.type === 'income') return;
      const cat = e.tripMetadata?.tripCategory || e.category || 'General & Other';
      const curr = catMap.get(cat) || { total: 0, count: 0 };
      curr.total += Number(e.amount || 0);
      curr.count += 1;
      catMap.set(cat, curr);
    });

    const categorySummaries: TripCategorySummary[] = Array.from(catMap.entries())
      .map(([category, data]) => ({
        category,
        total: data.total,
        percentage: totalSpent > 0 ? Math.round((data.total / totalSpent) * 100) : 0,
        count: data.count,
      }))
      .sort((a, b) => b.total - a.total);

    // Member Balances & Splits
    const members = trip.members || [];
    const memberPaidMap = new Map<string, number>();
    const memberShareMap = new Map<string, number>();

    // Initialize all members
    members.forEach((m) => {
      memberPaidMap.set(m.id, 0);
      memberShareMap.set(m.id, 0);
    });

    expenses.forEach((e) => {
      if (e.type === 'income') return;
      const amt = Number(e.amount || 0);
      const paidBy = e.tripMetadata?.paidByMemberId;
      const splits = e.tripMetadata?.splits;

      // Who paid
      if (paidBy && memberPaidMap.has(paidBy)) {
        memberPaidMap.set(paidBy, (memberPaidMap.get(paidBy) || 0) + amt);
      } else if (members.length > 0) {
        // Default to first/current member
        const defaultMemberId = members[0].id;
        memberPaidMap.set(defaultMemberId, (memberPaidMap.get(defaultMemberId) || 0) + amt);
      }

      // Who owes what share
      if (splits && splits.length > 0) {
        splits.forEach((s) => {
          if (memberShareMap.has(s.memberId)) {
            memberShareMap.set(s.memberId, (memberShareMap.get(s.memberId) || 0) + Number(s.amount || 0));
          }
        });
      } else if (members.length > 0) {
        // Equal default split
        const sharePerPerson = amt / members.length;
        members.forEach((m) => {
          memberShareMap.set(m.id, (memberShareMap.get(m.id) || 0) + sharePerPerson);
        });
      }
    });

    const memberBalances: TripMemberBalance[] = members.map((m) => {
      const totalPaid = Math.round(memberPaidMap.get(m.id) || 0);
      const totalShare = Math.round(memberShareMap.get(m.id) || 0);
      const netBalance = totalPaid - totalShare;

      return {
        memberId: m.id,
        memberName: m.name,
        isCurrentUser: !!m.isCurrentUser,
        totalPaid,
        totalShare,
        netBalance,
      };
    });

    const settlements = calculateSettlements(memberBalances);

    return {
      trip,
      expenses,
      totalSpent,
      budgetRemaining,
      budgetUsedPercentage,
      dailyAverage,
      daysCount,
      daySummaries,
      categorySummaries,
      memberBalances,
      settlements,
    };
  } catch (error) {
    console.error('[GET_TRIP_DETAIL_ERROR]', error);
    return null;
  }
}
