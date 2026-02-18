import { auth } from "@/auth";
import { getDb } from './db';
import { cache } from 'react';
import { User } from '@/types';
import { NextRequest } from 'next/server';

/**
 * Gets the authenticated user and ensures collaboration fields are initialized.
 * Wrapped in React.cache to avoid redundant DB calls during a single request.
 */
export const getAuthenticatedUser = cache(async (): Promise<User | null> => {
  try {
    const session = await auth();
    
    if (!session || !session.user || !session.user.email) {
      return null;
    }

    const db = await getDb();
    const userDoc = await db.collection('users').findOne({ email: session.user.email });

    if (!userDoc) {
      return null;
    }

    // Map MongoDB document to User interface
    const user: User = {
      _id: userDoc._id.toString(),
      user_id: userDoc.user_id as string,
      space_id: userDoc.space_id as string,
      name: userDoc.name as string,
      email: userDoc.email as string,
      image: userDoc.image as string | undefined,
    };

    // Ensure user_id and space_id exist for consistency and collaboration
    if (!user.user_id || !user.space_id) {
      const updates: Partial<User> = {};
      
      if (!user.user_id) {
        user.user_id = userDoc._id.toString();
        updates.user_id = user.user_id;
      }
      
      if (!user.space_id) {
        user.space_id = user.user_id;
        updates.space_id = user.user_id;
      }

      await db.collection('users').updateOne(
        { _id: userDoc._id },
        { $set: updates }
      );
    }

    return user;
  } catch (error) {
    console.error('[AUTH_MODULE_ERROR]', error);
    return null;
  }
});

interface AuthenticatedRequest extends NextRequest {
  user?: User;
}

/**
 * Higher-order function to protect API routes
 */
export function requireAuth(handler: (request: AuthenticatedRequest, context: any) => Promise<Response>) {
  return async (request: AuthenticatedRequest, context: any) => {
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
