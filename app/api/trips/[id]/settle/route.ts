export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';
import { getTripDetail } from '@/lib/trip-fetching';
import { v4 as uuidv4 } from 'uuid';
import { revalidatePath } from 'next/cache';
import { HisabRecord } from '@/types';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const db = await getDb();
    const spaceId = user.space_id || user.user_id;

    const detail = await getTripDetail(id);
    if (!detail) {
      return Response.json({ error: 'Not Found', message: 'Trip not found' }, { status: 404 });
    }

    const { trip, settlements, memberBalances } = detail;
    const currentUserMember = memberBalances.find((m) => m.isCurrentUser);

    if (!currentUserMember) {
      return Response.json(
        { error: 'Bad Request', message: 'Current user is not identified in trip members' },
        { status: 400 }
      );
    }

    const currentMemberId = currentUserMember.memberId;
    const now = new Date();
    const createdHisabRecords: HisabRecord[] = [];

    for (const s of settlements) {
      if (s.amount <= 0) continue;

      let hisabRecord: HisabRecord | null = null;

      if (s.fromMemberId === currentMemberId) {
        // Current user owes the other member -> Credit (you took / owe them)
        const targetMember = trip.members.find((m) => m.id === s.toMemberId);
        hisabRecord = {
          hisab_id: `hsb_${uuidv4().replace(/-/g, '').slice(0, 10)}`,
          user_id: user.user_id,
          space_id: spaceId,
          name: targetMember?.name || s.toMemberName,
          mobile: targetMember?.mobile || '',
          type: 'credit',
          amount: s.amount,
          description: `Settlement for "${trip.title}" (${s.fromMemberName} owes ${s.toMemberName})`,
          date: now,
          created_at: now,
          log_as_expense: false,
          ignored: false,
        };
      } else if (s.toMemberId === currentMemberId) {
        // Other member owes current user -> Debit (you gave / they owe you)
        const targetMember = trip.members.find((m) => m.id === s.fromMemberId);
        hisabRecord = {
          hisab_id: `hsb_${uuidv4().replace(/-/g, '').slice(0, 10)}`,
          user_id: user.user_id,
          space_id: spaceId,
          name: targetMember?.name || s.fromMemberName,
          mobile: targetMember?.mobile || '',
          type: 'debit',
          amount: s.amount,
          description: `Settlement for "${trip.title}" (${s.fromMemberName} owes ${s.toMemberName})`,
          date: now,
          created_at: now,
          log_as_expense: false,
          ignored: false,
        };
      }

      if (hisabRecord) {
        await db.collection('hisab').insertOne(hisabRecord as any);
        createdHisabRecords.push(hisabRecord);
      }
    }

    revalidatePath('/hisab', 'layout');
    revalidatePath('/dashboard', 'layout');
    revalidatePath(`/expenses/trips/${id}`, 'layout');

    return Response.json({
      success: true,
      count: createdHisabRecords.length,
      records: createdHisabRecords,
      message:
        createdHisabRecords.length > 0
          ? `Successfully synced ${createdHisabRecords.length} settlement record(s) to your Hisab ledger!`
          : 'No pending balances involving you to sync.',
    });
  } catch (error) {
    console.error('[API_TRIP_SETTLE_ERROR]', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
