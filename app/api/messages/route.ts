import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Message from '@/models/Message';
import Match from '@/models/Match';
import { getUserFromToken } from '@/lib/auth';
import mongoose from 'mongoose';

export async function GET(request: NextRequest) {
  try {
    console.log('[API /messages] GET request received');
    await dbConnect();

    const tokenData = await getUserFromToken();
    if (!tokenData) {
      console.log('[API /messages] Unauthorized - no valid token');
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('[API /messages] User authenticated:', tokenData.userId);

    const { searchParams } = new URL(request.url);
    const matchId = searchParams.get('matchId');

    console.log('[API /messages] Match ID:', matchId);

    if (!matchId) {
      console.error('[API /messages] Match ID required but not provided');
      return NextResponse.json(
        { message: 'Match ID required' },
        { status: 400 }
      );
    }

    // Verify match exists and user is part of it
    const match = await Match.findById(matchId);
    if (!match) {
      console.error('[API /messages] Match not found:', matchId);
      return NextResponse.json(
        { message: 'Match not found' },
        { status: 404 }
      );
    }

    console.log('[API /messages] Match found, verifying user access...');

    const currentUserId = tokenData.userId;
    const isPartOfMatch =
      match.user1Id.toString() === currentUserId ||
      match.user2Id.toString() === currentUserId;

    if (!isPartOfMatch) {
      console.error('[API /messages] User not part of match');
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Get messages
    const messages = await Message.find({ matchId })
      .sort({ createdAt: 1 })
      .limit(100);

    console.log('[API /messages] Retrieved', messages.length, 'messages');

    const formattedMessages = messages.map((msg) => ({
      id: String(msg._id),
      senderId: String(msg.senderId),
      receiverId: String(msg.receiverId),
      text: msg.text,
      read: msg.read,
      timestamp: msg.createdAt,
    }));

    return NextResponse.json({ messages: formattedMessages });
  } catch (error: any) {
    console.error('[API /messages] Get messages error:', error);
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('[API /messages] POST request received');
    await dbConnect();

    const tokenData = await getUserFromToken();
    if (!tokenData) {
      console.log('[API /messages] Unauthorized - no valid token');
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('[API /messages] User authenticated:', tokenData.userId);

    const body = await request.json();
    const { matchId, receiverId, text } = body;

    console.log('[API /messages] Message data:', { matchId, receiverId, textLength: text?.length });

    if (!matchId || !receiverId || !text) {
      console.error('[API /messages] Missing required fields');
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify match exists
    const match = await Match.findById(matchId);
    if (!match) {
      console.error('[API /messages] Match not found:', matchId);
      return NextResponse.json(
        { message: 'Match not found' },
        { status: 404 }
      );
    }

    const currentUserId = tokenData.userId;

    // Create message
    const message = await Message.create({
      matchId: new mongoose.Types.ObjectId(matchId),
      senderId: new mongoose.Types.ObjectId(currentUserId),
      receiverId: new mongoose.Types.ObjectId(receiverId),
      text: text.trim(),
    });

    console.log('[API /messages] Message created:', String(message._id));

    return NextResponse.json({
      message: {
        id: String(message._id),
        senderId: String(message.senderId),
        receiverId: String(message.receiverId),
        text: message.text,
        read: message.read,
        timestamp: message.createdAt,
      },
    }, { status: 201 });
  } catch (error: any) {
    console.error('[API /messages] Send message error:', error);
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    );
  }
}
