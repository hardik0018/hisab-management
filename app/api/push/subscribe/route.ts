import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const subscription = await req.json();
    
    if (!subscription || !subscription.endpoint) {
      return Response.json({ error: 'Invalid subscription object' }, { status: 400 });
    }

    const db = await getDb();
    
    // Store or update the subscription in the database
    await db.collection('push_subscriptions').updateOne(
      { endpoint: subscription.endpoint },
      {
        $set: {
          user_id: user.user_id,
          space_id: user.space_id,
          subscription: subscription,
          updatedAt: new Date(),
        }
      },
      { upsert: true }
    );

    return Response.json({ success: true });
  } catch (err) {
    console.error('[PUSH_SUBSCRIBE_ERROR]', err);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
