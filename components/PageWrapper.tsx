'use client'

import { ReactNode } from 'react';

interface PageWrapperProps {
  children: ReactNode;
}

export default function PageWrapper({ children }: PageWrapperProps) {
  return (
    <div
      className="w-full"
    >
      {children}
    </div>
  );
}
