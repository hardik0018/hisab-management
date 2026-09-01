'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export interface TabItem {
  label: string;
  href: string;
}

interface SegmentedTabsProps {
  tabs: TabItem[];
  className?: string;
}

/**
 * Pill-style segmented tab bar for sub-navigation within a screen.
 * Uses Next.js Link for routing. Active pill: bg-card + text-primary + shadow.
 */
export default function SegmentedTabs({ tabs, className }: SegmentedTabsProps) {
  const pathname = usePathname();

  return (
    <div
      className={cn(
        'sticky z-20 px-4 py-2 flex justify-center top-1',
        className
      )}
      style={{
        background: 'oklch(0.976 0.004 265 / 0.88)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      <div
        className="flex w-full max-w-xl lg:max-w-5xl p-1.5 rounded-2xl gap-1 overflow-x-auto no-scrollbar"
        style={{ background: 'var(--secondary)' }}
      >
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'flex-1 text-center py-1.5 px-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all active:scale-95 select-none min-h-[36px] flex items-center justify-center',
                isActive
                  ? 'text-primary shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              style={isActive ? { background: 'var(--card)' } : {}}
              aria-current={isActive ? 'page' : undefined}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
