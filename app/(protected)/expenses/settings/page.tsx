export const dynamic = 'force-dynamic';

import { getSettings } from '@/lib/data-fetching';
import SettingsClient from './SettingsClient';
import { redirect } from 'next/navigation';
import { getAuthenticatedUser } from '@/lib/auth';
import SegmentedTabs from '@/components/SegmentedTabs';

const EXPENSE_TABS = [
  { label: 'Today', href: '/expenses' },
  { label: 'History', href: '/expenses/history' },
  { label: 'Auto', href: '/expenses/recurring' },
  { label: 'Report', href: '/expenses/summary' },
  { label: 'Tax', href: '/expenses/tax' },
  { label: 'Settings', href: '/expenses/settings' },
];

export default async function SettingsPage() {
  const user = await getAuthenticatedUser();
  
  if (!user) {
    redirect('/login');
  }

  const settings = await getSettings();

  if (!settings) {
    redirect('/expenses');
  }

  return (
    <>
      <SegmentedTabs tabs={EXPENSE_TABS} />
      <SettingsClient initialSettings={settings} />
    </>
  );
}
