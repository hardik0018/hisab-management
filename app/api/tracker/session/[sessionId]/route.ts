/**
 * GET /api/tracker/session/[sessionId]
 * Web-facing. Returns session details + its location points (sorted by sequence).
 * No authentication required.
 */

import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';

const MAX_POINTS = 500;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
): Promise<Response> {
  const { sessionId } = await params;

  if (!sessionId || sessionId.trim() === '') {
    return Response.json(
      { success: false, message: 'sessionId is required', error: 'VALIDATION_ERROR' },
      { status: 400 },
    );
  }

  try {
    const db = await getDb();

    const [session, points] = await Promise.all([
      db
        .collection('tracker_sessions')
        .findOne({ sessionId }, { projection: { _id: 0 } }),
      db
        .collection('tracker_points')
        .find({ sessionId }, { projection: { _id: 0, location: 0 } })
        .sort({ sequence: 1 })
        .limit(MAX_POINTS)
        .toArray(),
    ]);

    if (!session) {
      return Response.json(
        { success: false, message: `Session '${sessionId}' not found`, error: 'NOT_FOUND' },
        { status: 404 },
      );
    }

    return Response.json(
      {
        success: true,
        data: {
          session,
          points,
          pointCount: points.length,
          truncated: points.length === MAX_POINTS,
        },
      },
      { status: 200 },
    );
  } catch (err) {
    console.error('[TRACKER/SESSION/:ID]', err);
    return Response.json(
      { success: false, message: 'Failed to fetch session', error: 'SERVER_ERROR' },
      { status: 500 },
    );
  }
}
