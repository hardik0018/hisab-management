'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Plus, History, Repeat, BarChart3, Settings2 } from 'lucide-react';

export default function ExpenseTopTabs() {
  const pathname = usePathname();

  const tabs = [
    { label: 'Add', href: '/expenses', icon: Plus },
    { label: 'History', href: '/expenses/history', icon: History },
    { label: 'Recurring', href: '/expenses/recurring', icon: Repeat },
    { label: 'Analysis', href: '/expenses/summary', icon: BarChart3 },
    { label: 'Settings', href: '/expenses/settings', icon: Settings2 },
  ];

  return (
    <div className="flex border-b border-border bg-card sticky top-0 z-50 justify-center w-full">
      <div className="flex w-full max-w-md justify-between px-4 h-12">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = pathname === tab.href;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-3 h-full border-b-2 text-xs font-bold transition-all relative font-sans",
                isActive
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
