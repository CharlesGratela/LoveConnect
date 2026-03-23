import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Like from '@/models/Like';
import User from '@/models/User';
import { getUserFromToken } from '@/lib/auth';
import { isSupabaseAuthEnabled } from '@/lib/auth-provider';
import { createClient as createSupabaseClient } from '@/lib/supabase/server';
import { getAuthenticatedSupabaseUser } from '@/lib/supabase/dating';

/**
 * Get new likes that the current user hasn't been notified about yet
 */
export async function GET(request: NextRequest) {
  try {
    if (isSupabaseAuthEnabled()) {
      const supabase = await createSupabaseClient();
      const authUser = await getAuthenticatedSupabaseUser(supabase);

      if (!authUser) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
      }

      const { searchParams } = new URL(request.url);
      const since = searchParams.get('since');
      let query = supabase
        .from('swipes')
        .select('id, from_user_id, created_at')
        .eq('to_user_id', authUser.id)
        .eq('action', 'like')
        .order('created_at', { ascending: false })
        .limit(10);

      if (since) {
        query = query.gt('created_at', since);
      }

      const { data: likes, error } = await query;

      if (error) {
        throw error;
      }

      const likerIds = [...new Set((likes || []).map((like) => like.from_user_id))];

      if (likerIds.length === 0) {
        return NextResponse.json({ likes: [] });
      }

      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, name, age, avatar_url')
        .in('id', likerIds);

      if (profileError) {
        throw profileError;
      }

      const profileMap = new Map((profiles || []).map((profile) => [profile.id, profile]));
      const formattedLikes = (likes || []).map((like) => {
        const liker = profileMap.get(like.from_user_id);

        return {
          id: like.id,
          user: {
            id: like.from_user_id,
            name: liker?.name || 'Unknown',
            age: liker?.age || 18,
            profilePhoto: liker?.avatar_url || '/favicon.svg',
          },
          likedAt: like.created_at,
        };
      });

      return NextResponse.json({ likes: formattedLikes });
    }

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

    // Build query for likes received by current user (only actual likes)
    const query: any = {
      toUserId: currentUserId,
      action: 'like',
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
