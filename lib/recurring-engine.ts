import { getDb } from './db';
import { ObjectId } from 'mongodb';
import { categorizeExpense } from './category-engine';

/**
 * Gets today's date string in Asia/Kolkata timezone (YYYY-MM-DD).
 * Direct implementation to prevent circular imports.
 */
function getTodayKolkata(): string {
  const options = { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' } as const;
  const parts = new Intl.DateTimeFormat('en-US', options).formatToParts(new Date());
  const yyyy = parts.find(p => p.type === 'year')?.value;
  const mm = parts.find(p => p.type === 'month')?.value;
  const dd = parts.find(p => p.type === 'day')?.value;
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Returns the month string that follows the given month string ("YYYY-MM").
 */
function getNextMonth(monthStr: string): string {
  const [year, month] = monthStr.split('-').map(Number);
  if (month === 12) {
    return `${year + 1}-01`;
  }
  return `${year}-${String(month + 1).padStart(2, '0')}`;
}

/**
 * Scan all active recurring expense templates in the given space,
 * and generate any pending monthly entries up to the current date/month.
 * Uses atomic updates to prevent duplicate generation under concurrency.
 */
export async function checkAndGenerateRecurringExpenses(spaceId: string, userId: string): Promise<void> {
  const db = await getDb();
  
  // Find all active templates for this space
  const templates = await db.collection('recurring_expenses')
    .find({ space_id: spaceId, isActive: true })
    .toArray();
    
  const todayStr = getTodayKolkata();
  const currentMonthStr = todayStr.substring(0, 7); // e.g. "2026-06"
  
  for (const template of templates) {
    let lastGeneratedMonth = template.lastGeneratedMonth;
    
    // Safety fallback: if somehow lastGeneratedMonth is not set, initialize to the month before startDate
    if (!lastGeneratedMonth) {
      const [sYear, sMonth] = template.startDate.split('-').map(Number);
      const prevMonth = sMonth === 1 ? 12 : sMonth - 1;
      const prevYear = sMonth === 1 ? sYear - 1 : sYear;
      lastGeneratedMonth = `${prevYear}-${String(prevMonth).padStart(2, '0')}`;
    }
    
    let candidateMonth = getNextMonth(lastGeneratedMonth);
    
    while (candidateMonth <= currentMonthStr) {
      const [cYear, cMonth] = candidateMonth.split('-').map(Number);
      
      // Handle variable days in months (e.g. Feb 28, Apr 30, etc.)
      const maxDays = new Date(cYear, cMonth, 0).getDate();
      const targetDay = Math.min(template.dayOfMonth, maxDays);
      const targetDateStr = `${cYear}-${String(cMonth).padStart(2, '0')}-${String(targetDay).padStart(2, '0')}`;
      
      // If the target execution day has not arrived yet, we stop generating for this template
      if (targetDateStr > todayStr) {
        break;
      }
      
      // Atomically attempt to advance the template's lastGeneratedMonth to the candidate month.
      // This prevents parallel requests from double-generating the same month.
      const updateResult = await db.collection('recurring_expenses').updateOne(
        {
          _id: template._id,
          lastGeneratedMonth: lastGeneratedMonth
        },
        {
          $set: {
            lastGeneratedMonth: candidateMonth,
            updatedAt: new Date()
          }
        }
      );
      
      if (updateResult.modifiedCount > 0) {
        // Safeguard double-check: ensure we haven't already generated an expense for this template on this date.
        // This handles cases where template start dates or generation history are reset/edited.
        const alreadyGenerated = await db.collection('expenses').findOne({
          space_id: template.space_id,
          associatedId: template._id.toString(),
          associatedType: 'recurring',
          date: targetDateStr
        });

        if (!alreadyGenerated) {
          // We secured the lock for this candidateMonth. Now insert the daily expense log.
          const expenseDoc = {
            space_id: template.space_id,
            user_id: template.user_id || userId,
            date: targetDateStr,
            itemName: template.itemName,
            amount: Number(template.amount),
            note: template.note || 'Generated automatically',
            category: categorizeExpense(template.itemName, template.note, Number(template.amount), 'expense', template.category),
            currency: 'INR',
            associatedId: template._id.toString(),
            associatedType: 'recurring',
            createdAt: new Date(),
            updatedAt: new Date()
          };
          
          await db.collection('expenses').insertOne(expenseDoc as any);
        }
        
        // Advance our cursor
        lastGeneratedMonth = candidateMonth;
      } else {
        // If atomic update failed, it means another thread advanced the lastGeneratedMonth already.
        // Fetch the fresh state of the template to see where it stands now.
        const refreshed = await db.collection('recurring_expenses').findOne({ _id: template._id });
        if (refreshed && refreshed.isActive) {
          lastGeneratedMonth = refreshed.lastGeneratedMonth;
        } else {
          // Template became inactive or deleted, stop processing
          break;
        }
      }
      
      candidateMonth = getNextMonth(lastGeneratedMonth);
    }
  }
}
