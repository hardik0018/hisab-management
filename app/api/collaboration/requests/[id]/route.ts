import { getDb } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';
import { ObjectId } from 'mongodb';
import { NextRequest } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getAuthenticatedUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action } = await request.json(); // 'accept' or 'reject'
    const db = await getDb();

    const collabRequest = await db.collection('collaboration_requests').findOne({
      _id: new ObjectId(id),
      to_email: user.email.toLowerCase(),
      status: 'pending'
    });

    if (!collabRequest) {
      return Response.json({ error: 'Request not found or already processed' }, { status: 404 });
    }

    if (action === 'accept') {
      // Update the user's space_id to the invited space_id
      await db.collection('users').updateOne(
        { user_id: user.user_id },
        { $set: { space_id: collabRequest.space_id } }
      );

      // Mark request as accepted
      await db.collection('collaboration_requests').updateOne(
        { _id: collabRequest._id },
        { $set: { status: 'accepted', processed_at: new Date() } }
      );

      return Response.json({ success: true, message: 'Invitation accepted!' });
    } else if (action === 'reject') {
      // Mark request as rejected
      await db.collection('collaboration_requests').updateOne(
        { _id: collabRequest._id },
        { $set: { status: 'rejected', processed_at: new Date() } }
      );

      return Response.json({ success: true, message: 'Invitation rejected.' });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Collaboration Request Action Error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
