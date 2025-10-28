import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Like from '@/models/Like';
import Match from '@/models/Match';
import { getUserFromToken } from '@/lib/auth';
import mongoose from 'mongoose';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const tokenData = await getUserFromToken();
    if (!tokenData) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { targetUserId, action } = body;

    if (!targetUserId || !action) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    const currentUserId = tokenData.userId;

    // Only process likes (skip dislikes)
    if (action === 'dislike') {
      return NextResponse.json({ success: true, matched: false });
    }

    // Create like
    const like = await Like.create({
      fromUserId: new mongoose.Types.ObjectId(currentUserId),
      toUserId: new mongoose.Types.ObjectId(targetUserId),
    });

    // Check if target user also liked current user
    const reciprocalLike = await Like.findOne({
      fromUserId: targetUserId,
      toUserId: currentUserId,
    });

    let match = null;
    if (reciprocalLike) {
      // Create match
      const user1 = currentUserId < targetUserId ? currentUserId : targetUserId;
      const user2 = currentUserId < targetUserId ? targetUserId : currentUserId;

      match = await Match.create({
        user1Id: new mongoose.Types.ObjectId(user1),
        user2Id: new mongoose.Types.ObjectId(user2),
        matchedAt: new Date(),
      });

      // Populate match with user details
      match = await Match.findById(String(match._id))
        .populate('user1Id', 'name age profilePhoto bio interests')
        .populate('user2Id', 'name age profilePhoto bio interests');
    }

    return NextResponse.json({
      success: true,
      matched: !!match,
      match: match ? {
        id: String(match._id),
        matchedWith: String((match.user1Id as any)._id) === currentUserId ? match.user2Id : match.user1Id,
        matchedAt: match.matchedAt,
      } : null,
    });
  } catch (error: any) {
    // Handle duplicate like (user already liked this person)
    if (error.code === 11000) {
      return NextResponse.json({ success: true, matched: false });
    }

    console.error('Swipe error:', error);
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    );
  }
}
