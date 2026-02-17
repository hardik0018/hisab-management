import { getDb } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';

/**
 * Handles inviting a user to the current space or viewing current space members.
 */
export async function POST(request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { email } = await request.json();
    if (!email) {
      return Response.json({ error: 'Email is required' }, { status: 400 });
    }

    const db = await getDb();
    
    // Find the target user
    const targetUser = await db.collection('users').findOne({ email: email.toLowerCase() });
    if (!targetUser) {
      return Response.json({ error: 'User not found. They must sign in once first.' }, { status: 404 });
    }

    // Set the target user's space_id to the current user's space_id
    // Note: In a production app, we'd have an invitation/approval flow.
    // For now, we do direct collaboration as requested.
    await db.collection('users').updateOne(
        { _id: targetUser._id },
        { $set: { space_id: user.space_id } }
    );

    return Response.json({ success: true, message: `Collaborator ${email} added successfully!` });
  } catch (error) {
    console.error('Collaboration API Error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
    try {
        const user = await getAuthenticatedUser();
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const db = await getDb();
        const collaborators = await db.collection('users')
            .find({ space_id: user.space_id })
            .project({ name: 1, email: 1, image: 1, user_id: 1 })
            .toArray();

        return Response.json({ collaborators });
    } catch (error) {
        return Response.json({ error: 'Internal server error' }, { status: 500 });
    }
}
