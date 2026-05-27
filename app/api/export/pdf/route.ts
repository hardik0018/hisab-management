export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { generatePDFBuffer } from '@/lib/export-pdf';
import { updateSystemSettings } from '@/models/Settings';
import { getAuthenticatedUser } from '@/lib/auth';
import { formatDisplayDate } from '@/lib/date-utils';
import { Expense } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized', message: 'You must be logged in' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const search = searchParams.get('search');
    const dateFilter = searchParams.get('date');

    const db = await getDb();
    const spaceId = user.space_id || user.user_id;
    const query: any = { space_id: spaceId };

    // Resolve Range & Query Filters
    let dateRange = 'Current Month';
    if (month && month !== 'all') {
      query.date = { $regex: `^${month}` };
      const [year, mon] = month.split('-');
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      const monthName = monthNames[parseInt(mon, 10) - 1] || mon;
      dateRange = `${monthName} ${year}`;
    } else if (startDate || endDate) {
      query.date = {};
      let startText = 'Beginning';
      let endText = 'Present';
      if (startDate) {
        query.date.$gte = startDate;
        startText = formatDisplayDate(startDate);
      }
      if (endDate) {
        query.date.$lte = endDate;
        endText = formatDisplayDate(endDate);
      }
      dateRange = `${startText} to ${endText}`;
    } else if (month === 'all') {
      dateRange = 'All Time';
    } else {
      const now = new Date();
      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      query.date = { $regex: `^${yyyy}-${mm}` };
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      dateRange = `${monthNames[now.getMonth()]} ${yyyy}`;
    }

    // Apply active list filters to PDF report as well
    if (dateFilter) {
      query.date = dateFilter;
    }
    if (search) {
      const searchRegex = { $regex: search, $options: 'i' };
      query.$or = [
        { itemName: searchRegex },
        { note: searchRegex }
      ];
    }

    const expenses = (await db
      .collection('expenses')
      .find(query)
      .sort({ date: -1, createdAt: -1 })
      .toArray()) as unknown as Expense[];

    const filterParts: string[] = [];
    if (search) filterParts.push(`Search: "${search}"`);
    if (dateFilter) filterParts.push(`Date: ${formatDisplayDate(dateFilter)}`);
    const appliedFilters = filterParts.join(' | ');

    const reportTitle = 'Expense Summary Report';
    const pdfBuffer = await generatePDFBuffer(expenses, reportTitle, dateRange, appliedFilters);

    // Reset backup reminder
    await updateSystemSettings(spaceId, {
      lastBackupAt: new Date().toISOString()
    });

    let filename = 'expenses-report';
    if (month && month !== 'all') {
      filename += `-${month}`;
    } else if (startDate && endDate) {
      filename += `-range-${startDate}-to-${endDate}`;
    }

    return new Response(pdfBuffer as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}.pdf"`,
      },
    });
  } catch (error) {
    console.error('[API_EXPORT_PDF_ERROR]', error);
    return Response.json(
      { error: 'Internal Server Error', message: 'Failed to generate PDF report' },
      { status: 500 }
    );
  }
}
