import { getDb, connectToDatabase } from '../lib/db';
import { categorizeExpense } from '../lib/category-engine';

async function main() {
  const { client, db } = await connectToDatabase();
  console.log('Connected to DB');

  const expenses = await db.collection('expenses').find({}).toArray();
  
  let changed = 0;
  let other = 0;
  
  for (const exp of expenses) {
    const itemName = exp.itemName || '';
    const note = exp.note || '';
    const currentCat = exp.category;
    
    const newCat = categorizeExpense(itemName, note, exp.amount, exp.type);
    
    if (newCat !== currentCat) {
      if (currentCat === 'General & Other' && newCat !== 'General & Other') {
        other++;
        console.log(`[FIXED OTHER] Item: "${itemName}" | Note: "${note}" -> NewCat: ${newCat}`);
      } else if (currentCat !== 'General & Other') {
        changed++;
        console.log(`[CHANGED] Item: "${itemName}" | Note: "${note}" | OldCat: ${currentCat} -> NewCat: ${newCat}`);
      }
      // Update in DB
      await db.collection('expenses').updateOne({ _id: exp._id }, { $set: { category: newCat } });
    }
  }

  console.log(`Total: ${expenses.length}, Fixed from Other: ${other}, Changed existing: ${changed}`);
  await client.close();
}

main().catch(console.error);
