import { NextRequest, NextResponse } from 'next/server';
import { isSupabaseAuthEnabled } from '@/lib/auth-provider';
import { createClient as createSupabaseClient } from '@/lib/supabase/server';
import { getAuthenticatedSupabaseUser } from '@/lib/supabase/dating';

export async function POST(request: NextRequest) {
  try {
    if (!isSupabaseAuthEnabled()) {
      return NextResponse.json(
        { message: 'Report API is only available in Supabase mode' },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseClient();
    const authUser = await getAuthenticatedSupabaseUser(supabase);

    if (!authUser) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { reportedUserId, reason, details } = body;

    if (!reportedUserId || !reason) {
      return NextResponse.json(
        { message: 'reportedUserId and reason are required' },
        { status: 400 }
      );
    }

    const { error } = await supabase.from('reports').insert({
      reporter_id: authUser.id,
      reported_user_id: reportedUserId,
      reason,
      details: details || null,
    });

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { message: 'Failed to submit report', error: error.message },
      { status: 500 }
    );
  }
}
