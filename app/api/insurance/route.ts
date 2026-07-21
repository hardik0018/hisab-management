export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';
import { validateInsurance } from '@/models/InsurancePolicy';
import { InsurancePolicy } from '@/types/vault';
import { revalidatePath } from 'next/cache';

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const db = await getDb();
    const spaceId = user.space_id || user.user_id;
    const items = await db.collection('insurance_policies')
      .find({ space_id: spaceId })
      .sort({ nextDueDate: 1 })
      .toArray();

    return Response.json({ items });
  } catch (err) {
    console.error('[API_INSURANCE_GET_ERROR]', err);
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

    const doc: Partial<InsurancePolicy> = {
      space_id: spaceId,
      user_id: user.user_id,
      policyName: body.policyName?.trim(),
      provider: body.provider?.trim(),
      policyNumber: body.policyNumber?.trim(),
      category: body.category || 'other',
      holderName: body.holderName?.trim(),
      nominee: body.nominee?.trim() || '',
      premiumAmount: Number(body.premiumAmount),
      premiumFrequency: body.premiumFrequency || 'yearly',
      sumAssured: body.sumAssured ? Number(body.sumAssured) : undefined,
      startDate: body.startDate,
      nextDueDate: body.nextDueDate,
      endDate: body.endDate || undefined,
      attachmentUrl: body.attachmentUrl?.trim() || '',
      notes: body.notes?.trim() || '',
    };

    const v = validateInsurance(doc);
    if (!v.isValid) return Response.json({ error: 'Validation Error', message: v.reason }, { status: 400 });

    const db = await getDb();
    const result = await db.collection('insurance_policies').insertOne({
      ...doc, createdAt: now, updatedAt: now,
    } as any);

    revalidatePath('/vault', 'layout');
    return Response.json({ success: true, id: result.insertedId.toString() }, { status: 201 });
  } catch (err) {
    console.error('[API_INSURANCE_POST_ERROR]', err);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
