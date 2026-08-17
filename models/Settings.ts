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
      _id: result.insertedId.toString(),
      space_id: spaceId,
      ...DEFAULT_SETTINGS,
      createdAt: newSettings.createdAt.toISOString(),
      updatedAt: newSettings.updatedAt.toISOString(),
    };
  }

  return {
    _id: settings._id ? settings._id.toString() : undefined,
    space_id: settings.space_id || spaceId,
    currency: settings.currency || 'INR',
    largeAmountLimit: settings.largeAmountLimit !== undefined ? settings.largeAmountLimit : 10000,
    lastBackupAt: settings.lastBackupAt || null,
    backupReminder: settings.backupReminder || {
      enabled: true,
      frequency: 'monthly',
      display: 'inside-app',
    },
    createdAt: settings.createdAt instanceof Date ? settings.createdAt.toISOString() : (settings.createdAt ? String(settings.createdAt) : undefined),
    updatedAt: settings.updatedAt instanceof Date ? settings.updatedAt.toISOString() : (settings.updatedAt ? String(settings.updatedAt) : undefined),
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
  
  const updatedAt = new Date();
  setObj.updatedAt = updatedAt;

  await db.collection('settings').updateOne(
    { space_id: spaceId },
    { $set: setObj }
  );

  return {
    ...current,
    ...updates,
    _id: current._id?.toString(),
    updatedAt: updatedAt.toISOString(),
  };
}
