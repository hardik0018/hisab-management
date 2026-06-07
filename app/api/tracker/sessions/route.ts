/**
 * GET /api/tracker/sessions
 * Web-facing. Returns a list of recent tracker sessions.
 * No authentication required.
 */

import { getDb } from '@/lib/db';

const SESSION_LIMIT = 20;

export async function GET(): Promise<Response> {
  try {
    const db = await getDb();
    const sessions = await db
      .collection('tracker_sessions')
      .find({}, { projection: { _id: 0 } })
      .sort({ createdAt: -1 })
      .limit(SESSION_LIMIT)
      .toArray();

    return Response.json({ success: true, data: sessions }, { status: 200 });
  } catch (err) {
    console.error('[TRACKER/SESSIONS]', err);
    return Response.json(
      { success: false, message: 'Failed to fetch sessions', error: 'SERVER_ERROR' },
      { status: 500 },
    );
  }
}
