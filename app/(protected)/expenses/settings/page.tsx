export const dynamic = 'force-dynamic';

import { getSettings } from '@/lib/data-fetching';
import SettingsClient from './SettingsClient';
import { redirect } from 'next/navigation';
import { getAuthenticatedUser } from '@/lib/auth';

export default async function SettingsPage() {
  const user = await getAuthenticatedUser();
  
  if (!user) {
    redirect('/login');
  }

  const settings = await getSettings();

  if (!settings) {
    redirect('/expenses');
  }

  return <SettingsClient initialSettings={settings} />;
}
