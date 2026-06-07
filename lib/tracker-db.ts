/**
 * tracker-db.ts
 * Server-only database helpers for the live tracker feature.
 * All functions use the shared MongoDB client via getDb().
 * Do NOT import this file in any Client Component.
 */

import { Db } from 'mongodb';
import { getDb } from './db';

// ─── Collection Accessors ────────────────────────────────────────────────────

export async function getTrackerSessionsCollection() {
  const db = await getDb();
  return db.collection('tracker_sessions');
}

export async function getTrackerPointsCollection() {
  const db = await getDb();
  return db.collection('tracker_points');
}

export async function getTrackerLatestCollection() {
  const db = await getDb();
  return db.collection('tracker_latest');
}

// ─── Index Bootstrapping ─────────────────────────────────────────────────────

let indexesEnsured = false;

/**
 * Creates all required MongoDB indexes for tracker collections.
 * Safe to call on every request — only runs once per server process.
 */
export async function ensureTrackerIndexes(): Promise<void> {
  if (indexesEnsured) return;
  indexesEnsured = true;

  try {
    const db = await getDb();

    // tracker_sessions: unique sessionId
    await db.collection('tracker_sessions').createIndexes([
      { key: { sessionId: 1 }, unique: true, name: 'idx_sessions_sessionId' },
      { key: { status: 1 }, name: 'idx_sessions_status' },
    ]);

    // tracker_points: unique composite + supporting indexes
    await db.collection('tracker_points').createIndexes([
      {
        key: { sessionId: 1, sequence: 1 },
        unique: true,
        name: 'idx_points_sessionId_sequence_unique',
      },
      { key: { sessionId: 1, sequence: -1 }, name: 'idx_points_sessionId_sequence_desc' },
      { key: { deviceTimestamp: 1 }, name: 'idx_points_deviceTimestamp' },
      { key: { location: '2dsphere' }, name: 'idx_points_location_2dsphere' },
    ]);

    // tracker_latest: unique trackerId
    await db.collection('tracker_latest').createIndexes([
      { key: { trackerId: 1 }, unique: true, name: 'idx_latest_trackerId' },
    ]);
  } catch (err) {
    // Non-fatal: indexes may already exist
    console.warn('[TRACKER_INDEXES]', err);
  }
}

// ─── Haversine Distance ───────────────────────────────────────────────────────

const EARTH_RADIUS_M = 6_371_000;

/**
 * Calculates the great-circle distance between two GPS coordinates in metres.
 * Uses the Haversine formula.
 */
export function haversineDistanceM(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_M * c;
}

// ─── Session Stats Update ─────────────────────────────────────────────────────

interface StatsUpdateInput {
  sessionId: string;
  distanceFromLastM: number;
  serverSpeedKmh: number;
  timeDeltaSec: number;
  sequence: number;
}

/**
 * Atomically increments session stats after a new point is accepted.
 * Moving segments are defined as server-verified speed > 1 km/h.
 */
export async function updateSessionStats(
  db: Db,
  input: StatsUpdateInput,
): Promise<void> {
  const { sessionId, distanceFromLastM, serverSpeedKmh, timeDeltaSec, sequence } = input;
  const isMoving = serverSpeedKmh > 1;

  // Fetch current session to recalculate weighted average speed
  const session = await db
    .collection('tracker_sessions')
    .findOne({ sessionId });

  if (!session) return;

  const prevMovingTime = session.movingTimeSec ?? 0;
  const newMovingTime = isMoving ? prevMovingTime + timeDeltaSec : prevMovingTime;

  // Weighted average: only include moving segments
  let newAvgSpeedKmh = session.avgSpeedKmh ?? 0;
  if (isMoving && newMovingTime > 0) {
    // Incremental weighted average
    const prevAvg = session.avgSpeedKmh ?? 0;
    const prevCount = session.pointCount ?? 0;
    newAvgSpeedKmh = prevCount > 0
      ? (prevAvg * prevMovingTime + serverSpeedKmh * timeDeltaSec) / newMovingTime
      : serverSpeedKmh;
  }

  await db.collection('tracker_sessions').updateOne(
    { sessionId },
    {
      $inc: {
        totalDistanceM: distanceFromLastM,
        pointCount: 1,
        movingTimeSec: isMoving ? timeDeltaSec : 0,
      },
      $set: {
        avgSpeedKmh: newAvgSpeedKmh,
        lastSequence: sequence,
        updatedAt: new Date(),
      },
    },
  );
}

// ─── Latest State Update ──────────────────────────────────────────────────────

interface LatestStateInput {
  sessionId: string;
  lat: number;
  lng: number;
  speedKmh: number;      // Android instant speed converted
  serverSpeedKmh: number;
  avgSpeedKmh: number;
  totalDistanceM: number;
  accuracyM: number;
  battery: number;
  lastSequence: number;
}

/**
 * Upserts the single 'tracker_latest' document (trackerId: "main").
 * This is the fast-read document consumed by SSR and SSE seed.
 */
export async function updateLatestState(
  db: Db,
  input: LatestStateInput,
): Promise<void> {
  await db.collection('tracker_latest').updateOne(
    { trackerId: 'main' },
    {
      $set: {
        trackerId: 'main',
        sessionId: input.sessionId,
        status: 'live',
        lat: input.lat,
        lng: input.lng,
        speedKmh: input.speedKmh,
        serverSpeedKmh: input.serverSpeedKmh,
        avgSpeedKmh: input.avgSpeedKmh,
        totalDistanceM: input.totalDistanceM,
        accuracyM: input.accuracyM,
        battery: input.battery,
        lastSequence: input.lastSequence,
        lastUpdatedAt: new Date(),
      },
    },
    { upsert: true },
  );
}
