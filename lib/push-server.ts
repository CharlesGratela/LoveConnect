import webpush from 'web-push';
import { PushSubscription } from '@/models/PushSubscription';
import dbConnect from '@/lib/mongodb';

// Configure web-push with VAPID keys
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY!;
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:support@nxtdate.com';

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, any>;
  requireInteraction?: boolean;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

/**
 * Send push notification to a specific user
 */
export async function sendPushNotificationToUser(
  userId: string,
  payload: PushNotificationPayload
): Promise<void> {
  try {
    await dbConnect();

    console.log('[Push Server] Sending notification to user:', userId);

    // Get all push subscriptions for this user
    const subscriptions = await PushSubscription.find({ userId });

    if (subscriptions.length === 0) {
      console.log('[Push Server] No subscriptions found for user:', userId);
      return;
    }

    console.log(`[Push Server] Found ${subscriptions.length} subscription(s)`);

    // Send notification to all subscriptions
    const promises = subscriptions.map(async (sub) => {
      try {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.keys.p256dh,
            auth: sub.keys.auth,
          },
        };

        await webpush.sendNotification(
          pushSubscription,
          JSON.stringify({
            ...payload,
            icon: payload.icon || '/favicon.svg',
            badge: payload.badge || '/favicon.svg',
          })
        );

        console.log('[Push Server] ✅ Notification sent successfully to:', sub.endpoint.substring(0, 50) + '...');
      } catch (error: any) {
        console.error('[Push Server] Error sending to subscription:', error);
        
        // If subscription is expired or invalid, remove it
        if (error.statusCode === 410 || error.statusCode === 404) {
          console.log('[Push Server] Removing invalid subscription:', sub._id);
          await PushSubscription.deleteOne({ _id: sub._id });
        }
      }
    });

    await Promise.all(promises);
  } catch (error) {
    console.error('[Push Server] Error sending push notification:', error);
    throw error;
  }
}

/**
 * Send match notification
 */
export async function sendMatchNotification(
  userId: string,
  matchName: string,
  matchPhoto: string
): Promise<void> {
  await sendPushNotificationToUser(userId, {
    title: 'It\'s a Match! 💕',
    body: `You matched with ${matchName}!`,
    icon: matchPhoto,
    tag: 'new-match',
    data: {
      type: 'match',
      matchName,
    },
    requireInteraction: true,
  });
}

/**
 * Send like notification
 */
export async function sendLikeNotification(
  userId: string,
  likerName: string,
  likerPhoto: string
): Promise<void> {
  await sendPushNotificationToUser(userId, {
    title: 'Someone likes you! 💖',
    body: `${likerName} liked your profile!`,
    icon: likerPhoto,
    tag: 'new-like',
    data: {
      type: 'like',
      likerName,
    },
    requireInteraction: false,
  });
}

/**
 * Send message notification
 */
export async function sendMessageNotification(
  userId: string,
  senderName: string,
  senderPhoto: string,
  message: string,
  matchId: string
): Promise<void> {
  await sendPushNotificationToUser(userId, {
    title: `New message from ${senderName}`,
    body: message.length > 50 ? message.substring(0, 50) + '...' : message,
    icon: senderPhoto,
    tag: 'new-message',
    data: {
      type: 'message',
      senderName,
      matchId,
    },
    requireInteraction: false,
  });
}
