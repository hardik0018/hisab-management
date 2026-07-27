import { Expense } from '@/types';
import { formatDisplayTime } from './date-utils';
import { categorizeExpense } from './category-engine';

export function generateCSV(expenses: Expense[]): string {
  const headers = [
    'Date',
    'Time',
    'Item',
    'Amount',
    'Note',
    'Category',
    'CreatedAt',
    'UpdatedAt'
  ];

  const escapeCSV = (val: any): string => {
    if (val === null || val === undefined) return '';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = expenses.map(exp => {
    const dateStr = exp.date;
    const timeStr = formatDisplayTime(exp.createdAt);
    const itemName = exp.itemName;
    const amount = exp.amount;
    const note = exp.note;
    const category = categorizeExpense(exp.itemName, exp.note, exp.amount, exp.type, exp.category);
    
    // Formatting timestamps nicely in CSV
    const createdAt = exp.createdAt instanceof Date ? exp.createdAt.toISOString() : new Date(exp.createdAt).toISOString();
    const updatedAt = exp.updatedAt instanceof Date ? exp.updatedAt.toISOString() : new Date(exp.updatedAt).toISOString();

    return [
      escapeCSV(dateStr),
      escapeCSV(timeStr),
      escapeCSV(itemName),
      amount,
      escapeCSV(note),
      escapeCSV(category),
      escapeCSV(createdAt),
      escapeCSV(updatedAt)
    ];
  });

  const csvContent = [
    headers.join(','),
    ...rows.map(r => r.join(','))
  ].join('\n');

  return csvContent;
}
