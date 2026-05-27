import { getDb } from './db';
import { getAuthenticatedUser } from './auth';
import { 
  HisabRecord, 
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
