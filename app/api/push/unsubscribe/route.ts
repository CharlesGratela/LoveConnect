import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { verifyToken } from '@/lib/auth';
import { PushSubscription } from '@/models/PushSubscription';

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    const decoded = await verifyToken(token || '');
    
    if (!decoded) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    console.log('[Push API] Removing subscriptions for user:', decoded.userId);

    // Remove all subscriptions for this user
    await PushSubscription.deleteMany({ userId: decoded.userId });

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
