'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Expense, User } from '@/types';
import { formatDisplayTime } from '@/lib/date-utils';
import { Edit2, Trash2, Link as LinkIcon, Repeat, TrendingUp, ShoppingCart, Apple, Car, Coffee, Home, Shield, Coins, HeartPulse, ShoppingBag, Book, Gift, ArrowRightLeft, CreditCard, Heart, Tag } from 'lucide-react';
import { toast } from 'sonner';

interface ExpenseCardProps {
  expense: Expense;
  onEditClick: (expense: Expense) => void;
  onDeleteClick: (expense: Expense) => void;
  collaborators: User[];
  currentUserId: string;
}

function fmt(amt: number) {
  const abs = Math.abs(amt);
  return abs % 1 === 0 ? `₹${abs}` : `₹${abs.toFixed(2)}`;
}

function getCategoryIcon(category?: string) {
  switch (category) {
    case 'Groceries & Kitchen': return <ShoppingCart className="w-5 h-5" />;
    case 'Vegetables & Fruits': return <Apple className="w-5 h-5" />;
    case 'Fuel, Vehicle & Travel': return <Car className="w-5 h-5" />;
    case 'Snacks, Food & Dining': return <Coffee className="w-5 h-5" />;
    case 'Bills, Rent & Housing': return <Home className="w-5 h-5" />;
    case 'Investments & Insurance': return <Shield className="w-5 h-5" />;
    case 'Salary & Income': return <Coins className="w-5 h-5" />;
    case 'Personal Care & Medical': return <HeartPulse className="w-5 h-5" />;
    case 'Shopping & Stores': return <ShoppingBag className="w-5 h-5" />;
    case 'Education & Stationery': return <Book className="w-5 h-5" />;
    case 'Gifts & Marriage': return <Gift className="w-5 h-5" />;
    case 'Transfers & Settlements': return <ArrowRightLeft className="w-5 h-5" />;
    case 'Debt/Credit': return <CreditCard className="w-5 h-5" />;
    case 'Marriage': return <Heart className="w-5 h-5" />;
    default: return <Tag className="w-5 h-5" />;
  }
}

export default function ExpenseCard({
  expense,
  onEditClick,
  onDeleteClick,
  collaborators,
  currentUserId,
}: ExpenseCardProps) {
  const isLinked =
    (expense.associatedType === 'hisab' || expense.associatedType === 'marriage') &&
    expense.type !== 'transfer_out' &&
    expense.type !== 'transfer_in';

  const isIncome = expense.type === 'income' || expense.amount < 0;

  const handleDisabledActionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const src = expense.associatedType === 'hisab' ? 'Hisab' : 'Marriage';
    toast.info(`Linked to a ${src} record. Edit or delete on the ${src} page.`, {
      duration: 4000,
    });
  };

  return (
    <div className="flex items-center gap-3 px-3 py-3">
      {/* Category / type icon tile */}
      <div
        className="tile w-10 h-10 shrink-0 text-sm font-bold"
        style={{
          background: isIncome ? 'var(--success-soft)' : 'var(--violet-soft)',
          color: isIncome ? 'var(--success)' : 'var(--violet)',
        }}
      >
        {isIncome ? (
          <TrendingUp className="w-5 h-5" />
        ) : (
          getCategoryIcon(expense.category)
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span
            className="font-semibold text-sm truncate"
            style={{ color: 'var(--foreground)' }}
          >
            {expense.itemName}
          </span>

          {/* Badges */}
          {expense.associatedType === 'hisab' && expense.type !== 'transfer_out' && expense.type !== 'transfer_in' && (
            <span className="inline-flex items-center gap-0.5 text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full"
              style={{ background: 'var(--accent)', color: 'var(--accent-foreground)' }}>
              <LinkIcon className="w-2 h-2" />Hisab
            </span>
          )}
          {expense.associatedType === 'recurring' && (
            <span className="inline-flex items-center gap-0.5 text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full"
              style={{ background: 'var(--teal-soft)', color: 'var(--teal)' }}>
              <Repeat className="w-2 h-2" />Auto
            </span>
          )}
          {expense.type === 'income' && (
            <span className="inline-flex items-center text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full"
              style={{ background: 'var(--success-soft)', color: 'var(--success)' }}>
              Income
            </span>
          )}
          {(expense.type === 'transfer_out' || expense.type === 'transfer_in' || expense.category === 'Transfers & Settlements') && (
            <span className="inline-flex items-center gap-0.5 text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full"
              style={{ background: 'var(--sky-soft)', color: 'var(--sky)' }}>
              <LinkIcon className="w-2 h-2" />Transfer
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 mt-0.5">
          {expense.note && (
            <span className="text-xs truncate max-w-[160px]" style={{ color: 'var(--muted-foreground)' }}>
              {expense.note}
            </span>
          )}
          <span className="text-[10px] font-mono" style={{ color: 'var(--muted-foreground)' }}>
            {formatDisplayTime(expense.createdAt)}
          </span>
          {expense.user_id !== currentUserId && (
            <span className="text-[10px]" style={{ color: 'var(--muted-foreground)' }}>
              · {collaborators?.find((c) => c.user_id === expense.user_id)?.name ?? 'Other'}
            </span>
          )}
        </div>
      </div>

      {/* Amount + actions */}
      <div className="flex items-center gap-1 shrink-0">
        <span
          className="text-sm font-bold amount"
          style={{ color: isIncome ? 'var(--success)' : 'var(--danger)' }}
        >
          {isIncome ? '+' : '−'}{fmt(expense.amount)}
        </span>

        <div className="flex items-center">
          {isLinked ? (
            <>
              <button
                onClick={handleDisabledActionClick}
                aria-label="Linked record — edit at source"
                className="p-1.5 rounded-lg opacity-30 cursor-not-allowed"
              >
                <Edit2 className="w-3.5 h-3.5" style={{ color: 'var(--muted-foreground)' }} />
              </button>
              <button
                onClick={handleDisabledActionClick}
                aria-label="Linked record — delete at source"
                className="p-1.5 rounded-lg opacity-30 cursor-not-allowed"
              >
                <Trash2 className="w-3.5 h-3.5" style={{ color: 'var(--muted-foreground)' }} />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => onEditClick(expense)}
                aria-label={`Edit ${expense.itemName}`}
                className="p-1.5 rounded-lg transition-colors active:scale-95"
                style={{ color: 'var(--muted-foreground)' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--primary)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--muted-foreground)')}
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onDeleteClick(expense)}
                aria-label={`Delete ${expense.itemName}`}
                className="p-1.5 rounded-lg transition-colors active:scale-95"
                style={{ color: 'var(--muted-foreground)' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--danger)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--muted-foreground)')}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
