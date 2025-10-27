import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Match from '@/models/Match';
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

    const currentUserId = tokenData.userId;

    // Find all matches for current user
    const matches = await Match.find({
      $or: [
        { user1Id: currentUserId },
        { user2Id: currentUserId },
      ],
    })
      .populate('user1Id', 'name age profilePhoto bio interests')
      .populate('user2Id', 'name age profilePhoto bio interests')
      .sort({ matchedAt: -1 });

    // Format matches
    const formattedMatches = matches.map((match) => {
      const isUser1 = match.user1Id._id.toString() === currentUserId;
      const matchedUser = isUser1 ? match.user2Id : match.user1Id;

      return {
        id: match._id.toString(),
        user: {
          id: matchedUser._id.toString(),
          name: matchedUser.name,
          age: matchedUser.age,
          profilePhoto: matchedUser.profilePhoto,
          bio: matchedUser.bio,
          interests: matchedUser.interests,
        },
        matchedAt: match.matchedAt,
      };
    });

    return NextResponse.json({ matches: formattedMatches });
  } catch (error: any) {
    console.error('Matches error:', error);
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await dbConnect();

    const tokenData = await getUserFromToken();
    if (!tokenData) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const matchId = searchParams.get('matchId');

    if (!matchId) {
      return NextResponse.json(
        { message: 'Match ID required' },
        { status: 400 }
      );
    }

    // Delete match
    await Match.findByIdAndDelete(matchId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Unmatch error:', error);
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    );
  }
}
