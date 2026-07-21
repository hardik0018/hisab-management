export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';
import { validateWarranty, computeExpiryDate } from '@/models/Warranty';
import { Warranty } from '@/types/vault';
import { revalidatePath } from 'next/cache';

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const db = await getDb();
    const spaceId = user.space_id || user.user_id;
    const items = await db.collection('warranties')
      .find({ space_id: spaceId })
      .sort({ expiryDate: 1 })
      .toArray();

    return Response.json({ items });
  } catch (err) {
    console.error('[API_WARRANTY_GET_ERROR]', err);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const spaceId = user.space_id || user.user_id;
    const now = new Date();
    const expiryDate = body.expiryDate || computeExpiryDate(body.purchaseDate, Number(body.warrantyMonths));

    const doc: Partial<Warranty> = {
      space_id: spaceId,
      user_id: user.user_id,
      itemName: body.itemName?.trim(),
      brand: body.brand?.trim() || '',
      modelNumber: body.modelNumber?.trim() || '',
      serialNumber: body.serialNumber?.trim() || '',
      category: body.category || 'other',
      vendor: body.vendor?.trim() || '',
      purchaseDate: body.purchaseDate,
      purchaseAmount: body.purchaseAmount ? Number(body.purchaseAmount) : undefined,
      warrantyMonths: Number(body.warrantyMonths),
      expiryDate,
      invoiceUrl: body.invoiceUrl?.trim() || '',
      warrantyCardUrl: body.warrantyCardUrl?.trim() || '',
      notes: body.notes?.trim() || '',
    };

    const v = validateWarranty(doc);
    if (!v.isValid) return Response.json({ error: 'Validation Error', message: v.reason }, { status: 400 });

    const db = await getDb();
    const result = await db.collection('warranties').insertOne({
      ...doc, createdAt: now, updatedAt: now,
    } as any);

    revalidatePath('/vault', 'layout');
    return Response.json({ success: true, id: result.insertedId.toString() }, { status: 201 });
  } catch (err) {
    console.error('[API_WARRANTY_POST_ERROR]', err);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
