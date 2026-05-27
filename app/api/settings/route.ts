export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { getSystemSettings, updateSystemSettings } from '@/models/Settings';
import { getAuthenticatedUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized', message: 'You must be logged in' }, { status: 401 });
    }

    const spaceId = user.space_id || user.user_id;
    const settings = await getSystemSettings(spaceId);
    return Response.json({ settings });
  } catch (error) {
    console.error('[API_SETTINGS_GET_ERROR]', error);
    return Response.json(
      { error: 'Internal Server Error', message: 'Failed to retrieve settings' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized', message: 'You must be logged in' }, { status: 401 });
    }

    const body = await request.json();
    const { largeAmountLimit, lastBackupAt, backupReminder } = body;

    const updates: any = {};
    if (largeAmountLimit !== undefined) updates.largeAmountLimit = Number(largeAmountLimit);
    if (lastBackupAt !== undefined) updates.lastBackupAt = lastBackupAt;
    if (backupReminder !== undefined) updates.backupReminder = backupReminder;

    const spaceId = user.space_id || user.user_id;
    const settings = await updateSystemSettings(spaceId, updates);
    return Response.json({ settings });
  } catch (error) {
    console.error('[API_SETTINGS_PATCH_ERROR]', error);
    return Response.json(
      { error: 'Internal Server Error', message: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
