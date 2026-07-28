import ExcelJS from 'exceljs';
import { Expense } from '@/types';
import { formatDisplayTime } from './date-utils';
import { categorizeExpense } from './category-engine';

export async function generateExcelBuffer(expenses: Expense[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Expenses');

  // Define columns
  worksheet.columns = [
    { header: 'Date', key: 'date', width: 12 },
    { header: 'Time', key: 'time', width: 12 },
    { header: 'Item', key: 'itemName', width: 25 },
    { header: 'Amount', key: 'amount', width: 12 },
    { header: 'Note', key: 'note', width: 30 },
    { header: 'Category', key: 'category', width: 15 },
    { header: 'CreatedAt', key: 'createdAt', width: 25 },
    { header: 'UpdatedAt', key: 'updatedAt', width: 25 }
  ];

  // Add rows
  expenses.forEach(exp => {
    const createdAtStr = exp.createdAt instanceof Date 
      ? exp.createdAt.toISOString() 
      : new Date(exp.createdAt).toISOString();
    const updatedAtStr = exp.updatedAt instanceof Date 
      ? exp.updatedAt.toISOString() 
      : new Date(exp.updatedAt).toISOString();

    worksheet.addRow({
      date: exp.date,
      time: formatDisplayTime(exp.createdAt),
      itemName: exp.itemName,
      amount: exp.amount, // Numeric value in Excel
      note: exp.note || '',
      category: categorizeExpense(exp.itemName, exp.note, exp.amount, exp.type, exp.category),
      createdAt: createdAtStr,
      updatedAt: updatedAtStr
    });
  });

  // Write to a node buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return buffer as unknown as Buffer;
}
