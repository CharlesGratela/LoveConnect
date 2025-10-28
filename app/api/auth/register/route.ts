import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { generateToken, setAuthCookie } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const { email, password, name, age, bio, profilePhoto, interests } = body;

    // Validation
    if (!email || !password || !name || !age || !bio) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { message: 'User already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      email,
      password: hashedPassword,
      name,
      age: parseInt(age),
      bio,
      profilePhoto: profilePhoto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&q=80',
      interests: interests || [],
    });

    // Generate token
    const token = generateToken({
      userId: String(user._id),
      email: user.email,
    });

    // Set cookie
    await setAuthCookie(token);

    // Return user without password
    const userResponse = {
      id: String(user._id),
      email: user.email,
      name: user.name,
      age: user.age,
      bio: user.bio,
      profilePhoto: user.profilePhoto,
      interests: user.interests,
    };

    return NextResponse.json(
      { user: userResponse, token },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    );
  }
}
