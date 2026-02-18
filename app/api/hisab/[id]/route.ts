export const dynamic = 'force-dynamic';
import { getDb } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';
import { NextRequest } from 'next/server';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: recordId } = await params;
    const body = await request.json();
    const db = await getDb();
    const spaceId = user.space_id || user.user_id;

    const updateData: any = {};
    if (body.name) updateData.name = body.name;
    if (body.mobile !== undefined) updateData.mobile = body.mobile ? String(body.mobile) : '';
    if (body.type) updateData.type = body.type;
    if (body.amount) updateData.amount = parseFloat(body.amount);
    if (body.description !== undefined) updateData.description = body.description;
    if (body.date) updateData.date = new Date(body.date);

    const result = await db.collection('hisab').updateOne(
      { hisab_id: recordId, space_id: spaceId },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return Response.json({ error: 'Record not found' }, { status: 404 });
    }

    const record = await db.collection('hisab').findOne(
      { hisab_id: recordId },
      { projection: { _id: 0 } }
    );

    return Response.json({ record });
  } catch (error) {
    console.error('API Error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: recordId } = await params;
    const db = await getDb();
    const spaceId = user.space_id || user.user_id;
    
    const result = await db.collection('hisab').deleteOne({
      hisab_id: recordId,
      space_id: spaceId,
    });

    if (result.deletedCount === 0) {
      return Response.json({ error: 'Record not found' }, { status: 404 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('API Error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
