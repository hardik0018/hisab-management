import React from 'react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  amount: number | string;
  caption?: string;
  variant?: 'hero' | 'in' | 'out' | 'surface';
  className?: string;
  children?: React.ReactNode;
}

function formatMoney(amount: number | string): string {
  const n = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(n)) return '₹0';
  return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

/**
 * A stat/money card supporting four visual variants:
 * - hero: purple→pink gradient, large number
 * - in: green gradient
 * - out: red gradient
 * - surface: white card-surface
 */
export default function StatCard({
  label,
  amount,
  caption,
  variant = 'surface',
  className,
  children,
}: StatCardProps) {
  const isGradient = variant === 'hero' || variant === 'in' || variant === 'out';

  const variantClass =
    variant === 'hero'
      ? 'hero-gradient'
      : variant === 'in'
      ? 'in-gradient'
      : variant === 'out'
      ? 'out-gradient'
      : 'card-surface';

  const textColor = isGradient ? 'oklch(1 0 0)' : 'var(--foreground)';
  const mutedColor = isGradient ? 'oklch(1 0 0 / 0.75)' : 'var(--muted-foreground)';

  return (
    <div
      className={cn(
        'p-4 flex flex-col gap-1',
        variantClass,
        className
      )}
    >
      <p
        className="text-xs font-semibold uppercase tracking-wider"
        style={{ color: mutedColor }}
      >
        {label}
      </p>
      <p
        className={cn(
          'font-extrabold leading-none amount',
          variant === 'hero' ? 'text-4xl' : 'text-2xl'
        )}
        style={{ color: textColor }}
      >
        {typeof amount === 'number' ? formatMoney(amount) : amount}
      </p>
      {caption && (
        <p className="text-xs mt-0.5" style={{ color: mutedColor }}>
          {caption}
        </p>
      )}
      {children}
    </div>
  );
}
