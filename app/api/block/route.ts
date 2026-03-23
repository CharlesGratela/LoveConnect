import { NextRequest, NextResponse } from 'next/server';
import { isSupabaseAuthEnabled } from '@/lib/auth-provider';
import { createClient as createSupabaseClient } from '@/lib/supabase/server';
import { getAuthenticatedSupabaseUser } from '@/lib/supabase/dating';

export async function POST(request: NextRequest) {
  try {
    if (!isSupabaseAuthEnabled()) {
      return NextResponse.json(
        { message: 'Block API is only available in Supabase mode' },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseClient();
    const authUser = await getAuthenticatedSupabaseUser(supabase);

    if (!authUser) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { blockedUserId } = body;

    if (!blockedUserId) {
      return NextResponse.json(
        { message: 'blockedUserId is required' },
        { status: 400 }
      );
    }

    const { error } = await supabase.from('blocks').upsert(
      {
        blocker_id: authUser.id,
        blocked_id: blockedUserId,
      },
      {
        onConflict: 'blocker_id,blocked_id',
      }
    );

    if (error) {
      throw error;
    }

    await supabase
      .from('matches')
      .delete()
      .or(
        `and(user1_id.eq.${authUser.id},user2_id.eq.${blockedUserId}),and(user1_id.eq.${blockedUserId},user2_id.eq.${authUser.id})`
      );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { message: 'Failed to block user', error: error.message },
      { status: 500 }
    );
  }
}
