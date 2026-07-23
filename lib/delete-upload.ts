import { unlink } from 'fs/promises';
import { join } from 'path';
import { del } from '@vercel/blob';

/**
 * If the given URL is a locally uploaded file or Vercel Blob,
 * delete it. Silently ignores missing files (already deleted,
 * external URL, or never uploaded locally).
 */
export async function deleteUploadedFile(url: string | undefined | null): Promise<void> {
  if (!url) return;

  // Handle secure Vercel Blob proxy URLs
  if (url.startsWith('/api/vault/view?url=')) {
    try {
      const targetUrl = decodeURIComponent(url.substring('/api/vault/view?url='.length));
      if (targetUrl.includes('blob.vercel-storage.com')) {
        await del(targetUrl);
      }
    } catch (err: any) {
      console.warn('[DELETE_UPLOAD_WARN] Could not delete Vercel Blob file:', url, err?.message);
    }
    return;
  }

  // Only act on our own upload paths — ignore external URLs (Drive, Dropbox, etc.)
  if (!url.startsWith('/uploads/vault/')) return;

  // Strip any leading slash and resolve to the actual filesystem path
  const relativePath = url.replace(/^\//, '');
  const absolutePath = join(process.cwd(), 'public', relativePath);

  try {
    await unlink(absolutePath);
  } catch (err: any) {
    // ENOENT = file already gone; that's fine — log others for observability
    if (err?.code !== 'ENOENT') {
      console.warn('[DELETE_UPLOAD_WARN] Could not delete file:', absolutePath, err?.message);
    }
  }
}
