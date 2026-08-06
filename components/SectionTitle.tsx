import React from 'react';
import { cn } from '@/lib/utils';

interface SectionTitleProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Small section separator title — uppercase tracking, muted color.
 */
export default function SectionTitle({ children, className }: SectionTitleProps) {
  return (
    <p
      className={cn(
        'text-[11px] font-bold uppercase tracking-widest px-1',
        className
      )}
      style={{ color: 'var(--muted-foreground)' }}
    >
      {children}
    </p>
  );
}
