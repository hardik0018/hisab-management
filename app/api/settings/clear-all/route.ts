export const dynamic = 'force-dynamic';

import { getDb } from '@/lib/db';
import { updateSystemSettings } from '@/models/Settings';
import { getAuthenticatedUser } from '@/lib/auth';

export async function DELETE() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized', message: 'You must be logged in' }, { status: 401 });
    }

    const db = await getDb();
    const spaceId = user.space_id || user.user_id;

    // 1. Delete all expenses in the active space only
    await db.collection('expenses').deleteMany({ space_id: spaceId });

    // 2. Reset settings for this space
    await updateSystemSettings(spaceId, {
      largeAmountLimit: 10000,
      lastBackupAt: null,
      backupReminder: {
        enabled: true,
        frequency: 'monthly',
        display: 'inside-app'
      }
    });

    return Response.json({ success: true, message: 'Space expense records cleared and settings reset successfully.' });
  } catch (error) {
    console.error('[API_SETTINGS_CLEAR_ALL_ERROR]', error);
    return Response.json(
      { error: 'Internal Server Error', message: 'Failed to clear space data' },
      { status: 500 }
    );
  }
}
