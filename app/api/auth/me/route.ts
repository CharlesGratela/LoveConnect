import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { getUserFromToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    console.log('[API /auth/me] Checking authentication...');
    await dbConnect();

    const tokenData = await getUserFromToken();
    if (!tokenData) {
      console.log('[API /auth/me] No token found or invalid token');
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('[API /auth/me] Token valid for user:', tokenData.userId);
    const user = await User.findById(tokenData.userId).select('-password');
    if (!user) {
      console.error('[API /auth/me] User not found in database:', tokenData.userId);
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    console.log('[API /auth/me] User authenticated:', user.email);
    const userResponse = {
      id: String(user._id),
      email: user.email,
      name: user.name,
      age: user.age,
      bio: user.bio,
      profilePhoto: user.profilePhoto,
      interests: user.interests,
      gender: user.gender,
      genderPreference: user.genderPreference,
      location: user.location,
    };

    return NextResponse.json({ user: userResponse });
  } catch (error: any) {
    console.error('[API /auth/me] Auth check error:', error);
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    );
  }
}
