'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  className?: string;
}

/**
 * Sticky page header with gradient title text, muted subtitle, and optional right action slot.
 */
export default function PageHeader({ title, subtitle, right, className }: PageHeaderProps) {
  return (
    <div
      className={cn(
        'sticky top-0 z-30 px-4 py-3 flex items-center justify-between gap-3',
        className
      )}
      style={{
        background: 'oklch(0.976 0.004 265 / 0.88)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      <div className="flex flex-col min-w-0">
        <h1
          className="text-2xl font-extrabold leading-tight tracking-tight gradient-text"
          style={{ fontSize: '1.4rem' }}
        >
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs font-medium mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
            {subtitle}
          </p>
        )}
      </div>
      {right && <div className="flex items-center gap-2 shrink-0">{right}</div>}
    </div>
  );
}
