import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { getUserFromToken } from '@/lib/auth';
import { getRecommendedUsers } from '@/lib/matching';

export async function GET(request: NextRequest) {
  try {
    console.log('[API /discover] Starting discovery request...');
    await dbConnect();

    const tokenData = await getUserFromToken();
    if (!tokenData) {
      console.log('[API /discover] Unauthorized - no valid token');
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('[API /discover] User authenticated:', tokenData.userId);

    // Get query parameters for filters
    const { searchParams } = new URL(request.url);
    const minAge = parseInt(searchParams.get('minAge') || '18');
    const maxAge = parseInt(searchParams.get('maxAge') || '100');
    const maxDistance = parseInt(searchParams.get('maxDistance') || '100');

    console.log('[API /discover] Filters:', { minAge, maxAge, maxDistance });

    // Get recommended users using AI + collaborative filtering with filters
    const users = await getRecommendedUsers(tokenData.userId, 20, {
      minAge,
      maxAge,
      maxDistance,
    });

    console.log('[API /discover] Found', users.length, 'users');
    return NextResponse.json({ users });
  } catch (error: any) {
    console.error('[API /discover] Discover error:', error);
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    );
  }
}
