export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { updateSystemSettings } from '@/models/Settings';
import { getAuthenticatedUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized', message: 'You must be logged in' }, { status: 401 });
    }

    const db = await getDb();
    const spaceId = user.space_id || user.user_id;
    const spaceIds = [user.space_id, user.user_id].filter(Boolean);

    const [
      expenses,
      hisab,
      recurring,
      insurance,
      warranties,
      marriage,
      passwords,
      settings
    ] = await Promise.all([
      db.collection('expenses').find({ space_id: { $in: spaceIds } }, { projection: { _id: 0 } }).toArray(),
      db.collection('hisab').find({ space_id: { $in: spaceIds } }, { projection: { _id: 0 } }).toArray(),
      db.collection('recurring_expenses').find({ space_id: { $in: spaceIds } }, { projection: { _id: 0 } }).toArray(),
      db.collection('insurance_policies').find({ space_id: { $in: spaceIds } }, { projection: { _id: 0 } }).toArray(),
      db.collection('warranties').find({ space_id: { $in: spaceIds } }, { projection: { _id: 0 } }).toArray(),
      db.collection('marriage').find({ space_id: { $in: spaceIds } }, { projection: { _id: 0 } }).toArray(),
      db.collection('passwords').find({ space_id: { $in: spaceIds } }, { projection: { _id: 0, encrypted_password: 0 } }).toArray(),
      db.collection('settings').findOne({ space_id: { $in: spaceIds } }, { projection: { _id: 0 } }),
    ]);

    const backupTimestamp = new Date().toISOString();

    // Update settings lastBackupAt
    await updateSystemSettings(spaceId, {
      lastBackupAt: backupTimestamp,
    });

    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const filename = `hisab-backup-${yyyy}-${mm}-${dd}`;

    const backupData = {
      version: '1.0',
      exported_at: backupTimestamp,
      space_id: spaceId,
      user_email: user.email,
      summary: {
        total_expenses: expenses.length,
        total_hisab_records: hisab.length,
        total_recurring: recurring.length,
        total_insurance: insurance.length,
        total_warranties: warranties.length,
        total_marriage_records: marriage.length,
        total_vault_items: passwords.length,
      },
      data: {
        expenses,
        hisab,
        recurring,
        insurance,
        warranties,
        marriage,
        passwords,
        settings,
      },
    };

    return new Response(JSON.stringify(backupData, null, 2), {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}.json"`,
      },
    });
  } catch (error) {
    console.error('[API_BACKUP_ERROR]', error);
    return Response.json(
      { error: 'Internal Server Error', message: 'Failed to generate backup' },
      { status: 500 }
    );
  }
}
