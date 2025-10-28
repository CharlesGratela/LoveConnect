import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { getUserFromToken } from '@/lib/auth';
import { PushSubscription } from '@/models/PushSubscription';

export async function POST(request: NextRequest) {
  try {
    // Verify authentication using cookies
    const tokenData = await getUserFromToken();
    
    if (!tokenData) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const body = await request.json();
    const { subscription } = body;

    if (!subscription || !subscription.endpoint) {
      return NextResponse.json(
        { message: 'Invalid subscription data' },
        { status: 400 }
      );
    }

    console.log('[Push API] Saving subscription for user:', tokenData.userId);

    // Upsert subscription (update if exists, create if not)
    await PushSubscription.findOneAndUpdate(
      {
        userId: tokenData.userId,
        endpoint: subscription.endpoint,
      },
      {
        userId: tokenData.userId,
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
        },
      },
      {
        upsert: true,
        new: true,
      }
    );

    console.log('[Push API] ✅ Subscription saved successfully');

    return NextResponse.json({
      message: 'Subscription saved successfully',
    });
  } catch (error) {
    console.error('[Push API] Error saving subscription:', error);
    return NextResponse.json(
      { message: 'Failed to save subscription' },
      { status: 500 }
    );
  }
}
