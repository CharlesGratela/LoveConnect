import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { generateToken, setAuthCookie } from '@/lib/auth';
import { sendEmail, generateVerificationEmailTemplate } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const { email, password, name, age, gender, genderPreference, bio, profilePhoto, interests, location } = body;

    // Validation
    if (!email || !password || !name || !age || !gender || !bio) {
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

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create user
    const user = await User.create({
      email,
      password: hashedPassword,
      name,
      age: parseInt(age),
      gender,
      genderPreference: genderPreference || 'both',
      bio,
      profilePhoto: profilePhoto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&q=80',
      interests: interests || [],
      location: location || undefined,
      isEmailVerified: false,
      verificationToken,
      verificationTokenExpiry,
    });

    // Send verification email
    const verificationUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/auth/verify-email?token=${verificationToken}`;
    
    await sendEmail({
      to: user.email,
      subject: 'Verify Your Email - nXtDate',
      html: generateVerificationEmailTemplate(user.name, verificationUrl),
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
      gender: user.gender,
      genderPreference: user.genderPreference,
      location: user.location,
      isEmailVerified: user.isEmailVerified,
    };

    return NextResponse.json(
      { 
        user: userResponse, 
        token,
        message: 'Registration successful! Please check your email to verify your account.' 
      },
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
