/**
 * tracker-sse.ts
 * Server-only in-memory SSE (Server-Sent Events) registry.
 *
 * IMPORTANT: This works in persistent Node.js environments (Railway, Render,
 * self-hosted Docker). On Vercel Serverless/Edge each request is isolated —
 * broadcasts will NOT reach other connections. Use a hosted process for SSE.
 *
 * Do NOT import this file in any Client Component.
 */

type SSEController = ReadableStreamDefaultController<Uint8Array>;

// Module-level singleton — survives across requests in a single Node process
const sseClients = new Set<SSEController>();

/**
 * Registers a new SSE client controller.
 */
export function addSSEClient(ctrl: SSEController): void {
  sseClients.add(ctrl);
}

/**
 * Removes a client controller (call on disconnect / error).
 */
export function removeSSEClient(ctrl: SSEController): void {
  sseClients.delete(ctrl);
}

/**
 * Returns current count of connected SSE clients (for debugging).
 */
export function getSSEClientCount(): number {
  return sseClients.size;
}

/**
 * Formats and broadcasts an SSE event to all connected clients.
 * Broken controllers are silently removed from the registry.
 *
 * @param eventType - The SSE event name (e.g. "tracker:point")
 * @param data      - JSON-serialisable payload
 */
export function broadcastSSE(eventType: string, data: unknown): void {
  if (sseClients.size === 0) return;

  const encoder = new TextEncoder();
  const message = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
  const encoded = encoder.encode(message);

  const broken: SSEController[] = [];

  for (const ctrl of sseClients) {
    try {
      ctrl.enqueue(encoded);
    } catch {
      // Controller is closed / errored — mark for removal
      broken.push(ctrl);
    }
  }

  for (const ctrl of broken) {
    sseClients.delete(ctrl);
  }
}

/**
 * Formats a single SSE message string.
 * Useful for the initial seed sent when a client connects.
 */
export function formatSSEMessage(eventType: string, data: unknown): Uint8Array {
  const encoder = new TextEncoder();
  return encoder.encode(`event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`);
}
