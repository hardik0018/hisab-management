'use client';

export interface OfflineQueueItem {
  id: string;
  timestamp: number;
  payload: any[];
}

const DB_NAME = 'hisab_offline_db';
const STORE_NAME = 'expense_queue';
const DB_VERSION = 1;

/**
 * Helper to open or initialize the IndexedDB database.
 */
function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this environment'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
}

/**
 * Adds an array of expenses to the offline IndexedDB queue.
 */
export async function queueOfflineExpenses(expenses: any[]): Promise<OfflineQueueItem | null> {
  if (typeof window === 'undefined' || !window.indexedDB) return null;

  try {
    const db = await openDb();
    const item: OfflineQueueItem = {
      id: `offline_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now(),
      payload: expenses,
    };

    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.add(item);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    db.close();
    notifyQueueChange();
    return item;
  } catch (err) {
    console.error('[OFFLINE_QUEUE_ADD_ERROR]', err);
    return null;
  }
}

/**
 * Retrieves all queued offline expense items from IndexedDB.
 */
export async function getQueuedExpenses(): Promise<OfflineQueueItem[]> {
  if (typeof window === 'undefined' || !window.indexedDB) return [];

  try {
    const db = await openDb();
    const items = await new Promise<OfflineQueueItem[]>((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });

    db.close();
    // Sort by oldest first so they get synced in chronological order
    return items.sort((a, b) => a.timestamp - b.timestamp);
  } catch (err) {
    console.error('[OFFLINE_QUEUE_GET_ERROR]', err);
    return [];
  }
}

/**
 * Removes a specific item from the offline queue after successful database sync.
 */
export async function removeQueuedExpense(id: string): Promise<void> {
  if (typeof window === 'undefined' || !window.indexedDB) return;

  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    db.close();
    notifyQueueChange();
  } catch (err) {
    console.error('[OFFLINE_QUEUE_REMOVE_ERROR]', err);
  }
}

/**
 * Returns the current number of pending items in the offline queue.
 */
export async function getOfflineQueueCount(): Promise<number> {
  if (typeof window === 'undefined' || !window.indexedDB) return 0;

  try {
    const db = await openDb();
    const count = await new Promise<number>((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.count();

      request.onsuccess = () => resolve(request.result || 0);
      request.onerror = () => reject(request.error);
    });

    db.close();
    return count;
  } catch (err) {
    console.error('[OFFLINE_QUEUE_COUNT_ERROR]', err);
    return 0;
  }
}

/**
 * Dispatches a custom window event so UI badges update in real-time.
 */
function notifyQueueChange() {
  if (typeof window !== 'undefined') {
    getOfflineQueueCount().then((count) => {
      window.dispatchEvent(
        new CustomEvent('offline-queue-updated', { detail: { count } })
      );
    });
  }
}

/**
 * Iterates through all queued offline items and attempts to sync them to the server.
 */
export async function syncOfflineExpenses(): Promise<{ synced: number; failed: number }> {
  if (typeof window === 'undefined' || !navigator.onLine) {
    return { synced: 0, failed: 0 };
  }

  const items = await getQueuedExpenses();
  if (items.length === 0) {
    return { synced: 0, failed: 0 };
  }

  let synced = 0;
  let failed = 0;

  for (const item of items) {
    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expenses: item.payload }),
      });

      if (res.ok) {
        await removeQueuedExpense(item.id);
        synced++;
      } else {
        const errData = await res.json().catch(() => ({}));
        console.error(`[OFFLINE_SYNC_FAILED] Item ${item.id}:`, errData);
        failed++;
      }
    } catch (err) {
      console.error(`[OFFLINE_SYNC_NETWORK_ERROR] Item ${item.id}:`, err);
      failed++;
    }
  }

  if (synced > 0) {
    notifyQueueChange();
  }

  return { synced, failed };
}
