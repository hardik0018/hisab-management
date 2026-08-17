import { connectToDatabase } from '../lib/db';
import { categorizeExpense } from '../lib/category-engine';

async function main() {
  const { client, db } = await connectToDatabase();
  console.log('Connected to DB');

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const endOfMonth = new Date();
  endOfMonth.setMonth(endOfMonth.getMonth() + 1);
  endOfMonth.setDate(0);
  endOfMonth.setHours(23, 59, 59, 999);

  // Note: expenses likely have a 'date' field as string 'YYYY-MM-DD'
  // Or we just get all expenses and filter in memory if the dataset is small.
  const expenses = await db.collection('expenses').find({}).toArray();
  
  const currentMonthPrefix = '2026-08';
  const thisMonthExpenses = expenses.filter(e => e.date && e.date.startsWith(currentMonthPrefix));

  console.log(`Found ${thisMonthExpenses.length} transactions for August 2026.`);
  
  let changed = 0;
  for (const exp of thisMonthExpenses) {
    const itemName = exp.itemName || '';
    const note = exp.note || '';
    const currentCat = exp.category;
    const newCat = categorizeExpense(itemName, note, exp.amount, exp.type);
    
    console.log(`- ${itemName} | Note: ${note} | Amount: ${exp.amount} | Type: ${exp.type} -> Cat: ${newCat}`);
    
    if (newCat !== currentCat) {
      changed++;
      await db.collection('expenses').updateOne({ _id: exp._id }, { $set: { category: newCat } });
      console.log(`  [UPDATED in DB: ${currentCat} -> ${newCat}]`);
    }
  }

  console.log(`Total checked: ${thisMonthExpenses.length}, Updated: ${changed}`);
  await client.close();
}

main().catch(console.error);
