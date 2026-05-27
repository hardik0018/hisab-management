const MONTHS: { [key: string]: number } = {
  jan: 1, january: 1,
  feb: 2, february: 2,
  mar: 3, march: 3,
  apr: 4, april: 4,
  may: 5,
  jun: 6, june: 6,
  jul: 7, july: 7,
  aug: 8, august: 8,
  sep: 9, september: 9,
  oct: 10, october: 10,
  nov: 11, november: 11,
  dec: 12, december: 12
};

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

/**
 * Parses a date string in various text formats and returns it in "YYYY-MM-DD" format.
 * Returns null if the text does not match any expected date format.
 */
export function parseTextDate(text: string): string | null {
  const cleanText = text.trim().toLowerCase();

  // 1. DD-MMM-YY (e.g., 27-may-26)
  const dmyyMatch = cleanText.match(/^(\d{1,2})-([a-z]{3,9})-(\d{2})$/);
  if (dmyyMatch) {
    const day = parseInt(dmyyMatch[1], 10);
    const monthStr = dmyyMatch[2];
    const yearYY = parseInt(dmyyMatch[3], 10);
    const month = MONTHS[monthStr];
    if (month && day >= 1 && day <= 31) {
      const year = 2000 + yearYY;
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
  }

  // 2. DD/MM/YYYY (e.g., 27/05/2026)
  const dmyyyyMatch = cleanText.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dmyyyyMatch) {
    const day = parseInt(dmyyyyMatch[1], 10);
    const month = parseInt(dmyyyyMatch[2], 10);
    const year = parseInt(dmyyyyMatch[3], 10);
    if (day >= 1 && day <= 31 && month >= 1 && month <= 12) {
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
  }

  // 3. YYYY-MM-DD (e.g., 2026-05-27)
  const yymmddMatch = cleanText.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (yymmddMatch) {
    const year = parseInt(yymmddMatch[1], 10);
    const month = parseInt(yymmddMatch[2], 10);
    const day = parseInt(yymmddMatch[3], 10);
    if (day >= 1 && day <= 31 && month >= 1 && month <= 12) {
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
  }

  // 4. DD MMM YYYY (e.g., 27 May 2026)
  const dmyMatch = cleanText.match(/^(\d{1,2})\s+([a-z]{3,9})\s+(\d{4})$/);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const monthStr = dmyMatch[2];
    const year = parseInt(dmyMatch[3], 10);
    const month = MONTHS[monthStr];
    if (month && day >= 1 && day <= 31) {
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
  }

  return null;
}

/**
 * Formats a YYYY-MM-DD date string into "DD-MMM-YYYY" (e.g., "27-May-2026")
 */
export function formatDisplayDate(dateStr: string): string {
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  
  const year = parts[0];
  const monthIdx = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  
  const monthName = MONTH_NAMES[monthIdx] || parts[1];
  return `${String(day).padStart(2, '0')}-${monthName}-${year}`;
}

/**
 * Formats a Date object or ISO string into local 12-hour format "hh:mm AM/PM" (e.g. "09:15 AM")
 */
export function formatDisplayTime(dateInput: Date | string): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return '';

  // Get Indian Standard Time offset if needed, but standard local formatting is preferred
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  const minutesStr = String(minutes).padStart(2, '0');
  const hoursStr = String(hours).padStart(2, '0');
  
  return `${hoursStr}:${minutesStr} ${ampm}`;
}
