import { NextRequest } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { get } from '@vercel/blob';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const fileUrl = searchParams.get('url');

    if (!fileUrl) {
      return Response.json({ error: 'Missing url parameter' }, { status: 400 });
    }

    // ── Security checks ──────────────────────────────────────────────────────
    let targetUrl: URL;
    try {
      targetUrl = new URL(fileUrl);
    } catch {
      return Response.json({ error: 'Invalid URL' }, { status: 400 });
    }

    // Restrict requests only to Vercel Blob storage
    if (!targetUrl.hostname.endsWith('blob.vercel-storage.com')) {
      return Response.json({ error: 'Forbidden URL host' }, { status: 403 });
    }

    // Restrict access only to the user's own space folder
    const spaceId = user.space_id || user.user_id;
    const safeSpaceId = spaceId.replace(/[^a-zA-Z0-9_-]/g, '_');
    const requiredPathPrefix = `/vault/${safeSpaceId}/`;

    if (!targetUrl.pathname.includes(requiredPathPrefix)) {
      return Response.json({ error: 'Unauthorized access to this file' }, { status: 403 });
    }

    // ── Fetch and Stream file ────────────────────────────────────────────────
    const result = await get(fileUrl, { access: 'private' });
    if (!result || result.statusCode !== 200) {
      return Response.json({ error: 'File not found' }, { status: 404 });
    }

    const headers = new Headers();
    if (result.blob.contentType) {
      headers.set('Content-Type', result.blob.contentType);
    }
    headers.set('Content-Length', result.blob.size.toString());
    headers.set('Content-Disposition', 'inline');
    headers.set('Cache-Control', 'private, max-age=3600');
    headers.set('X-Frame-Options', 'SAMEORIGIN');
    headers.set('Content-Security-Policy', "frame-ancestors 'self'");

    return new Response(result.stream, {
      status: 200,
      headers,
    });
  } catch (err) {
    console.error('[API_VAULT_VIEW_ERROR]', err);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
