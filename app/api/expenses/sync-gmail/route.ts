import { google } from 'googleapis';
import { getDb } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';
import { ObjectId } from 'mongodb';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDb();
    
    // 1. Get Google Account/Token for the user
    // In next-auth with MongoDB adapter, accounts are stored in 'accounts' collection
    // The user ID in session is the MongoDB ID of the user
    const userId = user._id;
    const account = await db.collection('accounts').findOne({ 
      userId: new ObjectId(userId), 
      provider: 'google' 
    });

    if (!account || !account.access_token) {
      console.error('[GMAIL_SYNC] ERROR: Account or token not found', { 
        userId, 
        hasAccount: !!account, 
        provider: account?.provider 
      });
      return Response.json({ 
        error: 'Missing Google Account or Token', 
        details: 'Try logging in again to grant Gmail permissions.' 
      }, { status: 403 });
    }

    console.log('[GMAIL_SYNC] Account Info:', {
      provider: account.provider,
      hasRefreshToken: !!account.refresh_token,
      expiresAt: account.expires_at,
      currentTime: Math.floor(Date.now() / 1000),
      isExpired: account.expires_at ? account.expires_at < Math.floor(Date.now() / 1000) : 'unknown'
    });

    console.log('[GMAIL_SYNC] Access Token Format Check:', { 
      length: account.access_token.length,
      startsWith: account.access_token.substring(0, 5) + '...'
    });

    // 2. Setup Google Auth Client
    const authClient = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );
    authClient.setCredentials({
      access_token: account.access_token as string,
      refresh_token: account.refresh_token as string,
    });

    // Check if token needs refresh
    try {
      if (account.expires_at && account.expires_at < Math.floor(Date.now() / 1000)) {
        console.log('[GMAIL_SYNC] Token expired, attempting refresh...');
        if (!account.refresh_token) {
          throw new Error('No refresh token available in database.');
        }

        const { credentials } = await authClient.refreshAccessToken();
        console.log('[GMAIL_SYNC] Token refreshed successfully');
        
        // Update database with new tokens
        await db.collection('accounts').updateOne(
          { _id: account._id },
          { $set: { 
              access_token: credentials.access_token,
              expires_at: Math.floor((credentials.expiry_date || 0) / 1000),
              refresh_token: credentials.refresh_token || account.refresh_token
            }
          }
        );
      }
    } catch (refreshError: any) {
      console.error('[GMAIL_SYNC] REFRESH ERROR:', refreshError.message);
      // We'll continue and see if the current access_token still works (sometimes expires_at is inaccurate)
    }

    const gmail = google.gmail({ version: 'v1', auth: authClient });

    // 3. Search for transaction emails
    // Common subjects: "Transaction Alert", "Paid to", "Debited", "Spent"
    const query = 'subject:("Transaction Alert" OR "Paid to" OR "Debited" OR "Spent") after:2026/01/01';
    const response = await gmail.users.messages.list({
      userId: 'me',
      q: query,
      maxResults: 20
    });
    
    const messages = response.data.messages || [];
    const newExpenses = [];
    for (const msg of messages) {
      const detail = await gmail.users.messages.get({
        userId: 'me',
        id: msg.id!
      });

      const snippet = detail.data.snippet || '';
      const body = detail.data.payload?.body?.data 
        ? Buffer.from(detail.data.payload.body.data, 'base64').toString()
        : snippet;

      // 4. Parse transaction details using Regex
      // Look for ₹ or RS. followed by amount
      const amountMatch = body.match(/(?:₹|Rs\.?|INR)\s*(\d+(?:\.\d{2})?)/i);
      const amount = amountMatch ? parseFloat(amountMatch[1]) : null;

      if (amount && amount > 0) {
        // Look for merchant/title
        // "Paid to XYZ", "Spent at ABC", "Transaction at PQR"
        const merchantMatch = body.match(/(?:at|to|on)\s+([A-Z0-9\s&]{3,20})/i);
        const title = merchantMatch ? merchantMatch[1].trim() : 'Bank Transaction';

        const date = new Date(parseInt(detail.data.internalDate!));
        
        // Avoid duplicates (idempotency)
        // We can use the gmail message ID as a unique identifier in notes or a dedicated field
        const existing = await db.collection('expenses').findOne({ 
          space_id: user.space_id,
          notes: { $regex: msg.id! }
        });

        if (!existing) {
          const expenseId = `exp_${uuidv4().split('-')[0]}`;
          const expense = {
            expense_id: expenseId,
            user_id: user.user_id,
            space_id: user.space_id,
            title,
            amount,
            category: 'Other', // Auto-categorization could be added later
            paymentMode: 'online',
            date,
            notes: `Auto-synced from Gmail (ID: ${msg.id})`,
            created_at: new Date(),
            updated_at: new Date(),
          };
          
          await db.collection('expenses').insertOne(expense);
          newExpenses.push(expense);
        }
      }
    }

    return Response.json({ 
      success: true, 
      count: newExpenses.length,
      synced: newExpenses
    });

  } catch (error: any) {
    console.error('[GMAIL_SYNC_ERROR]', error);
    return Response.json({ 
      error: 'Gmail Sync Failed', 
      message: error.message 
    }, { status: 500 });
  }
}
