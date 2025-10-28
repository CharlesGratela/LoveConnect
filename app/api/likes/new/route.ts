import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Like from '@/models/Like';
import User from '@/models/User';
import { getUserFromToken } from '@/lib/auth';

/**
 * Get new likes that the current user hasn't been notified about yet
 */
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const tokenData = await getUserFromToken();
    if (!tokenData) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const currentUserId = tokenData.userId;
    const { searchParams } = new URL(request.url);
    const since = searchParams.get('since'); // Timestamp to check for likes after

    // Build query for likes received by current user
    const query: any = {
      toUserId: currentUserId,
    };

    // If 'since' timestamp provided, only get likes after that time
    if (since) {
      query.createdAt = { $gt: new Date(since) };
    }

    // Get likes and populate with user details
    const likes = await Like.find(query)
      .populate('fromUserId', 'name age profilePhoto')
      .sort({ createdAt: -1 })
      .limit(10);

    const formattedLikes = likes.map((like) => ({
      id: String(like._id),
      user: {
        id: String((like.fromUserId as any)._id),
        name: (like.fromUserId as any).name,
        age: (like.fromUserId as any).age,
        profilePhoto: (like.fromUserId as any).profilePhoto,
      },
      likedAt: like.createdAt,
    }));

    return NextResponse.json({ likes: formattedLikes });
  } catch (error: any) {
    console.error('[API /likes/new] Error:', error);
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    );
  }
}
