'use client';

import React, { ReactNode } from 'react';
import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from 'next-themes';
import ErrorBoundary from './ErrorBoundary';
import { Session } from 'next-auth';

interface ProvidersProps {
  children: ReactNode;
  session?: Session | null;
}

export function Providers({ children, session }: ProvidersProps) {
  return (
    <ErrorBoundary>
      <SessionProvider session={session} refetchInterval={0} refetchOnWindowFocus={false}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          {children}
        </ThemeProvider>
      </SessionProvider>
    </ErrorBoundary>
  );
}
