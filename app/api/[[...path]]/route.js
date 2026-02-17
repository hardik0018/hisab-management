import { getDb } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';
import { cookies } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';

// Health check
export async function GET(request) {
  const url = new URL(request.url);
  const path = url.pathname.replace('/api', '');

  try {
    // Root health check
    if (path === '/' || path === '') {
      return Response.json({ message: 'Hisab API is running' });
    }

    // Auth endpoints
    if (path === '/auth/me') {
      return handleAuthMe(request);
    }

    // Protected endpoints
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Expenses
    if (path === '/expenses') {
      return getExpenses(request, user);
    }

    // Hisab
    if (path === '/hisab') {
      return getHisab(request, user);
    }

    // Marriage
    if (path === '/marriage') {
      return getMarriage(request, user);
    }

    // Dashboard stats
    if (path === '/dashboard/stats') {
      return getDashboardStats(request, user);
    }

    return Response.json({ error: 'Not found' }, { status: 404 });
  } catch (error) {
    console.error('API Error:', error);
    return Response.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  const url = new URL(request.url);
  const path = url.pathname.replace('/api', '');

  try {
    // Auth endpoints (public)
    if (path === '/auth/session') {
      return handleAuthSession(request);
    }

    if (path === '/auth/logout') {
      return handleLogout(request);
    }

    // Protected endpoints
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Expenses
    if (path === '/expenses') {
      return createExpense(request, user);
    }

    // Hisab
    if (path === '/hisab') {
      return createHisab(request, user);
    }

    // Marriage
    if (path === '/marriage') {
      return createMarriage(request, user);
    }

    return Response.json({ error: 'Not found' }, { status: 404 });
  } catch (error) {
    console.error('API Error:', error);
    return Response.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  const url = new URL(request.url);
  const path = url.pathname.replace('/api', '');

  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Extract ID from path
    const parts = path.split('/');
    const id = parts[parts.length - 1];

    if (path.startsWith('/expenses/')) {
      return updateExpense(request, user, id);
    }

    if (path.startsWith('/hisab/')) {
      return updateHisab(request, user, id);
    }

    if (path.startsWith('/marriage/')) {
      return updateMarriage(request, user, id);
    }

    return Response.json({ error: 'Not found' }, { status: 404 });
  } catch (error) {
    console.error('API Error:', error);
    return Response.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  const url = new URL(request.url);
  const path = url.pathname.replace('/api', '');

  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const parts = path.split('/');
    const id = parts[parts.length - 1];

    if (path.startsWith('/expenses/')) {
      return deleteExpense(request, user, id);
    }

    if (path.startsWith('/hisab/')) {
      return deleteHisab(request, user, id);
    }

    if (path.startsWith('/marriage/')) {
      return deleteMarriage(request, user, id);
    }

    return Response.json({ error: 'Not found' }, { status: 404 });
  } catch (error) {
    console.error('API Error:', error);
    return Response.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// ======================
// AUTH HANDLERS
// ======================

async function handleAuthSession(request) {
  const body = await request.json();
  const { session_id } = body;

  if (!session_id) {
    return Response.json({ error: 'session_id required' }, { status: 400 });
  }

  // Exchange session_id for user data
  const response = await fetch(
    'https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data',
    {
      headers: {
        'X-Session-ID': session_id,
      },
    }
  );

  if (!response.ok) {
    return Response.json({ error: 'Invalid session_id' }, { status: 401 });
  }

  const data = await response.json();
  const { id, email, name, picture, session_token } = data;

  // Store user in database
  const db = await getDb();
  const userId = `user_${uuidv4().split('-')[0]}`;

  // Upsert user
  await db.collection('users').updateOne(
    { email },
    {
      $setOnInsert: {
        user_id: userId,
        email,
        name,
        picture,
        created_at: new Date(),
      },
      $set: {
        name,
        picture,
      },
    },
    { upsert: true }
  );

  // Get the user
  const user = await db.collection('users').findOne(
    { email },
    { projection: { _id: 0 } }
  );

  // Store session
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await db.collection('user_sessions').insertOne({
    user_id: user.user_id,
    session_token,
    expires_at: expiresAt,
    created_at: new Date(),
  });

  // Set cookie
  const cookieStore = await cookies();
  cookieStore.set('session_token', session_token, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    path: '/',
    maxAge: 7 * 24 * 60 * 60,
  });

  return Response.json({ user });
}

async function handleAuthMe(request) {
  const user = await getAuthenticatedUser(request);
  
  if (!user) {
    return Response.json({ error: 'Not authenticated' }, { status: 401 });
  }

  return Response.json(user);
}

async function handleLogout(request) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session_token')?.value;

  if (sessionToken) {
    const db = await getDb();
    await db.collection('user_sessions').deleteOne({ session_token: sessionToken });
  }

  cookieStore.delete('session_token');
  return Response.json({ success: true });
}

// ======================
// EXPENSE HANDLERS
// ======================

async function getExpenses(request, user) {
  const db = await getDb();
  const url = new URL(request.url);
  const category = url.searchParams.get('category');
  const startDate = url.searchParams.get('startDate');
  const endDate = url.searchParams.get('endDate');
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '50');

  const query = { user_id: user.user_id };

  if (category && category !== 'all') {
    query.category = category;
  }

  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = new Date(startDate);
    if (endDate) query.date.$lte = new Date(endDate);
  }

  const expenses = await db
    .collection('expenses')
    .find(query, { projection: { _id: 0 } })
    .sort({ date: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .toArray();

  const total = await db.collection('expenses').countDocuments(query);

  return Response.json({ expenses, total, page, limit });
}

async function createExpense(request, user) {
  const body = await request.json();
  const { title, amount, category, paymentMode, date, notes } = body;

  if (!title || !amount || !category) {
    return Response.json(
      { error: 'title, amount, and category are required' },
      { status: 400 }
    );
  }

  const db = await getDb();
  const expenseId = `exp_${uuidv4().split('-')[0]}`;

  const expense = {
    expense_id: expenseId,
    user_id: user.user_id,
    title,
    amount: parseFloat(amount),
    category,
    paymentMode: paymentMode || 'cash',
    date: date ? new Date(date) : new Date(),
    notes: notes || '',
    created_at: new Date(),
  };

  await db.collection('expenses').insertOne(expense);

  return Response.json({ expense }, { status: 201 });
}

async function updateExpense(request, user, expenseId) {
  const body = await request.json();
  const db = await getDb();

  const updateData = {};
  if (body.title) updateData.title = body.title;
  if (body.amount) updateData.amount = parseFloat(body.amount);
  if (body.category) updateData.category = body.category;
  if (body.paymentMode) updateData.paymentMode = body.paymentMode;
  if (body.date) updateData.date = new Date(body.date);
  if (body.notes !== undefined) updateData.notes = body.notes;

  const result = await db.collection('expenses').updateOne(
    { expense_id: expenseId, user_id: user.user_id },
    { $set: updateData }
  );

  if (result.matchedCount === 0) {
    return Response.json({ error: 'Expense not found' }, { status: 404 });
  }

  const expense = await db.collection('expenses').findOne(
    { expense_id: expenseId },
    { projection: { _id: 0 } }
  );

  return Response.json({ expense });
}

async function deleteExpense(request, user, expenseId) {
  const db = await getDb();
  
  const result = await db.collection('expenses').deleteOne({
    expense_id: expenseId,
    user_id: user.user_id,
  });

  if (result.deletedCount === 0) {
    return Response.json({ error: 'Expense not found' }, { status: 404 });
  }

  return Response.json({ success: true });
}

// ======================
// HISAB HANDLERS
// ======================

async function getHisab(request, user) {
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
}

async function createHisab(request, user) {
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
}

async function updateHisab(request, user, hisabId) {
  const body = await request.json();
  const db = await getDb();

  const updateData = {};
  if (body.name) updateData.name = body.name;
  if (body.type) updateData.type = body.type;
  if (body.amount) updateData.amount = parseFloat(body.amount);
  if (body.description !== undefined) updateData.description = body.description;
  if (body.date) updateData.date = new Date(body.date);

  const result = await db.collection('hisab').updateOne(
    { hisab_id: hisabId, user_id: user.user_id },
    { $set: updateData }
  );

  if (result.matchedCount === 0) {
    return Response.json({ error: 'Record not found' }, { status: 404 });
  }

  const record = await db.collection('hisab').findOne(
    { hisab_id: hisabId },
    { projection: { _id: 0 } }
  );

  return Response.json({ record });
}

async function deleteHisab(request, user, hisabId) {
  const db = await getDb();
  
  const result = await db.collection('hisab').deleteOne({
    hisab_id: hisabId,
    user_id: user.user_id,
  });

  if (result.deletedCount === 0) {
    return Response.json({ error: 'Record not found' }, { status: 404 });
  }

  return Response.json({ success: true });
}

// ======================
// MARRIAGE HANDLERS
// ======================

async function getMarriage(request, user) {
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
}

async function createMarriage(request, user) {
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
}

async function updateMarriage(request, user, marriageId) {
  const body = await request.json();
  const db = await getDb();

  const updateData = {};
  if (body.name) updateData.name = body.name;
  if (body.city !== undefined) updateData.city = body.city;
  if (body.amount) updateData.amount = parseFloat(body.amount);
  if (body.date) updateData.date = new Date(body.date);

  const result = await db.collection('marriage_hisab').updateOne(
    { marriage_id: marriageId, user_id: user.user_id },
    { $set: updateData }
  );

  if (result.matchedCount === 0) {
    return Response.json({ error: 'Record not found' }, { status: 404 });
  }

  const record = await db.collection('marriage_hisab').findOne(
    { marriage_id: marriageId },
    { projection: { _id: 0 } }
  );

  return Response.json({ record });
}

async function deleteMarriage(request, user, marriageId) {
  const db = await getDb();
  
  const result = await db.collection('marriage_hisab').deleteOne({
    marriage_id: marriageId,
    user_id: user.user_id,
  });

  if (result.deletedCount === 0) {
    return Response.json({ error: 'Record not found' }, { status: 404 });
  }

  return Response.json({ success: true });
}

// ======================
// DASHBOARD HANDLERS
// ======================

async function getDashboardStats(request, user) {
  const db = await getDb();

  // Get total expenses
  const expensesAgg = await db
    .collection('expenses')
    .aggregate([
      { $match: { user_id: user.user_id } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ])
    .toArray();
  const totalExpense = expensesAgg[0]?.total || 0;

  // Get debit/credit totals
  const hisabAgg = await db
    .collection('hisab')
    .aggregate([
      { $match: { user_id: user.user_id } },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
        },
      },
    ])
    .toArray();

  let totalDebit = 0;
  let totalCredit = 0;
  hisabAgg.forEach((item) => {
    if (item._id === 'debit') totalDebit = item.total;
    if (item._id === 'credit') totalCredit = item.total;
  });

  const balance = totalCredit - totalDebit;

  // Get marriage total
  const marriageAgg = await db
    .collection('marriage_hisab')
    .aggregate([
      { $match: { user_id: user.user_id } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ])
    .toArray();
  const totalMarriage = marriageAgg[0]?.total || 0;

  // Recent activity
  const recentExpenses = await db
    .collection('expenses')
    .find({ user_id: user.user_id }, { projection: { _id: 0 } })
    .sort({ created_at: -1 })
    .limit(5)
    .toArray();

  const recentHisab = await db
    .collection('hisab')
    .find({ user_id: user.user_id }, { projection: { _id: 0 } })
    .sort({ created_at: -1 })
    .limit(5)
    .toArray();

  return Response.json({
    totalExpense,
    totalDebit,
    totalCredit,
    balance,
    totalMarriage,
    recentExpenses,
    recentHisab,
  });
}