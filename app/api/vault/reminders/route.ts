export const dynamic = 'force-dynamic';

import { getDb } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';
import { VaultReminder } from '@/types/vault';

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const db = await getDb();
    const spaceId = user.space_id || user.user_id;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const horizon = new Date(today);
    horizon.setDate(horizon.getDate() + 60); // next 60 days
    const horizonStr = horizon.toISOString().slice(0, 10);

    const insurance = await db.collection('insurance_policies')
      .find({ space_id: spaceId, nextDueDate: { $lte: horizonStr } })
      .sort({ nextDueDate: 1 }).toArray();

    const warranties = await db.collection('warranties')
      .find({ space_id: spaceId, expiryDate: { $lte: horizonStr } })
      .sort({ expiryDate: 1 }).toArray();

    const dayDiff = (d: string) =>
      Math.round((new Date(d).getTime() - today.getTime()) / 86400000);

    const reminders: VaultReminder[] = [
      ...insurance.map((p: any) => ({
        kind: 'insurance' as const,
        id: p._id.toString(),
        title: p.policyName,
        subtitle: `${p.provider} • ${p.policyNumber}`,
        dueDate: p.nextDueDate,
        daysLeft: dayDiff(p.nextDueDate),
        amount: p.premiumAmount,
      })),
      ...warranties.map((w: any) => ({
        kind: 'warranty' as const,
        id: w._id.toString(),
        title: w.itemName,
        subtitle: [w.brand, w.vendor].filter(Boolean).join(' • ') || 'Warranty',
        dueDate: w.expiryDate,
        daysLeft: dayDiff(w.expiryDate),
      })),
    ].sort((a, b) => a.daysLeft - b.daysLeft);

    return Response.json({ reminders });
  } catch (err) {
    console.error('[API_VAULT_REMINDERS_ERROR]', err);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
