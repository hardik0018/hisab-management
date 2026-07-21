export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { ObjectId } from 'mongodb';
import { getDb } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';
import { validateInsurance } from '@/models/InsurancePolicy';
import { revalidatePath } from 'next/cache';

export async function PUT(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const user = await getAuthenticatedUser();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (!ObjectId.isValid(params.id)) return Response.json({ error: 'Invalid ID' }, { status: 400 });

    const body = await request.json();
    const v = validateInsurance(body);
    if (!v.isValid) return Response.json({ error: 'Validation Error', message: v.reason }, { status: 400 });

    const db = await getDb();
    const spaceId = user.space_id || user.user_id;

    const { _id, space_id, user_id, createdAt, ...update } = body;
    const result = await db.collection('insurance_policies').updateOne(
      { _id: new ObjectId(params.id), space_id: spaceId },
      { $set: { ...update, updatedAt: new Date() } }
    );

    if (result.matchedCount === 0) return Response.json({ error: 'Not Found' }, { status: 404 });
    revalidatePath('/vault', 'layout');
    return Response.json({ success: true });
  } catch (err) {
    console.error('[API_INSURANCE_PUT_ERROR]', err);
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

    const result = await db.collection('insurance_policies')
      .deleteOne({ _id: new ObjectId(params.id), space_id: spaceId });

    if (result.deletedCount === 0) return Response.json({ error: 'Not Found' }, { status: 404 });
    revalidatePath('/vault', 'layout');
    return Response.json({ success: true });
  } catch (err) {
    console.error('[API_INSURANCE_DELETE_ERROR]', err);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
