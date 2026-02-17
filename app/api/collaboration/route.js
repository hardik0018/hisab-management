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

    if (email.toLowerCase() === user.email.toLowerCase()) {
      return Response.json({ error: 'You cannot invite yourself' }, { status: 400 });
    }

    const db = await getDb();
    
    // Find the target user
    const targetUser = await db.collection('users').findOne({ email: email.toLowerCase() });
    if (!targetUser) {
      return Response.json({ error: 'User not found. They must sign in once first.' }, { status: 404 });
    }

    // Check if already in the same space
    if (targetUser.space_id === user.space_id) {
      return Response.json({ error: 'User is already a collaborator' }, { status: 400 });
    }

    // Check if request already exists
    const existingRequest = await db.collection('collaboration_requests').findOne({
      from_user_id: user.user_id,
      to_email: email.toLowerCase(),
      status: 'pending'
    });

    if (existingRequest) {
      return Response.json({ error: 'Invitation already sent and pending' }, { status: 400 });
    }

    // Create invitation request
    await db.collection('collaboration_requests').insertOne({
      from_user_id: user.user_id,
      from_name: user.name,
      from_email: user.email,
      to_user_id: targetUser.user_id,
      to_email: email.toLowerCase(),
      space_id: user.space_id,
      status: 'pending',
      created_at: new Date()
    });

    return Response.json({ success: true, message: `Invitation sent to ${email}!` });
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
        
        // Get current collaborators
        const collaborators = await db.collection('users')
            .find({ space_id: user.space_id })
            .project({ name: 1, email: 1, image: 1, user_id: 1 })
            .toArray();

        // Get pending requests sent by the user
        const sentRequests = await db.collection('collaboration_requests')
            .find({ from_user_id: user.user_id, status: 'pending' })
            .toArray();

        // Get pending requests received by the user
        const receivedRequests = await db.collection('collaboration_requests')
            .find({ to_email: user.email.toLowerCase(), status: 'pending' })
            .toArray();

        return Response.json({ 
          collaborators,
          sentRequests,
          receivedRequests
        });
    } catch (error) {
        return Response.json({ error: 'Internal server error' }, { status: 500 });
    }
}

