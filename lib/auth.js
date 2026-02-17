import { auth } from "@/auth";
import { getDb } from './db';
import { cache } from 'react';

/**
 * Gets the authenticated user and ensures collaboration fields are initialized.
 * Wrapped in React.cache to avoid redundant DB calls during a single request.
 */
export const getAuthenticatedUser = cache(async () => {
  try {
    const session = await auth();
    
    if (!session || !session.user) {
      return null;
    }

    const db = await getDb();
    let user = await db.collection('users').findOne({ email: session.user.email });

    if (!user) {
      return null;
    }

    // Ensure user_id and space_id exist for consistency and collaboration
    if (!user.user_id || !user.space_id) {
      const updates = {};
      
      if (!user.user_id) {
        user.user_id = user._id.toString();
        updates.user_id = user.user_id;
      }
      
      if (!user.space_id) {
        user.space_id = user.user_id;
        updates.space_id = user.user_id;
      }

      await db.collection('users').updateOne(
        { _id: user._id },
        { $set: updates }
      );
    }

    return user;
  } catch (error) {
    console.error('[AUTH_MODULE_ERROR]', error);
    return null;
  }
});

/**
 * Higher-order function to protect API routes
 */
export function requireAuth(handler) {
  return async (request, context) => {
    try {
      const user = await getAuthenticatedUser();
      
      if (!user) {
        return Response.json(
          { error: 'Unauthorized', message: 'You must be logged in' },
          { status: 401 }
        );
      }

      // Attach user to request for the handler to use
      request.user = user;
      return handler(request, context);
    } catch (error) {
      console.error('[REQUIRE_AUTH_ERROR]', error);
      return Response.json(
        { error: 'Internal Server Error' },
        { status: 500 }
      );
    }
  };
}