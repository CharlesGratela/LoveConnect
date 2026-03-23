import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Like from '@/models/Like';
import Match from '@/models/Match';
import User from '@/models/User';
import { getUserFromToken } from '@/lib/auth';
import { sendLikeNotification, sendMatchNotification } from '@/lib/push-server';
import mongoose from 'mongoose';
import { isSupabaseAuthEnabled } from '@/lib/auth-provider';
import { createClient as createSupabaseClient } from '@/lib/supabase/server';
import {
  getAuthenticatedSupabaseUser,
  getCurrentUserProfile,
  type SupabaseProfile,
} from '@/lib/supabase/dating';

export async function POST(request: NextRequest) {
  try {
    if (isSupabaseAuthEnabled()) {
      return handleSupabaseSwipe(request);
    }

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

    await Like.create({
      fromUserId: new mongoose.Types.ObjectId(currentUserId),
      toUserId: new mongoose.Types.ObjectId(targetUserId),
      action: action,
    });

    if (action === 'dislike') {
      return NextResponse.json({ success: true, matched: false });
    }

    const currentUser = await User.findById(currentUserId).select('name profilePhoto');
    const reciprocalLike = await Like.findOne({
      fromUserId: targetUserId,
      toUserId: currentUserId,
      action: 'like',
    });

    let match = null;
    if (reciprocalLike) {
      const user1 = currentUserId < targetUserId ? currentUserId : targetUserId;
      const user2 = currentUserId < targetUserId ? targetUserId : currentUserId;

      match = await Match.create({
        user1Id: new mongoose.Types.ObjectId(user1),
        user2Id: new mongoose.Types.ObjectId(user2),
        matchedAt: new Date(),
      });

      match = await Match.findById(String(match._id))
        .populate('user1Id', 'name age profilePhoto bio interests')
        .populate('user2Id', 'name age profilePhoto bio interests');

      const targetUser = await User.findById(targetUserId).select('name profilePhoto');
      if (currentUser && targetUser) {
        void sendMatchNotification(
          currentUserId,
          targetUser.name,
          targetUser.profilePhoto || '/favicon.svg',
          targetUserId
        );

        void sendMatchNotification(
          targetUserId,
          currentUser.name,
          currentUser.profilePhoto || '/favicon.svg',
          currentUserId
        );
      }
    } else if (currentUser) {
      void sendLikeNotification(
        targetUserId,
        currentUser.name,
        currentUser.profilePhoto || '/favicon.svg',
        currentUserId
      );
    }

    return NextResponse.json({
      success: true,
      matched: !!match,
      match: match
        ? {
            id: String(match._id),
            matchedWith:
              String((match.user1Id as any)._id) === currentUserId
                ? match.user2Id
                : match.user1Id,
            matchedAt: match.matchedAt,
          }
        : null,
    });
  } catch (error: any) {
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

async function handleSupabaseSwipe(request: NextRequest) {
  const supabase = await createSupabaseClient();
  const authUser = await getAuthenticatedSupabaseUser(supabase);

  if (!authUser) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { targetUserId, action } = body;

  if (!targetUserId || !action) {
    return NextResponse.json(
      { message: 'Missing required fields' },
      { status: 400 }
    );
  }

  const currentUser = await getCurrentUserProfile(supabase, authUser);
  const { data: existingBlock, error: blockError } = await supabase
    .from('blocks')
    .select('id')
    .or(
      `and(blocker_id.eq.${authUser.id},blocked_id.eq.${targetUserId}),and(blocker_id.eq.${targetUserId},blocked_id.eq.${authUser.id})`
    )
    .maybeSingle();

  if (blockError) {
    throw blockError;
  }

  if (existingBlock) {
    return NextResponse.json(
      { message: 'You cannot interact with a blocked user' },
      { status: 403 }
    );
  }

  const { error: swipeError } = await supabase.from('swipes').upsert(
    {
      from_user_id: authUser.id,
      to_user_id: targetUserId,
      action,
    },
    {
      onConflict: 'from_user_id,to_user_id',
    }
  );

  if (swipeError) {
    throw swipeError;
  }

  if (action === 'dislike') {
    return NextResponse.json({ success: true, matched: false });
  }

  const { data: reciprocalLike, error: reciprocalError } = await supabase
    .from('swipes')
    .select('id')
    .eq('from_user_id', targetUserId)
    .eq('to_user_id', authUser.id)
    .eq('action', 'like')
    .maybeSingle();

  if (reciprocalError) {
    throw reciprocalError;
  }

  const targetUser = await getSupabaseProfileById(supabase, targetUserId);
  let matchRecord: { id: string; matched_at: string } | null = null;

  if (reciprocalLike) {
    const [user1Id, user2Id] = [authUser.id, targetUserId].sort();
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .upsert(
        {
          user1_id: user1Id,
          user2_id: user2Id,
          matched_at: new Date().toISOString(),
          is_active: true,
        },
        {
          onConflict: 'user1_id,user2_id',
        }
      )
      .select('id, matched_at')
      .single();

    if (matchError) {
      throw matchError;
    }

    matchRecord = match;

    if (targetUser) {
      void sendMatchNotification(
        authUser.id,
        targetUser.name || 'Unknown',
        targetUser.avatar_url || '/favicon.svg',
        targetUserId
      );

      void sendMatchNotification(
        targetUserId,
        currentUser.name || 'Unknown',
        currentUser.avatar_url || '/favicon.svg',
        authUser.id
      );
    }
  } else if (targetUser) {
    void sendLikeNotification(
      targetUserId,
      currentUser.name || 'Unknown',
      currentUser.avatar_url || '/favicon.svg',
      authUser.id
    );
  }

  return NextResponse.json({
    success: true,
    matched: !!matchRecord,
    match: matchRecord
      ? {
          id: matchRecord.id,
          matchedWith: targetUserId,
          matchedAt: matchRecord.matched_at,
        }
      : null,
  });
}

async function getSupabaseProfileById(
  supabase: Awaited<ReturnType<typeof createSupabaseClient>>,
  userId: string
) {
  const { data, error } = await supabase
    .from('profiles')
    .select(
      'id, email, name, age, gender, gender_preference, bio, avatar_url, interests, latitude, longitude'
    )
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data as SupabaseProfile | null;
}
