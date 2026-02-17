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
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '50');

    const query = { user_id: user.user_id };
    if (name) {
      query.name = { $regex: name, $options: 'i' };
    }

    const records = await db
      .collection('hisab')
      .find(query, { projection: { _id: 0 } })
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();

    const total = await db.collection('hisab').countDocuments(query);

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
    const { name, type, amount, description, date } = body;

    if (!name || !type || !amount) {
      return Response.json(
        { error: 'name, type, and amount are required' },
        { status: 400 }
      );
    }

    if (!['debit', 'credit'].includes(type)) {
      return Response.json(
        { error: 'type must be either "debit" or "credit"' },
        { status: 400 }
      );
    }

    const db = await getDb();
    const hisabId = `hisab_${uuidv4().split('-')[0]}`;

    const record = {
      hisab_id: hisabId,
      user_id: user.user_id,
      name,
      type,
      amount: parseFloat(amount),
      description: description || '',
      date: date ? new Date(date) : new Date(),
      created_at: new Date(),
    };

    await db.collection('hisab').insertOne(record);

    return Response.json({ record }, { status: 201 });
  } catch (error) {
    console.error('API Error:', error);
    return Response.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
