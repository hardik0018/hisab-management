import { getDb } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

export async function GET(request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDb();
    const url = new URL(request.url);
    const name = url.searchParams.get('name');
    const city = url.searchParams.get('city');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '50');

    const query = { user_id: user.user_id };
    if (name) {
      query.name = { $regex: name, $options: 'i' };
    }
    if (city) {
      query.city = { $regex: city, $options: 'i' };
    }

    const records = await db
      .collection('marriage_hisab')
      .find(query, { projection: { _id: 0 } })
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();

    const total = await db.collection('marriage_hisab').countDocuments(query);

    return Response.json({ records, total, page, limit });
  } catch (error) {
    console.error('API Error:', error);
    return Response.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, city, amount, date } = body;

    if (!name || !amount) {
      return Response.json(
        { error: 'name and amount are required' },
        { status: 400 }
      );
    }

    const db = await getDb();
    const marriageId = `marriage_${uuidv4().split('-')[0]}`;

    const record = {
      marriage_id: marriageId,
      user_id: user.user_id,
      name,
      city: city || '',
      amount: parseFloat(amount),
      eventType: 'marriage',
      date: date ? new Date(date) : new Date(),
      created_at: new Date(),
    };

    await db.collection('marriage_hisab').insertOne(record);

    return Response.json({ record }, { status: 201 });
  } catch (error) {
    console.error('API Error:', error);
    return Response.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
