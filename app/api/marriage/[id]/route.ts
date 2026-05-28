import { getDb } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';
import { NextRequest } from 'next/server';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: recordId } = await params;
    const body = await request.json();
    const db = await getDb();
    const spaceId = user.space_id || user.user_id;

    const existingRecord = await db.collection('marriage_hisab').findOne({
      marriage_id: recordId,
      space_id: spaceId
    });

    if (!existingRecord) {
      return Response.json({ error: 'Record not found' }, { status: 404 });
    }

    const updateData: any = {};
    if (body.name) updateData.name = body.name;
    if (body.city !== undefined) updateData.city = body.city;
    if (body.amount) updateData.amount = parseFloat(body.amount);
    if (body.date) updateData.date = new Date(body.date);
    if (body.logAsExpense !== undefined) updateData.log_as_expense = !!body.logAsExpense;

    const result = await db.collection('marriage_hisab').updateOne(
      { marriage_id: recordId, space_id: spaceId },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return Response.json({ error: 'Record not found' }, { status: 404 });
    }

    const isLoggedAsExpenseNow = body.logAsExpense !== undefined ? !!body.logAsExpense : !!existingRecord.log_as_expense;

    if (isLoggedAsExpenseNow) {
      const linkedExpense = await db.collection('expenses').findOne({
        associatedId: recordId,
        associatedType: 'marriage'
      });

      const nameToUse = body.name || existingRecord.name;
      const cityToUse = body.city !== undefined ? body.city : existingRecord.city;
      const amountToUse = body.amount ? parseFloat(body.amount) : existingRecord.amount;
      const dateToUse = body.date ? new Date(body.date) : new Date(existingRecord.date);
      
      const year = dateToUse.getFullYear();
      const monthStr = String(dateToUse.getMonth() + 1).padStart(2, '0');
      const dayStr = String(dateToUse.getDate()).padStart(2, '0');
      const dateStr = `${year}-${monthStr}-${dayStr}`;

      const locationStr = cityToUse ? ` (${cityToUse})` : '';

      if (linkedExpense) {
        await db.collection('expenses').updateOne(
          { _id: linkedExpense._id },
          {
            $set: {
              itemName: `Vyahar: ${nameToUse}${locationStr}`,
              amount: amountToUse,
              note: `Vyahar gift to ${nameToUse}${cityToUse ? ` from ${cityToUse}` : ''}`,
              date: dateStr,
              updatedAt: new Date()
            }
          }
        );
      } else {
        const expenseDoc = {
          space_id: spaceId,
          user_id: user.user_id,
          date: dateStr,
          itemName: `Vyahar: ${nameToUse}${locationStr}`,
          amount: amountToUse,
          note: `Vyahar gift to ${nameToUse}${cityToUse ? ` from ${cityToUse}` : ''}`,
          category: 'Marriage',
          currency: 'INR',
          associatedId: recordId,
          associatedType: 'marriage',
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        await db.collection('expenses').insertOne(expenseDoc);
      }
    } else {
      await db.collection('expenses').deleteOne({
        associatedId: recordId,
        associatedType: 'marriage'
      });
    }

    const record = await db.collection('marriage_hisab').findOne(
      { marriage_id: recordId },
      { projection: { _id: 0 } }
    );

    return Response.json({ record });
  } catch (error) {
    console.error('API Error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: recordId } = await params;
    const db = await getDb();
    const spaceId = user.space_id || user.user_id;
    
    // Delete linked expense first
    await db.collection('expenses').deleteOne({
      associatedId: recordId,
      associatedType: 'marriage',
      space_id: spaceId
    });

    const result = await db.collection('marriage_hisab').deleteOne({
      marriage_id: recordId,
      space_id: spaceId,
    });

    if (result.deletedCount === 0) {
      return Response.json({ error: 'Record not found' }, { status: 404 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('API Error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
