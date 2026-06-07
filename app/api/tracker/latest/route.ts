/**
 * GET /api/tracker/latest
 * Web-facing. Returns the current tracker_latest document.
 * No authentication required — public read of tracker state.
 */

import { getDb } from '@/lib/db';

export async function GET(): Promise<Response> {
  try {
    const db = await getDb();
    const doc = await db
      .collection('tracker_latest')
      .findOne({ trackerId: 'main' }, { projection: { _id: 0 } });

    return Response.json({ success: true, data: doc ?? null }, { status: 200 });
  } catch (err) {
    console.error('[TRACKER/LATEST]', err);
    return Response.json(
      { success: false, message: 'Failed to fetch tracker state', error: 'SERVER_ERROR' },
      { status: 500 },
    );
  }
}
