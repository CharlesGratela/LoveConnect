/**
 * Request notification permission from the user
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    console.warn('[Notifications] This browser does not support notifications');
    alert('Your browser does not support notifications');
    return 'denied';
  }

  console.log('[Notifications] Current permission:', Notification.permission);

  if (Notification.permission === 'granted') {
    console.log('[Notifications] Permission already granted');
    // Test notification to confirm it works
    new Notification('Notifications Enabled! ✅', {
      body: 'You will now receive notifications for matches, likes, and messages.',
      icon: '/icon-192x192.png',
    });
    return 'granted';
  }

  if (Notification.permission === 'denied') {
    console.error('[Notifications] Permission was denied. Please enable notifications in browser settings.');
    alert('Notifications are blocked. Please enable them in your browser settings (click the 🔒 icon in the address bar).');
    return 'denied';
  }

  console.log('[Notifications] Requesting permission...');
  const permission = await Notification.requestPermission();
  console.log('[Notifications] Permission result:', permission);
  
  if (permission === 'granted') {
    // Show test notification
    new Notification('Notifications Enabled! ✅', {
      body: 'You will now receive notifications for matches, likes, and messages.',
      icon: '/favicon.svg',
    });
  } else {
    alert('Please enable notifications to get notified about matches, likes, and messages!');
  }
  
  return permission;
}

/**
 * Show a browser notification
 */
export function showNotification(title: string, options?: NotificationOptions): void {
  console.log('[Notifications] Attempting to show notification:', title);
  
  if (!('Notification' in window)) {
    console.warn('[Notifications] This browser does not support notifications');
    return;
  }

  console.log('[Notifications] Current permission status:', Notification.permission);

  if (Notification.permission === 'granted') {
    try {
      console.log('[Notifications] Creating notification with options:', options);
      const notification = new Notification(title, {
        icon: '/favicon.svg',
        badge: '/favicon.svg',
        ...options,
      });
      
      notification.onclick = () => {
        console.log('[Notifications] Notification clicked');
        window.focus();
      };
      
      notification.onerror = (error) => {
        console.error('[Notifications] Notification error:', error);
      };
      
      console.log('[Notifications] ✅ Notification created successfully');
    } catch (error) {
      console.error('[Notifications] ❌ Error creating notification:', error);
    }
  } else {
    console.warn('[Notifications] ⚠️ Permission not granted. Current permission:', Notification.permission);
    console.warn('[Notifications] Please enable notifications in browser settings');
  }
}

/**
 * Show notification for new match
 */
export function showMatchNotification(matchName: string, matchPhoto: string): void {
  console.log('[Notifications] Match notification for:', matchName);
  showNotification('It\'s a Match! 💕', {
    body: `You matched with ${matchName}!`,
    icon: matchPhoto,
    tag: 'new-match',
    requireInteraction: true,
  });
}

/**
 * Show notification for new message
 */
export function showMessageNotification(senderName: string, message: string, senderPhoto: string): void {
  console.log('[Notifications] Message notification from:', senderName);
  showNotification(`New message from ${senderName}`, {
    body: message.length > 50 ? message.substring(0, 50) + '...' : message,
    icon: senderPhoto,
    tag: 'new-message',
  });
}

/**
 * Show notification for someone liking you
 */
export function showLikeNotification(likerName: string, likerPhoto: string): void {
  console.log('[Notifications] Like notification from:', likerName);
  showNotification('Someone likes you! 💖', {
    body: `${likerName} liked your profile!`,
    icon: likerPhoto,
    tag: 'new-like',
    requireInteraction: false,
  });
}

/**
 * Check if notifications are supported and enabled
 */
export function areNotificationsEnabled(): boolean {
  return ('Notification' in window) && Notification.permission === 'granted';
}

/**
 * Subscribe to push notifications
 */
export async function subscribeToPushNotifications(userId: string): Promise<PushSubscription | null> {
  console.log('[Notifications] Subscribing to push notifications for user:', userId);
  
  try {
    // Check if service worker is supported
    if (!('serviceWorker' in navigator)) {
      console.warn('[Notifications] Service workers are not supported');
      return null;
    }

    // Wait for service worker to be ready
    const registration = await navigator.serviceWorker.ready;
    console.log('[Notifications] Service worker ready:', registration);

    // Check if Push API is supported
    if (!('PushManager' in window)) {
      console.warn('[Notifications] Push notifications are not supported');
      return null;
    }

    // Get existing subscription or create new one
    let subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      console.log('[Notifications] Existing push subscription found:', subscription);
    } else {
      // VAPID public key - will be generated later
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      
      if (!vapidPublicKey) {
        console.error('[Notifications] VAPID public key not configured');
        return null;
      }

      console.log('[Notifications] Creating new push subscription...');
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });
      console.log('[Notifications] New push subscription created:', subscription);
    }

    // Send subscription to server
    const response = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        subscription,
      }),
    });

    if (!response.ok) {
      console.error('[Notifications] Failed to save subscription to server');
      return null;
    }

    console.log('[Notifications] ✅ Push subscription saved to server');
    return subscription;
  } catch (error) {
    console.error('[Notifications] Error subscribing to push notifications:', error);
    return null;
  }
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromPushNotifications(userId: string): Promise<boolean> {
  console.log('[Notifications] Unsubscribing from push notifications for user:', userId);
  
  try {
    if (!('serviceWorker' in navigator)) {
      return false;
    }

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      await subscription.unsubscribe();
      console.log('[Notifications] Unsubscribed from push notifications');

      // Remove subscription from server
      await fetch('/api/push/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });
    }

    return true;
  } catch (error) {
    console.error('[Notifications] Error unsubscribing from push notifications:', error);
    return false;
  }
}

/**
 * Convert VAPID key from base64 to Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}
