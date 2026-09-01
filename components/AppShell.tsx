import React from 'react';
import { cn } from '@/lib/utils';

interface AppShellProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'wide';
}

/**
 * Content column: max-w-xl on mobile, can expand to lg:max-w-5xl with variant="wide".
 * Use inside protected pages to ensure consistent and responsive layout.
 */
export default function AppShell({
  children,
  className,
  variant = 'default',
}: AppShellProps) {
  return (
    <div
      className={cn(
        'mx-auto px-4 pb-32 space-y-4',
        variant === 'wide' ? 'max-w-xl lg:max-w-5xl' : 'max-w-xl',
        className
      )}
    >
      {children}
    </div>
  );
}
