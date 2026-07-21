import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { endpoint } = await req.json();
    
    if (!endpoint) {
      return Response.json({ error: 'Endpoint is required' }, { status: 400 });
    }

    const db = await getDb();
    
    // Remove the subscription
    await db.collection('push_subscriptions').deleteOne({
      endpoint: endpoint,
      user_id: user.user_id
    });

    return Response.json({ success: true });
  } catch (err) {
    console.error('[PUSH_UNSUBSCRIBE_ERROR]', err);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
