'use client';

import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from 'next-themes';
import ErrorBoundary from './ErrorBoundary';

export function Providers({ children, session }) {
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
