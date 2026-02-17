import { getDb } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';

export async function PUT(request, { params }) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: marriageId } = params;
    const body = await request.json();
    const db = await getDb();

    const updateData = {};
    if (body.name) updateData.name = body.name;
    if (body.city !== undefined) updateData.city = body.city;
    if (body.amount) updateData.amount = parseFloat(body.amount);
    if (body.date) updateData.date = new Date(body.date);

    const result = await db.collection('marriage_hisab').updateOne(
      { marriage_id: marriageId, user_id: user.user_id },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return Response.json({ error: 'Record not found' }, { status: 404 });
    }

    const record = await db.collection('marriage_hisab').findOne(
      { marriage_id: marriageId },
      { projection: { _id: 0 } }
    );

    return Response.json({ record });
  } catch (error) {
    console.error('API Error:', error);
    return Response.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: marriageId } = params;
    const db = await getDb();
    
    const result = await db.collection('marriage_hisab').deleteOne({
      marriage_id: marriageId,
      user_id: user.user_id,
    });

    if (result.deletedCount === 0) {
      return Response.json({ error: 'Record not found' }, { status: 404 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('API Error:', error);
    return Response.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
