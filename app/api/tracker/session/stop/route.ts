/**
 * POST /api/tracker/session/stop
 * Android-facing endpoint. Requires Bearer token auth.
 * Stops an active session and finalizes its stats.
 */

import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import {
  validateTrackerToken,
  unauthorizedResponse,
  badRequestResponse,
  notFoundResponse,
  successResponse,
  serverErrorResponse,
} from '@/lib/tracker-auth';
import { broadcastSSE } from '@/lib/tracker-sse';

export async function POST(request: NextRequest): Promise<Response> {
  // 1. Validate Bearer token
  if (!validateTrackerToken(request)) {
    return unauthorizedResponse();
  }

  // 2. Parse and validate body
  let body: { sessionId?: unknown };
  try {
    body = await request.json();
  } catch {
    return badRequestResponse('Request body must be valid JSON');
  }

  const sessionId = body?.sessionId;
  if (!sessionId || typeof sessionId !== 'string' || sessionId.trim() === '') {
    return badRequestResponse('sessionId is required and must be a non-empty string', 'sessionId');
  }

  try {
    const db = await getDb();
    const sessions = db.collection('tracker_sessions');
    const latest = db.collection('tracker_latest');

    // 3. Find session
    const session = await sessions.findOne({ sessionId });
    if (!session) {
      return notFoundResponse(`Session '${sessionId}' not found`);
    }

    // 4. Idempotent — already stopped
    if (session.status === 'stopped') {
      return successResponse('Session already stopped', {
        sessionId,
        stoppedAt: session.stoppedAt,
      });
    }

    const now = new Date();

    // 5. Finalize session
    await sessions.updateOne(
      { sessionId },
      {
        $set: {
          status: 'stopped',
          stoppedAt: now,
          updatedAt: now,
        },
      },
    );

    // 6. Update latest state to stopped
    await latest.updateOne(
      { trackerId: 'main' },
      { $set: { status: 'stopped', lastUpdatedAt: now } },
      { upsert: true },
    );

    // 7. Broadcast SSE with final stats
    const finalSession = await sessions.findOne({ sessionId });
    broadcastSSE('tracker:session-stopped', {
      sessionId,
      stoppedAt: now.toISOString(),
      totalDistanceM: finalSession?.totalDistanceM ?? 0,
      avgSpeedKmh: finalSession?.avgSpeedKmh ?? 0,
      pointCount: finalSession?.pointCount ?? 0,
    });

    return successResponse('Session stopped', {
      sessionId,
      stoppedAt: now.toISOString(),
      totalDistanceM: finalSession?.totalDistanceM ?? 0,
      avgSpeedKmh: finalSession?.avgSpeedKmh ?? 0,
    });
  } catch (err) {
    console.error('[TRACKER/SESSION/STOP]', err);
    return serverErrorResponse();
  }
}
