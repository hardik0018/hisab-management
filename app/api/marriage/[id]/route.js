import { getDb } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';

export async function PUT(request, { params }) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: recordId } = await params;
    const body = await request.json();
    const db = await getDb();
    const spaceId = user.space_id || user.user_id;

    const updateData = {};
    if (body.name) updateData.name = body.name;
    if (body.city !== undefined) updateData.city = body.city;
    if (body.amount) updateData.amount = parseFloat(body.amount);
    if (body.date) updateData.date = new Date(body.date);

    const result = await db.collection('marriage_hisab').updateOne(
      { marriage_id: recordId, space_id: spaceId },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return Response.json({ error: 'Record not found' }, { status: 404 });
    }

    const record = await db.collection('marriage_hisab').findOne(
      { marriage_id: recordId },
      { projection: { _id: 0 } }
    );

    return Response.json({ record });
  } catch (error) {
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: recordId } = await params;
    const db = await getDb();
    const spaceId = user.space_id || user.user_id;
    
    const result = await db.collection('marriage_hisab').deleteOne({
      marriage_id: recordId,
      space_id: spaceId,
    });

    if (result.deletedCount === 0) {
      return Response.json({ error: 'Record not found' }, { status: 404 });
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
