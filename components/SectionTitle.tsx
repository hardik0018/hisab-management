import React from 'react';
import { cn } from '@/lib/utils';

interface SectionTitleProps {
  children: React.ReactNode;
  count?: number | string;
  rightAction?: React.ReactNode;
  className?: string;
}

/**
 * Section separator title — uppercase tracking, semantic contrast, with optional count badge and right action.
 */
export default function SectionTitle({
  children,
  count,
  rightAction,
  className,
}: SectionTitleProps) {
  return (
    <div className={cn('flex items-center justify-between px-1 py-1', className)}>
      <div className="flex items-center gap-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          {children}
        </h3>
        {count !== undefined && (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-muted text-muted-foreground border border-border">
            {count}
          </span>
        )}
      </div>
      {rightAction && <div>{rightAction}</div>}
    </div>
  );
}
