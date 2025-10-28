// Service Worker for Push Notifications
console.log('[Service Worker] Loading...');

// Install event - cache static assets if needed
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  self.skipWaiting(); // Activate immediately
});

// Activate event - clean up old caches if needed
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(self.clients.claim()); // Take control immediately
});

// Push event - receive push notifications from server
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push received:', event);
  
  let data = {
    title: 'nXtDate',
    body: 'You have a new notification',
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    tag: 'default',
    data: {}
  };

  // Parse push notification data
  if (event.data) {
    try {
      const payload = event.data.json();
      console.log('[Service Worker] Push payload:', payload);
      data = {
        title: payload.title || data.title,
        body: payload.body || data.body,
        icon: payload.icon || data.icon,
        badge: payload.badge || data.badge,
        tag: payload.tag || data.tag,
        data: payload.data || data.data,
        requireInteraction: payload.requireInteraction || false,
        vibrate: payload.vibrate || [200, 100, 200]
      };
    } catch (error) {
      console.error('[Service Worker] Error parsing push data:', error);
    }
  }

  // Show the notification
  const promiseChain = self.registration.showNotification(data.title, {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    tag: data.tag,
    data: data.data,
    requireInteraction: data.requireInteraction,
    vibrate: data.vibrate,
    actions: data.actions || []
  });

  event.waitUntil(promiseChain);
});

// Notification click event - handle user clicking on notification
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification clicked:', event.notification.tag);
  
  event.notification.close();

  // Determine URL to open based on notification type
  let urlToOpen = '/';
  const notificationData = event.notification.data;

  if (notificationData) {
    if (notificationData.type === 'match') {
      urlToOpen = '/matches';
    } else if (notificationData.type === 'like') {
      urlToOpen = '/matches';
    } else if (notificationData.type === 'message') {
      urlToOpen = notificationData.matchId ? `/chat/${notificationData.matchId}` : '/matches';
    }
  }

  // Open or focus the app
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if app is already open
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            // Navigate to the correct page
            client.postMessage({
              type: 'navigate',
              url: urlToOpen
            });
            return client.focus();
          }
        }
        // If not open, open new window
        if (clients.openWindow) {
          return clients.openWindow(self.location.origin + urlToOpen);
        }
      })
  );
});

// Message event - receive messages from app
self.addEventListener('message', (event) => {
  console.log('[Service Worker] Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

console.log('[Service Worker] Loaded successfully');
