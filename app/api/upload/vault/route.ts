export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { put } from '@vercel/blob';
import { v4 as uuidv4 } from 'uuid';

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
]);

const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'application/pdf': '.pdf',
};

export async function POST(request: NextRequest) {
  try {
    // ── Auth check ──────────────────────────────────────────────────────────
    const user = await getAuthenticatedUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const spaceId = user.space_id || user.user_id;

    // ── Parse multipart form ────────────────────────────────────────────────
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return Response.json({ error: 'Invalid multipart form data' }, { status: 400 });
    }

    const file = formData.get('file');
    if (!file || typeof file === 'string') {
      return Response.json({ error: 'No file provided' }, { status: 400 });
    }

    // ── Validate MIME type ──────────────────────────────────────────────────
    const mimeType = file.type;
    if (!ALLOWED_MIME_TYPES.has(mimeType)) {
      return Response.json(
        { error: 'Unsupported file type. Allowed: JPEG, PNG, WEBP, GIF, PDF.' },
        { status: 415 }
      );
    }

    // ── Validate file size ──────────────────────────────────────────────────
    const arrayBuffer = await file.arrayBuffer();
    if (arrayBuffer.byteLength > MAX_SIZE_BYTES) {
      return Response.json(
        { error: 'File too large. Maximum allowed size is 5 MB.' },
        { status: 413 }
      );
    }

    // ── Build path and upload to Vercel Blob ──────────────────────────────────
    const safeSpaceId = spaceId.replace(/[^a-zA-Z0-9_-]/g, '_');
    const ext = MIME_TO_EXT[mimeType] ?? '.bin';
    const filename = `vault/${safeSpaceId}/${uuidv4()}${ext}`;

    const blob = await put(filename, arrayBuffer, {
      access: 'private',
      contentType: mimeType,
    });

    const proxyUrl = `/api/vault/view?url=${encodeURIComponent(blob.url)}`;
    return Response.json({ url: proxyUrl }, { status: 201 });
  } catch (err) {
    console.error('[API_UPLOAD_VAULT_ERROR]', err);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
