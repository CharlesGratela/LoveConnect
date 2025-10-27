import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { getUserFromToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const tokenData = await getUserFromToken();
    if (!tokenData) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await User.findById(tokenData.userId).select('-password');
    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    const userResponse = {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      age: user.age,
      bio: user.bio,
      profilePhoto: user.profilePhoto,
      interests: user.interests,
    };

    return NextResponse.json({ user: userResponse });
  } catch (error: any) {
    console.error('Get profile error:', error);
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
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
    const { name, age, bio, profilePhoto, interests } = body;

    // Update user
    const user = await User.findByIdAndUpdate(
      tokenData.userId,
      {
        ...(name && { name }),
        ...(age && { age: parseInt(age) }),
        ...(bio && { bio }),
        ...(profilePhoto && { profilePhoto }),
        ...(interests && { interests }),
      },
      { new: true }
    ).select('-password');

    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    const userResponse = {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      age: user.age,
      bio: user.bio,
      profilePhoto: user.profilePhoto,
      interests: user.interests,
    };

    return NextResponse.json({ user: userResponse });
  } catch (error: any) {
    console.error('Update profile error:', error);
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    );
  }
}
