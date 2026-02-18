export const dynamic = 'force-dynamic';
import { getDb } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';
import { NextRequest } from 'next/server';
import { User, CollaborationRequest } from '@/types';

/**
 * Handles inviting a user to the current space or viewing current space members.
 */
export async function POST(request: NextRequest) {
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
            .project({ name: 1, email: 1, image: 1, user_id: 1, space_id: 1 })
            .toArray() as unknown as User[];

        // Get pending requests sent by the user
        const sentRequests = await db.collection('collaboration_requests')
            .find({ from_user_id: user.user_id, status: 'pending' })
            .toArray() as unknown as CollaborationRequest[];

        // Get pending requests received by the user
        const receivedRequests = await db.collection('collaboration_requests')
            .find({ to_email: user.email.toLowerCase(), status: 'pending' })
            .toArray() as unknown as CollaborationRequest[];

        return Response.json({ 
          collaborators,
          sentRequests,
          receivedRequests,
          currentUserId: user.user_id,
          currentSpaceId: user.space_id
        });
    } catch (error) {
        console.error('Collaboration API Error:', error);
        return Response.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { targetUserId } = await request.json();
    if (!targetUserId) {
      return Response.json({ error: 'Target User ID is required' }, { status: 400 });
    }

    const db = await getDb();

    // Case 1: User wants to leave a shared space
    if (targetUserId === user.user_id) {
       // Only allow leaving if they are NOT the owner of the current space
       if (user.user_id === user.space_id) {
          return Response.json({ error: 'You are the owner of this space. You cannot leave it, but you can remove others.' }, { status: 400 });
       }

       await db.collection('users').updateOne(
         { user_id: user.user_id },
         { $set: { space_id: user.user_id } }
       );

       return Response.json({ success: true, message: 'You have left the space.' });
    }

    // Case 2: Owner wants to remove a collaborator
    // Verify current user is the owner of the space
    if (user.user_id !== user.space_id) {
      return Response.json({ error: 'Only the space owner can remove collaborators.' }, { status: 403 });
    }

    // Find the target user to ensure they are actually in this space
    const targetUser = await db.collection('users').findOne({ user_id: targetUserId, space_id: user.space_id });
    if (!targetUser) {
      return Response.json({ error: 'Collaborator not found in your space.' }, { status: 404 });
    }

    // Reset their space_id back to their own user_id
    await db.collection('users').updateOne(
      { user_id: targetUserId },
      { $set: { space_id: targetUserId } }
    );

    return Response.json({ success: true, message: `Removed ${targetUser.name} from your space.` });
  } catch (error) {
    console.error('Collaboration DELETE Error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
