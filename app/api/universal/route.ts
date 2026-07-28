export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { getDb } from '@/lib/db';
import clientPromise from '@/lib/mongodb-promise';
import { v4 as uuidv4 } from 'uuid';
import { validateInsurance } from '@/models/InsurancePolicy';
import { validateWarranty, computeExpiryDate } from '@/models/Warranty';
import { passwordsCol } from '@/models/PasswordEntry';
import { encryptPassword, hashForAudit } from '@/lib/vaultCrypto';
import { revalidatePath } from 'next/cache';
import type {
  UniversalParsedItem,
  ParsedHisab,
  ParsedInsurance,
  ParsedWarranty,
  ParsedPassword,
  ParsedExpenseItem,
} from '@/lib/universal-parser';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function today(): string {
  return new Date().toISOString().split('T')[0];
}

// ─── Per-kind savers ─────────────────────────────────────────────────────────

async function saveHisab(item: ParsedHisab, spaceId: string, userId: string) {
  const db = await getDb();
  const client = await clientPromise;
  const session = client.startSession();
  const hisabId = `hsb_${uuidv4().split('-')[0]}`;

  const existingIgnored = await db.collection('hisab').findOne({
    space_id: spaceId, name: item.name, ignored: true,
  });

  const record = {
    hisab_id: hisabId,
    user_id: userId,
    space_id: spaceId,
    name: item.name,
    mobile: '',
    type: item.type,
    amount: item.amount,
    description: item.description || '',
    date: item.date ? new Date(item.date) : new Date(),
    created_at: new Date(),
    log_as_expense: item.logAsExpense,
    ignored: !!existingIgnored,
  };

  try {
    await session.withTransaction(async () => {
      await db.collection('hisab').insertOne(record, { session });

      if (item.logAsExpense && !record.ignored) {
        const dateObj = new Date(item.date || today());
        const dateStr = dateObj.toISOString().slice(0, 10);
        await db.collection('expenses').insertOne({
          space_id: spaceId,
          user_id: userId,
          date: dateStr,
          itemName: `Hisab: ${item.name}`,
          amount: item.type === 'credit' ? -item.amount : item.amount,
          note: item.description || '',
          category: 'Transfers & Settlements',
          currency: 'INR',
          associatedId: hisabId,
          associatedType: 'hisab',
          createdAt: new Date(),
          updatedAt: new Date(),
        }, { session });
      }
    });
  } finally {
    await session.endSession();
  }

  revalidatePath('/hisab', 'layout');
  revalidatePath('/expenses', 'layout');
  return { kind: 'hisab', name: item.name };
}

async function saveInsurance(item: ParsedInsurance, spaceId: string, userId: string) {
  const db = await getDb();
  const now = new Date();

  const doc = {
    space_id: spaceId,
    user_id: userId,
    policyName: item.policyName,
    provider: item.provider,
    policyNumber: item.policyNumber,
    category: 'other' as const,
    holderName: item.holderName,
    nominee: '',
    premiumAmount: item.premiumAmount,
    premiumFrequency: item.premiumFrequency,
    startDate: item.startDate || today(),
    nextDueDate: item.nextDueDate || today(),
    attachmentUrl: '',
    notes: item.notes || '',
    createdAt: now,
    updatedAt: now,
  };

  const v = validateInsurance(doc);
  if (!v.isValid) throw new Error(v.reason);

  await db.collection('insurance_policies').insertOne(doc as any);
  revalidatePath('/vault', 'layout');
  return { kind: 'insurance', policyName: item.policyName };
}

