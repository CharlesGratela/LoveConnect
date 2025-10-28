import { NextRequest, NextResponse } from 'next/server';
import { redirect } from 'next/navigation';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { sendEmail, generateWelcomeEmailTemplate } from '@/lib/email';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get('token');

    if (!token) {
      // Redirect to verification page with error
      return NextResponse.redirect(new URL('/verify-email?error=missing-token', request.url));
    }

    // Find user with this token
    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpiry: { $gt: new Date() },
    });

    if (!user) {
      // Redirect to verification page with error
      return NextResponse.redirect(new URL('/verify-email?error=invalid-token', request.url));
    }

    // Update user
    user.isEmailVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpiry = undefined;
    await user.save();

    // Send welcome email
    await sendEmail({
      to: user.email,
      subject: 'Welcome to nXtDate! 🎉',
      html: generateWelcomeEmailTemplate(user.name),
    });

    // Redirect to verification success page
    return NextResponse.redirect(new URL(`/verify-email?token=${token}&success=true`, request.url));
  } catch (error: any) {
    console.error('Email verification error:', error);
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    );
  }
}
