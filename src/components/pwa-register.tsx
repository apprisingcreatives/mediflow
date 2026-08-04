'use client';

import { useEffect } from 'react';

export function PWARegister() {
  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      window.location.protocol === 'https:' ||
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1'
    ) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('Service worker registered successfully:', registration.scope);
        })
        .catch((err) => {
          console.error('Service worker registration failed:', err);
        });
    }
  }, []);

  return null;
}
