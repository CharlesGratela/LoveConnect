/**
 * Request notification permission from the user
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications');
    return 'denied';
  }

  const permission = await Notification.requestPermission();
  return permission;
}

/**
 * Show a browser notification
 */
export function showNotification(title: string, options?: NotificationOptions): void {
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications');
    return;
  }

  if (Notification.permission === 'granted') {
    new Notification(title, {
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      ...options,
    });
  }
}

/**
 * Show notification for new match
 */
export function showMatchNotification(matchName: string, matchPhoto: string): void {
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
  showNotification(`New message from ${senderName}`, {
    body: message.length > 50 ? message.substring(0, 50) + '...' : message,
    icon: senderPhoto,
    tag: 'new-message',
  });
}

/**
 * Check if notifications are supported and enabled
 */
export function areNotificationsEnabled(): boolean {
  return ('Notification' in window) && Notification.permission === 'granted';
}
