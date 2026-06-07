/**
 * POST /api/tracker/location
 * Android-facing endpoint. Requires Bearer token auth.
 * Accepts a single GPS location point, validates it, and saves it.
 */

import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { haversineDistanceM, updateSessionStats, updateLatestState } from '@/lib/tracker-db';
import {
  validateTrackerToken,
  unauthorizedResponse,
  badRequestResponse,
  notFoundResponse,
  successResponse,
  serverErrorResponse,
  validateLocationPayload,
} from '@/lib/tracker-auth';
import { broadcastSSE } from '@/lib/tracker-sse';

// Max realistic jump distance between two consecutive points (metres)
const MAX_JUMP_DISTANCE_M = 2000;

export async function POST(request: NextRequest): Promise<Response> {
  // 1. Validate Bearer token
  if (!validateTrackerToken(request)) {
    return unauthorizedResponse();
  }

  // 2. Parse body
  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return badRequestResponse('Request body must be valid JSON');
  }

  // 3. Validate location payload
  const validation = validateLocationPayload(rawBody);
  if (validation.valid === false) {
    return badRequestResponse(validation.message);
  }


  const { sessionId, sequence, lat, lng, speedMps, accuracyM, battery, deviceTimestamp } =
    validation.data;

  try {
    const db = await getDb();
    const sessions = db.collection('tracker_sessions');
    const points = db.collection('tracker_points');

    // 4. Validate active session
    const session = await sessions.findOne({ sessionId });
    if (!session) {
      return notFoundResponse(`Session '${sessionId}' not found`);
    }
    if (session.status !== 'active') {
      return notFoundResponse(`Session '${sessionId}' is not active`);
    }

    // 5. Duplicate protection (sessionId + sequence must be unique)
    const existing = await points.findOne({ sessionId, sequence });
    if (existing) {
      return successResponse('Duplicate point ignored', { duplicate: true });
    }

    // 6. Find last accepted point for distance/speed calculation
    const lastPoint = await points
      .find({ sessionId })
      .sort({ sequence: -1 })
      .limit(1)
      .toArray();

    const prevPoint = lastPoint[0] ?? null;

    // 7. Calculate distance from last accepted point
    let distanceFromLastM = 0;
    let serverSpeedKmh = 0;
    let timeDeltaSec = 0;

    if (prevPoint) {
      distanceFromLastM = haversineDistanceM(
        prevPoint.lat,
        prevPoint.lng,
        lat,
        lng,
      );

      // Reject unrealistic jump (> 2 km between consecutive points)
      if (distanceFromLastM > MAX_JUMP_DISTANCE_M) {
        console.warn(
          `[TRACKER/LOCATION] Rejected: jump ${distanceFromLastM.toFixed(0)}m for session ${sessionId} seq ${sequence}`,
        );
        return badRequestResponse(
          `Position jump too large (${distanceFromLastM.toFixed(0)}m). Point rejected.`,
        );
      }

      // Server-verified speed: distance / time
      const prevTs =
        prevPoint.deviceTimestamp instanceof Date
          ? prevPoint.deviceTimestamp.getTime()
          : Number(prevPoint.deviceTimestamp);
      timeDeltaSec = Math.max((deviceTimestamp - prevTs) / 1000, 0.001);
      serverSpeedKmh = (distanceFromLastM / timeDeltaSec) * 3.6;
    }

    const speedKmh = speedMps * 3.6; // Android instant speed for display

    // 8. Build point document
    const pointDoc = {
      sessionId,
      sequence,
      lat,
      lng,
      speedMps,
      serverSpeedKmh,
      accuracyM,
      battery,
      distanceFromLastM,
      deviceTimestamp: new Date(deviceTimestamp),
      serverReceivedAt: new Date(),
      location: {
        type: 'Point' as const,
        coordinates: [lng, lat] as [number, number],
      },
    };

    // 9. Insert point
    await points.insertOne(pointDoc);

    // 10. Update session stats
    await updateSessionStats(db, {
      sessionId,
      distanceFromLastM,
      serverSpeedKmh,
      timeDeltaSec,
      sequence,
    });

    // 11. Fetch updated session for latest state
    const updatedSession = await sessions.findOne({ sessionId });

    // 12. Update latest state document
    await updateLatestState(db, {
      sessionId,
      lat,
      lng,
      speedKmh,
      serverSpeedKmh,
      avgSpeedKmh: updatedSession?.avgSpeedKmh ?? 0,
      totalDistanceM: updatedSession?.totalDistanceM ?? 0,
      accuracyM,
      battery,
      lastSequence: sequence,
    });

    // 13. Build SSE payload
    const ssePayload = {
      sessionId,
      sequence,
      lat,
      lng,
      speedKmh,
      serverSpeedKmh,
      avgSpeedKmh: updatedSession?.avgSpeedKmh ?? 0,
      totalDistanceM: updatedSession?.totalDistanceM ?? 0,
      accuracyM,
      battery,
      distanceFromLastM,
      deviceTimestamp,
      serverReceivedAt: new Date().toISOString(),
    };

    // 14. Broadcast to SSE clients
    broadcastSSE('tracker:point', ssePayload);

    return successResponse('Location accepted', {
      sessionId,
      sequence,
      distanceFromLastM,
      serverSpeedKmh,
    });
  } catch (err) {
    console.error('[TRACKER/LOCATION]', err);
    return serverErrorResponse();
  }
}
