import { getDb } from '@/lib/db';
import { Settings } from '@/types';
import { ObjectId } from 'mongodb';

const DEFAULT_SETTINGS = {
  currency: 'INR',
  largeAmountLimit: 10000,
  lastBackupAt: null,
  backupReminder: {
    enabled: true,
    frequency: 'monthly' as const,
    display: 'inside-app' as const,
  },
};

export async function getSystemSettings(spaceId: string): Promise<Settings> {
  const db = await getDb();
  let settings = await db.collection('settings').findOne({ space_id: spaceId });
  
  if (!settings) {
    const newSettings = {
      space_id: spaceId,
      ...DEFAULT_SETTINGS,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const result = await db.collection('settings').insertOne(newSettings as any);
    return {
      _id: result.insertedId,
      space_id: spaceId,
      ...DEFAULT_SETTINGS,
    };
  }

  return {
    _id: settings._id,
    space_id: settings.space_id || spaceId,
    currency: settings.currency || 'INR',
    largeAmountLimit: settings.largeAmountLimit !== undefined ? settings.largeAmountLimit : 10000,
    lastBackupAt: settings.lastBackupAt || null,
    backupReminder: settings.backupReminder || {
      enabled: true,
      frequency: 'monthly',
      display: 'inside-app',
    },
    createdAt: settings.createdAt,
    updatedAt: settings.updatedAt,
  };
}

export async function updateSystemSettings(spaceId: string, updates: Partial<Settings>): Promise<Settings> {
  const db = await getDb();
  const current = await getSystemSettings(spaceId);
  
  const setObj: any = {};
  if (updates.currency !== undefined) setObj.currency = updates.currency;
  if (updates.largeAmountLimit !== undefined) setObj.largeAmountLimit = updates.largeAmountLimit;
  if (updates.lastBackupAt !== undefined) setObj.lastBackupAt = updates.lastBackupAt;
  if (updates.backupReminder !== undefined) {
    setObj.backupReminder = {
      ...current.backupReminder,
      ...updates.backupReminder,
    };
  }
  
  setObj.updatedAt = new Date();

  await db.collection('settings').updateOne(
    { _id: new ObjectId(current._id as any) },
    { $set: setObj }
  );

  return {
    ...current,
    ...updates,
  };
}
