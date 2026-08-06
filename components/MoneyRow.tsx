import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MoneyRowProps {
  icon: LucideIcon;
  /** CSS variable color token, e.g. "--violet" */
  color?: string;
  label: string;
  sublabel?: string;
  amount: number;
  /** 'out' = red (expense), 'in' = green (income), 'neutral' = foreground */
  direction?: 'out' | 'in' | 'neutral';
  right?: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

function fmt(n: number) {
  return `₹${Math.abs(n).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

/**
 * A single row with a coloured icon tile, label/sublabel, and right-aligned amount.
 * Used in expense lists, category breakdowns, hisab person rows, etc.
 */
export default function MoneyRow({
  icon: Icon,
  color = '--violet',
  label,
  sublabel,
  amount,
  direction = 'out',
  right,
  onClick,
  className,
}: MoneyRowProps) {
  const amountColor =
    direction === 'in'
      ? 'var(--success)'
      : direction === 'out'
      ? 'var(--danger)'
      : 'var(--foreground)';

  const prefix = direction === 'in' ? '+' : direction === 'out' ? '−' : '';

  const Comp = onClick ? 'button' : 'div';

  return (
    <Comp
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 py-2.5 px-3 w-full text-left',
        onClick && 'active:scale-[0.98] transition-transform cursor-pointer',
        className
      )}
    >
      {/* Icon tile */}
      <div
        className="tile w-10 h-10 shrink-0"
        style={{
          background: `var(${color}-soft, var(--violet-soft))`,
          color: `var(${color}, var(--violet))`,
        }}
      >
        <Icon className="w-5 h-5" />
      </div>

      {/* Label */}
      <div className="flex-1 min-w-0">
        <p
          className="text-sm font-semibold truncate"
          style={{ color: 'var(--foreground)' }}
        >
          {label}
        </p>
        {sublabel && (
          <p className="text-xs truncate" style={{ color: 'var(--muted-foreground)' }}>
            {sublabel}
          </p>
        )}
      </div>

      {/* Amount + optional right slot */}
      <div className="flex items-center gap-2 shrink-0">
        <span
          className="text-sm font-bold amount"
          style={{ color: amountColor }}
        >
          {prefix}
          {fmt(amount)}
        </span>
        {right}
      </div>
    </Comp>
  );
}
