'use client';

import { useEffect } from 'react';

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('[App] Service Worker registered:', registration);
          
          // Check for updates periodically
          setInterval(() => {
            registration.update();
          }, 60000); // Check every minute
        })
        .catch((error) => {
          console.error('[App] Service Worker registration failed:', error);
        });

      // Handle messages from service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        console.log('[App] Message from Service Worker:', event.data);
        
        if (event.data && event.data.type === 'navigate') {
          window.location.href = event.data.url;
        }
      });
    } else {
      console.warn('[App] Service Workers are not supported in this browser');
    }
  }, []);

  return null;
}
