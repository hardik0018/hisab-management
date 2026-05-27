'use client';

import React, { ReactNode } from 'react';

interface ExpenseLayoutProps {
  children: ReactNode;
  title?: string;
  headerRight?: ReactNode;
}

export default function ExpenseLayout({ children }: ExpenseLayoutProps) {
  return (
    <div className="w-full">
      {children}
    </div>
  );
}
