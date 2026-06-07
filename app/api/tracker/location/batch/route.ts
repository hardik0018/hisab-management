/**
 * POST /api/tracker/location/batch
 * Android-facing endpoint. Requires Bearer token auth.
 * Accepts an array of GPS points, processes them in sequence order.
 * Duplicates and invalid points are skipped safely.
 */

import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { haversineDistanceM, updateSessionStats, updateLatestState } from '@/lib/tracker-db';
import {
  validateTrackerToken,
  unauthorizedResponse,
  badRequestResponse,
  successResponse,
  serverErrorResponse,
  validateLocationPayload,
  LocationPayload,
} from '@/lib/tracker-auth';
import { broadcastSSE } from '@/lib/tracker-sse';

const MAX_JUMP_DISTANCE_M = 2000;
const MAX_BATCH_SIZE = 500;

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

  if (!Array.isArray(rawBody)) {
    return badRequestResponse('Request body must be a JSON array of location points');
  }

  if (rawBody.length === 0) {
    return successResponse('No points to process', { accepted: 0, rejected: 0, duplicates: 0 });
  }

  if (rawBody.length > MAX_BATCH_SIZE) {
    return badRequestResponse(`Batch size exceeds maximum of ${MAX_BATCH_SIZE} points`);
  }

  // 3. Pre-validate and sort by sequence
  const validatedPoints: LocationPayload[] = [];
  let rejected = 0;

  for (const item of rawBody) {
    const result = validateLocationPayload(item);
    if (!result.valid) {
      rejected++;
    } else {
      validatedPoints.push(result.data);
    }
  }

  if (validatedPoints.length === 0) {
    return successResponse('All points rejected due to validation errors', {
      accepted: 0,
      rejected,
      duplicates: 0,
    });
  }

  // Sort by sequence ascending — process oldest first
  validatedPoints.sort((a, b) => a.sequence - b.sequence);

  // Group by sessionId
  const sessionGroups = new Map<string, LocationPayload[]>();
  for (const point of validatedPoints) {
    const existing = sessionGroups.get(point.sessionId) ?? [];
    existing.push(point);
    sessionGroups.set(point.sessionId, existing);
  }

  try {
    const db = await getDb();
    const sessions = db.collection('tracker_sessions');
    const points = db.collection('tracker_points');

    let accepted = 0;
    let duplicates = 0;
    let lastAcceptedPoint: LocationPayload | null = null;
    let lastAcceptedSessionId: string | null = null;

    for (const [sessionId, sessionPoints] of sessionGroups) {
      // Validate session is active
      const session = await sessions.findOne({ sessionId });
      if (!session || session.status !== 'active') {
        rejected += sessionPoints.length;
        continue;
      }

      // Get existing point sequences for duplicate detection
      const existingSequences = new Set<number>(
        (
          await points
            .find({ sessionId }, { projection: { sequence: 1, _id: 0 } })
            .toArray()
        ).map((p) => p.sequence as number),
      );

      // Get last accepted point for distance calc
      let prevDbPoint = await points
        .find({ sessionId })
        .sort({ sequence: -1 })
        .limit(1)
        .toArray()
        .then((arr) => arr[0] ?? null);

      for (const point of sessionPoints) {
        const { sequence, lat, lng, speedMps, accuracyM, battery, deviceTimestamp } = point;

        // Duplicate check
        if (existingSequences.has(sequence)) {
          duplicates++;
          continue;
        }

        // Calculate distance from previous point
        let distanceFromLastM = 0;
        let serverSpeedKmh = 0;
        let timeDeltaSec = 0;

        if (prevDbPoint) {
          distanceFromLastM = haversineDistanceM(
            prevDbPoint.lat,
            prevDbPoint.lng,
            lat,
            lng,
          );

          if (distanceFromLastM > MAX_JUMP_DISTANCE_M) {
            console.warn(
              `[TRACKER/BATCH] Skipped jump: ${distanceFromLastM.toFixed(0)}m seq ${sequence}`,
            );
            rejected++;
            continue;
          }

          const prevTs =
            prevDbPoint.deviceTimestamp instanceof Date
              ? prevDbPoint.deviceTimestamp.getTime()
              : Number(prevDbPoint.deviceTimestamp);
          timeDeltaSec = Math.max((deviceTimestamp - prevTs) / 1000, 0.001);
          serverSpeedKmh = (distanceFromLastM / timeDeltaSec) * 3.6;
        }

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

        try {
          await points.insertOne(pointDoc);
          existingSequences.add(sequence);
          prevDbPoint = pointDoc as unknown as typeof prevDbPoint;
          accepted++;

          // Track newest accepted for SSE
          lastAcceptedPoint = point;
          lastAcceptedSessionId = sessionId;

          // Update stats per point
          await updateSessionStats(db, {
            sessionId,
            distanceFromLastM,
            serverSpeedKmh,
            timeDeltaSec,
            sequence,
          });
        } catch (insertErr: unknown) {
          // Duplicate key error (race condition) — count as duplicate
          if (
            typeof insertErr === 'object' &&
            insertErr !== null &&
            'code' in insertErr &&
            (insertErr as { code: number }).code === 11000
          ) {
            duplicates++;
          } else {
            rejected++;
            console.error('[TRACKER/BATCH] Insert error:', insertErr);
          }
        }
      }
    }

    // Update latest state with newest accepted point
    if (lastAcceptedPoint && lastAcceptedSessionId) {
      const p = lastAcceptedPoint;
      const updatedSession = await sessions.findOne({ sessionId: lastAcceptedSessionId });
      await updateLatestState(db, {
        sessionId: lastAcceptedSessionId,
        lat: p.lat,
        lng: p.lng,
        speedKmh: p.speedMps * 3.6,
        serverSpeedKmh: 0, // re-fetched from session below
        avgSpeedKmh: updatedSession?.avgSpeedKmh ?? 0,
        totalDistanceM: updatedSession?.totalDistanceM ?? 0,
        accuracyM: p.accuracyM,
        battery: p.battery,
        lastSequence: p.sequence,
      });

      broadcastSSE('tracker:point', {
        sessionId: lastAcceptedSessionId,
        sequence: p.sequence,
        lat: p.lat,
        lng: p.lng,
        speedKmh: p.speedMps * 3.6,
        avgSpeedKmh: updatedSession?.avgSpeedKmh ?? 0,
        totalDistanceM: updatedSession?.totalDistanceM ?? 0,
        accuracyM: p.accuracyM,
        battery: p.battery,
      });
    }

    return successResponse('Batch processed', { accepted, rejected, duplicates });
  } catch (err) {
    console.error('[TRACKER/LOCATION/BATCH]', err);
    return serverErrorResponse();
  }
}
