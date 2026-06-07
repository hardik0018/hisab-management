/**
 * GET /api/tracker/stream
 * SSE (Server-Sent Events) endpoint for live tracker updates.
 *
 * - Sends tracker:latest immediately on connect as seed data
 * - Sends tracker:heartbeat every 20 seconds to keep connection alive
 * - Broadcasts tracker:point, tracker:session-started, tracker:session-stopped
 *   from POST handlers via the in-memory SSE registry
 *
 * NOTE: Requires a persistent Node.js process (Railway, Render, Docker, VPS).
 * Will NOT work correctly on Vercel Serverless/Edge due to request isolation.
 */

import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { addSSEClient, removeSSEClient, formatSSEMessage } from '@/lib/tracker-sse';

const HEARTBEAT_INTERVAL_MS = 20_000;

export async function GET(_request: NextRequest): Promise<Response> {
  // Fetch current latest state to seed the new client immediately
  let seedData: Record<string, unknown> | null = null;
  try {
    const db = await getDb();
    const doc = await db
      .collection('tracker_latest')
      .findOne({ trackerId: 'main' }, { projection: { _id: 0 } });
    seedData = doc ? (doc as Record<string, unknown>) : null;
  } catch (err) {
    console.error('[TRACKER/STREAM] Failed to fetch seed data:', err);
  }

  const encoder = new TextEncoder();
  let heartbeatTimer: ReturnType<typeof setInterval> | null = null;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      // 1. Register this client in the SSE registry
      addSSEClient(controller);

      // 2. Send current tracker state as immediate seed
      try {
        controller.enqueue(formatSSEMessage('tracker:latest', seedData));
      } catch {
        removeSSEClient(controller);
        return;
      }

      // 3. Heartbeat keeps the HTTP connection alive through proxies / load balancers
      heartbeatTimer = setInterval(() => {
        try {
          controller.enqueue(
            encoder.encode(
              `event: tracker:heartbeat\ndata: ${JSON.stringify({ ts: Date.now() })}\n\n`,
            ),
          );
        } catch {
          // Connection dropped mid-heartbeat — clean up
          if (heartbeatTimer) {
            clearInterval(heartbeatTimer);
            heartbeatTimer = null;
          }
          removeSSEClient(controller);
        }
      }, HEARTBEAT_INTERVAL_MS);
    },

    cancel() {
      // Called when the client closes the connection
      if (heartbeatTimer) {
        clearInterval(heartbeatTimer);
        heartbeatTimer = null;
      }
      // Note: we can't remove the specific controller here because the cancel
      // callback doesn't receive the controller reference. Broken controllers
      // are cleaned up lazily in broadcastSSE() when enqueue throws.
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable Nginx buffering for streaming
    },
  });
}
