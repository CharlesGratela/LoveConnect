import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Like from '@/models/Like';
import Match from '@/models/Match';
import User from '@/models/User';
import { getUserFromToken } from '@/lib/auth';
import { sendLikeNotification, sendMatchNotification } from '@/lib/push-server';
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

    // Get current user details for notification
    const currentUser = await User.findById(currentUserId).select('name profilePhoto');

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

      // Send match notifications to both users
      const targetUser = await User.findById(targetUserId).select('name profilePhoto');
      if (currentUser && targetUser) {
        // Notify current user about the match
        sendMatchNotification(
          currentUserId,
          targetUser.name,
          targetUser.profilePhoto || '/favicon.svg',
          targetUserId // Pass the matched user ID
        ).catch(err => console.error('[Swipe] Error sending match notification to current user:', err));

        // Notify target user about the match
        sendMatchNotification(
          targetUserId,
          currentUser.name,
          currentUser.profilePhoto || '/favicon.svg',
          currentUserId // Pass the matched user ID
        ).catch(err => console.error('[Swipe] Error sending match notification to target user:', err));
      }
    } else if (currentUser) {
      // No match yet, but send like notification to target user
      sendLikeNotification(
        targetUserId,
        currentUser.name,
        currentUser.profilePhoto || '/favicon.svg'
      ).catch(err => console.error('[Swipe] Error sending like notification:', err));
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
