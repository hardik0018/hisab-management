import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth-options';
import { getDb } from './db';

export async function getAuthenticatedUser(request) {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    return null;
  }

  const db = await getDb();
  const user = await db.collection('users').findOne({ email: session.user.email });

  if (!user) {
    return null;
  }

  // Ensure user_id exists for consistency with existing data
  if (!user.user_id) {
    user.user_id = user._id.toString();
  }

  return user;
}

export function requireAuth(handler) {
  return async (request, context) => {
    const user = await getAuthenticatedUser(request);
    
    if (!user) {
      return Response.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Attach user to request
    request.user = user;
    return handler(request, context);
  };
}