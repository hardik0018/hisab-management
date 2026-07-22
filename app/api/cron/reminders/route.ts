import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { Resend } from 'resend';
import webpush from 'web-push';

const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy');

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Allow up to 60s for emails

export async function GET(req: NextRequest) {
  try {
    // 1. Verify Vercel Cron Security
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return Response.json({ error: 'Unauthorized cron request' }, { status: 401 });
    }

    if (!process.env.RESEND_API_KEY) {
      console.warn('RESEND_API_KEY is not set. Skipping email dispatch.');
      return Response.json({ message: 'Resend API key missing' }, { status: 200 });
    }

    const db = await getDb();
    
    // 2. Fetch all users
    const users = await db.collection('users').find({ email: { $exists: true } }).toArray();
    if (!users.length) return Response.json({ message: 'No users found' });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const horizon = new Date(today);
    horizon.setDate(horizon.getDate() + 7); // Remind for things due in the next 7 days
    const horizonStr = horizon.toISOString().slice(0, 10);

    const dayDiff = (d: string) => Math.round((new Date(d).getTime() - today.getTime()) / 86400000);

    let sentCount = 0;

    // 3. Process each user
    for (const user of users) {
      if (!user.email) continue;
      const spaceId = user.space_id || user.user_id;

      const insurances = await db.collection('insurance_policies')
        .find({ space_id: spaceId, nextDueDate: { $lte: horizonStr } })
        .toArray();

      const warranties = await db.collection('warranties')
        .find({ space_id: spaceId, expiryDate: { $lte: horizonStr } })
        .toArray();

      const urgentItems: Array<{ type: string; name: string; due: string; daysLeft: number; amount?: number }> = [];

      insurances.forEach((p: any) => {
        urgentItems.push({
          type: 'Insurance Premium',
          name: p.policyName,
          due: p.nextDueDate,
          daysLeft: dayDiff(p.nextDueDate),
          amount: p.premiumAmount
        });
      });

      warranties.forEach((w: any) => {
        urgentItems.push({
          type: 'Warranty Expiry',
          name: w.itemName,
          due: w.expiryDate,
          daysLeft: dayDiff(w.expiryDate)
        });
      });

      // 4. Send email if there are urgent items
      if (urgentItems.length > 0) {
        // Filter to only send if daysLeft is exactly 7, 3, 1, or 0 to prevent spamming every single day
        const shouldSend = urgentItems.some(i => [7, 3, 1, 0, -1].includes(i.daysLeft));
        
        if (shouldSend) {
          const htmlContent = buildEmailHtml(user.name || 'User', urgentItems);
          
          if (process.env.RESEND_API_KEY) {
            await resend.emails.send({
              from: 'Vault Reminders <onboarding@resend.dev>', // Free tier Resend limit
              to: user.email,
              subject: `Action Required: ${urgentItems.length} items due soon in your Vault`,
              html: htmlContent
            });
            sentCount++;
          }

          // 5. Send Push Notifications
          if (process.env.VAPID_PRIVATE_KEY && process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
            webpush.setVapidDetails(
              process.env.VAPID_SUBJECT || 'mailto:vault@yourdomain.com',
              process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
              process.env.VAPID_PRIVATE_KEY
            );

            const pushSubscriptions = await db.collection('push_subscriptions').find({ user_id: user.user_id }).toArray();
            
            const payload = JSON.stringify({
              title: `Vault Reminder`,
              body: `You have ${urgentItems.length} items due soon in your Vault.`,
              url: '/vault'
            });

            for (const sub of pushSubscriptions) {
              try {
                await webpush.sendNotification(sub.subscription, payload);
              } catch (pushErr: any) {
                if (pushErr.statusCode === 404 || pushErr.statusCode === 410) {
                  console.log('Subscription has expired or is no longer valid: ', pushErr);
                  await db.collection('push_subscriptions').deleteOne({ _id: sub._id });
                } else {
                  console.error('Push notification error:', pushErr);
                }
              }
            }
          }
        }
      }
    }

    return Response.json({ success: true, emailsSent: sentCount });

  } catch (err) {
    console.error('[CRON_REMINDERS_ERROR]', err);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

function buildEmailHtml(name: string, items: any[]) {
  const formatDays = (d: number) => {
    if (d < 0) return `<span style="color: #dc2626; font-weight: bold;">Overdue by ${-d} days</span>`;
    if (d === 0) return `<span style="color: #ea580c; font-weight: bold;">Due Today</span>`;
    return `<span style="color: #4b5563;">Due in ${d} days</span>`;
  };

  const rowsList = items.sort((a, b) => a.daysLeft - b.daysLeft).map(i => `
    <div style="padding: 16px; border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 12px; font-family: sans-serif;">
      <div style="font-size: 14px; color: #6b7280; font-weight: 500; text-transform: uppercase;">${i.type}</div>
      <div style="font-size: 18px; font-weight: 600; color: #111827; margin: 4px 0;">${i.name}</div>
      <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px;">
        <div style="font-size: 14px;">${formatDays(i.daysLeft)}</div>
        ${i.amount ? `<div style="font-weight: 600; color: #111827;">₹${i.amount.toLocaleString('en-IN')}</div>` : ''}
      </div>
    </div>
  `).join('');

  return `
    <div style="max-width: 600px; margin: 0 auto; padding: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <h2 style="color: #111827; margin-bottom: 8px;">Hello ${name},</h2>
      <p style="color: #4b5563; font-size: 16px; line-height: 1.5; margin-bottom: 24px;">
        This is an automated reminder from your Vault. You have important renewals or warranties expiring soon.
      </p>
      
      ${rowsList}
      
      <p style="color: #6b7280; font-size: 14px; margin-top: 32px; text-align: center;">
        Log in to your Hisab Management dashboard to view details or update these records.
      </p>
    </div>
  `;
}
