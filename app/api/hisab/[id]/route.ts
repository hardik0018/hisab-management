export const dynamic = 'force-dynamic';
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

    const existingRecord = await db.collection('hisab').findOne({
      hisab_id: recordId,
      space_id: spaceId
    });

    if (!existingRecord) {
      return Response.json({ error: 'Record not found' }, { status: 404 });
    }

    const updateData: any = {};
    if (body.name) updateData.name = body.name;
    if (body.mobile !== undefined) updateData.mobile = body.mobile ? String(body.mobile) : '';
    if (body.type) updateData.type = body.type;
    if (body.amount) updateData.amount = parseFloat(body.amount);
    if (body.description !== undefined) updateData.description = body.description;
    if (body.date) updateData.date = new Date(body.date);
    if (body.logAsExpense !== undefined) updateData.log_as_expense = !!body.logAsExpense;
    if (body.ignored !== undefined) updateData.ignored = !!body.ignored;

    const result = await db.collection('hisab').updateOne(
      { hisab_id: recordId, space_id: spaceId },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return Response.json({ error: 'Record not found' }, { status: 404 });
    }

    const isIgnoredNow = body.ignored !== undefined ? !!body.ignored : !!existingRecord.ignored;
    const isLoggedAsExpenseNow = (body.logAsExpense !== undefined ? !!body.logAsExpense : !!existingRecord.log_as_expense) && !isIgnoredNow;

    if (isLoggedAsExpenseNow) {
      const linkedExpense = await db.collection('expenses').findOne({
        associatedId: recordId,
        associatedType: 'hisab'
      });

      const nameToUse = body.name || existingRecord.name;
      const typeToUse = body.type || existingRecord.type;
      const amountToUse = body.amount ? parseFloat(body.amount) : existingRecord.amount;
      const descToUse = body.description !== undefined ? body.description : existingRecord.description;
      const dateToUse = body.date ? new Date(body.date) : new Date(existingRecord.date);
      
      const expenseAmount = typeToUse === 'credit' ? -amountToUse : amountToUse;
      
      const year = dateToUse.getFullYear();
      const monthStr = String(dateToUse.getMonth() + 1).padStart(2, '0');
      const dayStr = String(dateToUse.getDate()).padStart(2, '0');
      const dateStr = `${year}-${monthStr}-${dayStr}`;

      if (linkedExpense) {
        await db.collection('expenses').updateOne(
          { _id: linkedExpense._id },
          {
            $set: {
              itemName: `Hisab: ${nameToUse}`,
              amount: expenseAmount,
              note: descToUse || '',
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
          itemName: `Hisab: ${nameToUse}`,
          amount: expenseAmount,
          note: descToUse || '',
          category: 'Debt/Credit',
          currency: 'INR',
          associatedId: recordId,
          associatedType: 'hisab',
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        await db.collection('expenses').insertOne(expenseDoc);
      }
    } else {
      await db.collection('expenses').deleteOne({
        associatedId: recordId,
        associatedType: 'hisab'
      });
    }

    const record = await db.collection('hisab').findOne(
      { hisab_id: recordId },
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
      associatedType: 'hisab',
      space_id: spaceId
    });

    const result = await db.collection('hisab').deleteOne({
      hisab_id: recordId,
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
