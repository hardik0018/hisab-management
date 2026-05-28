import { Expense } from '@/types';

export function validateExpense(expense: Partial<Expense>): { isValid: boolean; reason?: string } {
  const { itemName, amount, date } = expense;

  if (!itemName || itemName.trim().length < 2) {
    return { isValid: false, reason: 'Item name must be at least 2 characters' };
  }

  if (amount === undefined || amount === null) {
    return { isValid: false, reason: 'Amount is required' };
  }

  if (isNaN(amount)) {
    return { isValid: false, reason: 'Amount must be a number' };
  }

  if (expense.associatedType) {
    if (amount === 0) {
      return { isValid: false, reason: 'Amount must not be 0' };
    }
  } else {
    if (amount <= 0) {
      return { isValid: false, reason: 'Amount must be greater than 0' };
    }
  }

  // Validate date format: YYYY-MM-DD
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return { isValid: false, reason: 'Date must be in YYYY-MM-DD format' };
  }

  return { isValid: true };
}
