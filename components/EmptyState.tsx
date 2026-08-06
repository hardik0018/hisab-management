import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  hint: string;
  /** CSS variable color name, e.g. "--violet" */
  color?: string;
  className?: string;
}

/**
 * Empty state block: dashed border card with a soft tile icon, title, and hint text.
 */
export default function EmptyState({
  icon: Icon,
  title,
  hint,
  color = '--violet',
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-14 px-6 text-center rounded-[1.125rem] gap-4',
        className
      )}
      style={{
        border: '2px dashed var(--border)',
      }}
    >
      <div
        className="tile w-14 h-14"
        style={{
          background: `var(${color}-soft, var(--violet-soft))`,
          color: `var(${color}, var(--violet))`,
        }}
      >
        <Icon className="w-6 h-6" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-bold" style={{ color: 'var(--foreground)' }}>
          {title}
        </p>
        <p className="text-xs" style={{ color: 'var(--muted-foreground)', maxWidth: '200px' }}>
          {hint}
        </p>
      </div>
    </div>
  );
}
