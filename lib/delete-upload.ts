import { unlink } from 'fs/promises';
import { join } from 'path';

/**
 * If the given URL is a locally uploaded file under /uploads/vault/,
 * delete it from disk. Silently ignores missing files (already deleted,
 * external URL, or never uploaded locally).
 */
export async function deleteUploadedFile(url: string | undefined | null): Promise<void> {
  if (!url) return;

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
