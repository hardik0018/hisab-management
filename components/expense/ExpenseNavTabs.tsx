'use client';

import SegmentedTabs, { TabItem } from '@/components/SegmentedTabs';

export const EXPENSE_TABS: TabItem[] = [
  { label: 'Today', href: '/expenses' },
  { label: 'History', href: '/expenses/history' },
  { label: 'Trips', href: '/expenses/trips' },
  { label: 'Auto', href: '/expenses/recurring' },
  { label: 'Report', href: '/expenses/summary' },
  { label: 'Tax', href: '/expenses/tax' },
];

export default function ExpenseNavTabs() {
  return <SegmentedTabs tabs={EXPENSE_TABS} />;
}
