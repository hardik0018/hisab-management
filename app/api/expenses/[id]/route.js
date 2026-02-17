import { getDb } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';

export async function PUT(request, { params }) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: expenseId } = await params;
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
      { 
        expense_id: expenseId, 
        $or: [{ user_id: user.user_id }, { shared_with: user.user_id }]
      },
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
  } catch (error) {
    console.error('API Error:', error);
    return Response.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: expenseId } = await params;
    const db = await getDb();
    
    const result = await db.collection('expenses').deleteOne({
      expense_id: expenseId,
      $or: [{ user_id: user.user_id }, { shared_with: user.user_id }]
    });

    if (result.deletedCount === 0) {
      return Response.json({ error: 'Expense not found' }, { status: 404 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('API Error:', error);
    return Response.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
