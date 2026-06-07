/**
 * POST /api/tracker/session/start
 * Android-facing endpoint. Requires Bearer token auth.
 * Creates a new tracking session or returns the existing one (idempotent).
 */

import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { ensureTrackerIndexes } from '@/lib/tracker-db';
import {
  validateTrackerToken,
  unauthorizedResponse,
  badRequestResponse,
  createdResponse,
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
    await ensureTrackerIndexes();
    const db = await getDb();
    const sessions = db.collection('tracker_sessions');
    const latest = db.collection('tracker_latest');
    const now = new Date();

    // 3. Check if this exact sessionId already exists
    const existingSession = await sessions.findOne({ sessionId });
    if (existingSession) {
      // Idempotent — return existing session as-is
      return successResponse('Session already exists', {
        sessionId: existingSession.sessionId,
        status: existingSession.status,
        startedAt: existingSession.startedAt,
      });
    }

    // 4. Stop any currently active session before starting a new one
    const activeSession = await sessions.findOne({ status: 'active' });
    if (activeSession) {
      await sessions.updateOne(
        { sessionId: activeSession.sessionId },
        { $set: { status: 'stopped', stoppedAt: now, updatedAt: now } },
      );
      await latest.updateOne(
        { trackerId: 'main' },
        { $set: { status: 'stopped' } },
        { upsert: true },
      );
      broadcastSSE('tracker:session-stopped', {
        sessionId: activeSession.sessionId,
        stoppedAt: now.toISOString(),
      });
    }

    // 5. Create new session
    const newSession = {
      sessionId,
      status: 'active',
      startedAt: now,
      stoppedAt: null,
      totalDistanceM: 0,
      avgSpeedKmh: 0,
      movingTimeSec: 0,
      pointCount: 0,
      lastSequence: -1,
      createdAt: now,
      updatedAt: now,
    };

    await sessions.insertOne(newSession);

    // 6. Seed the latest state doc
    await latest.updateOne(
      { trackerId: 'main' },
      {
        $set: {
          trackerId: 'main',
          sessionId,
          status: 'live',
          lat: null,
          lng: null,
          speedKmh: null,
          serverSpeedKmh: null,
          avgSpeedKmh: 0,
          totalDistanceM: 0,
          accuracyM: null,
          battery: null,
          lastSequence: -1,
          lastUpdatedAt: now,
        },
      },
      { upsert: true },
    );

    // 7. Broadcast SSE
    broadcastSSE('tracker:session-started', {
      sessionId,
      startedAt: now.toISOString(),
    });

    return createdResponse('Session started', { sessionId, startedAt: now.toISOString() });
  } catch (err) {
    console.error('[TRACKER/SESSION/START]', err);
    return serverErrorResponse();
  }
}
