'use client';

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface ChartItem {
  name: string;
  value: number;
  color: string;
}

interface DashboardChartProps {
  data: ChartItem[];
}

export default function DashboardChart({ data }: DashboardChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
        <XAxis
          dataKey="name"
          axisLine={false}
          tickLine={false}
          tick={{ fill: '#64748B', fontSize: 10, fontWeight: 700 }}
          dy={5}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fill: '#64748B', fontSize: 10, fontWeight: 700 }}
        />
        <Tooltip
          cursor={{ fill: '#F8FAFC' }}
          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
        />
        <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={40}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
