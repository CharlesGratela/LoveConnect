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
