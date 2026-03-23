import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Match from '@/models/Match';
import { getUserFromToken } from '@/lib/auth';
import { isSupabaseAuthEnabled } from '@/lib/auth-provider';
import { createClient as createSupabaseClient } from '@/lib/supabase/server';
import { getAuthenticatedSupabaseUser } from '@/lib/supabase/dating';

export async function GET(request: NextRequest) {
  try {
    if (isSupabaseAuthEnabled()) {
      return handleSupabaseGetMatches();
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

    const matches = await Match.find({
      $or: [
        { user1Id: currentUserId },
        { user2Id: currentUserId },
      ],
    })
      .populate('user1Id', 'name age profilePhoto bio interests')
      .populate('user2Id', 'name age profilePhoto bio interests')
      .sort({ matchedAt: -1 });

    const formattedMatches = matches.map((match) => {
      const isUser1 = String((match.user1Id as any)._id) === currentUserId;
      const matchedUser = isUser1 ? match.user2Id : match.user1Id;

      return {
        id: String(match._id),
        user: {
          id: String((matchedUser as any)._id),
          name: (matchedUser as any).name,
          age: (matchedUser as any).age,
          profilePhoto: (matchedUser as any).profilePhoto,
          bio: (matchedUser as any).bio,
          interests: (matchedUser as any).interests,
        },
        matchedAt: match.matchedAt,
      };
    });

    return NextResponse.json({ matches: formattedMatches });
  } catch (error: any) {
    console.error('Matches error:', error);
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    if (isSupabaseAuthEnabled()) {
      return handleSupabaseDeleteMatch(request);
    }

    await dbConnect();

    const tokenData = await getUserFromToken();
    if (!tokenData) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const matchId = searchParams.get('matchId');

    if (!matchId) {
      return NextResponse.json(
        { message: 'Match ID required' },
        { status: 400 }
      );
    }

    await Match.findByIdAndDelete(matchId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Unmatch error:', error);
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    );
  }
}

async function handleSupabaseGetMatches() {
  const supabase = await createSupabaseClient();
  const authUser = await getAuthenticatedSupabaseUser(supabase);

  if (!authUser) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { data: matches, error } = await supabase
    .from('matches')
    .select('id, user1_id, user2_id, matched_at')
    .or(`user1_id.eq.${authUser.id},user2_id.eq.${authUser.id}`)
    .eq('is_active', true)
    .order('matched_at', { ascending: false });

  if (error) {
    throw error;
  }

  const { data: blocks, error: blocksError } = await supabase
    .from('blocks')
    .select('blocked_id')
    .eq('blocker_id', authUser.id);

  if (blocksError) {
    throw blocksError;
  }

  const blockedIds = new Set((blocks || []).map((block) => block.blocked_id));

  const otherUserIds = [...new Set((matches || []).map((match) =>
    match.user1_id === authUser.id ? match.user2_id : match.user1_id
  ))].filter((id) => !blockedIds.has(id));

  if (otherUserIds.length === 0) {
    return NextResponse.json({ matches: [] });
  }

  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('id, name, age, avatar_url, bio, interests')
    .in('id', otherUserIds);

  if (profileError) {
    throw profileError;
  }

  const matchIds = (matches || [])
    .filter((match) => {
      const otherId = match.user1_id === authUser.id ? match.user2_id : match.user1_id;
      return !blockedIds.has(otherId);
    })
    .map((match) => match.id);

  const { data: unreadMessages, error: unreadError } = await supabase
    .from('messages')
    .select('match_id')
    .eq('receiver_id', authUser.id)
    .is('read_at', null)
    .in('match_id', matchIds);

  if (unreadError) {
    throw unreadError;
  }

  const profileMap = new Map((profiles || []).map((profile) => [profile.id, profile]));
  const unreadCounts = new Map<string, number>();
  for (const message of unreadMessages || []) {
    unreadCounts.set(message.match_id, (unreadCounts.get(message.match_id) || 0) + 1);
  }

  const formattedMatches = (matches || [])
    .filter((match) => {
      const otherId = match.user1_id === authUser.id ? match.user2_id : match.user1_id;
      return !blockedIds.has(otherId);
    })
    .map((match) => {
    const matchedUserId = match.user1_id === authUser.id ? match.user2_id : match.user1_id;
    const matchedUser = profileMap.get(matchedUserId);

    return {
      id: match.id,
      user: {
        id: matchedUserId,
        name: matchedUser?.name || 'Unknown',
        age: matchedUser?.age || 18,
        profilePhoto: matchedUser?.avatar_url || '/favicon.svg',
        bio: matchedUser?.bio || '',
        interests: matchedUser?.interests || [],
      },
      matchedAt: match.matched_at,
      unreadCount: unreadCounts.get(match.id) || 0,
    };
  });

  return NextResponse.json({ matches: formattedMatches });
}

async function handleSupabaseDeleteMatch(request: NextRequest) {
  const supabase = await createSupabaseClient();
  const authUser = await getAuthenticatedSupabaseUser(supabase);

  if (!authUser) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const matchId = searchParams.get('matchId');

  if (!matchId) {
    return NextResponse.json(
      { message: 'Match ID required' },
      { status: 400 }
    );
  }

  const { data: match, error: matchError } = await supabase
    .from('matches')
    .select('id, user1_id, user2_id')
    .eq('id', matchId)
    .maybeSingle();

  if (matchError) {
    throw matchError;
  }

  if (!match || (match.user1_id !== authUser.id && match.user2_id !== authUser.id)) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
  }

  const { error: deleteMessagesError } = await supabase
    .from('messages')
    .delete()
    .eq('match_id', matchId);

  if (deleteMessagesError) {
    throw deleteMessagesError;
  }

  const { error: deleteMatchError } = await supabase
    .from('matches')
    .delete()
    .eq('id', matchId);

  if (deleteMatchError) {
    throw deleteMatchError;
  }

  return NextResponse.json({ success: true });
}
