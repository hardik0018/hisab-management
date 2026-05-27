import * as XLSX from 'xlsx';
import { Expense } from '@/types';
import { formatDisplayTime } from './date-utils';

export function generateExcelBuffer(expenses: Expense[]): Buffer {
  const data = expenses.map(exp => {
    const createdAtStr = exp.createdAt instanceof Date 
      ? exp.createdAt.toISOString() 
      : new Date(exp.createdAt).toISOString();
    const updatedAtStr = exp.updatedAt instanceof Date 
      ? exp.updatedAt.toISOString() 
      : new Date(exp.updatedAt).toISOString();

    return {
      'Date': exp.date,
      'Time': formatDisplayTime(exp.createdAt),
      'Item': exp.itemName,
      'Amount': exp.amount, // Numeric value in Excel
      'Note': exp.note || '',
      'Category': exp.category || 'Uncategorized',
      'CreatedAt': createdAtStr,
      'UpdatedAt': updatedAtStr
    };
  });

  // Create worksheet
  const worksheet = XLSX.utils.json_to_sheet(data);

  // Set column widths for better visual layout
  const colWidths = [
    { wch: 12 }, // Date
    { wch: 12 }, // Time
    { wch: 25 }, // Item
    { wch: 12 }, // Amount
    { wch: 30 }, // Note
    { wch: 15 }, // Category
    { wch: 25 }, // CreatedAt
    { wch: 25 }  // UpdatedAt
  ];
  worksheet['!cols'] = colWidths;

  // Create workbook and append worksheet
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Expenses');

  // Write to a node buffer
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  return buffer;
}
