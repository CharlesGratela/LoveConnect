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

    console.log('[Push API] Removing subscriptions for user:', tokenData.userId);

    // Remove all subscriptions for this user
    await PushSubscription.deleteMany({ userId: tokenData.userId });

    console.log('[Push API] ✅ Subscriptions removed successfully');

    return NextResponse.json({
      message: 'Unsubscribed successfully',
    });
  } catch (error) {
    console.error('[Push API] Error removing subscription:', error);
    return NextResponse.json(
      { message: 'Failed to unsubscribe' },
      { status: 500 }
    );
  }
}