async function saveWarranty(item: ParsedWarranty, spaceId: string, userId: string) {
  const db = await getDb();
  const now = new Date();

  const expiryDate = item.expiryDate || computeExpiryDate(item.purchaseDate, item.warrantyMonths);

  const doc = {
    space_id: spaceId,
    user_id: userId,
    itemName: item.itemName,
    brand: item.brand || '',
    modelNumber: '',
    serialNumber: '',
    category: 'other' as const,
    vendor: '',
    purchaseDate: item.purchaseDate,
    warrantyMonths: item.warrantyMonths,
    expiryDate,
    invoiceUrl: '',
    warrantyCardUrl: '',
    notes: item.notes || '',
    createdAt: now,
    updatedAt: now,
  };

  const v = validateWarranty(doc);
  if (!v.isValid) throw new Error(v.reason);

  await db.collection('warranties').insertOne(doc as any);
  revalidatePath('/vault', 'layout');
  return { kind: 'warranty', itemName: item.itemName };
}

async function savePassword(item: ParsedPassword, userId: string) {
  const col = await passwordsCol();
  const now = new Date();
  const ciphertext = encryptPassword(item.password);
  const hash = hashForAudit(item.password);

  await col.insertOne({
    user_id: userId,
    space_id: null,
    title: item.title.slice(0, 120),
    username: item.username.slice(0, 200),
    website: item.website ? item.website.slice(0, 300) : undefined,
    category: 'Other',
    notes: item.notes ? item.notes.slice(0, 2000) : undefined,
    favorite: false,
    password_ciphertext: ciphertext,
    password_hash: hash,
    password_length: item.password.length,
    created_at: now,
    updated_at: now,
  } as any);

  return { kind: 'password', title: item.title };
}

async function saveExpense(item: ParsedExpenseItem, spaceId: string, userId: string) {
  const db = await getDb();
  const now = new Date();

  await db.collection('expenses').insertOne({
    space_id: spaceId,
    user_id: userId,
    date: item.date,
    itemName: item.itemName,
    amount: item.amount,
    note: item.note || '',
    type: 'expense',
    currency: 'INR',
    createdAt: now,
    updatedAt: now,
  } as any);

  revalidatePath('/expenses', 'layout');
  return { kind: 'expense', itemName: item.itemName };
}

// ─── Route handler ────────────────────────────────────────────────────────────

/**
 * POST /api/universal
 * Body: { items: UniversalParsedItem[] }
 * Saves each item to its appropriate collection.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const items: UniversalParsedItem[] = body.items ?? [];

    if (!Array.isArray(items) || items.length === 0) {
      return Response.json({ error: 'No items to save' }, { status: 400 });
    }

    const spaceId = user.space_id || user.user_id;
    const userId = user.user_id;

    const results: { success: boolean; kind: string; label: string; error?: string }[] = [];

    for (const item of items) {
      try {
        if (item.kind === 'hisab') {
          const r = await saveHisab(item, spaceId, userId);
          results.push({ success: true, kind: 'hisab', label: r.name });
        } else if (item.kind === 'insurance') {
          const r = await saveInsurance(item, spaceId, userId);
          results.push({ success: true, kind: 'insurance', label: r.policyName });
        } else if (item.kind === 'warranty') {
          const r = await saveWarranty(item, spaceId, userId);
          results.push({ success: true, kind: 'warranty', label: r.itemName });
        } else if (item.kind === 'password') {
          const r = await savePassword(item, userId);
          results.push({ success: true, kind: 'password', label: r.title });
        } else if (item.kind === 'expense') {
          const r = await saveExpense(item, spaceId, userId);
          results.push({ success: true, kind: 'expense', label: r.itemName });
        }
      } catch (err: any) {
        results.push({
          success: false,
          kind: (item as any).kind ?? 'unknown',
          label: (item as any).itemName ?? (item as any).name ?? (item as any).policyName ?? (item as any).title ?? '?',
          error: err?.message ?? 'Unknown error',
        });
      }
    }

    const succeeded = results.filter(r => r.success).length;
    const failed    = results.filter(r => !r.success).length;

    return Response.json({ results, succeeded, failed }, { status: 200 });
  } catch (error) {
    console.error('[API_UNIVERSAL_POST_ERROR]', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
