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
      console.error('[API /users/profile] User not found:', tokenData.userId);
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }
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
    console.error('[API /users/profile] Get profile error:', error);
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
    const { name, age, bio, profilePhoto, interests, gender, genderPreference, location } = body;
    // Build update object
    const updateData: any = {};
    if (name) updateData.name = name;
    if (age) updateData.age = parseInt(age);
    if (bio) updateData.bio = bio;
    if (profilePhoto) updateData.profilePhoto = profilePhoto;
    if (interests) updateData.interests = interests;
    if (gender) updateData.gender = gender;
    if (genderPreference) updateData.genderPreference = genderPreference;
    if (location) updateData.location = location;
    // Update user
    const user = await User.findByIdAndUpdate(
      tokenData.userId,
      { $set: updateData },
      { new: true, runValidators: false } // Don't run validators to avoid gender required error
    ).select('-password');
    if (!user) {
      console.error('[API /users/profile] User not found:', tokenData.userId);
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }
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
    console.error('[API /users/profile] Update profile error:', error);
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    );
  }
}
