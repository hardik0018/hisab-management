export const dynamic = 'force-dynamic';
import { getDb } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';
import { NextRequest } from 'next/server';
import { HisabRecord } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');
    const mobile = searchParams.get('mobile') || '';

    if (!name) {
      return Response.json({ error: 'Missing name parameter' }, { status: 400 });
    }

    const db = await getDb();
    const spaceId = user.space_id || user.user_id;

    const m = mobile ? String(mobile).trim() : '';
    let mobileQuery: any;
    if (m) {
      const num = Number(m);
      if (!isNaN(num)) {
        mobileQuery = { $in: [m, num] };
      } else {
        mobileQuery = m;
      }
    } else {
      mobileQuery = { $in: ['', null] };
    }

    const records = await db
      .collection('hisab')
      .find({ space_id: spaceId, name, mobile: mobileQuery }, { projection: { _id: 0 } })
      .sort({ date: -1, created_at: -1 })
      .toArray() as unknown as HisabRecord[];

    return Response.json({ records });
  } catch (error) {
    console.error('API Error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
