import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { getUserFromToken } from '@/lib/auth';
import { getRecommendedUsers } from '@/lib/matching';
import { isSupabaseAuthEnabled } from '@/lib/auth-provider';
import { createClient as createSupabaseClient } from '@/lib/supabase/server';
import { getAuthenticatedSupabaseUser, getCurrentUserProfile } from '@/lib/supabase/dating';
import { getAiRecommendedProfiles } from '@/lib/supabase/recommendations';

export async function GET(request: NextRequest) {
  try {
    if (isSupabaseAuthEnabled()) {
      const supabase = await createSupabaseClient();
      const authUser = await getAuthenticatedSupabaseUser(supabase);

      if (!authUser) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
      }

      const { searchParams } = new URL(request.url);
      const minAge = parseInt(searchParams.get('minAge') || '18');
      const maxAge = parseInt(searchParams.get('maxAge') || '100');
      const maxDistance = parseInt(searchParams.get('maxDistance') || '100');
      const currentUser = await getCurrentUserProfile(supabase, authUser);
      const users = await getAiRecommendedProfiles({
        currentUser,
        limit: 20,
        filters: {
          minAge,
          maxAge,
          maxDistance,
        },
      });

      return NextResponse.json({ users });
    }

    await dbConnect();
    const tokenData = await getUserFromToken();
    if (!tokenData) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }
    // Get query parameters for filters
    const { searchParams } = new URL(request.url);
    const minAge = parseInt(searchParams.get('minAge') || '18');
    const maxAge = parseInt(searchParams.get('maxAge') || '100');
    const maxDistance = parseInt(searchParams.get('maxDistance') || '100');
    // Get recommended users using AI + collaborative filtering with filters
    const users = await getRecommendedUsers(tokenData.userId, 20, {
      minAge,
      maxAge,
      maxDistance,
    });
    return NextResponse.json({ users });
  } catch (error: any) {
    console.error('[API /discover] Discover error:', error);
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    );
  }
}
