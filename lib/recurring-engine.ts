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
 * Resolves the interval in months for a given template.
 */
export function getIntervalMonths(template: { frequency?: string; frequencyIntervalMonths?: number }): number {
  if (template.frequencyIntervalMonths && template.frequencyIntervalMonths > 0) {
    return template.frequencyIntervalMonths;
  }
  if (template.frequency === 'quarterly') return 3;
  if (template.frequency === 'half_yearly') return 6;
  if (template.frequency === 'yearly') return 12;
  return 1; // monthly default
}

/**
 * Returns the candidate month string according to interval in months.
 */
export function getNextCandidateMonth(monthStr: string, intervalMonths: number = 1): string {
  const [year, month] = monthStr.split('-').map(Number);
  const inc = Math.max(1, intervalMonths || 1);

  let totalMonths = (month - 1) + inc;
  let newYear = year + Math.floor(totalMonths / 12);
  let newMonth = (totalMonths % 12) + 1;

  return `${newYear}-${String(newMonth).padStart(2, '0')}`;
}

/**
 * Returns the month before the start month according to interval so the first trigger executes on startDate.
 */
export function getInitialLastGenMonth(startDate: string, intervalMonths: number = 1): string {
  const [year, month] = startDate.split('-').map(Number);
  const dec = Math.max(1, intervalMonths || 1);

  let totalMonths = (month - 1) - dec;
  let newYear = year + Math.floor(totalMonths / 12);
  let newMonth = (((totalMonths % 12) + 12) % 12) + 1;

  return `${newYear}-${String(newMonth).padStart(2, '0')}`;
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
    const intervalMonths = getIntervalMonths(template as any);
    let lastGeneratedMonth = template.lastGeneratedMonth;
    
    // Safety fallback: if somehow lastGeneratedMonth is not set, initialize to the interval before startDate
    if (!lastGeneratedMonth) {
      lastGeneratedMonth = getInitialLastGenMonth(template.startDate, intervalMonths);
    }
    
    let candidateMonth = getNextCandidateMonth(lastGeneratedMonth, intervalMonths);
    
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
        // Safeguard: check if we've already generated OR if user manually recorded an entry
        // this month for this template on ANY date. This prevents creating a duplicate
        // auto-entry on the scheduled day (e.g. 5th) when the user already received rent on the 3rd.
        const monthStart = `${cYear}-${String(cMonth).padStart(2, '0')}-01`;
        const monthEnd   = `${cYear}-${String(cMonth).padStart(2, '0')}-31`;

        const alreadyExists = await db.collection('expenses').findOne({
          space_id: template.space_id,
          associatedId: template._id.toString(),
          associatedType: 'recurring',
          date: { $gte: monthStart, $lte: monthEnd }
        });

        if (!alreadyExists) {
          // We secured the lock for this candidateMonth. Now insert the daily expense log.
          const expenseDoc = {
            space_id: template.space_id,
            user_id: template.user_id || userId,
            date: targetDateStr,
            itemName: template.itemName,
            amount: Number(template.amount),
            note: template.note || 'Generated automatically',
            category: categorizeExpense(template.itemName, template.note, Number(template.amount), template.type || 'expense', template.category),
            type: template.type || 'expense',
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
      
      candidateMonth = getNextCandidateMonth(lastGeneratedMonth, intervalMonths);
    }
  }
}
