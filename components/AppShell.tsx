import React from 'react';
import { cn } from '@/lib/utils';

interface AppShellProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Content column: max-w-xl, centered, with standard padding and spacing.
 * Use inside every protected page to ensure consistent layout.
 */
export default function AppShell({ children, className }: AppShellProps) {
  return (
    <div className={cn('max-w-xl mx-auto px-4 pb-32 space-y-3', className)}>
      {children}
    </div>
  );
}
