import { ParseResult, ParsedExpense, InvalidLine } from '@/types';
import { parseTextDate } from './date-utils';

/**
 * Parses multiline text input into a list of valid expense objects and invalid lines.
 * 
 * @param text The multiline plain text entered by the user.
 * @param datePickerDate The selected date string in "YYYY-MM-DD" format from the UI date picker.
 * @param largeLimit The threshold for identifying large expense amounts.
 */
export function parseExpenses(
  text: string,
  datePickerDate: string,
  largeLimit: number = 10000
): ParseResult {
  const lines = text.split(/\r?\n/);
  const validExpenses: ParsedExpense[] = [];
  const invalidLines: InvalidLine[] = [];
  
  let activeDate = datePickerDate;
  const textDatesSeen: string[] = [];
  let hasLargeAmount = false;

  // Pattern for extracting: Item Name, Separator, optional currency, Amount, optional Note
  // Handles:
  // - Separator: optional spaces, followed by -, :, =, or space(s)
  // - Currency symbol: optional ₹, Rs, Rs., Rs, rs, rs., INR, followed by optional spaces
  // - Amount: integer or decimal number
  // - Note: trailing characters starting with space(s) or parentheses
  const expenseRegex = /^(?<item>.+?)\s*(?:[-:=]\s*|\s+)(?:₹|Rs\.?|INR)?\s*(?<amount>\d+(?:\.\d+)?)(?:\s+(?<note>.+))?$/i;

  for (const rawLine of lines) {
    const trimmedLine = rawLine.trim();
    if (!trimmedLine) {
      continue; // Skip empty lines
    }

    // 1. Check if the line is a date line
    const parsedDate = parseTextDate(trimmedLine);
    if (parsedDate) {
      activeDate = parsedDate;
      textDatesSeen.push(parsedDate);
      continue;
    }

    // 2. Treat as expense line
    const match = trimmedLine.match(expenseRegex);
    if (!match || !match.groups) {
      invalidLines.push({
        line: rawLine,
        reason: 'Invalid expense format. Use format like: Item-Amount [optional note]'
      });
      continue;
    }

    const { item, amount: amountStr, note: rawNote } = match.groups;
    const itemName = item.trim();
    const amount = parseFloat(amountStr);

    // Run custom validators
    if (itemName.length < 2) {
      invalidLines.push({
        line: rawLine,
        reason: 'Item name must be at least 2 characters long'
      });
      continue;
    }

    if (isNaN(amount) || amount <= 0) {
      invalidLines.push({
        line: rawLine,
        reason: 'Amount must be a positive number greater than 0'
      });
      continue;
    }

    // Clean optional note (strip enclosing parentheses if present)
    let note = (rawNote || '').trim();
    if (note.startsWith('(') && note.endsWith(')')) {
      note = note.slice(1, -1).trim();
    }

    const isLarge = amount >= largeLimit;
    if (isLarge) {
      hasLargeAmount = true;
    }

    validExpenses.push({
      date: activeDate,
      itemName,
      amount,
      note,
      isLarge
    });
  }

  // Determine if a date conflict exists
  // We compare the final parsed date (if any text date was specified) with the selected datepicker date.
  let dateConflict: ParseResult['dateConflict'] = null;
  if (textDatesSeen.length > 0) {
    // If the last parsed date in the text differs from the date picker date, we trigger conflict warning
    const lastTextDate = textDatesSeen[textDatesSeen.length - 1];
    if (lastTextDate !== datePickerDate) {
      dateConflict = {
        textDate: lastTextDate,
        selectedDate: datePickerDate
      };
    }
  }

  // A preview is required if:
  // - There are invalid lines.
  // - There are date conflicts.
  // - There is a large amount warning.
  const previewRequired = invalidLines.length > 0 || dateConflict !== null || hasLargeAmount;

  return {
    validExpenses,
    invalidLines,
    hasLargeAmount,
    dateConflict,
    previewRequired
  };
}
