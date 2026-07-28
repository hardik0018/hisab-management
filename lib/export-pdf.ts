import PDFDocument from 'pdfkit';
import { Expense } from '@/types';
import { formatDisplayDate, formatDisplayTime } from './date-utils';
import { categorizeExpense } from './category-engine';
import path from 'path';

export function generatePDFBuffer(
  expenses: Expense[],
  reportTitle: string,
  dateRange: string,
  appliedFilters: string
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        bufferPages: true // Allows two-pass rendering for page count
      });

      const regularFontPath = path.join(process.cwd(), 'public', 'fonts', 'Roboto-Regular.ttf');
      const boldFontPath = path.join(process.cwd(), 'public', 'fonts', 'Roboto-Bold.ttf');
      doc.registerFont('Roboto-Regular', regularFontPath);
      doc.registerFont('Roboto-Bold', boldFontPath);

      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err) => reject(err));

      const now = new Date();
      const generatedTime = `${formatDisplayDate(now.toISOString().split('T')[0])} ${formatDisplayTime(now)}`;

      // Calculate summaries
      const totalAmount = expenses.reduce((sum, exp) => sum + exp.amount, 0);
      const totalCount = expenses.length;

      // Group daily totals for the summary table
      const dailyMap: { [date: string]: number } = {};
      for (const exp of expenses) {
        dailyMap[exp.date] = (dailyMap[exp.date] || 0) + exp.amount;
      }
      const dailyTotals = Object.entries(dailyMap)
        .map(([date, total]) => ({ date, total }))
        .sort((a, b) => b.date.localeCompare(a.date)); // Latest date first

      // --- DOCUMENT HEADER ---
      // Primary banner (Deep Slate Blue)
      doc.rect(50, 45, 495, 60).fill('#1E293B');
      doc.rect(50, 102, 495, 3).fill('#6366F1'); // Premium branding accent line
      
      doc.fillColor('#FFFFFF')
         .fontSize(18)
         .font('Roboto-Bold')
         .text(reportTitle.toUpperCase(), 70, 58);

      doc.fillColor('#94A3B8')
         .fontSize(9)
         .font('Roboto-Regular')
         .text('PERSONAL EXPENSE TRACKER REPORT', 70, 80);

      // Meta details side
      doc.fillColor('#E2E8F0')
         .fontSize(8)
         .font('Roboto-Bold')
         .text('Generated On:', 400, 58, { width: 130, align: 'right' })
         .font('Roboto-Regular')
         .text(generatedTime, 400, 68, { width: 130, align: 'right' })
         .font('Roboto-Bold')
         .text('Range:', 400, 80, { width: 130, align: 'right' })
         .font('Roboto-Regular')
         .text(dateRange, 400, 90, { width: 130, align: 'right' });

      let currentY = 125;

      // --- APPLIED FILTERS ---
      if (appliedFilters) {
        doc.rect(50, currentY, 495, 20).fill('#F1F5F9');
        doc.fillColor('#475569')
           .fontSize(8)
           .font('Roboto-Bold')
           .text(`Filters: `, 60, currentY + 6, { continued: true })
           .font('Roboto-Regular')
           .text(appliedFilters);
        currentY += 30;
      }

      // --- SUMMARY CARDS ---
      const cardWidth = 237;
      const cardHeight = 50;

      // Total Spent Card
      doc.rect(50, currentY, cardWidth, cardHeight).fill('#F8FAFC');
      doc.rect(50, currentY, cardWidth, cardHeight).stroke('#E2E8F0');
      doc.rect(50, currentY, 4, cardHeight).fill('#6366F1'); // Indigo accent line
      
      doc.fillColor('#64748B').fontSize(8).font('Roboto-Bold').text('TOTAL SPENT', 65, currentY + 10);
      doc.fillColor('#0F172A').fontSize(16).font('Roboto-Bold').text(`₹${totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`, 65, currentY + 22);

      // Total Transactions Card
      doc.rect(50 + cardWidth + 21, currentY, cardWidth, cardHeight).fill('#F8FAFC');
      doc.rect(50 + cardWidth + 21, currentY, cardWidth, cardHeight).stroke('#E2E8F0');
      doc.rect(50 + cardWidth + 21, currentY, 4, cardHeight).fill('#475569'); // Dark Slate accent line
      
      doc.fillColor('#64748B').fontSize(8).font('Roboto-Bold').text('TOTAL ENTRIES', 50 + cardWidth + 36, currentY + 10);
      doc.fillColor('#0F172A').fontSize(16).font('Roboto-Bold').text(`${totalCount} records`, 50 + cardWidth + 36, currentY + 22);

      currentY += 70;

      // --- DAILY BREAKDOWN ---
      doc.fillColor('#0F172A').fontSize(12).font('Roboto-Bold').text('Daily Breakdown', 50, currentY);
      currentY += 15;

      // Draw Daily Totals table
      doc.rect(50, currentY, 495, 18).fill('#E2E8F0');
      doc.fillColor('#334155').fontSize(8).font('Roboto-Bold');
      doc.text('Date', 60, currentY + 5);
      doc.text('Total Spent', 250, currentY + 5, { width: 100, align: 'right' });
      doc.text('% of Report Total', 430, currentY + 5, { width: 100, align: 'right' });
      currentY += 18;

      let drawDailyCount = 0;
      for (const daily of dailyTotals) {
        // Simple page breaking safety
        if (currentY > 730) {
          doc.addPage();
          currentY = 50;
        }

        // Zebra striping
        if (drawDailyCount % 2 === 1) {
          doc.rect(50, currentY, 495, 16).fill('#F8FAFC');
        }
        
        const pct = totalAmount > 0 ? ((daily.total / totalAmount) * 100).toFixed(1) : '0.0';

        doc.fillColor('#334155').fontSize(8).font('Roboto-Regular');
        doc.text(formatDisplayDate(daily.date), 60, currentY + 4);
        doc.text(`₹${daily.total.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`, 250, currentY + 4, { width: 100, align: 'right' });
        doc.text(`${pct}%`, 430, currentY + 4, { width: 100, align: 'right' });

        currentY += 16;
        drawDailyCount++;
      }

      currentY += 25;

      // --- DETAILED EXPENSE LIST ---
      doc.fillColor('#0F172A').fontSize(12).font('Roboto-Bold').text('Expense Directory', 50, currentY);
      currentY += 15;

      // Table Header
      doc.rect(50, currentY, 495, 20).fill('#0F172A');
      doc.fillColor('#FFFFFF').fontSize(8).font('Roboto-Bold');
      doc.text('Date / Time', 60, currentY + 6);
      doc.text('Item Name', 160, currentY + 6);
      doc.text('Category', 280, currentY + 6);
      doc.text('Note', 360, currentY + 6);
      doc.text('Amount', 475, currentY + 6, { width: 60, align: 'right' });
      currentY += 20;

      let listCount = 0;
      for (const exp of expenses) {
        if (currentY > 740) {
          doc.addPage();
          // Draw table header on new page
          doc.rect(50, 40, 495, 20).fill('#0F172A');
          doc.fillColor('#FFFFFF').fontSize(8).font('Roboto-Bold');
          doc.text('Date / Time', 60, 46);
          doc.text('Item Name', 160, 46);
          doc.text('Category', 280, 46);
          doc.text('Note', 360, 46);
          doc.text('Amount', 475, 46, { width: 60, align: 'right' });
          currentY = 60;
        }

        if (listCount % 2 === 1) {
          doc.rect(50, currentY, 495, 26).fill('#F8FAFC');
        }

        const dateDisplay = formatDisplayDate(exp.date);
        const timeDisplay = formatDisplayTime(exp.createdAt);
        const isNegative = exp.amount < 0;
        const absAmt = Math.abs(exp.amount);
        const amountDisplay = `${isNegative ? '-' : ''}₹${absAmt.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

        // Col 1: Date & Time
        doc.fillColor('#334155').fontSize(8).font('Roboto-Regular');
        doc.text(dateDisplay, 60, currentY + 5);
        doc.fillColor('#94A3B8').fontSize(7).text(timeDisplay, 60, currentY + 14);
        
        // Col 2: Item Name
        doc.fillColor('#0F172A').font('Roboto-Bold').text(exp.itemName, 160, currentY + 9, { width: 110, height: 10, ellipsis: true });
        
        // Col 3: Category
        const catText = categorizeExpense(exp.itemName, exp.note, exp.amount, exp.type, exp.category);
        doc.fillColor('#64748B').font('Roboto-Regular').text(catText, 280, currentY + 9, { width: 70, height: 10, ellipsis: true });
        
        // Col 4: Note
        doc.text(exp.note || '-', 360, currentY + 9, { width: 110, height: 10, ellipsis: true });
        
        // Col 5: Amount
        doc.fillColor(isNegative ? '#10B981' : '#0F172A').font('Roboto-Bold').text(amountDisplay, 475, currentY + 9, { width: 60, align: 'right' });

        currentY += 26;
        listCount++;
      }

      // --- PAGE NUMBERS FOOTER ---
      const range = doc.bufferedPageRange();
      for (let i = 0; i < range.count; i++) {
        doc.switchToPage(i);
        doc.rect(50, 785, 495, 1).fill('#E2E8F0');
        doc.fillColor('#94A3B8')
           .fontSize(7)
           .font('Roboto-Regular')
           .text(`Page ${i + 1} of ${range.count}`, 50, 792, { align: 'center', width: 495 });
      }

      doc.end();
    } catch (e) {
      reject(e);
    }
  });
}
