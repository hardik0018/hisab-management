'use client';

import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

export interface CategoryBreakdownItem {
  category: string;
  total: number;
  count: number;
  percentage: number;
}

interface CategoryBreakdownChartProps {
  data: CategoryBreakdownItem[];
}

export const CATEGORY_COLORS: Record<string, string> = {
  'Groceries & Kitchen': '#10B981', // Emerald
  'Vegetables & Fruits': '#84CC16', // Lime
  'Fuel, Vehicle & Travel': '#F59E0B', // Amber
  'Snacks, Food & Dining': '#F97316', // Orange
  'Bills, Rent & Housing': '#3B82F6', // Blue
  'Investments & Insurance': '#6366F1', // Indigo
  'Salary & Income': '#14B8A6', // Teal
  'Personal Care & Medical': '#EC4899', // Pink
  'Shopping & Stores': '#A855F7', // Purple
  'Education & Stationery': '#06B6D4', // Cyan
  'Gifts & Marriage': '#F43F5E', // Rose
  'Transfers & Settlements': '#64748B', // Slate
  'Debt/Credit': '#EAB308', // Yellow
  'Marriage': '#D946EF', // Fuchsia
  'General & Other': '#94A3B8', // Gray
};

export function getCategoryColor(category: string): string {
  return CATEGORY_COLORS[category] || '#6366F1';
}

export default function CategoryBreakdownChart({ data }: CategoryBreakdownChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-[180px] w-full flex items-center justify-center text-muted-foreground text-xs font-medium italic">
        No expense category data in this period.
      </div>
    );
  }

  const formatCurrency = (amt: number) => {
    return amt.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
        <Tooltip
          content={({ active, payload }) => {
            if (active && payload && payload.length > 0) {
              const item = payload[0].payload as CategoryBreakdownItem;
              const color = getCategoryColor(item.category);
              return (
                <div className="bg-popover border border-border rounded-2xl p-3 shadow-xl flex flex-col gap-1 min-w-[150px] animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                    <span className="font-bold text-xs text-popover-foreground">{item.category}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs mt-1">
                    <span className="text-muted-foreground">Amount:</span>
                    <span className="font-black text-foreground">₹{formatCurrency(item.total)}</span>
                  </div>
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-muted-foreground">Share:</span>
                    <span className="font-bold text-primary">{item.percentage}%</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-muted-foreground/80 border-t border-border/50 pt-1 mt-0.5">
                    <span>Transactions:</span>
                    <span>{item.count} items</span>
                  </div>
                </div>
              );
            }
            return null;
          }}
        />
        <Pie
          data={data}
          dataKey="total"
          nameKey="category"
          cx="50%"
          cy="50%"
          innerRadius={48}
          outerRadius={75}
          paddingAngle={3}
          stroke="hsl(var(--card))"
          strokeWidth={2}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={getCategoryColor(entry.category)} />
          ))}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  );
}
