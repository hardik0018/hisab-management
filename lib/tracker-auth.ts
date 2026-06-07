/**
 * tracker-auth.ts
 * Bearer token validation for Android tracker API routes.
 * Uses TRACKER_API_TOKEN environment variable (server-only).
 * Do NOT import this file in any Client Component.
 */

import { NextRequest } from 'next/server';

/** Standard error response for invalid / missing tracker token */
export const UNAUTHORIZED_RESPONSE = {
  success: false,
  message: 'Invalid tracker token',
  error: 'UNAUTHORIZED',
} as const;

/**
 * Validates the `Authorization: Bearer <token>` header against
 * the TRACKER_API_TOKEN environment variable.
 *
 * @returns true if token is valid, false otherwise
 */
export function validateTrackerToken(request: NextRequest): boolean {
  const token = process.env.TRACKER_API_TOKEN;

  if (!token) {
    console.error('[TRACKER_AUTH] TRACKER_API_TOKEN env variable is not set');
    return false;
  }

  const authHeader = request.headers.get('authorization') ?? '';

  if (!authHeader.startsWith('Bearer ')) {
    return false;
  }

  const providedToken = authHeader.slice(7).trim();
  return providedToken === token;
}

/** Helper: returns a 401 Response with standard error body */
export function unauthorizedResponse(): Response {
  return Response.json(UNAUTHORIZED_RESPONSE, { status: 401 });
}

/** Helper: returns a 400 Response with a validation error message */
export function badRequestResponse(message: string, field?: string): Response {
  return Response.json(
    {
      success: false,
      message,
      error: 'VALIDATION_ERROR',
      ...(field ? { field } : {}),
    },
    { status: 400 },
  );
}

/** Helper: returns a 404 Response */
export function notFoundResponse(message: string): Response {
  return Response.json(
    { success: false, message, error: 'NOT_FOUND' },
    { status: 404 },
  );
}

/** Helper: returns a 409 Conflict Response */
export function conflictResponse(message: string): Response {
  return Response.json(
    { success: false, message, error: 'CONFLICT' },
    { status: 409 },
  );
}

/** Helper: returns a 500 Response */
export function serverErrorResponse(message = 'Internal server error'): Response {
  return Response.json(
    { success: false, message, error: 'SERVER_ERROR' },
    { status: 500 },
  );
}

/** Helper: returns a 200 success Response */
export function successResponse(message: string, data: unknown = {}): Response {
  return Response.json({ success: true, message, data }, { status: 200 });
}

/** Helper: returns a 201 created Response */
export function createdResponse(message: string, data: unknown = {}): Response {
  return Response.json({ success: true, message, data }, { status: 201 });
}

// ─── Location Payload Validation ─────────────────────────────────────────────

export interface LocationPayload {
  sessionId: string;
  sequence: number;
  lat: number;
  lng: number;
  speedMps: number;
  accuracyM: number;
  battery: number;
  deviceTimestamp: number;
}

const MAX_ACCURACY_M = 50;
const MAX_TIMESTAMP_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Validates a single location payload object.
 * Returns null on success, or an error message string on failure.
 */
export function validateLocationPayload(
  payload: unknown,
): { valid: true; data: LocationPayload } | { valid: false; message: string } {
  if (!payload || typeof payload !== 'object') {
    return { valid: false, message: 'Payload must be a JSON object' };
  }

  const p = payload as Record<string, unknown>;

  if (!p.sessionId || typeof p.sessionId !== 'string' || p.sessionId.trim() === '') {
    return { valid: false, message: 'sessionId is required and must be a string' };
  }

  if (!Number.isInteger(p.sequence) || (p.sequence as number) < 0) {
    return { valid: false, message: 'sequence must be a non-negative integer' };
  }

  const lat = Number(p.lat);
  if (!isFinite(lat) || lat < -90 || lat > 90) {
    return { valid: false, message: 'lat must be a valid number between -90 and 90' };
  }

  const lng = Number(p.lng);
  if (!isFinite(lng) || lng < -180 || lng > 180) {
    return { valid: false, message: 'lng must be a valid number between -180 and 180' };
  }

  const speedMps = Number(p.speedMps);
  if (!isFinite(speedMps) || speedMps < 0) {
    return { valid: false, message: 'speedMps must be a non-negative number' };
  }

  const accuracyM = Number(p.accuracyM);
  if (!isFinite(accuracyM) || accuracyM < 0) {
    return { valid: false, message: 'accuracyM must be a non-negative number' };
  }
  if (accuracyM > MAX_ACCURACY_M) {
    return {
      valid: false,
      message: `GPS accuracy too low (${accuracyM}m > ${MAX_ACCURACY_M}m threshold). Point rejected.`,
    };
  }

  const battery = Number(p.battery);
  if (!isFinite(battery) || battery < 0 || battery > 100) {
    return { valid: false, message: 'battery must be a number between 0 and 100' };
  }

  const deviceTimestamp = Number(p.deviceTimestamp);
  if (!isFinite(deviceTimestamp) || deviceTimestamp <= 0) {
    return { valid: false, message: 'deviceTimestamp must be a valid Unix epoch in milliseconds' };
  }

  const now = Date.now();
  if (deviceTimestamp > now + 60_000) {
    // Allow 60s clock skew tolerance
    return { valid: false, message: 'deviceTimestamp is in the future' };
  }
  if (now - deviceTimestamp > MAX_TIMESTAMP_AGE_MS) {
    return { valid: false, message: 'deviceTimestamp is too old (> 24 hours)' };
  }

  return {
    valid: true,
    data: {
      sessionId: p.sessionId as string,
      sequence: p.sequence as number,
      lat,
      lng,
      speedMps,
      accuracyM,
      battery,
      deviceTimestamp,
    },
  };
}
