export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { parseExpenses } from '@/lib/expense-parser';
import { getSystemSettings } from '@/models/Settings';
import { getAuthenticatedUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized', message: 'You must be logged in' }, { status: 401 });
    }

    const body = await request.json();
    const { text, datePickerDate } = body;

    if (text === undefined || !datePickerDate) {
      return Response.json(
        { error: 'Bad Request', message: 'Missing fields: text and datePickerDate are required' },
        { status: 400 }
      );
    }

    const spaceId = user.space_id || user.user_id;
    const settings = await getSystemSettings(spaceId);
    const result = parseExpenses(text, datePickerDate, settings.largeAmountLimit);

    return Response.json({ result });
  } catch (error) {
    console.error('[API_EXPENSES_PARSE_ERROR]', error);
    return Response.json(
      { error: 'Internal Server Error', message: 'An error occurred while parsing expenses' },
      { status: 500 }
    );
  }
}
