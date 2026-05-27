'use client';

import { useEffect } from 'react';

export default function PwaRegister() {
  useEffect(() => {
    if (
      typeof window !== 'undefined' && 
      'serviceWorker' in navigator && 
      process.env.NODE_ENV === 'production' // Only register in production to avoid HMR interference
    ) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('[SW] Service Worker registered scope:', registration.scope);
          })
          .catch((error) => {
            console.error('[SW] Service Worker registration failed:', error);
          });
      });
    } else if (
      typeof window !== 'undefined' && 
      'serviceWorker' in navigator && 
      process.env.NODE_ENV === 'development'
    ) {
      // In development, also register to allow testing installability locally
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('[SW] Service Worker registered (dev):', registration.scope);
        })
        .catch((error) => {
          console.error('[SW] Service Worker registration failed (dev):', error);
        });
    }
  }, []);

  return null;
}
