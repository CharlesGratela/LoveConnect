import webpush from 'web-push';
import { PushSubscription } from '@/models/PushSubscription';
import dbConnect from '@/lib/mongodb';
import { isSupabaseAuthEnabled } from '@/lib/auth-provider';
import { createAdminClient } from '@/lib/supabase/admin';

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

interface SubscriptionRecord {
  id?: string;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

interface SupabasePushSubscriptionRow {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

async function getSubscriptionsForUser(userId: string): Promise<SubscriptionRecord[]> {
  if (isSupabaseAuthEnabled()) {
    const admin = createAdminClient();

    if (!admin) {
      console.warn(
        '[Push Server] SUPABASE_SERVICE_ROLE_KEY is missing. Skipping subscription lookup.'
      );
      return [];
    }

    const { data, error } = await admin
      .from('push_subscriptions')
      .select('id, endpoint, p256dh, auth')
      .eq('user_id', userId);

    if (error) {
      throw error;
    }

    return ((data || []) as SupabasePushSubscriptionRow[]).map((sub) => ({
      id: sub.id,
      endpoint: sub.endpoint,
      keys: {
        p256dh: sub.p256dh,
        auth: sub.auth,
      },
    }));
  }

  await dbConnect();

  const subscriptions = await PushSubscription.find({ userId });

  return subscriptions.map((sub) => ({
    id: String((sub as any)._id),
    endpoint: sub.endpoint,
    keys: {
      p256dh: sub.keys.p256dh,
      auth: sub.keys.auth,
    },
  }));
}

async function removeSubscription(subscriptionId?: string) {
  if (!subscriptionId) {
    return;
  }

  if (isSupabaseAuthEnabled()) {
    const admin = createAdminClient();

    if (!admin) {
      return;
    }

    await admin.from('push_subscriptions').delete().eq('id', subscriptionId);
    return;
  }

  await PushSubscription.deleteOne({ _id: subscriptionId });
}

export async function sendPushNotificationToUser(
  userId: string,
  payload: PushNotificationPayload
): Promise<void> {
  try {
    console.log('[Push Server] Sending notification to user:', userId);

    const subscriptions = await getSubscriptionsForUser(userId);

    if (subscriptions.length === 0) {
      console.log('[Push Server] No subscriptions found for user:', userId);
      return;
    }

    const promises = subscriptions.map(async (sub) => {
      try {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.keys.p256dh,
            auth: sub.keys.auth,
          },
        };

        const notificationPayload = {
          title: payload.title,
          body: payload.body,
          icon: '/favicon.svg',
          badge: '/favicon.svg',
          tag: payload.tag,
          data: payload.data,
          requireInteraction: payload.requireInteraction || false,
        };

        await webpush.sendNotification(
          pushSubscription,
          JSON.stringify(notificationPayload)
        );
      } catch (error: any) {
        console.error('[Push Server] Error sending to subscription:', error);

        if (error.statusCode === 410 || error.statusCode === 404) {
          await removeSubscription(sub.id);
        }
      }
    });

    await Promise.all(promises);
  } catch (error) {
    console.error('[Push Server] Error sending push notification:', error);
    throw error;
  }
}

export async function sendMatchNotification(
  userId: string,
  matchName: string,
  matchPhoto?: string,
  matchedUserId?: string
): Promise<void> {
  await sendPushNotificationToUser(userId, {
    title: "It's a Match!",
    body: `You matched with ${matchName}!`,
    tag: 'new-match',
    data: {
      type: 'match',
      matchName,
      matchedUserId,
      url: '/matches',
    },
    requireInteraction: true,
  });
}

export async function sendLikeNotification(
  userId: string,
  likerName: string,
  likerPhoto?: string,
  likerId?: string
): Promise<void> {
  await sendPushNotificationToUser(userId, {
    title: 'Someone likes you!',
    body: `${likerName} liked your profile!`,
    tag: 'new-like',
    data: {
      type: 'like',
      likerName,
      likerId,
      url: likerId ? `/discover?likedBy=${likerId}` : '/discover',
    },
    requireInteraction: false,
  });
}

export async function sendMessageNotification(
  userId: string,
  senderName: string,
  senderPhoto: string,
  message: string,
  matchId: string
): Promise<void> {
  const truncatedMessage =
    message.length > 100 ? `${message.substring(0, 100)}...` : message;

  await sendPushNotificationToUser(userId, {
    title: `New message from ${senderName}`,
    body: truncatedMessage,
    tag: 'new-message',
    data: {
      type: 'message',
      senderName,
      matchId,
    },
    requireInteraction: false,
  });
}
