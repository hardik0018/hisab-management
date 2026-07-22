export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { ObjectId } from 'mongodb';
import { getDb } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';
import { validateWarranty, computeExpiryDate } from '@/models/Warranty';
import { revalidatePath } from 'next/cache';
import { deleteUploadedFile } from '@/lib/delete-upload';

export async function PUT(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const user = await getAuthenticatedUser();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (!ObjectId.isValid(params.id)) return Response.json({ error: 'Invalid ID' }, { status: 400 });

    const body = await request.json();
    if (body.purchaseDate && body.warrantyMonths && !body.expiryDate) {
      body.expiryDate = computeExpiryDate(body.purchaseDate, Number(body.warrantyMonths));
    }
    const v = validateWarranty(body);
    if (!v.isValid) return Response.json({ error: 'Validation Error', message: v.reason }, { status: 400 });

    const db = await getDb();
    const spaceId = user.space_id || user.user_id;

    // Fetch existing record so we can clean up replaced uploaded files
    const existing = await db.collection('warranties')
      .findOne({ _id: new ObjectId(params.id), space_id: spaceId });

    if (!existing) return Response.json({ error: 'Not Found' }, { status: 404 });

    // Delete old local uploads if the URLs changed
    const oldInvoice: string = existing.invoiceUrl || '';
    const newInvoice: string = body.invoiceUrl?.trim() || '';
    const oldCard: string = existing.warrantyCardUrl || '';
    const newCard: string = body.warrantyCardUrl?.trim() || '';

    await Promise.all([
      oldInvoice !== newInvoice ? deleteUploadedFile(oldInvoice) : Promise.resolve(),
      oldCard !== newCard ? deleteUploadedFile(oldCard) : Promise.resolve(),
    ]);

    const { _id, space_id, user_id, createdAt, ...update } = body;
    await db.collection('warranties').updateOne(
      { _id: new ObjectId(params.id), space_id: spaceId },
      { $set: { ...update, updatedAt: new Date() } }
    );

    revalidatePath('/vault', 'layout');
    return Response.json({ success: true });
  } catch (err) {
    console.error('[API_WARRANTY_PUT_ERROR]', err);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const user = await getAuthenticatedUser();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (!ObjectId.isValid(params.id)) return Response.json({ error: 'Invalid ID' }, { status: 400 });

    const db = await getDb();
    const spaceId = user.space_id || user.user_id;

    // Fetch the record first so we can clean up any uploaded files
    const existing = await db.collection('warranties')
      .findOne({ _id: new ObjectId(params.id), space_id: spaceId });

    if (!existing) return Response.json({ error: 'Not Found' }, { status: 404 });

    // Delete both locally uploaded files (no-op if external URLs or missing)
    await Promise.all([
      deleteUploadedFile(existing.invoiceUrl),
      deleteUploadedFile(existing.warrantyCardUrl),
    ]);

    await db.collection('warranties')
      .deleteOne({ _id: new ObjectId(params.id), space_id: spaceId });

    revalidatePath('/vault', 'layout');
    return Response.json({ success: true });
  } catch (err) {
    console.error('[API_WARRANTY_DELETE_ERROR]', err);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
