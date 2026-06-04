'use client';

import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ChartItem {
  name: string;
  amount: number;
}

interface SummaryChartProps {
  data: ChartItem[];
}

export default function SummaryChart({ data }: SummaryChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
        <defs>
          <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis
          dataKey="name"
          stroke="hsl(var(--muted-foreground))"
          fontSize={9}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="hsl(var(--muted-foreground))"
          fontSize={9}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--popover))',
            borderColor: 'hsl(var(--border))',
            borderRadius: '12px',
            fontSize: '11px',
            color: 'hsl(var(--popover-foreground))'
          }}
          itemStyle={{ color: 'hsl(var(--primary))' }}
        />
        <Area
          type="monotone"
          dataKey="amount"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#colorAmount)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
