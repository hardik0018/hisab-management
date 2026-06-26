import { ObjectId } from 'mongodb';

export interface Expense {
  _id?: string | ObjectId;
  space_id: string;
  user_id: string;
  date: string; // "YYYY-MM-DD"
  itemName: string;
  amount: number;
  note: string;
  category: string; // defaults to "Uncategorized"
  currency: string; // defaults to "INR"
  type?: 'expense' | 'income'; // defaults to 'expense'
  createdAt: Date | string;
  updatedAt: Date | string;
  associatedId?: string;
  associatedType?: 'hisab' | 'marriage' | 'recurring';
}

export interface RecurringExpense {
  _id?: string;
  space_id: string;
  user_id: string;
  itemName: string;
  amount: number;
  note?: string;
  category?: string; // defaults to "Uncategorized"
  dayOfMonth: number; // 1-31
  isActive: boolean;
  startDate: string; // "YYYY-MM"
  lastGeneratedMonth: string; // "YYYY-MM"
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface Settings {
  _id?: string | ObjectId;
  space_id?: string;
  currency: string;
  largeAmountLimit: number;
  lastBackupAt: string | null; // "YYYY-MM-DD" or ISO date string
  backupReminder: {
    enabled: boolean;
    frequency: 'monthly';
    display: 'inside-app';
  };
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface ParsedExpense {
  date: string; // "YYYY-MM-DD"
  itemName: string;
  amount: number;
  note: string;
  isLarge: boolean;
  type?: 'expense' | 'income';
}

export interface InvalidLine {
  line: string;
  reason: string;
}

export interface ParseResult {
  validExpenses: ParsedExpense[];
  invalidLines: InvalidLine[];
  hasLargeAmount: boolean;
  dateConflict: {
    textDate: string;
    selectedDate: string;
  } | null;
  previewRequired: boolean;
}
